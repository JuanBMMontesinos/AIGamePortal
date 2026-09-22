import { GoogleGenAI, Type } from "@google/genai";
import { SupabaseClient } from "@supabase/supabase-js";
import { GameHub } from "@/types/database";
import { logAITask, logAISuccess } from "./logger";

export interface HubMatchResult {
  matched: boolean;
  hubId: string | null;
  hub: GameHub | null;
  isNew: boolean;
  suggestedHub?: Partial<GameHub> | null;
}

export interface SuggestedHubOutput {
  shouldCreateHub: boolean;
  name?: string;
  slug?: string;
  aliases?: string[];
  developer?: string;
  publisher?: string;
  release_date?: string;
  platforms?: string[];
  metacritic_score?: number | null;
  synopsis?: string;
  cover_image_url?: string;
  banner_image_url?: string;
}

/**
 * Normaliza um texto para comparação fonética/textual neutra:
 * Converte para minúsculas, remove acentuação e diacríticos.
 */
export function normalizeMatchText(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos (ex: Yōtei -> Yotei, Ação -> Acao)
    .replace(/[^\w\s-]/g, " ") // Converte pontuações em espaços
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Cria uma slug amigável a partir de um nome de jogo.
 */
export function slugifyGameName(name: string): string {
  return normalizeMatchText(name)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Escapa caracteres especiais para uso seguro em Expressões Regulares
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Verifica se um termo ou alias aparece no texto respeitando limites de palavras
 * para evitar falsos positivos (ex: "in" não deve dar match em "inter").
 */
function textContainsAlias(normalizedText: string, alias: string): boolean {
  const cleanAlias = normalizeMatchText(alias);
  if (!cleanAlias || cleanAlias.length < 2) return false;

  // Usa word boundaries com suporte a termos compostos
  const escaped = escapeRegExp(cleanAlias);
  const regex = new RegExp(`(?:^|\\s)${escaped}(?:$|\\s)`, "i");
  return regex.test(normalizedText);
}

/**
 * Compara o título e conteúdo do post contra a lista de Hubs cadastrados.
 * Ordena os aliases por tamanho decrescente para priorizar termos mais específicos
 * (ex: "Grand Theft Auto VI" antes de "GTA").
 */
export function matchGameHub(
  title: string,
  content: string,
  hubs: GameHub[]
): GameHub | null {
  if (!hubs || hubs.length === 0) return null;

  const combinedText = `${title || ""} ${content || ""}`;
  const normalizedText = normalizeMatchText(combinedText);
  const normalizedTitle = normalizeMatchText(title || "");

  // Criamos uma lista plana de todos os candidatos de correspondência
  interface HubCandidate {
    term: string;
    hub: GameHub;
    isExactName: boolean;
    isTitleMatch: boolean;
  }

  const candidates: HubCandidate[] = [];

  for (const hub of hubs) {
    // 1. Termo principal (nome)
    const normName = normalizeMatchText(hub.name);
    if (normName.length >= 3) {
      candidates.push({
        term: normName,
        hub,
        isExactName: true,
        isTitleMatch: textContainsAlias(normalizedTitle, normName),
      });
    }

    // 2. Slug
    const normSlug = normalizeMatchText(hub.slug.replace(/-/g, " "));
    if (normSlug.length >= 3 && normSlug !== normName) {
      candidates.push({
        term: normSlug,
        hub,
        isExactName: false,
        isTitleMatch: textContainsAlias(normalizedTitle, normSlug),
      });
    }

    // 3. Aliases cadastrados
    if (Array.isArray(hub.aliases)) {
      for (const alias of hub.aliases) {
        const normAlias = normalizeMatchText(alias);
        if (normAlias.length >= 2 && normAlias !== normName) {
          candidates.push({
            term: normAlias,
            hub,
            isExactName: false,
            isTitleMatch: textContainsAlias(normalizedTitle, normAlias),
          });
        }
      }
    }
  }

  // Ordenação estratégica de candidatos:
  // 1. Matches no título vêm antes de matches no corpo
  // 2. Termos mais longos vêm antes de termos curtos (evita que "gta" supere "grand theft auto vi")
  candidates.sort((a, b) => {
    if (a.isTitleMatch !== b.isTitleMatch) {
      return a.isTitleMatch ? -1 : 1;
    }
    return b.term.length - a.term.length;
  });

  // Testa cada candidato
  for (const candidate of candidates) {
    if (candidate.isTitleMatch || textContainsAlias(normalizedText, candidate.term)) {
      return candidate.hub;
    }
  }

  return null;
}

/**
 * Agente de IA Gemini para avaliar se um artigo aborda um jogo de grande repercussão
 * que ainda não possui Hub permanente e sugerir sua ficha técnica completa.
 */
export async function suggestGameHubWithGemini(
  ai: GoogleGenAI,
  title: string,
  content: string,
  gameMetadata?: Record<string, any>
): Promise<SuggestedHubOutput | null> {
  const models = ["gemini-2.5-flash", "gemini-1.5-flash"];

  const prompt = `
Você é o Arquiteto de Informação e Especialista em SEO de Games do Made By AI Games.
Analise a matéria jornalística abaixo e os metadados preliminares para determinar se ela trata centralmente de um JOGO DE VIDEOGAME DE GRANDE REPERCUSSÃO ou FRANQUIA RELEVANTE que merece ter uma "Central de Jogo Permanente" (Hub) para atração de tráfego orgânico perene de cauda longa (Long-Tail SEO).

Critérios para criar Hub (shouldCreateHub: true):
- É um jogo específico anunciado, em desenvolvimento ou lançado de relevância (ex: GTA VI, Monster Hunter Wilds, Elden Ring, Ghost of Yōtei, The Witcher 4, Doom The Dark Ages).
- Não crie Hub para notícias genéricas de hardware puro sem jogo central (ex: apenas uma placa RTX ou cabo), nem para notícias corporativas gerais da indústria sem foco em um jogo específico.

Se for elegível, forneça a ficha técnica completa do jogo com precisão:
- name: Nome oficial completo (ex: "Grand Theft Auto VI")
- slug: Slug em kebab-case limpa (ex: "gta-6")
- aliases: 4 a 6 termos de busca e grafias alternativas em minúsculas (ex: ["gta vi", "gta 6", "grand theft auto 6", "vice city 2"])
- developer: Estúdio desenvolvedor (ex: "Rockstar Studios")
- publisher: Empresa publicadora (ex: "Rockstar Games")
- release_date: Data oficial de lançamento (ex: "2025-11-20" ou ano estimado "2025")
- platforms: Array com plataformas confirmadas (ex: ["PlayStation 5", "Xbox Series X|S", "PC"])
- metacritic_score: Nota Metacritic aproximada (número inteiro de 0 a 100) se o jogo já foi avaliado pela crítica, ou null se for inédito/não lançado.
- synopsis: Sinopse editorial rica e envolvente de 2 a 3 parágrafos em português do Brasil, apresentando o universo, premissa da história e mecânicas centrais do jogo.
- cover_image_url: URL de imagem vertical de capa representativa ou vazio.
- banner_image_url: URL de imagem horizontal panorâmica (1920x1080) representativa ou vazio.

---
TÍTULO: ${title}
METADADOS DISPONÍVEIS: ${JSON.stringify(gameMetadata || {})}
CONTEÚDO DA MATÉRIA:
${content.slice(0, 2000)}
`.trim();

  for (const model of models) {
    try {
      const response = await ai.models.generateContent({
        model,
        config: {
          temperature: 0.1,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              shouldCreateHub: {
                type: Type.BOOLEAN,
                description: "Verdadeiro se for um jogo de relevância que justifica a criação de uma central permanente.",
              },
              name: { type: Type.STRING },
              slug: { type: Type.STRING },
              aliases: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              developer: { type: Type.STRING },
              publisher: { type: Type.STRING },
              release_date: { type: Type.STRING },
              platforms: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              metacritic_score: {
                type: Type.INTEGER,
                description: "Nota numérica de 0 a 100 ou null",
              },
              synopsis: { type: Type.STRING },
              cover_image_url: { type: Type.STRING },
              banner_image_url: { type: Type.STRING },
            },
            required: ["shouldCreateHub"],
          },
        },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });

      const text = response.text;
      if (!text) continue;

      const sanitized = text.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
      const parsed = JSON.parse(sanitized) as SuggestedHubOutput;
      return parsed;
    } catch (err: any) {
      console.warn(`[HubMatcher] Falha ao consultar sugestão no Gemini (${model}):`, err?.message || err);
    }
  }

  // Se esgotou todos os modelos sem conseguir resposta válida
  try {
    await logAITask({
      service: "ai_hub",
      action: "hub_suggestion",
      level: "warn",
      status: "failed",
      task_completed: false,
      failure_reason_code: "HUB_SUGGESTION_FAILED",
      message: `Agente de sugestão de Hubs falhou em todos os modelos para "${title.slice(0, 80)}"`,
      metadata: {
        models_attempted: models,
        title,
        has_metadata: Boolean(gameMetadata),
      },
    });
  } catch {
    // Fail-safe defensivo
  }

  return null;
}

/**
 * Orquestrador executado no pipeline de publicação:
 * 1. Consulta os hubs já existentes.
 * 2. Realiza o matching determinístico por aliases/título.
 * 3. Se não houver Hub e a IA estiver disponível, sugere e opcionalmente cria no Supabase.
 */
export async function matchOrSuggestGameHub(params: {
  supabase?: SupabaseClient | null;
  title: string;
  content: string;
  gameMetadata?: Record<string, any>;
  aiClient?: GoogleGenAI | null;
  autoCreate?: boolean;
  defaultCoverUrl?: string | null;
}): Promise<HubMatchResult> {
  const {
    supabase,
    title,
    content,
    gameMetadata,
    aiClient,
    autoCreate = true,
    defaultCoverUrl,
  } = params;

  let existingHubs: GameHub[] = [];

  // 1. Carregar hubs existentes do Supabase se disponível
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("game_hubs")
        .select("*");

      if (!error && data && data.length > 0) {
        existingHubs = data as GameHub[];
      }
    } catch (err: any) {
      console.warn("[HubMatcher] Não foi possível consultar tabela game_hubs:", err?.message || err);
    }
  }

  // 2. Tentar match determinístico
  const matchedHub = matchGameHub(title, content, existingHubs);
  if (matchedHub) {
    return {
      matched: true,
      hubId: matchedHub.id,
      hub: matchedHub,
      isNew: false,
    };
  }

  // 3. Se não encontrou e o cliente de IA Gemini estiver disponível, avaliar sugestão
  if (aiClient) {
    try {
      const suggestion = await suggestGameHubWithGemini(aiClient, title, content, gameMetadata);

      if (suggestion && suggestion.shouldCreateHub && suggestion.name) {
        const cleanSlug = suggestion.slug ? slugifyGameName(suggestion.slug) : slugifyGameName(suggestion.name);

        // Se autoCreate estiver ativo e tivermos conexão com o Supabase, persistir
        if (autoCreate && supabase && cleanSlug) {
          const newHubData = {
            name: suggestion.name.trim(),
            slug: cleanSlug,
            aliases: Array.isArray(suggestion.aliases) && suggestion.aliases.length > 0
              ? suggestion.aliases.map((a) => a.toLowerCase().trim())
              : [suggestion.name.toLowerCase().trim(), cleanSlug.replace(/-/g, " ")],
            developer: suggestion.developer?.trim() || "Estúdio Não Confirmado",
            publisher: suggestion.publisher?.trim() || "Editora Não Confirmada",
            release_date: suggestion.release_date?.trim() || "A Definir",
            platforms: Array.isArray(suggestion.platforms) && suggestion.platforms.length > 0
              ? suggestion.platforms
              : ["Multiplataforma"],
            metacritic_score: typeof suggestion.metacritic_score === "number" ? suggestion.metacritic_score : null,
            cover_image_url:
              suggestion.cover_image_url?.trim() ||
              defaultCoverUrl ||
              "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=800&auto=format&fit=crop",
            banner_image_url:
              suggestion.banner_image_url?.trim() ||
              defaultCoverUrl ||
              "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=1920&auto=format&fit=crop",
            synopsis:
              suggestion.synopsis?.trim() ||
              `Central de notícias, atualizações oficiais e cobertura completa de ${suggestion.name} no Made By AI Games.`,
          };

          const { data: insertedHub, error: insertError } = await supabase
            .from("game_hubs")
            .upsert(newHubData, { onConflict: "slug" })
            .select("*")
            .single();

          if (!insertError && insertedHub) {
            const created = insertedHub as GameHub;
            console.log(`🎮 [HubMatcher] Novo Hub criado automaticamente pela IA: "${created.name}" (/jogos/${created.slug})`);
            try {
              await logAISuccess("ai_hub", "hub_creation", `Novo Hub criado pela IA: "${created.name}"`, {
                hub_id: created.id,
                slug: created.slug,
                title,
              });
            } catch {
              // Fail-safe defensivo
            }
            return {
              matched: true,
              hubId: created.id,
              hub: created,
              isNew: true,
              suggestedHub: suggestion,
            };
          } else {
            console.warn("[HubMatcher] Erro ao inserir novo Hub no banco:", insertError?.message);
            try {
              await logAITask({
                service: "ai_hub",
                action: "hub_suggestion",
                level: "warn",
                status: "failed",
                task_completed: false,
                failure_reason_code: "HUB_SUGGESTION_FAILED",
                message: `Supabase rejeitou criação de Hub para "${newHubData.name}": ${insertError?.message || "Erro desconhecido"}`,
                error: insertError,
                metadata: {
                  hub_name: newHubData.name,
                  slug: newHubData.slug,
                  error: insertError?.message,
                },
              });
            } catch {
              // Fail-safe defensivo
            }
          }
        }

        return {
          matched: false,
          hubId: null,
          hub: null,
          isNew: false,
          suggestedHub: suggestion,
        };
      }
    } catch (err: any) {
      console.warn("[HubMatcher] Falha no fluxo de sugestão via IA:", err?.message || err);
    }
  }

  return {
    matched: false,
    hubId: null,
    hub: null,
    isNew: false,
  };
}
