import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { TwitterApi } from "twitter-api-v2";
import { createClient } from "@supabase/supabase-js";
import {
  generateSocialCopy,
  publishToSocialNetworks,
  sendToInstagram,
  sendToTelegram,
  sendToTwitter,
  SocialArticlePayload,
} from "../lib/services/social-publisher";
import {
  sendDiscordFreeGameAlert,
  sendDiscordNewsAlert,
  executeDiscordWebhook,
} from "../lib/services/discord-notifier";
import {
  logAITask,
  logAISuccess,
  logAIFailure,
  logSocialDispatch,
  resetLoggerDeduplicationCache,
} from "../lib/services/logger";
import { Database, FailureReasonCode } from "../types/database";

const isTelegramOnly = process.argv.includes("--telegram");
const isFindId = process.argv.includes("--find-id");
const isLive = process.argv.includes("--live");

async function checkTelegramUpdates() {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!token) {
    console.error("❌ TELEGRAM_BOT_TOKEN não encontrado no .env.local");
    return;
  }
  console.log("🔍 Consultando mensagens recentes enviadas para o bot...");
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates`);
    const data = await res.json();
    if (!data.ok) {
      console.error("❌ Erro da API do Telegram:", data.description);
      return;
    }

    const updates = data.result || [];
    if (updates.length === 0) {
      console.log("\n⚠️ Nenhuma mensagem encontrada ainda!");
      console.log("👉 Faça o seguinte no Telegram:");
      console.log("   1. Abra o Telegram e procure pelo seu bot: @aigameportalbot");
      console.log("   2. Clique em Iniciar (ou envie qualquer mensagem, como 'olá')");
      console.log("   3. Rode novamente este comando: npx tsx scripts/test-social-publisher.ts --find-id");
      return;
    }

    console.log(`\n🎉 Foram encontradas ${updates.length} interação(ões) recentes:\n`);
    const seenChats = new Set<string>();

    for (const u of updates) {
      const msg = u.message || u.channel_post || u.my_chat_member;
      const chat = msg?.chat;
      if (chat && !seenChats.has(String(chat.id))) {
        seenChats.add(String(chat.id));
        console.log("------------------------------------------------------------");
        console.log(`📌 Tipo: ${chat.type.toUpperCase()}`);
        console.log(`👤 Nome: ${chat.first_name || chat.title || "N/A"} ${chat.last_name || ""}`);
        if (chat.username) console.log(`🔗 Username: @${chat.username}`);
        console.log(`🆔 SEU TELEGRAM_CHAT_ID: ${chat.id}`);
        console.log("------------------------------------------------------------");
        console.log(`Copie e cole no seu .env.local:`);
        console.log(`TELEGRAM_CHAT_ID=${chat.id}\n`);
      }
    }
  } catch (err: any) {
    console.error("❌ Erro ao conectar ao Telegram:", err?.message || err);
  }
}

const mockPayload: SocialArticlePayload = {
  title: "PlayStation anuncia novo State of Play com grandes novidades para 2026",
  slug: "playstation-anuncia-novo-state-of-play-2026",
  url: "https://aigameportal.com/noticias/playstation-anuncia-novo-state-of-play-2026",
  tldr: [
    "Sony confirma transmissão especial focada nos próximos lançamentos de PS5.",
    "Expectativa de novidades sobre jogos exclusivos e atualizações de estúdios parceiros.",
    "Evento será transmitido ao vivo nos canais oficiais da PlayStation.",
  ],
  category: "playstation",
  coverImageUrl: "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=1200&q=80",
  isRumor: false,
  reliabilityScore: 5,
  platforms: ["PS5"],
};

async function getArticlePayload(): Promise<SocialArticlePayload> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://aigameportal.com").replace(/\/+$/, "");

  if (supabaseUrl && supabaseKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data } = await supabase
        .from("posts")
        .select("title, slug, tldr, cover_image_url, is_rumor, reliability_score, game_metadata")
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data && data.slug) {
        console.log(`📰 Usando artigo REAL do seu banco: "${data.title}"`);
        return {
          title: data.title,
          slug: data.slug,
          url: `${siteUrl}/noticias/${data.slug}`,
          tldr: data.tldr || [],
          category: "geral",
          coverImageUrl: data.cover_image_url,
          isRumor: data.is_rumor,
          reliabilityScore: data.reliability_score,
          platforms: data.game_metadata?.platforms,
        };
      }
    } catch {
      // fallback
    }
  }

  console.log("ℹ️ Usando artigo fictício (mock) para testes.");
  return mockPayload;
}

// ==============================================================================
// SUÍTE DE TESTES AUTOMATIZADOS (FASE 3)
// ==============================================================================

async function runAutomatedPhase3Tests(payload: SocialArticlePayload) {
  console.log("\n====================================================================");
  console.log("🧪 [FASE 3] SUÍTE DE TESTES: REDES SOCIAIS, DISCORD & AUTOMAÇÕES");
  console.log("Foco: Instagram, Twitter 402/403/429, Telegram Parse/Timeout, Discord Webhooks");
  console.log("====================================================================\n");

  resetLoggerDeduplicationCache();

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    total++;
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName}${detail ? `: ${detail}` : ""}`);
      process.exit(1);
    }
  }

  // ----------------------------------------------------------------------------
  // CENÁRIO 1: Instagram - Validação de Credenciais e Status Skipped
  // ----------------------------------------------------------------------------
  console.log("[CENÁRIO 1] Instagram - Credenciais Ausentes (INSTAGRAM_NOT_CONFIGURED):");
  const origInstaToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  const origInstaAccount = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
  delete process.env.INSTAGRAM_ACCESS_TOKEN;
  delete process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;

  const copies = generateSocialCopy(payload);
  const instaResult = await sendToInstagram(payload, copies.instagram);

  assert(
    instaResult.success === false &&
      instaResult.skipped === true &&
      Boolean(instaResult.error?.includes("Credenciais")),
    "1.1 sendToInstagram identifica ausência de credenciais e retorna skipped: true com segurança"
  );

  // Restaura se existiam
  if (origInstaToken) process.env.INSTAGRAM_ACCESS_TOKEN = origInstaToken;
  if (origInstaAccount) process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID = origInstaAccount;

  // ----------------------------------------------------------------------------
  // CENÁRIO 2: Instagram - Erro na Meta Graph API (INSTAGRAM_API_ERROR)
  // ----------------------------------------------------------------------------
  console.log("\n[CENÁRIO 2] Instagram - Simulação de Falha na Meta Graph API:");
  const instaErrorLog = await logAITask({
    service: "social_instagram",
    action: "publish_post",
    level: "error",
    status: "failed",
    task_completed: false,
    failure_reason_code: "INSTAGRAM_API_ERROR",
    message: 'Erro na Meta Graph API: Error validating access token: Session has expired',
    error: { message: "Error validating access token: Session has expired", type: "OAuthException", code: 190 },
    metadata: {
      title: payload.title,
      slug: payload.slug,
      accountId: "17841400000000000",
    },
    is_retryable: true,
  });

  assert(
    instaErrorLog.service === "social_instagram" &&
      instaErrorLog.action === "publish_post" &&
      instaErrorLog.status === "failed" &&
      instaErrorLog.task_completed === false &&
      instaErrorLog.failure_reason_code === "INSTAGRAM_API_ERROR",
    "2.1 Registro de falha da Meta Graph API com INSTAGRAM_API_ERROR e task_completed = false"
  );

  // ----------------------------------------------------------------------------
  // CENÁRIO 3: X (Twitter) - HTTP 402 Créditos Esgotados (TWITTER_CREDITS_DEPLETED)
  // ----------------------------------------------------------------------------
  console.log("\n[CENÁRIO 3] X/Twitter - Saldo de Créditos Esgotado (HTTP 402):");
  const twitter402Log = await logAITask({
    service: "social_x",
    action: "publish_post",
    level: "error",
    status: "failed",
    task_completed: false,
    failure_reason_code: "TWITTER_CREDITS_DEPLETED",
    message: 'Saldo de créditos esgotado no X Developer Portal (HTTP 402 - credits depleted)',
    metadata: {
      http_code: 402,
      title: payload.title,
      slug: payload.slug,
    },
    is_retryable: false,
  });

  assert(
    twitter402Log.service === "social_x" &&
      twitter402Log.failure_reason_code === "TWITTER_CREDITS_DEPLETED" &&
      twitter402Log.task_completed === false &&
      twitter402Log.is_retryable === false,
    "3.1 Registro de créditos esgotados com TWITTER_CREDITS_DEPLETED e is_retryable = false"
  );

  // ----------------------------------------------------------------------------
  // CENÁRIO 4: X (Twitter) - HTTP 403 Permissão Read-Only (TWITTER_FORBIDDEN_403)
  // ----------------------------------------------------------------------------
  console.log("\n[CENÁRIO 4] X/Twitter - Permissão OAuth 1.0a Insuficiente (HTTP 403):");
  const twitter403Log = await logAITask({
    service: "social_x",
    action: "publish_post",
    level: "error",
    status: "failed",
    task_completed: false,
    failure_reason_code: "TWITTER_FORBIDDEN_403",
    message: 'Permissão insuficiente no X Developer Portal (HTTP 403 Forbidden). App precisa de Read and Write.',
    metadata: {
      http_code: 403,
      oauth_type: "oauth1-permissions",
    },
    is_retryable: false,
  });

  assert(
    twitter403Log.service === "social_x" &&
      twitter403Log.failure_reason_code === "TWITTER_FORBIDDEN_403" &&
      twitter403Log.task_completed === false,
    "4.1 Registro de permissão insuficiente com TWITTER_FORBIDDEN_403"
  );

  // ----------------------------------------------------------------------------
  // CENÁRIO 5: X (Twitter) - HTTP 429 Rate Limit (TWITTER_RATE_LIMITED)
  // ----------------------------------------------------------------------------
  console.log("\n[CENÁRIO 5] X/Twitter - Rate Limit Atingido (HTTP 429):");
  const twitter429Log = await logAITask({
    service: "social_x",
    action: "publish_post",
    level: "warn",
    status: "failed",
    task_completed: false,
    failure_reason_code: "TWITTER_RATE_LIMITED",
    message: 'Rate limit atingido no X/Twitter (HTTP 429): Too Many Requests',
    metadata: {
      http_code: 429,
      retry_after: 900,
    },
    is_retryable: true,
  });

  assert(
    twitter429Log.service === "social_x" &&
      twitter429Log.failure_reason_code === "TWITTER_RATE_LIMITED" &&
      twitter429Log.is_retryable === true,
    "5.1 Registro de rate limit com TWITTER_RATE_LIMITED e is_retryable = true"
  );

  // ----------------------------------------------------------------------------
  // CENÁRIO 6: Telegram - Erro de Parse HTML (TELEGRAM_PARSE_ERROR)
  // ----------------------------------------------------------------------------
  console.log("\n[CENÁRIO 6] Telegram - Falha de Parse HTML:");
  const tgParseLog = await logAITask({
    service: "social_telegram",
    action: "publish_post",
    level: "error",
    status: "failed",
    task_completed: false,
    failure_reason_code: "TELEGRAM_PARSE_ERROR",
    message: 'Erro ao enviar para Telegram: Bad Request: can\'t parse entities: Character \'<\' is reserved',
    metadata: {
      title: payload.title,
    },
    is_retryable: false,
  });

  assert(
    tgParseLog.service === "social_telegram" &&
      tgParseLog.failure_reason_code === "TELEGRAM_PARSE_ERROR" &&
      tgParseLog.task_completed === false,
    "6.1 Registro de erro de formatação com TELEGRAM_PARSE_ERROR"
  );

  // ----------------------------------------------------------------------------
  // CENÁRIO 7: Telegram - Timeout de Upload de Imagem (TELEGRAM_TIMEOUT_ERROR)
  // ----------------------------------------------------------------------------
  console.log("\n[CENÁRIO 7] Telegram - Timeout de Rede / Upload de Foto:");
  const tgTimeoutLog = await logAITask({
    service: "social_telegram",
    action: "publish_post",
    level: "error",
    status: "failed",
    task_completed: false,
    failure_reason_code: "TELEGRAM_TIMEOUT_ERROR",
    message: 'Exceção na requisição Telegram: The operation was aborted due to timeout',
    metadata: {
      timeout_ms: 10000,
    },
    is_retryable: true,
  });

  assert(
    tgTimeoutLog.service === "social_telegram" &&
      tgTimeoutLog.failure_reason_code === "TELEGRAM_TIMEOUT_ERROR" &&
      tgTimeoutLog.is_retryable === true,
    "7.1 Registro de timeout de foto com TELEGRAM_TIMEOUT_ERROR e is_retryable = true"
  );

  // ----------------------------------------------------------------------------
  // CENÁRIO 8: Telegram - Bot Bloqueado / Chat Não Encontrado (TELEGRAM_BLOCKED_ERROR)
  // ----------------------------------------------------------------------------
  console.log("\n[CENÁRIO 8] Telegram - Bot Bloqueado ou Chat Inexistente:");
  const tgBlockedLog = await logAITask({
    service: "social_telegram",
    action: "publish_post",
    level: "error",
    status: "failed",
    task_completed: false,
    failure_reason_code: "TELEGRAM_BLOCKED_ERROR",
    message: 'Erro ao enviar para Telegram: Forbidden: bot was blocked by the user',
    metadata: {
      chat_id: "-1001234567890",
    },
    is_retryable: false,
  });

  assert(
    tgBlockedLog.service === "social_telegram" &&
      tgBlockedLog.failure_reason_code === "TELEGRAM_BLOCKED_ERROR" &&
      tgBlockedLog.task_completed === false,
    "8.1 Registro de bot bloqueado com TELEGRAM_BLOCKED_ERROR"
  );

  // ----------------------------------------------------------------------------
  // CENÁRIO 9: Discord Webhook - HTTP 400 Bad Request / Limite de Embeds
  // ----------------------------------------------------------------------------
  console.log("\n[CENÁRIO 9] Discord Webhook - Rejeição HTTP 400:");
  const discord400Log = await logAITask({
    service: "social_discord",
    action: "free_game_alert",
    level: "error",
    status: "failed",
    task_completed: false,
    failure_reason_code: "DISCORD_BAD_REQUEST_400",
    message: 'Falha ao postar alerta de jogo grátis no Discord: HTTP 400: {"message": "Invalid Form Body"}',
    metadata: {
      deal_title: "Jogo Grátis Teste",
      status_code: 400,
    },
  });

  assert(
    discord400Log.service === "social_discord" &&
      discord400Log.action === "free_game_alert" &&
      discord400Log.failure_reason_code === "DISCORD_BAD_REQUEST_400" &&
      discord400Log.task_completed === false,
    "9.1 Registro de erro HTTP 400 no Discord com DISCORD_BAD_REQUEST_400"
  );

  // ----------------------------------------------------------------------------
  // CENÁRIO 10: Discord Webhook - HTTP 404 Webhook Inexistente
  // ----------------------------------------------------------------------------
  console.log("\n[CENÁRIO 10] Discord Webhook - Webhook Inexistente (HTTP 404):");
  const discord404Log = await logAITask({
    service: "social_discord",
    action: "breaking_news_alert",
    level: "error",
    status: "failed",
    task_completed: false,
    failure_reason_code: "DISCORD_NOT_FOUND_404",
    message: 'Falha ao enviar notícia urgente ao Discord: HTTP 404: Unknown Webhook',
    metadata: {
      status_code: 404,
      slug: payload.slug,
    },
  });

  assert(
    discord404Log.service === "social_discord" &&
      discord404Log.failure_reason_code === "DISCORD_NOT_FOUND_404" &&
      discord404Log.task_completed === false,
    "10.1 Registro de webhook não encontrado com DISCORD_NOT_FOUND_404"
  );

  // ----------------------------------------------------------------------------
  // CENÁRIO 11: Discord Webhook - HTTP 429 Rate Limit
  // ----------------------------------------------------------------------------
  console.log("\n[CENÁRIO 11] Discord Webhook - Rate Limit Excedido (HTTP 429):");
  const discord429Log = await logAITask({
    service: "social_discord",
    action: "breaking_news_alert",
    level: "error",
    status: "failed",
    task_completed: false,
    failure_reason_code: "DISCORD_RATE_LIMITED",
    message: 'Discord rate-limit excedido após retries (retry_after: 5s)',
    metadata: {
      status_code: 429,
      retry_after: 5,
    },
    is_retryable: true,
  });

  assert(
    discord429Log.service === "social_discord" &&
      discord429Log.failure_reason_code === "DISCORD_RATE_LIMITED" &&
      discord429Log.is_retryable === true,
    "11.1 Registro de rate limit no Discord com DISCORD_RATE_LIMITED e is_retryable = true"
  );

  // ----------------------------------------------------------------------------
  // CENÁRIO 12: GamerPower API - Falha na Ingestão (GAMERPOWER_API_ERROR)
  // ----------------------------------------------------------------------------
  console.log("\n[CENÁRIO 12] Bot de Jogos Grátis - Falha na API GamerPower:");
  const gamerpowerLog = await logAITask({
    service: "social_discord",
    action: "fetch_giveaways",
    level: "error",
    status: "failed",
    task_completed: false,
    failure_reason_code: "GAMERPOWER_API_ERROR",
    message: 'Falha na API GamerPower (HTTP 502 Bad Gateway)',
    error: "HTTP 502: Bad Gateway",
    metadata: {
      endpoint: "https://www.gamerpower.com/api/giveaways?type=game",
      http_status: 502,
    },
    is_retryable: true,
  });

  assert(
    gamerpowerLog.service === "social_discord" &&
      gamerpowerLog.action === "fetch_giveaways" &&
      gamerpowerLog.failure_reason_code === "GAMERPOWER_API_ERROR" &&
      gamerpowerLog.task_completed === false,
    "12.1 Registro de erro da API GamerPower com GAMERPOWER_API_ERROR"
  );

  // ----------------------------------------------------------------------------
  // CENÁRIO 13: Newsletter Resend - Falha no Envio em Lote (RESEND_BATCH_ERROR)
  // ----------------------------------------------------------------------------
  console.log("\n[CENÁRIO 13] Newsletter - Falha no Envio via Resend:");
  const resendLog = await logAITask({
    service: "newsletter",
    action: "send_newsletter_email",
    level: "error",
    status: "failed",
    task_completed: false,
    failure_reason_code: "RESEND_BATCH_ERROR",
    message: 'Falha ao enviar e-mail para assinante@exemplo.com: Domain not verified',
    error: "Domain not verified",
    metadata: {
      email: "assinante@exemplo.com",
      subject: `🎮 Resumo Gamer: ${payload.title}`,
    },
    is_retryable: true,
  });

  assert(
    resendLog.service === "newsletter" &&
      resendLog.action === "send_newsletter_email" &&
      resendLog.failure_reason_code === "RESEND_BATCH_ERROR" &&
      resendLog.task_completed === false,
    "13.1 Registro de erro no envio da newsletter com RESEND_BATCH_ERROR"
  );

  // ----------------------------------------------------------------------------
  // CENÁRIO 14: Orquestrador Multi-canal com Retorno Estruturado
  // ----------------------------------------------------------------------------
  console.log("\n[CENÁRIO 14] Orquestrador Multi-canal (publishToSocialNetworks):");
  const multiResult = await publishToSocialNetworks(payload);

  assert(
    "telegram" in multiResult &&
      "twitter" in multiResult &&
      "instagram" in multiResult,
    "14.1 publishToSocialNetworks retorna estrutura completa com telegram, twitter e instagram"
  );

  // ----------------------------------------------------------------------------
  // CENÁRIO 15: Verificação de Persistência no Banco Supabase (public.ai_system_logs)
  // ----------------------------------------------------------------------------
  console.log("\n[CENÁRIO 15] Verificação de Integridade dos Logs no Supabase:");
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey && supabaseUrl.startsWith("http")) {
    try {
      const supabase = createClient<Database>(supabaseUrl, supabaseKey);
      const { data, error: dbErr } = await (supabase.from("ai_system_logs") as any)
        .select("id, service, action, status, task_completed, failure_reason_code")
        .in("service", ["social_instagram", "social_x", "social_telegram", "social_discord", "newsletter"])
        .order("created_at", { ascending: false })
        .limit(10);

      const logs = (data || []) as Array<{ task_completed: boolean; failure_reason_code: string | null }>;

      if (dbErr) {
        console.warn(`  ⚠️ Consulta ao Supabase retornou aviso: ${dbErr.message}`);
      } else if (logs && logs.length > 0) {
        console.log(`  💾 Encontrados ${logs.length} logs de redes sociais/automação persistidos com sucesso!`);
        assert(
          logs.some((l) => l.task_completed === false && l.failure_reason_code !== null),
          "15.1 Supabase armazena logs com task_completed = false e failure_reason_code padronizado"
        );
      } else {
        console.log("  ℹ️ Tabela ai_system_logs ainda sem registros prévios remotos.");
      }
    } catch (e: any) {
      console.warn(`  ⚠️ Exceção ao consultar Supabase: ${e?.message || e}`);
    }
  } else {
    console.log("  ℹ️ Supabase não configurado neste ambiente. Teste executado em modo local fail-safe.");
  }

  console.log("\n====================================================================");
  console.log(`🎉 SUÍTE DA FASE 3 CONCLUÍDA COM SUCESSO: ${passed}/${total} testes aprovados!`);
  console.log("====================================================================\n");
}

// ==============================================================================
// EXECUÇÃO PRINCIPAL DO SCRIPT
// ==============================================================================

async function run() {
  console.log("====================================================================");
  console.log("🧪 [Teste Social Publisher & Logger] Distribuição Social e APIs");
  console.log("====================================================================");

  if (isFindId) {
    await checkTelegramUpdates();
    return;
  }

  const payload = await getArticlePayload();

  if (isTelegramOnly) {
    console.log("\n🚀 Testando ENVIO REAL para o Telegram...");
    const copy = generateSocialCopy(payload);
    const result = await sendToTelegram(payload, copy.telegram);
    console.log("\nResultado Telegram:", JSON.stringify(result, null, 2));
    return;
  }

  console.log("\n1. Verificando Variáveis de Ambiente:");
  console.log(`   - TELEGRAM_BOT_TOKEN: ${process.env.TELEGRAM_BOT_TOKEN ? "✅ Configurado" : "❌ Ausente"}`);
  console.log(`   - TELEGRAM_CHAT_ID: ${process.env.TELEGRAM_CHAT_ID ? "✅ Configurado" : "❌ Ausente"}`);
  console.log(`   - TWITTER_API_KEY: ${process.env.TWITTER_API_KEY ? "✅ Configurado" : "❌ Ausente"}`);
  console.log(`   - TWITTER_API_SECRET: ${process.env.TWITTER_API_SECRET ? "✅ Configurado" : "❌ Ausente"}`);
  console.log(`   - TWITTER_ACCESS_TOKEN: ${process.env.TWITTER_ACCESS_TOKEN ? "✅ Configurado" : "❌ Ausente"}`);
  console.log(`   - TWITTER_ACCESS_SECRET: ${process.env.TWITTER_ACCESS_SECRET ? "✅ Configurado" : "❌ Ausente"}`);
  console.log(`   - INSTAGRAM_ACCESS_TOKEN: ${process.env.INSTAGRAM_ACCESS_TOKEN ? "✅ Configurado" : "❌ Ausente"}`);
  console.log(`   - INSTAGRAM_BUSINESS_ACCOUNT_ID: ${process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID ? "✅ Configurado" : "❌ Ausente"}`);
  console.log(`   - DISCORD_WEBHOOK_NEWS: ${process.env.DISCORD_WEBHOOK_NEWS ? "✅ Configurado" : "❌ Ausente"}`);
  console.log(`   - DISCORD_WEBHOOK_FREE_GAMES: ${process.env.DISCORD_WEBHOOK_FREE_GAMES ? "✅ Configurado" : "❌ Ausente"}`);

  console.log("\n2. Teste de Formatação de Cópias (Preview):");
  const copies = generateSocialCopy(payload);
  console.log("\n--- [X / Twitter Copy] ---");
  console.log(copies.twitter);
  console.log(`Caracteres: ${copies.twitter.length}/280`);

  console.log("\n--- [Telegram Copy] ---");
  console.log(copies.telegram);

  console.log("\n--- [Instagram Copy] ---");
  console.log(copies.instagram);

  if (!isLive) {
    // Roda os testes automatizados da Fase 3
    await runAutomatedPhase3Tests(payload);
    return;
  }

  console.log("\n🚀 Executando publicação REAL em modo --live...");
  const result = await publishToSocialNetworks(payload);
  console.log("\nResultado final:", JSON.stringify(result, null, 2));
}

run().catch((e) => {
  console.error("Erro no script de teste:", e);
  process.exit(1);
});
