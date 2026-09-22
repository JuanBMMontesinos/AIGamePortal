import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import {
  logAITask,
  logAISuccess,
  logAIFailure,
  logSocialDispatch,
  sanitizeLogPayload,
  sanitizeSingleLine,
  sanitizeErrorDetails,
  resetLoggerDeduplicationCache,
} from "../lib/services/logger";

async function runTests() {
  console.log("=== INICIANDO SUÍTE DE TESTES AUTOMATIZADOS - FASE 1 ===");
  console.log("Foco: Sistema Centralizado de Logs & Auditoria IA (Sanitização CWE-532, CWE-117 e De-duplicação)\n");

  let testsPassed = 0;
  let testsTotal = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    testsTotal++;
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      testsPassed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName}${detail ? `: ${detail}` : ""}`);
      process.exit(1);
    }
  }

  // ============================================================================
  // TESTE 1: SANITIZAÇÃO UNIVERSAL DE SEGREDOS (CWE-532)
  // ============================================================================
  console.log("[TESTE 1] Sanitização Criptográfica de Segredos (CWE-532):");

  const FAKE_GEMINI_KEY = "AIzaSyD_TestFakeKeyForSanitizerValidation12";
  const FAKE_TELEGRAM_TOKEN = "123456789:ABCdefGHIjklMNOpqrsTUVwxyz123456789";
  const FAKE_DISCORD_WEBHOOK =
    "https://discord.com/api/webhooks/123456789012345678/abcdefghijklmnopqrstuvwxyz0123456789ABCDEF12345";
  const FAKE_JWT =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
  const FAKE_RESEND_KEY = "re_12345678_abcdefghijklmnopqrstuvwxyz90";
  const FAKE_TWITTER_BEARER = "Bearer AAAAAAAAAAAAAAAAAAAAAFX5EAAAAAAA1234567890abcdefghijklm";
  const FAKE_SESSION_COOKIE = "sb-access-auth-token=super_secret_cookie_payload_12345; Path=/";

  // 1.1 Gemini API Key
  const sanitizedGemini = sanitizeSingleLine(`Falha na API: chave ${FAKE_GEMINI_KEY} atingiu quota`);
  assert(
    !sanitizedGemini.includes(FAKE_GEMINI_KEY) && sanitizedGemini.includes("[REDACTED_GEMINI_KEY]"),
    "Cenário 1.1: Chave Google Gemini mascarada com [REDACTED_GEMINI_KEY]",
    sanitizedGemini
  );

  // 1.2 Telegram Bot Token
  const sanitizedTelegram = sanitizeSingleLine(`Erro no bot do Telegram com token ${FAKE_TELEGRAM_TOKEN}`);
  assert(
    !sanitizedTelegram.includes(FAKE_TELEGRAM_TOKEN) && sanitizedTelegram.includes("[REDACTED_TELEGRAM_TOKEN]"),
    "Cenário 1.2: Token do Bot Telegram mascarado com [REDACTED_TELEGRAM_TOKEN]",
    sanitizedTelegram
  );

  // 1.3 Discord Webhook URL
  const sanitizedDiscord = sanitizeSingleLine(`Webhook falhou: ${FAKE_DISCORD_WEBHOOK}`);
  assert(
    !sanitizedDiscord.includes("abcdefghijklmnopqrstuvwxyz") &&
      sanitizedDiscord.includes("https://discord.com/api/webhooks/[REDACTED_DISCORD_WEBHOOK]"),
    "Cenário 1.3: URL de Webhook do Discord mascarada com [REDACTED_DISCORD_WEBHOOK]",
    sanitizedDiscord
  );

  // 1.4 JWT / Supabase Token
  const sanitizedJwt = sanitizeSingleLine(`Authorization Bearer ${FAKE_JWT}`);
  assert(
    !sanitizedJwt.includes(FAKE_JWT) && sanitizedJwt.includes("[REDACTED_JWT_TOKEN]"),
    "Cenário 1.4: Token JWT mascarado com [REDACTED_JWT_TOKEN]",
    sanitizedJwt
  );

  // 1.5 Resend API Key
  const sanitizedResend = sanitizeSingleLine(`Falha no envio de e-mail com chave ${FAKE_RESEND_KEY}`);
  assert(
    !sanitizedResend.includes(FAKE_RESEND_KEY) && sanitizedResend.includes("[REDACTED_RESEND_KEY]"),
    "Cenário 1.5: Chave do Resend mascarada com [REDACTED_RESEND_KEY]",
    sanitizedResend
  );

  // 1.6 Twitter Bearer Token
  const sanitizedTwitter = sanitizeSingleLine(`Headers: ${FAKE_TWITTER_BEARER}`);
  assert(
    !sanitizedTwitter.includes("AAAAAAAAAAAAAAAAAAAAAFX5EAAAAAAA") &&
      sanitizedTwitter.includes("Bearer [REDACTED_TWITTER_BEARER]"),
    "Cenário 1.6: Token Bearer do Twitter/X mascarado com [REDACTED_TWITTER_BEARER]",
    sanitizedTwitter
  );

  // 1.7 Cookies de Sessão
  const sanitizedCookie = sanitizeSingleLine(`Cookie header: ${FAKE_SESSION_COOKIE}`);
  assert(
    !sanitizedCookie.includes("super_secret_cookie_payload_12345") &&
      sanitizedCookie.includes("[REDACTED_COOKIE]"),
    "Cenário 1.7: Cookie de sessão mascarado com [REDACTED_COOKIE]",
    sanitizedCookie
  );

  // 1.8 Objeto JSON com propriedades sensíveis
  const sensitiveObj = {
    apiKey: "plain_api_key_123",
    secret: "plain_secret_456",
    password: "super_secret_password",
    safeField: "not_a_secret",
    nested: {
      private_key: "nested_private_key",
      gemini_url: `https://generativelanguage.googleapis.com/v1beta/models?key=${FAKE_GEMINI_KEY}`,
    },
  };
  const sanitizedObj: any = sanitizeLogPayload(sensitiveObj);
  assert(
    sanitizedObj.apiKey === "[REDACTED_SECRET]" &&
      sanitizedObj.secret === "[REDACTED_SECRET]" &&
      sanitizedObj.password === "[REDACTED_SECRET]" &&
      sanitizedObj.safeField === "not_a_secret" &&
      sanitizedObj.nested.private_key === "[REDACTED_SECRET]" &&
      sanitizedObj.nested.gemini_url.includes("[REDACTED_GEMINI_KEY]"),
    "Cenário 1.8: Objeto JSON recursivo com propriedades sensíveis completamente mascaradas"
  );

  // 1.9 Prevenção contra referências circulares
  const circularObj: any = { name: "test_cycle" };
  circularObj.self = circularObj;
  const sanitizedCircular: any = sanitizeLogPayload(circularObj);
  assert(
    sanitizedCircular.name === "test_cycle" && sanitizedCircular.self === "[CIRCULAR_REFERENCE]",
    "Cenário 1.9: Objeto com referência circular tratado de forma segura sem loop infinito"
  );

  // ============================================================================
  // TESTE 2: MITIGAÇÃO DE LOG INJECTION (CWE-117)
  // ============================================================================
  console.log("\n[TESTE 2] Mitigação de Log Injection (CWE-117):");

  // 2.1 Injeção de quebra de linha CRLF
  const crlfAttack = "Processamento iniciado com sucesso.\r\n[CRITICAL][ADMIN] Admin user logged in as ROOT!\r\nDetails:";
  const sanitizedCrlf = sanitizeSingleLine(crlfAttack);
  assert(
    !sanitizedCrlf.includes("\r") &&
      !sanitizedCrlf.includes("\n") &&
      sanitizedCrlf.includes("Processamento iniciado com sucesso. [CRITICAL][ADMIN] Admin user logged in as ROOT! Details:"),
    "Cenário 2.1: Quebras de linha CRLF convertidas em espaços lineares seguros",
    sanitizedCrlf
  );

  // 2.2 Injeção de sequências de escape ANSI
  const ansiAttack = "Texto normal \x1b[31;1mINJEÇÃO VERMELHA\x1b[0m final";
  const sanitizedAnsi = sanitizeSingleLine(ansiAttack);
  assert(
    !sanitizedAnsi.includes("\x1b") && sanitizedAnsi === "Texto normal INJEÇÃO VERMELHA final",
    "Cenário 2.2: Sequências de formatação ANSI removidas",
    sanitizedAnsi
  );

  // ============================================================================
  // TESTE 3: MÉTODOS UTILITÁRIOS E FLAGS DE CONCLUSÃO DE TAREFA
  // ============================================================================
  console.log("\n[TESTE 3] Métodos Utilitários e Flags de Auditoria de IA:");

  // 3.1 logAISuccess
  const successLog = await logAISuccess(
    "ai_writer",
    "article_rewrite",
    `Artigo reescrito com sucesso utilizando ${FAKE_GEMINI_KEY}`,
    { model: "gemini-2.5-flash", duration_ms: 1250 }
  );

  assert(
    successLog.service === "ai_writer" &&
      successLog.action === "article_rewrite" &&
      successLog.level === "info" &&
      successLog.status === "success" &&
      successLog.task_completed === true &&
      !successLog.message.includes(FAKE_GEMINI_KEY) &&
      successLog.message.includes("[REDACTED_GEMINI_KEY]"),
    "Cenário 3.1: logAISuccess registra task_completed = true e sanitiza a mensagem"
  );

  // 3.2 logAIFailure
  const failureLog = await logAIFailure(
    "ai_writer",
    "article_rewrite",
    "Limite de cota da API atingido durante geração de artigo",
    {
      level: "error",
      failureReasonCode: "GEMINI_QUOTA_EXCEEDED",
      error: new Error(`Quota limit exceeded on key ${FAKE_GEMINI_KEY}`),
      metadata: { attempt: 3, raw_feed: "IGN Brasil" },
      is_retryable: true,
    }
  );

  assert(
    failureLog.service === "ai_writer" &&
      failureLog.action === "article_rewrite" &&
      failureLog.level === "error" &&
      failureLog.status === "failed" &&
      failureLog.task_completed === false && // FLAG PRIMÁRIA
      failureLog.failure_reason_code === "GEMINI_QUOTA_EXCEEDED" &&
      failureLog.is_retryable === true &&
      failureLog.error_details !== null &&
      !failureLog.error_details.includes(FAKE_GEMINI_KEY) &&
      failureLog.error_details.includes("[REDACTED_GEMINI_KEY]"),
    "Cenário 3.2: logAIFailure registra estritamente task_completed = false e código de falha"
  );

  // 3.3 Limite defensivo de tamanho de error_details (máx 4000 caracteres)
  const hugeError = new Error("X".repeat(6000));
  const sanitizedHugeError = sanitizeErrorDetails(hugeError);
  assert(
    sanitizedHugeError !== null &&
      sanitizedHugeError.length <= 4000 &&
      sanitizedHugeError.includes("[TRUNCATED_ERROR_DETAILS_MAX_4000_CHARS]"),
    `Cenário 3.3: error_details com limite defensivo de 4000 caracteres (comprimento: ${sanitizedHugeError?.length})`
  );

  // 3.4 logSocialDispatch para múltiplos canais
  const telegramDispatch = await logSocialDispatch(
    "telegram",
    "success",
    "Post publicado no canal oficial com sucesso",
    { message_id: 12345 }
  );

  assert(
    telegramDispatch.service === "social_telegram" &&
      telegramDispatch.action === "publish_post" &&
      telegramDispatch.level === "info" &&
      telegramDispatch.status === "success" &&
      telegramDispatch.task_completed === true,
    "Cenário 3.4: logSocialDispatch mapeia 'telegram' para serviço 'social_telegram' com sucesso"
  );

  const discordDispatch = await logSocialDispatch(
    "discord",
    "failed",
    "Webhook do Discord retornou HTTP 500",
    { webhook_url: FAKE_DISCORD_WEBHOOK },
    new Error("Internal Server Error")
  );

  assert(
    discordDispatch.service === "social_discord" &&
      discordDispatch.status === "failed" &&
      discordDispatch.task_completed === false &&
      discordDispatch.failure_reason_code === "DISCORD_WEBHOOK_ERROR",
    "Cenário 3.5: logSocialDispatch mapeia falha no Discord com código DISCORD_WEBHOOK_ERROR e task_completed = false"
  );

  // ============================================================================
  // TESTE 4: DE-DUPLICAÇÃO INTELIGENTE DE ERROS CONSECUTIVOS NO MESMO MINUTO
  // ============================================================================
  console.log("\n[TESTE 4] De-duplicação Inteligente de Erros Repetitivos:");

  resetLoggerDeduplicationCache();

  // Primeiro disparo do erro
  const error1 = await logAIFailure(
    "rss_scraper",
    "scrape_feed",
    "Feed RSS indisponível: Connection reset by peer",
    {
      level: "error",
      failureReasonCode: "RSS_FEED_UNREACHABLE",
    }
  );

  assert(error1.repeat_count === 1, "Cenário 4.1: Primeiro disparo de erro possui repeat_count = 1");

  // Segundo disparo consecutivo idêntico dentro do mesmo minuto
  const error2 = await logAIFailure(
    "rss_scraper",
    "scrape_feed",
    "Feed RSS indisponível: Connection reset by peer",
    {
      level: "error",
      failureReasonCode: "RSS_FEED_UNREACHABLE",
    }
  );

  assert(
    error2.repeat_count === 2,
    `Cenário 4.2: Segundo disparo consecutivo no mesmo minuto detectado e de-duplicado com repeat_count = 2 (obtido: ${error2.repeat_count})`
  );

  // Terceiro disparo consecutivo idêntico
  const error3 = await logAIFailure(
    "rss_scraper",
    "scrape_feed",
    "Feed RSS indisponível: Connection reset by peer",
    {
      level: "error",
      failureReasonCode: "RSS_FEED_UNREACHABLE",
    }
  );

  assert(
    error3.repeat_count === 3,
    `Cenário 4.3: Terceiro disparo consecutivo incrementa repeat_count para 3 (obtido: ${error3.repeat_count})`
  );

  // Disparo de um erro com assinatura diferente -> não deve de-duplicar com o anterior
  const errorDiferente = await logAIFailure(
    "rss_scraper",
    "scrape_feed",
    "Feed RSS retornou XML mal formatado",
    {
      level: "error",
      failureReasonCode: "JSON_SCHEMA_INVALID",
    }
  );

  assert(
    errorDiferente.repeat_count === 1,
    "Cenário 4.4: Erro com mensagem diferente reinicia o ciclo com repeat_count = 1"
  );

  // ============================================================================
  // TESTE 5: RESILIÊNCIA E FAIL-SAFE
  // ============================================================================
  console.log("\n[TESTE 5] Resiliência e Operação Fail-Safe:");

  // Disparo genérico com objeto vazio e valores nulos não deve lançar exceção
  let exceptionThrown = false;
  try {
    const safeLog = await logAITask({
      service: "system",
      action: "health_check",
      level: "info",
      status: "success",
      message: "Verificação de rotina do sistema",
    });
    assert(
      safeLog !== null && typeof safeLog.id === "string",
      "Cenário 5.1: Execução resiliente retorna objeto de log válido com ID e timestamp"
    );
  } catch (err) {
    exceptionThrown = true;
  }

  assert(!exceptionThrown, "Cenário 5.2: logAITask opera em modo Fail-Safe sem propagar exceções bloqueantes");

  console.log(`\n======================================================`);
  console.log(`SUÍTE DE TESTES CONCLUÍDA: ${testsPassed}/${testsTotal} testes passaram com 100% de sucesso!`);
  console.log(`======================================================\n`);
}

runTests().catch((err) => {
  console.error("Erro fatal ao rodar os testes:", err);
  process.exit(1);
});
