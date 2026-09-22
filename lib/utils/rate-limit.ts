import { NextRequest, NextResponse } from "next/server";

export interface RateLimitOptions {
  /**
   * Quantidade máxima de requisições permitidas na janela
   */
  limit: number;
  /**
   * Duração da janela deslizante em segundos
   */
  windowSeconds: number;
  /**
   * Prefixo do namespace do rate limiter (ex: 'admin_auth', 'subscribe')
   */
  prefix?: string;
  /**
   * Identificador customizado (se omitido, o IP do cliente é detectado automaticamente)
   */
  identifier?: string;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // Timestamp em milissegundos de expiração/reset
  retryAfter: number; // Tempo de espera recomendado em segundos
  isRedis?: boolean;
}

// ==============================================================================
// 1. ARMAZENAMENTO EM MEMÓRIA (SLIDING WINDOW LOG COM GC OPORTUNISTA)
// ==============================================================================

interface WindowEntry {
  timestamps: number[];
  lastAccessed: number;
}

// Armazena janelas de requisições em memória por chave
const memoryStore = new Map<string, WindowEntry>();
let lastGcTimestamp = Date.now();
const GC_INTERVAL_MS = 60 * 1000; // Limpeza a cada 60s
const MAX_STORE_SIZE = 5000; // Limite de chaves antes de forçar GC

function pruneExpiredEntries(now: number) {
  for (const [key, entry] of memoryStore.entries()) {
    // Se o último acesso for mais antigo que 1 hora, remove
    if (now - entry.lastAccessed > 60 * 60 * 1000) {
      memoryStore.delete(key);
    }
  }
  lastGcTimestamp = now;
}

function checkInMemoryRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): RateLimitResult {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const threshold = now - windowMs;

  // Limpeza de memória oportunista
  if (now - lastGcTimestamp > GC_INTERVAL_MS || memoryStore.size > MAX_STORE_SIZE) {
    pruneExpiredEntries(now);
  }

  let entry = memoryStore.get(key);
  if (!entry) {
    entry = { timestamps: [], lastAccessed: now };
    memoryStore.set(key, entry);
  }
  entry.lastAccessed = now;

  // Descarta timestamps fora da janela deslizante
  entry.timestamps = entry.timestamps.filter((ts) => ts > threshold);

  if (entry.timestamps.length >= limit) {
    const oldest = entry.timestamps[0];
    const reset = oldest + windowMs;
    const retryAfter = Math.max(1, Math.ceil((reset - now) / 1000));

    return {
      success: false,
      limit,
      remaining: 0,
      reset,
      retryAfter,
      isRedis: false,
    };
  }

  // Registra a nova requisição
  entry.timestamps.push(now);

  const oldest = entry.timestamps[0];
  const reset = oldest + windowMs;
  const remaining = Math.max(0, limit - entry.timestamps.length);

  return {
    success: true,
    limit,
    remaining,
    reset,
    retryAfter: 0,
    isRedis: false,
  };
}

// ==============================================================================
// 2. SUPORTE TRANSPARENTE AO UPSTASH REDIS REST (SE CONFIGURADO)
// ==============================================================================

async function checkUpstashRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token || !url.startsWith("http")) {
    return null;
  }

  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const clearBefore = now - windowMs;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1200); // 1.2s timeout

    // Pipeline atômica Upstash: ZREMRANGEBYSCORE -> ZCARD -> ZADD -> EXPIRE
    const memberId = `${now}-${Math.random().toString(36).substring(2, 8)}`;
    const pipelineCommands = [
      ["ZREMRANGEBYSCORE", key, "0", String(clearBefore)],
      ["ZCARD", key],
      ["ZADD", key, String(now), memberId],
      ["EXPIRE", key, String(windowSeconds + 2)],
    ];

    const response = await fetch(`${url}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(pipelineCommands),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    // data[1].result é o ZCARD antes da inserção
    const currentCount = typeof data?.[1]?.result === "number" ? data[1].result : 0;

    if (currentCount >= limit) {
      const reset = now + windowMs;
      return {
        success: false,
        limit,
        remaining: 0,
        reset,
        retryAfter: windowSeconds,
        isRedis: true,
      };
    }

    const remaining = Math.max(0, limit - (currentCount + 1));
    return {
      success: true,
      limit,
      remaining,
      reset: now + windowMs,
      retryAfter: 0,
      isRedis: true,
    };
  } catch (err) {
    // Se o Upstash falhar ou der timeout, fallback transparente para in-memory
    console.warn("[RateLimit] Falha ao comunicar com Upstash Redis, utilizando fallback in-memory:", err);
    return null;
  }
}

// ==============================================================================
// 3. UTILITÁRIOS PÚBLICOS DE IDENTIFICAÇÃO E VALIDAÇÃO
// ==============================================================================

/**
 * Extrai o endereço IP real do cliente a partir dos cabeçalhos de proxy reverso e CDN.
 */
export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const firstIp = forwarded.split(",")[0].trim();
    if (firstIp) return firstIp;
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp && realIp.trim()) return realIp.trim();

  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp && cfIp.trim()) return cfIp.trim();

  return "127.0.0.1";
}

/**
 * Valida os limites de requisições de um endpoint com Sliding Window e fallback para Redis.
 */
export async function rateLimit(
  request: NextRequest,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  const { limit, windowSeconds, prefix = "rl", identifier } = options;
  const ip = identifier || getClientIp(request);
  const cacheKey = `ratelimit:${prefix}:${ip}`;

  // 1. Tenta validar no Redis / Upstash caso configurado
  const redisResult = await checkUpstashRateLimit(cacheKey, limit, windowSeconds);
  if (redisResult) {
    return redisResult;
  }

  // 2. Fallback de alta performance in-memory
  return checkInMemoryRateLimit(cacheKey, limit, windowSeconds);
}

/**
 * Cria uma resposta HTTP 429 Too Many Requests com cabeçalhos padrão RFC 6585.
 */
export function createRateLimitResponse(
  result: RateLimitResult,
  customMessage?: string
): NextResponse {
  const message =
    customMessage ||
    `Muitas requisições. Limite de taxa excedido. Por favor, aguarde ${result.retryAfter} segundo(s) antes de tentar novamente.`;

  return NextResponse.json(
    {
      success: false,
      error: message,
      retryAfter: result.retryAfter,
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(result.retryAfter),
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": String(result.remaining),
        "X-RateLimit-Reset": String(Math.ceil(result.reset / 1000)),
      },
    }
  );
}
