import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import {
  logAITask,
  logAISuccess,
  logAIFailure,
  resetLoggerDeduplicationCache,
} from "../lib/services/logger";
import { FailureReasonCode, LogService } from "../types/database";
import { suggestGameHubWithGemini, matchOrSuggestGameHub } from "../lib/services/hub-matcher";
import { enrichGameMetadata } from "../lib/services/game-enricher";

async function runPhase2Tests() {
  console.log("====================================================================");
  console.log("🧪 [FASE 2] SUÍTE DE TESTES AUTOMATIZADOS: LOGS DO PIPELINE DE IA");
  console.log("Foco: Instrumentação de Falhas, Códigos Padronizados e Tarefas Incompletas");
  console.log("====================================================================\n");

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

  resetLoggerDeduplicationCache();

  // ==========================================================================
  // CENÁRIO 1: Falha na Leitura de Feeds RSS (RSS_FEED_UNREACHABLE)
  // ==========================================================================
  console.log("[CENÁRIO 1] Leitura de Feed RSS com Falha (HTTP 403/404/500/Timeout):");

  const rssFailureLog = await logAITask({
    service: "rss_scraper",
    action: "scrape_feed",
    level: "warn",
    status: "failed",
    task_completed: false,
    failure_reason_code: "RSS_FEED_UNREACHABLE",
    message: 'Falha ao obter feed RSS "Destructoid" (https://destructoid.com/feed): HTTP 403 Forbidden',
    metadata: {
      feed_name: "Destructoid",
      feed_url: "https://destructoid.com/feed",
      default_category: "geral",
    },
    is_retryable: true,
  });

  assert(
    rssFailureLog.service === "rss_scraper" &&
      rssFailureLog.action === "scrape_feed" &&
      rssFailureLog.level === "warn" &&
      rssFailureLog.status === "failed" &&
      rssFailureLog.task_completed === false &&
      rssFailureLog.failure_reason_code === "RSS_FEED_UNREACHABLE" &&
      rssFailureLog.is_retryable === true,
    "1.1 Registro de falha em feed RSS com código RSS_FEED_UNREACHABLE e task_completed = false"
  );

  // ==========================================================================
  // CENÁRIO 2: Extração de Conteúdo Insuficiente / Abortado (CONTENT_TOO_SHORT)
  // ==========================================================================
  console.log("\n[CENÁRIO 2] Extração de Conteúdo < 80 Caracteres (Abortado):");

  const contentShortLog = await logAITask({
    service: "rss_scraper",
    action: "content_extraction",
    level: "info",
    status: "aborted",
    task_completed: false,
    failure_reason_code: "CONTENT_TOO_SHORT",
    message: 'Conteúdo extraído insuficiente (42 caracteres) para "Teaser misterioso". Item ignorado.',
    metadata: {
      url: "https://example.com/teaser",
      title: "Teaser misterioso",
      content_length: 42,
      feed_name: "IGN",
    },
  });

  assert(
    contentShortLog.service === "rss_scraper" &&
      contentShortLog.action === "content_extraction" &&
      contentShortLog.level === "info" &&
      contentShortLog.status === "aborted" &&
      contentShortLog.task_completed === false &&
      contentShortLog.failure_reason_code === "CONTENT_TOO_SHORT",
    "2.1 Registro de extração insuficiente como aborted com código CONTENT_TOO_SHORT"
  );

  // ==========================================================================
  // CENÁRIO 3: Geração de Embeddings Esgotada (EMBEDDING_ALL_MODELS_FAILED)
  // ==========================================================================
  console.log("\n[CENÁRIO 3] Falha em Todos os Modelos de Embeddings:");

  const embeddingFailureLog = await logAITask({
    service: "ai_embedding",
    action: "embedding_generation",
    level: "error",
    status: "failed",
    task_completed: false,
    failure_reason_code: "EMBEDDING_ALL_MODELS_FAILED",
    message: 'Todos os modelos de embedding falharam ao gerar vetor para "Resident Evil 9 anunciado"',
    metadata: {
      models_attempted: ["gemini-embedding-001", "text-embedding-004", "gemini-embedding-2"],
      title: "Resident Evil 9 anunciado",
    },
    is_retryable: true,
  });

  assert(
    embeddingFailureLog.service === "ai_embedding" &&
      embeddingFailureLog.action === "embedding_generation" &&
      embeddingFailureLog.level === "error" &&
      embeddingFailureLog.status === "failed" &&
      embeddingFailureLog.task_completed === false &&
      embeddingFailureLog.failure_reason_code === "EMBEDDING_ALL_MODELS_FAILED",
    "3.1 Registro de esgotamento de embeddings com código EMBEDDING_ALL_MODELS_FAILED e level error"
  );

  // ==========================================================================
  // CENÁRIO 4: Busca Vetorial pgvector com Falha (PGVECTOR_RPC_ERROR)
  // ==========================================================================
  console.log("\n[CENÁRIO 4] Falha na RPC pgvector match_recent_articles:");

  const pgvectorLog = await logAITask({
    service: "database",
    action: "vector_search",
    level: "warn",
    status: "failed",
    task_completed: false,
    failure_reason_code: "PGVECTOR_RPC_ERROR",
    message: "Erro na busca vetorial match_recent_articles: function match_recent_articles does not exist",
    metadata: {
      match_threshold: 0.82,
      hours_limit: 48,
      item_title: "Silent Hill 2 Remake Update",
    },
  });

  assert(
    pgvectorLog.service === "database" &&
      pgvectorLog.action === "vector_search" &&
      pgvectorLog.level === "warn" &&
      pgvectorLog.task_completed === false &&
      pgvectorLog.failure_reason_code === "PGVECTOR_RPC_ERROR",
    "4.1 Registro de erro na RPC pgvector com código PGVECTOR_RPC_ERROR e level warn"
  );

  // ==========================================================================
  // CENÁRIO 5: Redação com Gemini - Rate Limit / Quota (GEMINI_QUOTA_EXCEEDED)
  // ==========================================================================
  console.log("\n[CENÁRIO 5] Rate Limit / Quota Excedida no Gemini Flash (429):");

  const quotaLog = await logAITask({
    service: "ai_writer",
    action: "article_rewrite",
    level: "warn",
    status: "failed",
    task_completed: false,
    failure_reason_code: "GEMINI_QUOTA_EXCEEDED",
    message: 'Falha na tentativa com modelo gemini-3.6-flash para "GTA VI": 429 Quota Exceeded',
    metadata: {
      model: "gemini-3.6-flash",
      title: "GTA VI",
      isQuota: true,
    },
    is_retryable: true,
  });

  assert(
    quotaLog.service === "ai_writer" &&
      quotaLog.failure_reason_code === "GEMINI_QUOTA_EXCEEDED" &&
      quotaLog.task_completed === false &&
      quotaLog.is_retryable === true,
    "5.1 Registro de cota excedida com GEMINI_QUOTA_EXCEEDED e flag is_retryable = true"
  );

  // ==========================================================================
  // CENÁRIO 6: Redação com Gemini - Bloqueio de Segurança (GEMINI_SAFETY_BLOCK)
  // ==========================================================================
  console.log("\n[CENÁRIO 6] Bloqueio por Filtro de Segurança do Gemini:");

  const safetyLog = await logAITask({
    service: "ai_writer",
    action: "article_rewrite",
    level: "warn",
    status: "failed",
    task_completed: false,
    failure_reason_code: "GEMINI_SAFETY_BLOCK",
    message: 'Modelo gemini-flash-latest bloqueou o artigo "Doom The Dark Ages" por filtro de segurança',
    metadata: {
      model: "gemini-flash-latest",
      title: "Doom The Dark Ages",
      finish_reason: "SAFETY",
    },
  });

  assert(
    safetyLog.service === "ai_writer" &&
      safetyLog.failure_reason_code === "GEMINI_SAFETY_BLOCK" &&
      safetyLog.task_completed === false,
    "6.1 Registro de filtro de segurança com GEMINI_SAFETY_BLOCK"
  );

  // ==========================================================================
  // CENÁRIO 7: Redação com Gemini - JSON Quebrado / Schema Inválido (JSON_SCHEMA_INVALID)
  // ==========================================================================
  console.log("\n[CENÁRIO 7] JSON Quebrado ou Schema Incompleto:");

  const jsonSchemaLog = await logAITask({
    service: "ai_writer",
    action: "article_rewrite",
    level: "warn",
    status: "failed",
    task_completed: false,
    failure_reason_code: "JSON_SCHEMA_INVALID",
    message: 'Modelo gemini-1.5-flash gerou JSON sintaticamente inválido para "Half-Life 3": Unexpected token < in JSON',
    metadata: {
      model: "gemini-1.5-flash",
      title: "Half-Life 3",
    },
  });

  assert(
    jsonSchemaLog.service === "ai_writer" &&
      jsonSchemaLog.failure_reason_code === "JSON_SCHEMA_INVALID" &&
      jsonSchemaLog.task_completed === false,
    "7.1 Registro de JSON quebrado com código JSON_SCHEMA_INVALID"
  );

  // ==========================================================================
  // CENÁRIO 8: Redação com Gemini - Esgotamento de Todos os Modelos (GEMINI_GENERATION_FAILED)
  // ==========================================================================
  console.log("\n[CENÁRIO 8] Falha Geral de Geração após Esgotar Todos os Modelos:");

  const genFailedLog = await logAITask({
    service: "ai_writer",
    action: "article_rewrite",
    level: "error",
    status: "failed",
    task_completed: false,
    failure_reason_code: "GEMINI_GENERATION_FAILED",
    message: 'Todos os modelos de IA (gemini-3.6-flash, gemini-flash-latest, gemini-1.5-flash) falharam na redação da matéria "The Witcher 4"',
    metadata: {
      models_attempted: ["gemini-3.6-flash", "gemini-flash-latest", "gemini-1.5-flash"],
      title: "The Witcher 4",
      canonical_url: "https://example.com/witcher-4",
    },
  });

  assert(
    genFailedLog.service === "ai_writer" &&
      genFailedLog.action === "article_rewrite" &&
      genFailedLog.level === "error" &&
      genFailedLog.status === "failed" &&
      genFailedLog.task_completed === false &&
      genFailedLog.failure_reason_code === "GEMINI_GENERATION_FAILED",
    "8.1 Registro de falha crítica na redação com código GEMINI_GENERATION_FAILED e level error"
  );

  // ==========================================================================
  // CENÁRIO 9: Enriquecimento de Metadados Não-Bloqueante
  // ==========================================================================
  console.log("\n[CENÁRIO 9] Falha Não-Bloqueante no Enriquecedor de Metadados (RAWG/OpenCritic):");

  const enrichLog = await logAITask({
    service: "game_enricher",
    action: "enrich_metadata",
    level: "warn",
    status: "failed",
    task_completed: false,
    message: 'Falha não-bloqueante na API RAWG para "Ghost of Yōtei": Connection timeout',
    metadata: {
      api: "RAWG",
      game_name: "Ghost of Yōtei",
    },
  });

  assert(
    enrichLog.service === "game_enricher" &&
      enrichLog.action === "enrich_metadata" &&
      enrichLog.level === "warn" &&
      enrichLog.task_completed === false,
    "9.1 Registro de falha não-bloqueante em enriquecimento de metadados"
  );

  // ==========================================================================
  // CENÁRIO 10: Persistência de Artigo com Falha (DATABASE_INSERT_ERROR)
  // ==========================================================================
  console.log("\n[CENÁRIO 10] Falha Crítica ao Inserir Artigo no Banco:");

  const insertDbLog = await logAITask({
    service: "database",
    action: "post_insert",
    level: "critical",
    status: "failed",
    task_completed: false,
    failure_reason_code: "DATABASE_INSERT_ERROR",
    message: 'Falha crítica ao persistir matéria "Elden Ring DLC" no Supabase: duplicate key value violates unique constraint "posts_slug_key"',
    metadata: {
      title: "Elden Ring DLC",
      slug: "elden-ring-dlc",
      category_id: "cat_123",
      source_url: "https://example.com/elden-ring",
    },
  });

  assert(
    insertDbLog.service === "database" &&
      insertDbLog.action === "post_insert" &&
      insertDbLog.level === "critical" &&
      insertDbLog.task_completed === false &&
      insertDbLog.failure_reason_code === "DATABASE_INSERT_ERROR",
    "10.1 Registro de erro crítico de banco com código DATABASE_INSERT_ERROR e level critical"
  );

  // ==========================================================================
  // CENÁRIO 11: Sucesso na Publicação da Matéria com Duração em ms
  // ==========================================================================
  console.log("\n[CENÁRIO 11] Sucesso de Publicação com Duração Total em ms:");

  const successLog = await logAISuccess(
    "ai_writer",
    "article_rewrite",
    'Matéria "Monster Hunter Wilds: Guia Completo" publicada com sucesso em 3420ms',
    {
      post_id: "post_9999",
      slug: "monster-hunter-wilds-guia-completo",
      title: "Monster Hunter Wilds: Guia Completo",
      total_generation_ms: 3420,
      is_rumor: false,
      reliability_score: 5,
    }
  );

  assert(
    successLog.service === "ai_writer" &&
      successLog.action === "article_rewrite" &&
      successLog.level === "info" &&
      successLog.status === "success" &&
      successLog.task_completed === true &&
      typeof successLog.metadata?.total_generation_ms === "number" &&
      successLog.metadata.total_generation_ms === 3420,
    "11.1 Registro de sucesso da matéria com task_completed = true e total_generation_ms registrado"
  );

  // ==========================================================================
  // CENÁRIO 12: Agente de Hubs - Falha de Sugestão e Criação (HUB_SUGGESTION_FAILED)
  // ==========================================================================
  console.log("\n[CENÁRIO 12] Agente de Hubs - Falhas com HUB_SUGGESTION_FAILED:");

  // 12.1 Falha na sugestão com IA
  const hubAiFailLog = await logAITask({
    service: "ai_hub",
    action: "hub_suggestion",
    level: "warn",
    status: "failed",
    task_completed: false,
    failure_reason_code: "HUB_SUGGESTION_FAILED",
    message: 'Agente de sugestão de Hubs falhou em todos os modelos para "Jogo Indisponível"',
    metadata: {
      models_attempted: ["gemini-2.5-flash", "gemini-1.5-flash"],
      title: "Jogo Indisponível",
    },
  });

  assert(
    hubAiFailLog.service === "ai_hub" &&
      hubAiFailLog.action === "hub_suggestion" &&
      hubAiFailLog.level === "warn" &&
      hubAiFailLog.task_completed === false &&
      hubAiFailLog.failure_reason_code === "HUB_SUGGESTION_FAILED",
    "12.1 Registro de falha na sugestão de Hub com código HUB_SUGGESTION_FAILED"
  );

  // 12.2 Rejeição de criação no Supabase
  const hubDbFailLog = await logAITask({
    service: "ai_hub",
    action: "hub_suggestion",
    level: "warn",
    status: "failed",
    task_completed: false,
    failure_reason_code: "HUB_SUGGESTION_FAILED",
    message: 'Supabase rejeitou criação de Hub para "GTA VI": permission denied for table game_hubs',
    metadata: {
      hub_name: "Grand Theft Auto VI",
      slug: "gta-6",
      error: "permission denied",
    },
  });

  assert(
    hubDbFailLog.service === "ai_hub" &&
      hubDbFailLog.action === "hub_suggestion" &&
      hubDbFailLog.task_completed === false &&
      hubDbFailLog.failure_reason_code === "HUB_SUGGESTION_FAILED",
    "12.2 Registro de rejeição de criação de Hub no Supabase com HUB_SUGGESTION_FAILED"
  );

  // ==========================================================================
  // CENÁRIO 13: Execução Fail-Safe dos Módulos Instrumentados
  // ==========================================================================
  console.log("\n[CENÁRIO 13] Validação de Execução Fail-Safe dos Módulos:");

  // enrichGameMetadata não deve quebrar mesmo com dados nulos ou falhas de rede
  const enrichedFallback = await enrichGameMetadata("Jogo Inexistente 99999", {});
  assert(
    enrichedFallback.game_name === "Jogo Inexistente 99999",
    "13.1 enrichGameMetadata retorna dados preservados sem quebrar o pipeline"
  );

  // matchOrSuggestGameHub sem conexão com Supabase e sem IA opera em modo fail-safe
  const hubSafeResult = await matchOrSuggestGameHub({
    supabase: null,
    title: "Matéria Sem Hub",
    content: "Texto explicativo",
    aiClient: null,
  });
  assert(
    hubSafeResult.matched === false && hubSafeResult.hubId === null,
    "13.2 matchOrSuggestGameHub opera de forma resiliente e fail-safe sem exceções"
  );

  console.log("\n====================================================================");
  console.log(`🎉 SUÍTE DE TESTES DA FASE 2 CONCLUÍDA: ${testsPassed}/${testsTotal} testes passaram com 100% de sucesso!`);
  console.log("====================================================================\n");
}

runPhase2Tests().catch((err) => {
  console.error("Erro fatal ao rodar os testes da Fase 2:", err);
  process.exit(1);
});
