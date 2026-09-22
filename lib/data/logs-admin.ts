import { createClient, SupabaseClient } from "@supabase/supabase-js";
import {
  createAdminClient,
  createServerClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server";
import {
  AISystemLog,
  Database,
  FailureReasonCode,
  LogLevel,
  LogService,
  LogStatus,
} from "@/types/database";

// ==============================================================================
// INTERFACES E TIPOS DE CONSULTA ADMINISTRATIVA
// ==============================================================================

export interface GetSystemLogsAdminParams {
  /**
   * Número da página atual (1-indexado, padrão: 1)
   */
  page?: number;
  /**
   * Quantidade de itens por página (padrão: 20, mínimo: 1, máximo: 100)
   */
  limit?: number;
  /**
   * Filtro opcional por serviço emissor (ex: ai_writer, social_x)
   */
  service?: LogService;
  /**
   * Filtro opcional por nível de severidade (info, warn, error, critical)
   */
  level?: LogLevel;
  /**
   * Filtro opcional por status da execução (success, failed, skipped, aborted, retry_exhausted)
   */
  status?: LogStatus;
  /**
   * Filtro opcional por código unificado de motivo de falha
   */
  failure_reason_code?: FailureReasonCode;
  /**
   * Filtro booleano estrito: quando true, busca apenas tarefas que a IA não concluiu (task_completed = false)
   */
  incompleteOnly?: boolean;
  /**
   * Termo de busca textual parametrizado em message, action, failure_reason_code e error_details
   */
  search?: string;
  /**
   * Data inicial do intervalo (formato ISO 8601)
   */
  startDate?: string;
  /**
   * Data final do intervalo (formato ISO 8601)
   */
  endDate?: string;
}

export interface GetSystemLogsAdminResult {
  logs: AISystemLog[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
}

export interface SystemLogsAdminKPIs {
  totalLogs: number;
  totalFailures: number;
  failures24h: number;
  failures7d: number;
  incompleteTasks: number;
  criticalErrors: number;
  failureRatePercentage: number;
  successRatePercentage: number;
  failuresByAIModule: {
    writer: number;
    embedding: number;
    hub: number;
  };
  failuresBySocialNetwork: {
    x: number;
    telegram: number;
    discord: number;
    instagram: number;
  };
  topFailureReasons: Array<{ reason: string; count: number }>;
  servicesHealth: Array<{
    service: string;
    success_count: number;
    failure_count: number;
    total: number;
    success_rate: number;
  }>;
}

// ==============================================================================
// FUNÇÕES UTILITÁRIAS DE HIGIENIZAÇÃO E SEGURANÇA (OWASP TOP 10 A03/A01)
// ==============================================================================

/**
 * Obtém cliente Supabase com credencial de serviço resiliente a ESM hoisting em scripts CLI/Testes
 */
function getLogsAdminClient(): SupabaseClient<Database> | null {
  try {
    const admin = createAdminClient();
    if (admin) return admin;
  } catch {}

  try {
    const server = createServerClient();
    if (server) return server;
  } catch {}

  // Fallback dinâmico caso variáveis de ambiente tenham sido carregadas após import estático de módulos
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  const key = serviceRoleKey || anonKey;

  if (
    supabaseUrl &&
    key &&
    supabaseUrl.startsWith("http") &&
    !supabaseUrl.includes("your-project") &&
    key.length > 20
  ) {
    return createClient<Database>(supabaseUrl, key, {
      auth: { persistSession: false },
    });
  }

  return null;
}

/**
 * Sanitiza o termo de busca textual para mitigar PostgREST filter injection e SQL injection.
 * Remove caracteres de controle e pontuação que possam quebrar a sintaxe do PostgREST.
 */
function sanitizeSearchTerm(term: string): string {
  if (!term) return "";
  // Remove parênteses, vírgulas, colchetes, aspas e barras invertidas que compõem a gramática do PostgREST
  return term
    .replace(/[\x00-\x1F\x7F]/g, "") // Caracteres de controle ASCII
    .replace(/[,()[\]"'\\]/g, "")   // Metacaracteres PostgREST / SQL
    .trim();
}

/**
 * Valida se uma string é uma data válida no formato ISO
 */
function isValidIsoDate(dateStr?: string): boolean {
  if (!dateStr || typeof dateStr !== "string") return false;
  const timestamp = Date.parse(dateStr);
  return !Number.isNaN(timestamp);
}

/**
 * Expressão regular estrita para validação de formato UUID v4
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ==============================================================================
// CAMADA DE ACESSO A DADOS (DATA ACCESS LAYER)
// ==============================================================================

/**
 * Retorna lista paginada e filtrada de logs do sistema de IA com blindagem contra injeções.
 */
export async function getSystemLogsAdmin(
  params: GetSystemLogsAdminParams = {}
): Promise<GetSystemLogsAdminResult> {
  const page = Math.max(1, Math.floor(Number(params.page) || 1));
  const limit = Math.min(100, Math.max(1, Math.floor(Number(params.limit) || 20)));

  const supabase = getLogsAdminClient();
  if (!supabase) {
    return { logs: [], total: 0, page, totalPages: 1, limit };
  }

  try {
    let query = (supabase.from("ai_system_logs") as any)
      .select("*", { count: "exact" });

    // 1. Filtro estrito de tarefas incompletas (utiliza o índice parcial idx_ai_logs_incomplete_tasks)
    if (params.incompleteOnly === true) {
      query = query.eq("task_completed", false);
    }

    // 2. Filtros exatos opcionais
    if (params.service && typeof params.service === "string") {
      query = query.eq("service", params.service.trim());
    }
    if (params.level && typeof params.level === "string") {
      query = query.eq("level", params.level.trim());
    }
    if (params.status && typeof params.status === "string") {
      query = query.eq("status", params.status.trim());
    }
    if (params.failure_reason_code && typeof params.failure_reason_code === "string") {
      query = query.eq("failure_reason_code", params.failure_reason_code.trim());
    }

    // 3. Filtros temporais validados
    if (isValidIsoDate(params.startDate)) {
      query = query.gte("created_at", new Date(params.startDate!).toISOString());
    }
    if (isValidIsoDate(params.endDate)) {
      query = query.lte("created_at", new Date(params.endDate!).toISOString());
    }

    // 4. Busca textual sanitizada em colunas textuais
    if (params.search && typeof params.search === "string") {
      const cleanTerm = sanitizeSearchTerm(params.search);
      if (cleanTerm.length > 0) {
        query = query.or(
          `message.ilike.%${cleanTerm}%,action.ilike.%${cleanTerm}%,failure_reason_code.ilike.%${cleanTerm}%,error_details.ilike.%${cleanTerm}%`
        );
      }
    }

    // 5. Ordenação e paginação segura
    const offset = (page - 1) * limit;
    query = query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, count, error } = await query;

    if (error) {
      console.error("[Logs Admin] Falha ao consultar ai_system_logs:", error.message);
      return { logs: [], total: 0, page, totalPages: 1, limit };
    }

    const total = count || 0;
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      logs: (data || []) as AISystemLog[],
      total,
      page,
      totalPages,
      limit,
    };
  } catch (err: any) {
    console.error("[Logs Admin] Erro inesperado em getSystemLogsAdmin:", err?.message || err);
    return { logs: [], total: 0, page, totalPages: 1, limit };
  }
}

/**
 * Calcula métricas e KPIs consolidados em tempo real sobre a saúde do ecossistema de IA e publicações.
 */
export async function getSystemLogsKPIsAdmin(): Promise<SystemLogsAdminKPIs> {
  const defaultKPIs: SystemLogsAdminKPIs = {
    totalLogs: 0,
    totalFailures: 0,
    failures24h: 0,
    failures7d: 0,
    incompleteTasks: 0,
    criticalErrors: 0,
    failureRatePercentage: 0,
    successRatePercentage: 100,
    failuresByAIModule: {
      writer: 0,
      embedding: 0,
      hub: 0,
    },
    failuresBySocialNetwork: {
      x: 0,
      telegram: 0,
      discord: 0,
      instagram: 0,
    },
    topFailureReasons: [],
    servicesHealth: [],
  };

  const supabase = getLogsAdminClient();
  if (!supabase) {
    return defaultKPIs;
  }

  try {
    const now = Date.now();
    const iso24hAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString();
    const iso7dAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Consultas otimizadas em paralelo utilizando count: exact e head: true
    const [
      totalLogsRes,
      incompleteTasksRes,
      failures24hRes,
      failures7dRes,
      criticalErrorsRes,
      recentLogsRes,
    ] = await Promise.all([
      // Total geral de registros
      (supabase.from("ai_system_logs") as any).select("*", { count: "exact", head: true }),
      // Tarefas não concluídas pela IA (task_completed = false)
      (supabase.from("ai_system_logs") as any)
        .select("*", { count: "exact", head: true })
        .eq("task_completed", false),
      // Falhas nas últimas 24h
      (supabase.from("ai_system_logs") as any)
        .select("*", { count: "exact", head: true })
        .eq("task_completed", false)
        .gte("created_at", iso24hAgo),
      // Falhas nos últimos 7 dias
      (supabase.from("ai_system_logs") as any)
        .select("*", { count: "exact", head: true })
        .eq("task_completed", false)
        .gte("created_at", iso7dAgo),
      // Erros críticos de alta gravidade
      (supabase.from("ai_system_logs") as any)
        .select("*", { count: "exact", head: true })
        .eq("level", "critical"),
      // Amostragem leve recente para quebra analítica por serviço e motivo
      (supabase.from("ai_system_logs") as any)
        .select("service, status, task_completed, failure_reason_code, level")
        .gte("created_at", iso7dAgo)
        .limit(2000),
    ]);

    const totalLogs = totalLogsRes.count || 0;
    const incompleteTasks = incompleteTasksRes.count || 0;
    const failures24h = failures24hRes.count || 0;
    const failures7d = failures7dRes.count || 0;
    const criticalErrors = criticalErrorsRes.count || 0;
    const totalFailures = incompleteTasks;

    // Percentuais de sucesso e falha
    const failureRatePercentage =
      totalLogs > 0 ? Number(((totalFailures / totalLogs) * 100).toFixed(1)) : 0;
    const successRatePercentage =
      totalLogs > 0
        ? Number((((totalLogs - totalFailures) / totalLogs) * 100).toFixed(1))
        : 100;

    // Contadores analíticos agregados em memória a partir dos registros recentes
    const failuresByAIModule = {
      writer: 0,
      embedding: 0,
      hub: 0,
    };

    const failuresBySocialNetwork = {
      x: 0,
      telegram: 0,
      discord: 0,
      instagram: 0,
    };

    const failureReasonMap: Record<string, number> = {};
    const serviceHealthMap: Record<
      string,
      { success_count: number; failure_count: number; total: number }
    > = {};

    const recentRecords = ((recentLogsRes.data as any) || []) as Array<{
      service: string;
      status: string;
      task_completed: boolean;
      failure_reason_code: string | null;
      level: string;
    }>;

    for (const row of recentRecords) {
      const service = row.service || "unknown";
      const isFailure = !row.task_completed;

      // Agrupamento de integridade por serviço
      if (!serviceHealthMap[service]) {
        serviceHealthMap[service] = { success_count: 0, failure_count: 0, total: 0 };
      }
      serviceHealthMap[service].total += 1;
      if (isFailure) {
        serviceHealthMap[service].failure_count += 1;
      } else {
        serviceHealthMap[service].success_count += 1;
      }

      // Falhas por módulo de IA
      if (isFailure) {
        if (service === "ai_writer") failuresByAIModule.writer += 1;
        else if (service === "ai_embedding") failuresByAIModule.embedding += 1;
        else if (service === "ai_hub") failuresByAIModule.hub += 1;

        // Falhas por rede social
        if (service === "social_x") failuresBySocialNetwork.x += 1;
        else if (service === "social_telegram") failuresBySocialNetwork.telegram += 1;
        else if (service === "social_discord") failuresBySocialNetwork.discord += 1;
        else if (service === "social_instagram") failuresBySocialNetwork.instagram += 1;

        // Frequência de causas de falha
        if (row.failure_reason_code) {
          const code = String(row.failure_reason_code);
          failureReasonMap[code] = (failureReasonMap[code] || 0) + 1;
        }
      }
    }

    // Top causas-raiz ordenadas por frequência
    const topFailureReasons = Object.entries(failureReasonMap)
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Lista de saúde de serviços com taxa de sucesso calculada
    const servicesHealth = Object.entries(serviceHealthMap).map(([service, stats]) => ({
      service,
      success_count: stats.success_count,
      failure_count: stats.failure_count,
      total: stats.total,
      success_rate:
        stats.total > 0
          ? Number(((stats.success_count / stats.total) * 100).toFixed(1))
          : 100,
    }));

    return {
      totalLogs,
      totalFailures,
      failures24h,
      failures7d,
      incompleteTasks,
      criticalErrors,
      failureRatePercentage,
      successRatePercentage,
      failuresByAIModule,
      failuresBySocialNetwork,
      topFailureReasons,
      servicesHealth,
    };
  } catch (err: any) {
    console.error("[Logs Admin] Falha ao computar KPIs de logs:", err?.message || err);
    return defaultKPIs;
  }
}

/**
 * Marca uma ocorrência de falha ou log como resolvida pela equipe técnica.
 */
export async function resolveLogAdmin(
  logId: string,
  resolvedBy: string = "admin"
): Promise<{ success: boolean; log?: AISystemLog; error?: string }> {
  if (!logId || typeof logId !== "string" || !UUID_REGEX.test(logId.trim())) {
    return {
      success: false,
      error: "Identificador do log inválido ou fora do formato UUID.",
    };
  }

  const supabase = getLogsAdminClient();
  if (!supabase) {
    return {
      success: false,
      error: "Supabase não está configurado no ambiente.",
    };
  }

  try {
    const cleanResolvedBy =
      typeof resolvedBy === "string" && resolvedBy.trim().length > 0
        ? resolvedBy.trim().slice(0, 100)
        : "admin";

    const { data, error } = await (supabase.from("ai_system_logs") as any)
      .update({
        resolved_at: new Date().toISOString(),
        resolved_by: cleanResolvedBy,
      })
      .eq("id", logId.trim())
      .select()
      .maybeSingle();

    if (error) {
      console.error("[Logs Admin] Falha ao marcar log como resolvido:", error.message);
      return { success: false, error: error.message };
    }

    if (!data) {
      return {
        success: false,
        error: "Registro de log não encontrado com o ID especificado.",
      };
    }

    return {
      success: true,
      log: data as AISystemLog,
    };
  } catch (err: any) {
    console.error("[Logs Admin] Erro inesperado em resolveLogAdmin:", err?.message || err);
    return {
      success: false,
      error: err?.message || "Erro inesperado ao atualizar status de resolução.",
    };
  }
}

/**
 * Invoca a função RPC purge_old_system_logs para expurgar registros antigos de telemetria.
 */
export async function purgeOldLogsAdmin(
  daysToKeep: number = 30
): Promise<{ success: boolean; deletedCount: number; error?: string }> {
  const safeDays = Math.max(1, Math.floor(Number(daysToKeep) || 30));

  const supabase = getLogsAdminClient();
  if (!supabase) {
    return {
      success: false,
      deletedCount: 0,
      error: "Supabase não está configurado no ambiente.",
    };
  }

  try {
    const { data, error } = await (supabase.rpc as any)("purge_old_system_logs", {
      days_to_keep: safeDays,
    });

    if (error) {
      console.error("[Logs Admin] Falha ao executar purge_old_system_logs:", error.message);
      return { success: false, deletedCount: 0, error: error.message };
    }

    const deletedCount = typeof data === "number" ? data : Number(data) || 0;

    return {
      success: true,
      deletedCount,
    };
  } catch (err: any) {
    console.error("[Logs Admin] Erro inesperado em purgeOldLogsAdmin:", err?.message || err);
    return {
      success: false,
      deletedCount: 0,
      error: err?.message || "Erro inesperado ao executar limpeza de logs.",
    };
  }
}
