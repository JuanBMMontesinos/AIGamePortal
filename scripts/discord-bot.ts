/**
 * ==============================================================================
 * PROJETO: Made By AI Games (Fase 4 - Bot de Alertas de Jogos Grátis para o Discord)
 * SCRIPT: scripts/discord-bot.ts
 * ==============================================================================
 *
 * Execução autônoma (Serverless/Cron/CLI):
 * - Consulta a API pública da GamerPower para identificar novas ofertas de jogos 100% gratuitos.
 * - Compara com a tabela Supabase `free_games_history` (com fallback local para desenvolvimento).
 * - Envia Rich Embeds profissionais para o webhook do Discord com capa HD, plataformas,
 *   preço original riscado, data limite e botões interativos de resgate.
 *
 * USO:
 *  npx tsx scripts/discord-bot.ts
 *  npx tsx scripts/discord-bot.ts --dry-run
 *  npx tsx scripts/discord-bot.ts --limit=3
 *  npx tsx scripts/discord-bot.ts --force
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { Database } from "../types/database";
import {
  sendDiscordFreeGameAlert,
  FreeGameDeal,
  sanitizeDealTitle,
  formatDealPrice,
  formatExpiryDate,
} from "../lib/services/discord-notifier";

// ==============================================================================
// CONFIGURAÇÕES & VARIÁVEIS DE AMBIENTE
// ==============================================================================

const GAMERPOWER_API_URL = "https://www.gamerpower.com/api/giveaways?type=game";
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_FREE_GAMES || "";
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const LOCAL_HISTORY_PATH = path.resolve(process.cwd(), "scratch", "free_games_history.json");

// Parse de argumentos CLI
const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run") || process.env.DRY_RUN === "true";
const isForce = args.includes("--force");
const limitArg = args.find((arg) => arg.startsWith("--limit="))?.split("=")[1];
const maxDealsPerRun = limitArg ? parseInt(limitArg, 10) : 5;

// Inicialização segura do cliente Supabase
const isSupabaseLive = Boolean(
  SUPABASE_URL &&
    SUPABASE_KEY &&
    !SUPABASE_URL.includes("your-project") &&
    SUPABASE_URL.startsWith("http")
);

const supabase: SupabaseClient<Database> | null = isSupabaseLive
  ? createClient<Database>(SUPABASE_URL, SUPABASE_KEY)
  : null;

// ==============================================================================
// GERENCIADOR DE HISTÓRICO DUAL (SUPABASE + FALLBACK LOCAL)
// ==============================================================================

/**
 * Carrega a lista local de IDs em caso de fallback
 */
function loadLocalHistory(): Set<string> {
  try {
    if (fs.existsSync(LOCAL_HISTORY_PATH)) {
      const raw = fs.readFileSync(LOCAL_HISTORY_PATH, "utf-8");
      const list = JSON.parse(raw);
      if (Array.isArray(list)) {
        return new Set(list.map(String));
      }
    }
  } catch (err: any) {
    console.warn(`  ⚠️ [LocalHistory] Erro ao ler histórico local: ${err?.message || err}`);
  }
  return new Set();
}

/**
 * Salva no arquivo local de histórico
 */
function saveLocalHistory(dealId: string): void {
  try {
    const dir = path.dirname(LOCAL_HISTORY_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const current = Array.from(loadLocalHistory());
    if (!current.includes(dealId)) {
      current.push(dealId);
      fs.writeFileSync(LOCAL_HISTORY_PATH, JSON.stringify(current, null, 2), "utf-8");
    }
  } catch (err: any) {
    console.warn(`  ⚠️ [LocalHistory] Erro ao salvar histórico local: ${err?.message || err}`);
  }
}

/**
 * Verifica se uma oferta já foi disparada anteriormente
 */
async function hasDealBeenPosted(dealId: string): Promise<boolean> {
  if (isForce) return false;

  // 1. Tenta consulta via Supabase
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("free_games_history")
        .select("id")
        .eq("deal_id", dealId)
        .maybeSingle();

      if (!error && data) {
        return true;
      }
    } catch (dbErr: any) {
      console.warn(`  ⚠️ [Supabase] Erro ao consultar free_games_history: ${dbErr?.message || dbErr}. Usando fallback local.`);
    }
  }

  // 2. Fallback para histórico local
  const localSet = loadLocalHistory();
  return localSet.has(dealId);
}

/**
 * Registra a oferta no histórico como postada
 */
async function markDealAsPosted(deal: FreeGameDeal): Promise<void> {
  const dealIdStr = String(deal.id);

  // Sempre grava no arquivo local para garantir redundância
  saveLocalHistory(dealIdStr);

  // Grava no banco de dados Supabase caso disponível
  if (supabase) {
    try {
      let expiresAt: string | null = null;
      if (deal.end_date && deal.end_date !== "N/A") {
        const parsed = new Date(deal.end_date.replace(" ", "T"));
        if (!isNaN(parsed.getTime())) {
          expiresAt = parsed.toISOString();
        }
      }

      const { error } = await (supabase.from("free_games_history") as any).insert({
        deal_id: dealIdStr,
        title: sanitizeDealTitle(deal.title),
        platform: deal.platforms || null,
        worth: deal.worth || null,
        giveaway_url: deal.open_giveaway_url,
        image_url: deal.image || deal.thumbnail || null,
        expires_at: expiresAt,
        posted_at: new Date().toISOString(),
      });

      if (error) {
        console.warn(`  ⚠️ [Supabase] Falha ao registrar oferta no banco: ${error.message}`);
      }
    } catch (insertErr: any) {
      console.warn(`  ⚠️ [Supabase] Exceção ao gravar no banco: ${insertErr?.message || insertErr}`);
    }
  }
}

/**
 * Verifica se os envios de jogos grátis estão autorizados no painel administrativo (/admin/discord)
 */
async function checkDealsEnabled(): Promise<{ isEnabled: boolean; reason: string | null }> {
  if (!supabase) {
    return {
      isEnabled: false,
      reason: "Supabase não conectado (padrão de segurança: desabilitado).",
    };
  }

  try {
    const { data, error } = await supabase
      .from("discord_settings")
      .select("is_deals_enabled, deals_disabled_reason")
      .eq("id", "default")
      .maybeSingle();

    if (error || !data) {
      return {
        isEnabled: false,
        reason: "Configuração discord_settings não encontrada (padrão de segurança: desabilitado).",
      };
    }

    const row = data as any;
    return {
      isEnabled: row.is_deals_enabled === true,
      reason: row.deals_disabled_reason || "Envios de jogos grátis desabilitados no painel /admin/discord",
    };
  } catch (err: any) {
    return {
      isEnabled: false,
      reason: err?.message || "Erro ao consultar configurações do Discord.",
    };
  }
}

/**
 * Atualiza o status e log da execução na tabela discord_settings
 */
async function updateDispatchStatus(
  status: "idle" | "success" | "failed" | "skipped",
  log: string
): Promise<void> {
  if (!supabase) return;
  try {
    await (supabase.from("discord_settings") as any).upsert({
      id: "default",
      last_deals_dispatched_at: new Date().toISOString(),
      last_deals_dispatch_status: status,
      last_deals_dispatch_log: log.slice(0, 1000),
      updated_at: new Date().toISOString(),
    });
  } catch (err: any) {
    console.warn(`  ⚠️ Falha ao atualizar telemetria em discord_settings: ${err?.message || err}`);
  }
}

// ==============================================================================
// CONSUMO DA API DE JOGOS GRÁTIS
// ==============================================================================

/**
 * Busca a lista de ofertas ativas da GamerPower
 */
async function fetchGiveaways(): Promise<FreeGameDeal[]> {
  console.log(`🌐 [GamerPower] Consultando API de gratuidades: ${GAMERPOWER_API_URL}`);

  const res = await fetch(GAMERPOWER_API_URL, {
    headers: {
      "User-Agent": "MadeByAIGames-DiscordBot/1.0",
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    throw new Error(`Falha na API GamerPower (HTTP ${res.status}): ${await res.text().catch(() => "")}`);
  }

  const data = await res.json();
  if (!Array.isArray(data)) {
    throw new Error("Formato inesperado de resposta da API GamerPower (não é um array)");
  }

  return data as FreeGameDeal[];
}

// ==============================================================================
// ORQUESTRADOR PRINCIPAL DO BOT
// ==============================================================================

async function runDiscordDealsBot() {
  const startTime = Date.now();

  console.log("====================================================================");
  console.log("🤖 [Made By AI Games] Bot de Alertas de Jogos Grátis para Discord");
  console.log("====================================================================");
  console.log(`⏱️ Início da execução: ${new Date().toISOString()}`);
  console.log(`🧪 Modo Dry-Run: ${isDryRun ? "ATIVADO (Sem envios reais)" : "DESATIVADO"}`);
  console.log(`🎯 Limite por ciclo: ${maxDealsPerRun} ofertas`);
  console.log(`💾 Persistência Supabase: ${supabase ? "CONECTADO" : "FALLBACK LOCAL"}`);
  console.log(`📢 Webhook Alvo: ${DISCORD_WEBHOOK_URL ? "CONFIGURADO" : "AUSENTE (dry-run recomendado)"}`);
  console.log("--------------------------------------------------------------------\n");

  // 0. Verifica se o envio está autorizado no painel administrativo (/admin/discord)
  console.log("🔒 [0/2] Verificando autorização de envio no painel administrativo...");
  const { isEnabled, reason } = await checkDealsEnabled();

  if (!isEnabled) {
    if (isDryRun || isForce) {
      console.log("⚠️ [AVISO] O envio de alertas está DESABILITADO no painel administrativo.");
      console.log(`📌 Motivo registrado: "${reason}"`);
      console.log(`🧪 Flag --${isDryRun ? "dry-run" : "force"} ativa: Continuando execução apenas para simulação.`);
    } else {
      console.log("🛑 [BLOQUEIO DE SEGURANÇA] O envio de alertas para o Discord está DESABILITADO.");
      console.log(`📌 Motivo da pausa: "${reason}"`);
      console.log("💡 Para reativar, acesse o painel administrativo: /admin/discord");
      await updateDispatchStatus("skipped", `Envio pausado via painel admin. Motivo: ${reason}`);
      return;
    }
  }

  let deals: FreeGameDeal[] = [];

  try {
    deals = await fetchGiveaways();
    console.log(`📦 [GamerPower] Total de ofertas encontradas na API: ${deals.length}`);
  } catch (err: any) {
    console.error(`❌ [GamerPower] Erro fatal ao buscar ofertas: ${err?.message || err}`);
    process.exit(1);
  }

  // Filtragem inicial: apenas tipo "Game" e ativas (se a chave status existir)
  const candidateDeals = deals.filter((d) => {
    const isGame = !d.type || d.type.toLowerCase() === "game";
    const isActive = !d.status || d.status.toLowerCase() === "active";
    return isGame && isActive;
  });

  console.log(`🎮 [Filtro] Ofertas válidas de jogos completos: ${candidateDeals.length}`);

  let totalPosted = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  for (const deal of candidateDeals) {
    if (totalPosted >= maxDealsPerRun) {
      console.log(`\n🛑 Limite de ${maxDealsPerRun} novos alertas atingido para esta execução. Encerrando ciclo.`);
      break;
    }

    const dealIdStr = String(deal.id);
    const cleanTitle = sanitizeDealTitle(deal.title);

    // 1. Checagem de duplicação
    const alreadyPosted = await hasDealBeenPosted(dealIdStr);
    if (alreadyPosted) {
      totalSkipped++;
      continue;
    }

    console.log(`\n✨ Nova oportunidade detectada: [ID ${dealIdStr}] "${cleanTitle}"`);
    console.log(`   Plataforma: ${deal.platforms || "PC"}`);
    console.log(`   Preço Original: ${formatDealPrice(deal.worth)}`);
    console.log(`   Validade: ${formatExpiryDate(deal.end_date)}`);
    console.log(`   URL: ${deal.open_giveaway_url}`);

    // 2. Modo Dry-run: Apenas exibe o preview sem disparar
    if (isDryRun) {
      console.log(`   🧪 [DRY-RUN] Embed simulado com sucesso. Nenhuma mensagem enviada ao Discord.`);
      totalPosted++;
      continue;
    }

    // 3. Envio real para o Webhook do Discord
    if (!DISCORD_WEBHOOK_URL) {
      console.warn(`   ⚠️ DISCORD_WEBHOOK_FREE_GAMES não configurado. Impossível enviar.`);
      totalErrors++;
      continue;
    }

    try {
      const sendResult = await sendDiscordFreeGameAlert(deal, DISCORD_WEBHOOK_URL);

      if (sendResult.success) {
        await markDealAsPosted(deal);
        totalPosted++;

        // Delay de segurança de 1.5s entre disparos para respeitar o rate-limit do Discord
        await new Promise((resolve) => setTimeout(resolve, 1500));
      } else {
        console.error(`   ❌ Erro ao enviar para Discord: ${sendResult.error}`);
        totalErrors++;
      }
    } catch (postErr: any) {
      console.error(`   ❌ Exceção ao processar deal ${dealIdStr}: ${postErr?.message || postErr}`);
      totalErrors++;
    }
  }

  // ==============================================================================
  // RELATÓRIO FINAL
  // ==============================================================================
  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log("\n====================================================================");
  console.log("📊 [Made By AI Games] Relatório de Execução do Discord Bot");
  console.log("====================================================================");
  console.log(`⏱️ Tempo total de execução: ${durationSec}s`);
  console.log(`📢 Novos alertas enviados: ${totalPosted}`);
  console.log(`⏭️ Ofertas já notificadas (puladas): ${totalSkipped}`);
  console.log(`⚠️ Erros encontrados: ${totalErrors}`);
  console.log("====================================================================\n");

  if (!isDryRun) {
    if (totalErrors > 0 && totalPosted === 0) {
      await updateDispatchStatus(
        "failed",
        `Execução falhou com ${totalErrors} erros. Nenhuma oferta enviada.`
      );
    } else {
      await updateDispatchStatus(
        "success",
        `Executado com sucesso. ${totalPosted} novas ofertas enviadas ao Discord, ${totalSkipped} já existentes puladas.`
      );
    }
  }

  if (totalErrors > 0 && totalPosted === 0 && !isDryRun) {
    process.exit(1);
  }
}

// Execução
runDiscordDealsBot().catch((fatalErr) => {
  console.error("💥 Erro não tratado no Discord Bot:", fatalErr);
  process.exit(1);
});
