/**
 * ==============================================================================
 * PROJETO: AIGamePortal (Fase 4 - Painel Administrativo do Discord)
 * MÓDULO: lib/data/discord-admin.ts
 * ==============================================================================
 *
 * Camada de acesso a dados exclusiva para a área administrativa /admin/discord.
 * Garante segurança com padrão desabilitado e consultas paginadas de histórico.
 */

import { createServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { DiscordSettings, FreeGameHistory } from "@/types/database";

export interface DiscordAdminKPIs {
  isDealsEnabled: boolean;
  isNewsEnabled: boolean;
  dealsDisabledReason: string | null;
  newsDisabledReason: string | null;
  isDealsWebhookConfigured: boolean;
  isNewsWebhookConfigured: boolean;
  dealsWebhookMasked: string | null;
  newsWebhookMasked: string | null;
  totalFreeGamesPosted: number;
  lastDealsDispatchedAt: string | null;
  lastDealsDispatchStatus: string;
  lastDealsDispatchLog: string | null;
  lastNewsDispatchedAt: string | null;
  lastNewsDispatchStatus: string;
  lastNewsDispatchLog: string | null;
}

export const DEFAULT_DISCORD_SETTINGS: DiscordSettings = {
  id: "default",
  is_deals_enabled: false,
  is_news_enabled: false,
  deals_disabled_reason: "Envio de jogos grátis pausado pelo administrador",
  news_disabled_reason: "Envio de breaking news pausado pelo administrador",
  deals_webhook_url: null,
  news_webhook_url: null,
  last_deals_dispatched_at: null,
  last_deals_dispatch_status: "idle",
  last_deals_dispatch_log: null,
  last_news_dispatched_at: null,
  last_news_dispatch_status: "idle",
  last_news_dispatch_log: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

/**
 * Mascara uma URL de Webhook do Discord para exibição segura na interface
 */
export function maskDiscordWebhookUrl(url?: string | null): string | null {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  try {
    const parts = trimmed.split("/api/webhooks/");
    if (parts.length === 2) {
      const [id, token] = parts[1].split("/");
      if (token && token.length > 8) {
        return `https://discord.com/api/webhooks/${id}/${token.slice(0, 4)}...${token.slice(-4)}`;
      }
      return `https://discord.com/api/webhooks/${id}/***`;
    }
  } catch {
    // Fallback básico
  }

  if (trimmed.length > 25) {
    return `${trimmed.slice(0, 32)}...${trimmed.slice(-6)}`;
  }
  return trimmed;
}

/**
 * Carrega as configurações globais do Discord (sempre garantindo false caso não haja registro)
 */
export async function getDiscordSettingsAdmin(): Promise<DiscordSettings> {
  if (!isSupabaseConfigured) {
    return { ...DEFAULT_DISCORD_SETTINGS };
  }

  try {
    const supabase = createServerClient();
    if (!supabase) return { ...DEFAULT_DISCORD_SETTINGS };

    const { data, error } = await supabase
      .from("discord_settings")
      .select("*")
      .eq("id", "default")
      .maybeSingle();

    if (error || !data) {
      return { ...DEFAULT_DISCORD_SETTINGS };
    }

    return data as DiscordSettings;
  } catch (err) {
    console.warn("[Discord Admin] Falha ao carregar configurações do banco, usando default:", err);
    return { ...DEFAULT_DISCORD_SETTINGS };
  }
}

/**
 * Atualiza o status de habilitação e parâmetros do bot no Discord
 */
export async function updateDiscordSettingsAdmin(
  payload: Partial<DiscordSettings>
): Promise<{ success: boolean; settings?: DiscordSettings; error?: string }> {
  if (!isSupabaseConfigured) {
    return {
      success: true,
      settings: {
        ...DEFAULT_DISCORD_SETTINGS,
        ...payload,
        updated_at: new Date().toISOString(),
      },
    };
  }

  try {
    const supabase = createServerClient();
    if (!supabase) return { success: false, error: "Cliente Supabase indisponível." };

    const updateData = {
      ...payload,
      id: "default",
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await (supabase.from("discord_settings") as any)
      .upsert(updateData)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, settings: data as DiscordSettings };
  } catch (err: any) {
    return { success: false, error: err?.message || "Exceção ao atualizar configurações do Discord" };
  }
}

/**
 * Consolida métricas, status de webhooks e indicadores de saúde para o dashboard
 */
export async function getDiscordKPIsAdmin(): Promise<DiscordAdminKPIs> {
  const settings = await getDiscordSettingsAdmin();

  // Verifica URLs nos arquivos de ambiente ou em banco
  const envDealsUrl = process.env.DISCORD_WEBHOOK_FREE_GAMES || settings.deals_webhook_url;
  const envNewsUrl = process.env.DISCORD_WEBHOOK_NEWS || settings.news_webhook_url;

  const isDealsWebhookConfigured = Boolean(
    envDealsUrl &&
      envDealsUrl.startsWith("https://discord") &&
      !envDealsUrl.includes("example_webhook_url")
  );

  const isNewsWebhookConfigured = Boolean(
    envNewsUrl &&
      envNewsUrl.startsWith("https://discord") &&
      !envNewsUrl.includes("example_webhook_url")
  );

  let totalFreeGamesPosted = 0;

  if (isSupabaseConfigured) {
    try {
      const supabase = createServerClient();
      if (supabase) {
        const { count, error } = await supabase
          .from("free_games_history")
          .select("*", { count: "exact", head: true });

        if (!error && typeof count === "number") {
          totalFreeGamesPosted = count;
        }
      }
    } catch {
      // Fallback gracioso
    }
  }

  return {
    isDealsEnabled: settings.is_deals_enabled,
    isNewsEnabled: settings.is_news_enabled,
    dealsDisabledReason: settings.deals_disabled_reason,
    newsDisabledReason: settings.news_disabled_reason,
    isDealsWebhookConfigured,
    isNewsWebhookConfigured,
    dealsWebhookMasked: maskDiscordWebhookUrl(envDealsUrl),
    newsWebhookMasked: maskDiscordWebhookUrl(envNewsUrl),
    totalFreeGamesPosted,
    lastDealsDispatchedAt: settings.last_deals_dispatched_at,
    lastDealsDispatchStatus: settings.last_deals_dispatch_status,
    lastDealsDispatchLog: settings.last_deals_dispatch_log,
    lastNewsDispatchedAt: settings.last_news_dispatched_at,
    lastNewsDispatchStatus: settings.last_news_dispatch_status,
    lastNewsDispatchLog: settings.last_news_dispatch_log,
  };
}

/**
 * Obtém a lista paginada de ofertas já disparadas no Discord com suporte a busca
 */
export async function getDiscordDealsHistoryAdmin(options?: {
  search?: string;
  limit?: number;
  page?: number;
}): Promise<{
  items: FreeGameHistory[];
  total: number;
  page: number;
  totalPages: number;
}> {
  const limit = options?.limit || 15;
  const page = Math.max(1, options?.page || 1);
  const offset = (page - 1) * limit;

  if (!isSupabaseConfigured) {
    return { items: [], total: 0, page: 1, totalPages: 1 };
  }

  try {
    const supabase = createServerClient();
    if (!supabase) return { items: [], total: 0, page: 1, totalPages: 1 };

    let query = supabase
      .from("free_games_history")
      .select("*", { count: "exact" });

    if (options?.search && options.search.trim()) {
      const term = options.search.trim();
      query = query.or(`title.ilike.%${term}%,platform.ilike.%${term}%`);
    }

    query = query.order("posted_at", { ascending: false }).range(offset, offset + limit - 1);

    const { data, count, error } = await query;

    if (error || !data) {
      console.warn("[Discord Admin] Erro ao consultar free_games_history:", error?.message);
      return { items: [], total: 0, page: 1, totalPages: 1 };
    }

    const total = count || 0;
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      items: data as FreeGameHistory[],
      total,
      page,
      totalPages,
    };
  } catch (err) {
    console.warn("[Discord Admin] Exceção ao consultar histórico:", err);
    return { items: [], total: 0, page: 1, totalPages: 1 };
  }
}
