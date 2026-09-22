import { GameMetadata } from "@/types/database";
import { logAITask } from "./logger";

/**
 * Interface de resposta mínima da API RAWG
 */
interface RawgSearchResponse {
  results?: Array<{
    id: number;
    name: string;
    released?: string;
    metacritic?: number | null;
    platforms?: Array<{ platform: { id: number; name: string; slug: string } }>;
    genres?: Array<{ id: number; name: string }>;
    background_image?: string;
  }>;
}

/**
 * Interface de detalhes adicionais de um jogo no RAWG
 */
interface RawgGameDetailResponse {
  developers?: Array<{ id: number; name: string }>;
  publishers?: Array<{ id: number; name: string }>;
  description_raw?: string;
}

/**
 * Enriquece os metadados extraídos pela IA utilizando APIs de dados estruturados (RAWG / OpenCritic).
 * Possui execução defensiva com timeout curto: se a API não estiver configurada,
 * rate-limited ou não encontrar o jogo, preserva os dados originais sem lançar exceções.
 *
 * @param gameName Nome do jogo identificado
 * @param existingMetadata Metadados já existentes obtidos da IA
 * @returns Metadados enriquecidos ou inalterados em caso de indisponibilidade
 */
export async function enrichGameMetadata(
  gameName?: string | null,
  existingMetadata?: GameMetadata
): Promise<GameMetadata> {
  const current: GameMetadata = {
    game_name: gameName || existingMetadata?.game_name || "",
    platforms: existingMetadata?.platforms || [],
    release_date: existingMetadata?.release_date || null,
    developer: existingMetadata?.developer || null,
    publisher: existingMetadata?.publisher || null,
    metacritic_score: existingMetadata?.metacritic_score ?? null,
    genre: existingMetadata?.genre || null,
  };

  const cleanName = (gameName || existingMetadata?.game_name || "").trim();
  if (!cleanName || cleanName.length < 2 || cleanName.toLowerCase() === "não especificado") {
    return current;
  }

  const rawgApiKey = process.env.RAWG_API_KEY;

  // 1. Tentar enriquecer via RAWG Video Games Database API se houver chave configurada
  if (rawgApiKey) {
    try {
      const searchUrl = `https://api.rawg.io/api/games?key=${rawgApiKey}&search=${encodeURIComponent(
        cleanName
      )}&page_size=1`;

      const searchRes = await fetch(searchUrl, {
        headers: { "User-Agent": "MadeByAIGames/1.0" },
        signal: AbortSignal.timeout(4000),
      });

      if (searchRes.ok) {
        const searchData = (await searchRes.json()) as RawgSearchResponse;
        const match = searchData.results?.[0];

        if (match) {
          // Extrair plataformas se ainda não definidas ou genéricas
          if ((!current.platforms || current.platforms.length === 0) && match.platforms) {
            current.platforms = match.platforms.map((p) => p.platform.name).slice(0, 5);
          }

          // Extrair data de lançamento oficial se ausente ou não confirmada
          if (
            (!current.release_date ||
              current.release_date.toLowerCase().includes("não") ||
              current.release_date.toLowerCase().includes("indefinid")) &&
            match.released
          ) {
            current.release_date = match.released;
          }

          // Extrair nota do Metacritic se disponível
          if (typeof match.metacritic === "number" && !current.metacritic_score) {
            current.metacritic_score = match.metacritic;
          }

          // Extrair gênero primário
          if (!current.genre && match.genres && match.genres.length > 0) {
            current.genre = match.genres[0].name;
          }

          // Buscar estúdio / desenvolvedor com requisição secundária rápida se estiver faltando
          if (!current.developer || !current.publisher) {
            try {
              const detailUrl = `https://api.rawg.io/api/games/${match.id}?key=${rawgApiKey}`;
              const detailRes = await fetch(detailUrl, {
                headers: { "User-Agent": "MadeByAIGames/1.0" },
                signal: AbortSignal.timeout(3000),
              });
              if (detailRes.ok) {
                const detailData = (await detailRes.json()) as RawgGameDetailResponse;
                if (!current.developer && detailData.developers && detailData.developers.length > 0) {
                  current.developer = detailData.developers.map((d) => d.name).join(", ");
                }
                if (!current.publisher && detailData.publishers && detailData.publishers.length > 0) {
                  current.publisher = detailData.publishers.map((p) => p.name).join(", ");
                }
              }
            } catch {
              // Falha tolerada na requisição de detalhes secundários
            }
          }
        }
      } else {
        try {
          await logAITask({
            service: "game_enricher",
            action: "enrich_metadata",
            level: "warn",
            status: "failed",
            task_completed: false,
            message: `API RAWG retornou status HTTP ${searchRes.status} para "${cleanName}"`,
            metadata: { api: "RAWG", game_name: cleanName, status: searchRes.status },
          });
        } catch {}
      }
    } catch (rawgErr: any) {
      try {
        await logAITask({
          service: "game_enricher",
          action: "enrich_metadata",
          level: "warn",
          status: "failed",
          task_completed: false,
          message: `Falha não-bloqueante na API RAWG para "${cleanName}": ${rawgErr?.message || rawgErr}`,
          error: rawgErr,
          metadata: { api: "RAWG", game_name: cleanName },
        });
      } catch {}
    }
  }

  // 2. Se a nota do Metacritic ainda não existir, tentar consulta rápida na API pública do OpenCritic
  if (!current.metacritic_score) {
    try {
      const openCriticSearchUrl = `https://api.opencritic.com/api/game/search?criteria=${encodeURIComponent(
        cleanName
      )}`;
      const ocRes = await fetch(openCriticSearchUrl, {
        headers: { "User-Agent": "MadeByAIGames/1.0" },
        signal: AbortSignal.timeout(3000),
      });

      if (ocRes.ok) {
        const ocMatches = (await ocRes.json()) as Array<{ id: number; name: string }>;
        if (Array.isArray(ocMatches) && ocMatches.length > 0) {
          const gameId = ocMatches[0].id;
          const ocDetailUrl = `https://api.opencritic.com/api/game/${gameId}`;
          const ocDetailRes = await fetch(ocDetailUrl, {
            headers: { "User-Agent": "MadeByAIGames/1.0" },
            signal: AbortSignal.timeout(3000),
          });
          if (ocDetailRes.ok) {
            const ocDetail = (await ocDetailRes.json()) as { topCriticScore?: number };
            if (typeof ocDetail.topCriticScore === "number" && ocDetail.topCriticScore > 0) {
              current.metacritic_score = Math.round(ocDetail.topCriticScore);
            }
          }
        }
      } else {
        try {
          await logAITask({
            service: "game_enricher",
            action: "enrich_metadata",
            level: "warn",
            status: "failed",
            task_completed: false,
            message: `API OpenCritic retornou status HTTP ${ocRes.status} para "${cleanName}"`,
            metadata: { api: "OpenCritic", game_name: cleanName, status: ocRes.status },
          });
        } catch {}
      }
    } catch (ocErr: any) {
      try {
        await logAITask({
          service: "game_enricher",
          action: "enrich_metadata",
          level: "warn",
          status: "failed",
          task_completed: false,
          message: `Falha não-bloqueante na API OpenCritic para "${cleanName}": ${ocErr?.message || ocErr}`,
          error: ocErr,
          metadata: { api: "OpenCritic", game_name: cleanName },
        });
      } catch {}
    }
  }

  return current;
}
