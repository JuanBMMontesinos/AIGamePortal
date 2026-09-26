import { GoogleGenAI } from "@google/genai";

export type GeminiKeyStatus = "healthy" | "cooling_down" | "exhausted_daily" | "disabled";

export interface GeminiKeyEntry {
  id: string;
  key: string;
  maskedKey: string;
  label: string;
  client: GoogleGenAI;
  status: GeminiKeyStatus;
  cooldownUntil: number | null; // Timestamp em milissegundos
  totalSuccesses: number;
  totalErrors: number;
  consecutiveErrors: number;
  lastUsedAt: number | null;
  lastErrorMessage?: string | null;
}

export interface GeminiKeyStatusSummary {
  id: string;
  label: string;
  maskedKey: string;
  status: GeminiKeyStatus;
  cooldownRemainingSeconds: number | null;
  totalSuccesses: number;
  totalErrors: number;
  lastUsedAt: string | null;
  lastErrorMessage?: string | null;
}

export interface GeminiPoolStatus {
  totalKeys: number;
  healthyKeys: number;
  coolingDownKeys: number;
  exhaustedDailyKeys: number;
  disabledKeys: number;
  keys: GeminiKeyStatusSummary[];
}

export interface GeminiPoolOptions {
  rpmCooldownMs?: number; // Padrão: 65.000 ms (65s para limite de minuto)
  rpdCooldownMs?: number; // Padrão: até a meia-noite UTC (virada da cota diária do Google)
  maxRetriesPerOperation?: number;
  waitIfShortCooldown?: boolean;
  maxWaitMs?: number;
  logKeyRotation?: boolean;
}

export interface GeminiExecuteOptions {
  maxRetries?: number;
  contextName?: string;
  waitIfShortCooldown?: boolean;
  maxWaitMs?: number;
}

/**
 * Erro lançado quando todas as chaves do pool estão esgotadas ou em cooldown
 */
export class GeminiAllKeysExhaustedError extends Error {
  public shortestCooldownMs: number | null;
  public totalKeys: number;

  constructor(message: string, shortestCooldownMs: number | null = null, totalKeys: number = 0) {
    super(message);
    this.name = "GeminiAllKeysExhaustedError";
    this.shortestCooldownMs = shortestCooldownMs;
    this.totalKeys = totalKeys;
  }
}

/**
 * Mascara uma chave de API para exibição segura em logs e telemetria
 * Ex: "AIzaSyDa...7x9k"
 */
export function maskApiKey(key: string): string {
  if (!key) return "empty_key";
  const clean = key.trim();
  if (clean.length <= 10) return "••••••••";
  return `${clean.slice(0, 8)}...${clean.slice(-4)}`;
}

/**
 * Calcula os milissegundos restantes até a próxima meia-noite UTC (quando as cotas diárias do Google AI Studio resetam)
 */
function getMsUntilMidnightUtc(): number {
  const now = new Date();
  const nextMidnightUtc = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 1, 0)
  );
  return Math.max(nextMidnightUtc.getTime() - now.getTime(), 60_000);
}

/**
 * Analisa se um erro retornado pelo Gemini é decorrente de quota excedida (HTTP 429 / RESOURCE_EXHAUSTED)
 * e classifica se é limitação de RPM (por minuto) ou RPD (cota diária de 1.500 requisições).
 */
export function classifyGeminiError(error: any): {
  isQuota: boolean;
  isDaily: boolean;
  isSafety: boolean;
  rawMessage: string;
} {
  const rawMessage = String(error?.message || error?.statusText || error || "");
  const status = error?.status || error?.statusCode;

  const isSafety =
    rawMessage.toLowerCase().includes("safety") ||
    rawMessage.toLowerCase().includes("blocked") ||
    rawMessage.toLowerCase().includes("finishreason: safety");

  const isQuota =
    status === 429 ||
    rawMessage.includes("429") ||
    rawMessage.includes("RESOURCE_EXHAUSTED") ||
    rawMessage.toLowerCase().includes("quota") ||
    rawMessage.toLowerCase().includes("rate limit") ||
    rawMessage.toLowerCase().includes("exceeded your current quota");

  // O Google AI Studio diferencia limites de minuto (RPM/TPM) e diários (RPD)
  const isDaily =
    isQuota &&
    (rawMessage.toLowerCase().includes("requests per day") ||
      rawMessage.toLowerCase().includes("queries per day") ||
      rawMessage.toLowerCase().includes("per day") ||
      rawMessage.toLowerCase().includes("daily quota") ||
      rawMessage.toLowerCase().includes("free_tier_requests_per_day"));

  return { isQuota, isDaily, isSafety, rawMessage };
}

/**
 * Gerenciador resiliente de pool de chaves da Gemini API
 * Distribui requisições via Round-Robin e realiza failover automático em caso de 429.
 */
export class GeminiPool {
  private entries: GeminiKeyEntry[] = [];
  private currentIndex: number = 0;
  private options: Required<GeminiPoolOptions>;

  constructor(
    rawKeys: Array<string | { key: string; label?: string }>,
    options?: GeminiPoolOptions
  ) {
    this.options = {
      rpmCooldownMs: options?.rpmCooldownMs ?? 65_000, // 65s para janela de 1 minuto
      rpdCooldownMs: options?.rpdCooldownMs ?? getMsUntilMidnightUtc(),
      maxRetriesPerOperation: options?.maxRetriesPerOperation ?? 5,
      waitIfShortCooldown: options?.waitIfShortCooldown ?? false,
      maxWaitMs: options?.maxWaitMs ?? 70_000,
      logKeyRotation: options?.logKeyRotation ?? true,
    };

    this.registerKeys(rawKeys);
  }

  /**
   * Constrói o pool a partir de variáveis de ambiente:
   * 1. Verifica `process.env.GEMINI_API_KEYS` (lista separada por vírgula ou quebra de linha)
   * 2. Fallback para `process.env.GEMINI_API_KEY` (chave única legada)
   */
  public static fromEnv(options?: GeminiPoolOptions): GeminiPool {
    const rawKeysEnv = process.env.GEMINI_API_KEYS;
    const rawSingleKeyEnv = process.env.GEMINI_API_KEY;

    let keyStrings: string[] = [];

    if (rawKeysEnv && rawKeysEnv.trim().length > 0) {
      keyStrings = rawKeysEnv
        .split(/[,\n]/)
        .map((k) => k.trim())
        .filter((k) => k.length > 0 && !k.startsWith("#") && !k.includes("your-google-ai"));
    }

    if (keyStrings.length === 0 && rawSingleKeyEnv && rawSingleKeyEnv.trim().length > 0) {
      const trimmed = rawSingleKeyEnv.trim();
      if (!trimmed.includes("your-google-ai")) {
        keyStrings = [trimmed];
      }
    }

    if (keyStrings.length === 0) {
      throw new Error(
        "❌ [GeminiPool] Nenhuma chave Gemini configurada. Defina GEMINI_API_KEYS (separadas por vírgula) ou GEMINI_API_KEY no ambiente."
      );
    }

    return new GeminiPool(keyStrings, options);
  }

  /**
   * Registra as chaves de API no pool interno
   */
  private registerKeys(rawKeys: Array<string | { key: string; label?: string }>): void {
    const seen = new Set<string>();

    for (let i = 0; i < rawKeys.length; i++) {
      const item = rawKeys[i];
      const keyString = (typeof item === "string" ? item : item.key || "").trim();

      if (!keyString || seen.has(keyString)) {
        continue;
      }
      seen.add(keyString);

      const label =
        typeof item === "object" && item.label
          ? item.label
          : `Chave #${this.entries.length + 1} (${maskApiKey(keyString)})`;

      this.entries.push({
        id: `gemini-key-${this.entries.length + 1}`,
        key: keyString,
        maskedKey: maskApiKey(keyString),
        label,
        client: new GoogleGenAI({ apiKey: keyString }),
        status: "healthy",
        cooldownUntil: null,
        totalSuccesses: 0,
        totalErrors: 0,
        consecutiveErrors: 0,
        lastUsedAt: null,
      });
    }

    if (this.entries.length === 0) {
      throw new Error("❌ [GeminiPool] Nenhuma chave válida foi informada para o pool.");
    }
  }

  /**
   * Retorna a quantidade total de chaves registradas
   */
  public get size(): number {
    return this.entries.length;
  }

  /**
   * Atualiza os status das chaves expiradas em cooldown de volta para 'healthy'
   */
  private refreshCooldowns(): void {
    const now = Date.now();
    for (const entry of this.entries) {
      if (
        (entry.status === "cooling_down" || entry.status === "exhausted_daily") &&
        entry.cooldownUntil &&
        entry.cooldownUntil <= now
      ) {
        entry.status = "healthy";
        entry.cooldownUntil = null;
        entry.consecutiveErrors = 0;
        if (this.options.logKeyRotation) {
          console.log(
            `🟢 [GeminiPool] Cooldown expirado. ${entry.label} reativada e pronta para novas requisições.`
          );
        }
      }
    }
  }

  /**
   * Retorna as chaves atualmente saudáveis
   */
  public getHealthyEntries(): GeminiKeyEntry[] {
    this.refreshCooldowns();
    return this.entries.filter((e) => e.status === "healthy");
  }

  /**
   * Retorna um cliente do GoogleGenAI diretamente (útil para retrocompatibilidade onde o pool não é injetado)
   */
  public getPrimaryClient(): GoogleGenAI {
    const healthy = this.getHealthyEntries();
    if (healthy.length > 0) {
      return healthy[0].client;
    }
    // Se nenhuma estiver saudável, retorna a primeira com menor cooldown
    return this.entries[0].client;
  }

  /**
   * Seleciona a próxima chave saudável usando Round-Robin balanceado
   */
  private getNextHealthyEntry(): GeminiKeyEntry | null {
    const healthy = this.getHealthyEntries();
    if (healthy.length === 0) {
      return null;
    }

    const entry = healthy[this.currentIndex % healthy.length];
    this.currentIndex = (this.currentIndex + 1) % healthy.length;
    return entry;
  }

  /**
   * Executa uma operação com a Gemini API aplicando Round-Robin e Failover automático em caso de 429
   */
  public async execute<T>(
    operation: (ai: GoogleGenAI, keyEntry: GeminiKeyEntry) => Promise<T>,
    options?: GeminiExecuteOptions
  ): Promise<T> {
    const maxRetries = Math.min(
      options?.maxRetries ?? this.options.maxRetriesPerOperation,
      this.entries.length * 2
    );
    const context = options?.contextName ? `[${options.contextName}] ` : "";
    const waitIfShort = options?.waitIfShortCooldown ?? this.options.waitIfShortCooldown;
    const maxWaitMs = options?.maxWaitMs ?? this.options.maxWaitMs;

    let attempts = 0;
    const errorsEncountered: Array<{ key: string; error: string; isQuota: boolean }> = [];

    while (attempts < maxRetries) {
      attempts++;
      this.refreshCooldowns();

      let targetEntry = this.getNextHealthyEntry();

      // Se todas as chaves estiverem em cooldown/esgotadas
      if (!targetEntry) {
        // Encontra o menor cooldown restante
        const activeCooldowns = this.entries
          .filter((e) => e.cooldownUntil && e.cooldownUntil > Date.now())
          .map((e) => e.cooldownUntil! - Date.now())
          .sort((a, b) => a - b);

        const shortestMs = activeCooldowns[0] ?? null;

        if (waitIfShort && shortestMs && shortestMs <= maxWaitMs) {
          const waitSeconds = Math.ceil(shortestMs / 1000);
          console.warn(
            `⏳ [GeminiPool] ${context}Todas as ${this.entries.length} chaves estão em cooldown. Aguardando ${waitSeconds}s para liberação da próxima chave...`
          );
          await new Promise((resolve) => setTimeout(resolve, shortestMs + 500));
          this.refreshCooldowns();
          targetEntry = this.getNextHealthyEntry();
        }

        if (!targetEntry) {
          const shortestSec = shortestMs ? Math.ceil(shortestMs / 1000) : "indeterminado";
          throw new GeminiAllKeysExhaustedError(
            `❌ [GeminiPool] ${context}Todas as ${this.entries.length} chaves de API do Gemini estão com cota esgotada. Menor cooldown restante: ${shortestSec}s.`,
            shortestMs,
            this.entries.length
          );
        }
      }

      try {
        targetEntry.lastUsedAt = Date.now();
        const result = await operation(targetEntry.client, targetEntry);

        // Sucesso na operação
        targetEntry.totalSuccesses++;
        targetEntry.consecutiveErrors = 0;
        targetEntry.lastErrorMessage = null;
        return result;
      } catch (error: any) {
        targetEntry.totalErrors++;
        targetEntry.consecutiveErrors++;
        targetEntry.lastErrorMessage = String(error?.message || error);

        const classification = classifyGeminiError(error);

        errorsEncountered.push({
          key: targetEntry.maskedKey,
          error: classification.rawMessage,
          isQuota: classification.isQuota,
        });

        // Caso o erro NÃO seja de cota (ex: erro de parâmetro, JSON ou rede não recuperável por troca de chave)
        if (!classification.isQuota) {
          // Se for filtro de segurança (SAFETY) ou erro não transitório, propaga imediatamente
          throw error;
        }

        // Tratamento de Quota Excedida (HTTP 429 / RESOURCE_EXHAUSTED)
        const now = Date.now();
        if (classification.isDaily) {
          targetEntry.status = "exhausted_daily";
          targetEntry.cooldownUntil = now + getMsUntilMidnightUtc();
          const hoursLeft = (getMsUntilMidnightUtc() / 3_600_000).toFixed(1);
          console.warn(
            `🔴 [GeminiPool] ${context}${targetEntry.label} esgotou a cota diária de requisições (RPD). Pausada por ~${hoursLeft}h até a virada UTC.`
          );
        } else {
          targetEntry.status = "cooling_down";
          targetEntry.cooldownUntil = now + this.options.rpmCooldownMs;
          const sec = Math.ceil(this.options.rpmCooldownMs / 1000);
          console.warn(
            `⚠️ [GeminiPool] ${context}${targetEntry.label} atingiu limite de requisições por minuto (RPM 429). Cooldown de ${sec}s aplicado.`
          );
        }

        const remainingHealthy = this.getHealthyEntries().length;
        if (remainingHealthy > 0) {
          console.log(
            `🔄 [GeminiPool] ${context}Alternando automaticamente para a próxima chave saudável do pool (${remainingHealthy} disponíveis)...`
          );
        }
      }
    }

    throw new GeminiAllKeysExhaustedError(
      `❌ [GeminiPool] ${context}Falha após ${attempts} tentativas em múltiplas chaves: ${JSON.stringify(
        errorsEncountered
      )}`,
      null,
      this.entries.length
    );
  }

  /**
   * Reseta manualmente todos os cooldowns (útil para testes ou no painel admin)
   */
  public resetCooldowns(): void {
    for (const entry of this.entries) {
      entry.status = "healthy";
      entry.cooldownUntil = null;
      entry.consecutiveErrors = 0;
    }
    console.log(`🔄 [GeminiPool] Todos os cooldowns foram resetados.`);
  }

  /**
   * Fornece um relatório do status atual de todas as chaves do pool
   */
  public getStatus(): GeminiPoolStatus {
    this.refreshCooldowns();
    const now = Date.now();

    const keys: GeminiKeyStatusSummary[] = this.entries.map((e) => {
      const remainingMs = e.cooldownUntil && e.cooldownUntil > now ? e.cooldownUntil - now : null;
      return {
        id: e.id,
        label: e.label,
        maskedKey: e.maskedKey,
        status: e.status,
        cooldownRemainingSeconds: remainingMs ? Math.ceil(remainingMs / 1000) : null,
        totalSuccesses: e.totalSuccesses,
        totalErrors: e.totalErrors,
        lastUsedAt: e.lastUsedAt ? new Date(e.lastUsedAt).toISOString() : null,
        lastErrorMessage: e.lastErrorMessage || null,
      };
    });

    return {
      totalKeys: this.entries.length,
      healthyKeys: keys.filter((k) => k.status === "healthy").length,
      coolingDownKeys: keys.filter((k) => k.status === "cooling_down").length,
      exhaustedDailyKeys: keys.filter((k) => k.status === "exhausted_daily").length,
      disabledKeys: keys.filter((k) => k.status === "disabled").length,
      keys,
    };
  }
}
