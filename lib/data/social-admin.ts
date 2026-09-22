/**
 * ==============================================================================
 * PROJETO: Made By AI Games (Fase 4 - Painel Administrativo de Redes Sociais)
 * MÓDULO: lib/data/social-admin.ts
 * ==============================================================================
 *
 * Camada de acesso a dados exclusiva para a área administrativa /admin/redes.
 * Garante segurança com padrão desabilitado para o X e telemetria de disparos.
 */

import { createServerClient, createAdminClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { SocialSettings } from "@/types/database";

export interface SocialAdminKPIs {
  isTwitterEnabled: boolean;
  isTelegramEnabled: boolean;
  twitterDisabledReason: string | null;
  telegramDisabledReason: string | null;
  isTwitterConfigured: boolean;
  isTelegramConfigured: boolean;
  twitterApiKeyMasked: string | null;
  twitterAccessTokenMasked: string | null;
  telegramBotTokenMasked: string | null;
  telegramChatId: string | null;
  lastTwitterDispatchedAt: string | null;
  lastTwitterDispatchStatus: string;
  lastTwitterDispatchLog: string | null;
  lastTelegramDispatchedAt: string | null;
  lastTelegramDispatchStatus: string;
  lastTelegramDispatchLog: string | null;
}

export const DEFAULT_SOCIAL_SETTINGS: SocialSettings = {
  id: "default",
  is_twitter_enabled: false,
  is_telegram_enabled: true,
  twitter_disabled_reason: "Aguardando recarga de créditos no X Developer Portal",
  telegram_disabled_reason: null,
  last_twitter_dispatched_at: null,
  last_twitter_dispatch_status: "idle",
  last_twitter_dispatch_log: null,
  last_telegram_dispatched_at: null,
  last_telegram_dispatch_status: "idle",
  last_telegram_dispatch_log: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

/**
 * Mascara uma chave de API ou token para exibição segura na interface
 */
export function maskSecretKey(secret?: string | null): string | null {
  if (!secret || typeof secret !== "string") return null;
  const trimmed = secret.trim();
  if (!trimmed) return null;
  if (trimmed.length <= 8) return "********";
  return `${trimmed.slice(0, 4)}...${trimmed.slice(-4)}`;
}

/**
 * Carrega as configurações globais de redes sociais
 * Garante is_twitter_enabled = false caso não haja registro ou dê erro.
 */
export async function getSocialSettingsAdmin(): Promise<SocialSettings> {
  if (!isSupabaseConfigured) {
    return { ...DEFAULT_SOCIAL_SETTINGS };
  }

  try {
    const supabase = createAdminClient() || createServerClient();
    if (!supabase) return { ...DEFAULT_SOCIAL_SETTINGS };

    const { data, error } = await supabase
      .from("social_settings")
      .select("*")
      .eq("id", "default")
      .maybeSingle();

    if (error || !data) {
      return { ...DEFAULT_SOCIAL_SETTINGS };
    }

    return data as SocialSettings;
  } catch (err) {
    console.warn("[Social Admin] Falha ao carregar configurações do banco, usando default:", err);
    return { ...DEFAULT_SOCIAL_SETTINGS };
  }
}

/**
 * Atualiza o status de habilitação e motivos do X e Telegram
 */
export async function updateSocialSettingsAdmin(
  payload: Partial<SocialSettings>
): Promise<{ success: boolean; settings?: SocialSettings; error?: string }> {
  if (!isSupabaseConfigured) {
    return {
      success: true,
      settings: {
        ...DEFAULT_SOCIAL_SETTINGS,
        ...payload,
        updated_at: new Date().toISOString(),
      },
    };
  }

  try {
    const supabase = createAdminClient() || createServerClient();
    if (!supabase) return { success: false, error: "Cliente Supabase indisponível." };

    const updateData = {
      ...payload,
      id: "default",
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await (supabase.from("social_settings") as any)
      .upsert(updateData)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, settings: data as SocialSettings };
  } catch (err: any) {
    return { success: false, error: err?.message || "Erro desconhecido ao salvar configurações." };
  }
}

/**
 * Retorna os KPIs e status consolidados para a interface /admin/redes
 */
export async function getSocialKPIsAdmin(): Promise<SocialAdminKPIs> {
  const settings = await getSocialSettingsAdmin();

  const twitterApiKey = process.env.TWITTER_API_KEY?.trim();
  const twitterApiSecret = process.env.TWITTER_API_SECRET?.trim();
  const twitterAccessToken = process.env.TWITTER_ACCESS_TOKEN?.trim();
  const twitterAccessSecret = process.env.TWITTER_ACCESS_SECRET?.trim();
  const isTwitterConfigured = Boolean(
    twitterApiKey && twitterApiSecret && twitterAccessToken && twitterAccessSecret
  );

  const telegramToken = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const telegramChat = process.env.TELEGRAM_CHAT_ID?.trim() || process.env.TELEGRAM_CHANNEL_ID?.trim();
  const isTelegramConfigured = Boolean(telegramToken && telegramChat);

  return {
    isTwitterEnabled: settings.is_twitter_enabled,
    isTelegramEnabled: settings.is_telegram_enabled,
    twitterDisabledReason: settings.twitter_disabled_reason,
    telegramDisabledReason: settings.telegram_disabled_reason,
    isTwitterConfigured,
    isTelegramConfigured,
    twitterApiKeyMasked: maskSecretKey(twitterApiKey),
    twitterAccessTokenMasked: maskSecretKey(twitterAccessToken),
    telegramBotTokenMasked: maskSecretKey(telegramToken),
    telegramChatId: telegramChat || null,
    lastTwitterDispatchedAt: settings.last_twitter_dispatched_at,
    lastTwitterDispatchStatus: settings.last_twitter_dispatch_status,
    lastTwitterDispatchLog: settings.last_twitter_dispatch_log,
    lastTelegramDispatchedAt: settings.last_telegram_dispatched_at,
    lastTelegramDispatchStatus: settings.last_telegram_dispatch_status,
    lastTelegramDispatchLog: settings.last_telegram_dispatch_log,
  };
}

/**
 * Registra telemetria de um disparo social no banco de dados
 */
export async function recordSocialDispatchTelemetry(
  channel: "twitter" | "telegram",
  status: "success" | "failed" | "skipped",
  log: string
): Promise<void> {
  if (!isSupabaseConfigured) return;

  try {
    const supabase = createAdminClient() || createServerClient();
    if (!supabase) return;

    const payload =
      channel === "twitter"
        ? {
            last_twitter_dispatched_at: new Date().toISOString(),
            last_twitter_dispatch_status: status,
            last_twitter_dispatch_log: log.slice(0, 1000),
          }
        : {
            last_telegram_dispatched_at: new Date().toISOString(),
            last_telegram_dispatch_status: status,
            last_telegram_dispatch_log: log.slice(0, 1000),
          };

    await (supabase.from("social_settings") as any).upsert({
      id: "default",
      ...payload,
      updated_at: new Date().toISOString(),
    });
  } catch (err: any) {
    console.warn(`[Social Admin] Falha ao registrar telemetria do ${channel}:`, err?.message || err);
  }
}
