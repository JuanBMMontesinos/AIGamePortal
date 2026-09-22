import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/server";
import {
  AISystemLog,
  Database,
  FailureReasonCode,
  LogLevel,
  LogService,
  LogStatus,
} from "@/types/database";

// ============================================================================
// REGEXES CRIPTOGRÁFICAS PARA SANITIZAÇÃO DE SEGREDOS (CWE-532)
// ============================================================================

const SECRET_PATTERNS = [
  // Chaves do Google Gemini / Google AI Studio (AIza...)
  {
    regex: /\bAIza[0-9A-Za-z-_]{30,45}\b/g,
    replacement: "[REDACTED_GEMINI_KEY]",
  },
  // Tokens de Bot do Telegram (ex: 123456789:ABCdefGHIjklMNOpqrsTUVwxyz123456789)
  {
    regex: /\b\d{8,10}:[A-Za-z0-9_-]{35}\b/g,
    replacement: "[REDACTED_TELEGRAM_TOKEN]",
  },
  // URLs de Webhook do Discord com Token
  {
    regex: /https?:\/\/(?:ptb\.|canary\.)?discord(?:app)?\.com\/api\/webhooks\/\d+\/[A-Za-z0-9_-]+/gi,
    replacement: "https://discord.com/api/webhooks/[REDACTED_DISCORD_WEBHOOK]",
  },
  // Tokens JWT (Supabase, Auth0, Bearer tokens)
  {
    regex: /\beyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*\b/g,
    replacement: "[REDACTED_JWT_TOKEN]",
  },
  // Chaves de API do Resend (re_...)
  {
    regex: /\bre_[A-Za-z0-9_]{20,}\b/g,
    replacement: "[REDACTED_RESEND_KEY]",
  },
  // Credenciais Bearer do X / Twitter
  {
    regex: /\bBearer\s+[A-Za-z0-9%_-]{20,}\b/gi,
    replacement: "Bearer [REDACTED_TWITTER_BEARER]",
  },
  // Chaves de API do X / Twitter em query strings ou pares chave-valor
  {
    regex: /(?:oauth_token|oauth_token_secret|oauth_consumer_key|consumer_secret|access_token|access_token_secret)=([A-Za-z0-9_-]+)/gi,
    replacement: "$1=[REDACTED_TWITTER_CREDENTIAL]",
  },
  // Cookies de sessão sensíveis
  {
    regex: /(connect\.sid|sb-[a-z0-9-]+-auth-token|admin_session|session_token)=([^;]+)/gi,
    replacement: "$1=[REDACTED_COOKIE]",
  },
];

// Nomes de chaves de objetos que contêm segredos
const SENSITIVE_KEY_PATTERN = /^(password|passwd|secret|apiKey|api_key|apiSecret|api_secret|token|accessToken|access_token|refreshToken|refresh_token|auth|authorization|privateKey|private_key|serviceRoleKey|service_role_key)$/i;

// ============================================================================
// HIGIENIZAÇÃO DE TEXTO & LOG INJECTION (CWE-117)
// ============================================================================

/**
 * Remove sequências de escape ANSI e quebras de linha de campos de texto simples
 * para prevenir ataques de Log Injection (CWE-117).
 */
export function sanitizeSingleLine(text: string | null | undefined): string {
  if (!text) return "";
  let sanitized = String(text);

  // Aplica remoção de segredos
  sanitized = sanitizeStringSecrets(sanitized);

  // Remove caracteres de escape ANSI
  sanitized = sanitized.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, "");

  // Substitui quebras de linha CRLF por espaço simples
  sanitized = sanitized.replace(/[\r\n]+/g, " ");

  // Remove caracteres de controle não-imprimíveis (ASCII 0-8, 11-12, 14-31, 127)
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

  return sanitized.trim();
}

/**
 * Aplica todas as expressões regulares criptográficas em uma string
 */
function sanitizeStringSecrets(str: string): string {
  let result = str;
  for (const { regex, replacement } of SECRET_PATTERNS) {
    result = result.replace(regex, replacement);
  }
  return result;
}

/**
 * Sanitiza stack traces e mensagens de erro com limite defensivo de 4000 caracteres
 */
export function sanitizeErrorDetails(error: unknown): string | null {
  if (!error) return null;

  let rawErrorStr = "";
  if (error instanceof Error) {
    rawErrorStr = error.stack || `${error.name}: ${error.message}`;
  } else if (typeof error === "object") {
    try {
      rawErrorStr = JSON.stringify(sanitizeLogPayload(error), null, 2);
    } catch {
      rawErrorStr = String(error);
    }
  } else {
    rawErrorStr = String(error);
  }

  // Mascara segredos
  let sanitized = sanitizeStringSecrets(rawErrorStr);

  // Remove caracteres ANSI
  sanitized = sanitized.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, "");

  // Limite defensivo estrito de 4000 caracteres conforme especificação do banco
  if (sanitized.length > 4000) {
    sanitized = sanitized.slice(0, 3950) + "\n... [TRUNCATED_ERROR_DETAILS_MAX_4000_CHARS]";
  }

  return sanitized;
}

/**
 * Sanitizador universal de payloads para telemetria (CWE-532).
 * Percorre recursivamente objetos, arrays e strings mascarando segredos e prevenindo ciclos.
 */
export function sanitizeLogPayload<T>(data: T, visited = new WeakSet<object>()): T {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === "string") {
    return sanitizeStringSecrets(data) as unknown as T;
  }

  if (typeof data === "number" || typeof data === "boolean") {
    return data;
  }

  if (data instanceof Error) {
    return {
      name: data.name,
      message: sanitizeStringSecrets(data.message),
      stack: sanitizeErrorDetails(data.stack),
    } as unknown as T;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeLogPayload(item, visited)) as unknown as T;
  }

  if (typeof data === "object") {
    // Prevenção contra referências circulares
    if (visited.has(data as object)) {
      return "[CIRCULAR_REFERENCE]" as unknown as T;
    }
    visited.add(data as object);

    const sanitizedObj: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (SENSITIVE_KEY_PATTERN.test(key)) {
        sanitizedObj[key] = "[REDACTED_SECRET]";
      } else {
        sanitizedObj[key] = sanitizeLogPayload(value, visited);
      }
    }
    return sanitizedObj as T;
  }

  return String(data) as unknown as T;
}

// ============================================================================
// RESILIENT CLIENT GETTER (COMPATÍVEL COM NEXT.JS E NODE SCRIPTS/CLI)
// ============================================================================

let cachedSupabaseClient: SupabaseClient<Database> | null = null;

function getSupabaseAdmin(): SupabaseClient<Database> | null {
  if (cachedSupabaseClient) {
    return cachedSupabaseClient;
  }

  // 1. Tenta obter o cliente através de createAdminClient()
  try {
    const admin = createAdminClient();
    if (admin) {
      cachedSupabaseClient = admin;
      return cachedSupabaseClient;
    }
  } catch {
    // Ignora erro e tenta fallback dinâmico
  }

  // 2. Fallback dinâmico (resolve casos em que dotenv foi carregado após a importação estática de módulos)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  if (
    supabaseUrl &&
    serviceRoleKey &&
    supabaseUrl.startsWith("http") &&
    serviceRoleKey.length > 20 &&
    !serviceRoleKey.includes("your-service-role")
  ) {
    cachedSupabaseClient = createClient<Database>(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
      },
    });
    return cachedSupabaseClient;
  }

  return null;
}

// ============================================================================
// DE-DUPLICAÇÃO INTELIGENTE DE ERROS CONSECUTIVOS NO MESMO MINUTO
// ============================================================================

interface LastErrorCache {
  signature: string;
  id: string;
  minuteTimestamp: number;
  repeatCount: number;
  lastRecord: AISystemLog;
}

let lastErrorCache: LastErrorCache | null = null;

/**
 * Reseta o cache de de-duplicação (útil para suítes de testes unitários)
 */
export function resetLoggerDeduplicationCache(): void {
  lastErrorCache = null;
}

// ============================================================================
// INTERFACES DO MOTOR DE LOGGING
// ============================================================================

export interface CreateLogParams {
  service: LogService;
  action: string;
  level: LogLevel;
  status: LogStatus;
  task_completed?: boolean;
  failure_reason_code?: FailureReasonCode | null;
  message: string;
  error?: unknown;
  metadata?: Record<string, any>;
  is_retryable?: boolean;
}

export interface FailureLogOptions {
  level?: "error" | "critical";
  status?: "failed" | "aborted" | "retry_exhausted";
  failureReasonCode?: FailureReasonCode;
  error?: unknown;
  metadata?: Record<string, any>;
  is_retryable?: boolean;
}

// ============================================================================
// MOTOR PRINCIPAL DE LOGGING
// ============================================================================

/**
 * Registra um evento no sistema centralizado de logs com sanitização completa
 * e gravação no banco Supabase (public.ai_system_logs).
 */
export async function logAITask(params: CreateLogParams): Promise<AISystemLog> {
  const {
    service,
    action,
    level,
    status,
    task_completed = status === "success",
    failure_reason_code = null,
    message,
    error,
    metadata = {},
    is_retryable = false,
  } = params;

  // 1. Sanitização estrita de Log Injection (CWE-117)
  const cleanService = sanitizeSingleLine(service) as LogService;
  const cleanAction = sanitizeSingleLine(action);
  const cleanMessage = sanitizeSingleLine(message);
  const cleanFailureReason = failure_reason_code
    ? (sanitizeSingleLine(failure_reason_code) as FailureReasonCode)
    : null;

  // 2. Sanitização estrita de Segredos (CWE-532)
  const cleanErrorDetails = sanitizeErrorDetails(error);
  const cleanMetadata = sanitizeLogPayload(metadata) || {};

  // 3. De-duplicação inteligente para erros consecutivos no mesmo minuto
  const isErrorLevel = level === "error" || level === "critical";
  const currentMinute = Math.floor(Date.now() / 60000);
  const errorSignature = `${cleanService}|${cleanAction}|${cleanFailureReason || "NONE"}|${cleanMessage}`;

  if (
    isErrorLevel &&
    lastErrorCache &&
    lastErrorCache.signature === errorSignature &&
    lastErrorCache.minuteTimestamp === currentMinute
  ) {
    lastErrorCache.repeatCount += 1;
    const currentRepeat = lastErrorCache.repeatCount;
    const cachedId = lastErrorCache.id;

    // Saída no console indicando de-duplicação
    console.warn(
      `[AI_LOGGER_SUPPRESSED][${cleanService}] ${cleanAction}: Repetição #${currentRepeat} suprimida no mesmo minuto.`
    );

    // Tenta atualizar o repeat_count da linha existente no Supabase sem bloquear
    const client = getSupabaseAdmin();
    if (client && cachedId) {
      try {
        await (client.from("ai_system_logs") as any)
          .update({ repeat_count: currentRepeat })
          .eq("id", cachedId);
      } catch {
        // Ignora silenciosamente para não interromper fluxo principal
      }
    }

    lastErrorCache.lastRecord.repeat_count = currentRepeat;
    return { ...lastErrorCache.lastRecord, repeat_count: currentRepeat };
  }

  // 4. Monta objeto de log pronto para persistência
  const logPayload: Omit<AISystemLog, "id" | "created_at"> & { id?: string; created_at?: string } = {
    service: cleanService,
    action: cleanAction,
    level,
    status,
    task_completed,
    failure_reason_code: cleanFailureReason,
    message: cleanMessage,
    error_details: cleanErrorDetails,
    metadata: cleanMetadata,
    is_retryable,
    repeat_count: 1,
    resolved_at: null,
    resolved_by: null,
  };

  // 5. Emissão formatada no console do servidor / CLI
  const consolePrefix = `[AI_LOGGER][${level.toUpperCase()}][${cleanService}] ${cleanAction}:`;
  if (level === "error" || level === "critical") {
    console.error(`${consolePrefix} ${cleanMessage}`, {
      task_completed,
      failure_reason_code: cleanFailureReason,
      error_details: cleanErrorDetails,
    });
  } else if (level === "warn") {
    console.warn(`${consolePrefix} ${cleanMessage}`, { task_completed, failure_reason_code: cleanFailureReason });
  } else {
    console.log(`${consolePrefix} ${cleanMessage}`);
  }

  // 6. Inserção no Supabase (não-bloqueante em relação a falhas de conexão)
  const client = getSupabaseAdmin();
  let createdRecord: AISystemLog = {
    id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `log_${Date.now()}`,
    created_at: new Date().toISOString(),
    ...logPayload,
  };

  if (client) {
    try {
      const { data, error: dbError } = await (client.from("ai_system_logs") as any)
        .insert(logPayload)
        .select()
        .single();

      if (dbError) {
        // Se a tabela ainda não foi criada no Supabase remoto ou houve erro de rede, apenas avisa defensivamente
        console.warn(`[AI_LOGGER_DB_NOTICE] Não foi possível persistir no Supabase: ${dbError.message}`);
      } else if (data) {
        createdRecord = data as AISystemLog;
      }
    } catch (insertEx: any) {
      console.warn(`[AI_LOGGER_DB_NOTICE] Exceção ao gravar no Supabase: ${insertEx?.message}`);
    }
  }

  // 7. Atualiza cache de último erro para de-duplicação futura
  if (isErrorLevel) {
    lastErrorCache = {
      signature: errorSignature,
      id: createdRecord.id,
      minuteTimestamp: currentMinute,
      repeatCount: 1,
      lastRecord: createdRecord,
    };
  }

  return createdRecord;
}

// ============================================================================
// MÉTODOS UTILITÁRIOS ESPECÍFICOS
// ============================================================================

/**
 * Atalho para registrar sucesso em operações de IA
 */
export async function logAISuccess(
  service: LogService,
  action: string,
  message: string,
  metadata?: Record<string, any>
): Promise<AISystemLog> {
  return logAITask({
    service,
    action,
    level: "info",
    status: "success",
    task_completed: true,
    message,
    metadata,
  });
}

/**
 * Atalho para registrar falhas em operações de IA com flag task_completed = false
 */
export async function logAIFailure(
  service: LogService,
  action: string,
  message: string,
  options: FailureLogOptions = {}
): Promise<AISystemLog> {
  const {
    level = "error",
    status = "failed",
    failureReasonCode = "DATABASE_INSERT_ERROR",
    error,
    metadata,
    is_retryable = false,
  } = options;

  return logAITask({
    service,
    action,
    level,
    status,
    task_completed: false, // Flag primária: a IA não concluiu a tarefa com sucesso
    failure_reason_code: failureReasonCode,
    message,
    error,
    metadata,
    is_retryable,
  });
}

/**
 * Atalho para registrar o resultado de publicações nas redes sociais e canais
 */
export async function logSocialDispatch(
  network: "x" | "telegram" | "discord" | "instagram",
  status: "success" | "failed" | "skipped",
  message: string,
  metadata?: Record<string, any>,
  error?: unknown
): Promise<AISystemLog> {
  const serviceMap: Record<string, LogService> = {
    x: "social_x",
    telegram: "social_telegram",
    discord: "social_discord",
    instagram: "social_instagram",
  };

  const service = serviceMap[network] || "system";
  const action = "publish_post";
  const level: LogLevel = status === "success" ? "info" : status === "skipped" ? "warn" : "error";
  const task_completed = status === "success" || status === "skipped";

  let failure_reason_code: FailureReasonCode | null = null;
  if (status === "failed") {
    if (network === "x") failure_reason_code = "TWITTER_FORBIDDEN_403";
    else if (network === "telegram") failure_reason_code = "TELEGRAM_PARSE_ERROR";
    else if (network === "discord") failure_reason_code = "DISCORD_WEBHOOK_ERROR";
    else if (network === "instagram") failure_reason_code = "INSTAGRAM_API_ERROR";
  }

  return logAITask({
    service,
    action,
    level,
    status,
    task_completed,
    failure_reason_code,
    message,
    error,
    metadata,
    is_retryable: status === "failed",
  });
}
