import { createServerClient, createAdminClient, isSupabaseConfigured, isServiceRoleConfigured } from "@/lib/supabase/server";
import { NewsletterSettings, NewsletterSubscriber } from "@/types/database";

export interface NewsletterAdminKPIs {
  isEnabled: boolean;
  disabledReason: string | null;
  activeSubscribers: number;
  inactiveSubscribers: number;
  totalSubscribers: number;
  churnRate: number;
  isResendConfigured: boolean;
  resendApiKeyMasked: string | null;
  resendFromEmail: string;
  lastDispatchedAt: string | null;
  lastDispatchStatus: string;
  lastDispatchLog: string | null;
}

export const DEFAULT_NEWSLETTER_SETTINGS: NewsletterSettings = {
  id: "default",
  is_enabled: false,
  disabled_reason: "Aguardando configuração e homologação do serviço Resend",
  sender_name: "Made By AI Games",
  sender_email: process.env.RESEND_FROM_EMAIL || "newsletter@madebyaigames.com",
  test_recipient_email: null,
  last_dispatched_at: null,
  last_dispatch_status: "idle",
  last_dispatch_log: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

/**
 * Carrega as configurações globais da Newsletter (sempre garantindo is_enabled: false caso não haja registro)
 */
export async function getNewsletterSettingsAdmin(): Promise<NewsletterSettings> {
  if (!isSupabaseConfigured) {
    return { ...DEFAULT_NEWSLETTER_SETTINGS };
  }

  try {
    const supabase = createAdminClient() || createServerClient();
    if (!supabase) return { ...DEFAULT_NEWSLETTER_SETTINGS };

    const { data, error } = await supabase
      .from("newsletter_settings")
      .select("*")
      .eq("id", "default")
      .maybeSingle();

    if (error || !data) {
      return { ...DEFAULT_NEWSLETTER_SETTINGS };
    }

    return data as NewsletterSettings;
  } catch (err) {
    console.warn("[Newsletter Admin] Falha ao carregar settings do banco, usando default:", err);
    return { ...DEFAULT_NEWSLETTER_SETTINGS };
  }
}

/**
 * Atualiza o status de habilitação e parâmetros da newsletter
 */
export async function updateNewsletterSettingsAdmin(
  payload: Partial<NewsletterSettings>
): Promise<{ success: boolean; settings?: NewsletterSettings; error?: string }> {
  if (!isSupabaseConfigured) {
    return {
      success: true,
      settings: {
        ...DEFAULT_NEWSLETTER_SETTINGS,
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

    const { data, error } = await (supabase.from("newsletter_settings") as any)
      .upsert(updateData)
      .select("*")
      .single();

    if (error) {
      console.error("[Newsletter Admin] Erro ao atualizar settings:", error);
      return { success: false, error: error.message };
    }

    return { success: true, settings: data as NewsletterSettings };
  } catch (err: any) {
    console.error("[Newsletter Admin] Exceção ao atualizar settings:", err);
    return { success: false, error: err?.message || "Erro inesperado." };
  }
}

/**
 * Calcula os KPIs do módulo de Newsletter
 */
export async function getNewsletterKPIsAdmin(): Promise<NewsletterAdminKPIs> {
  const settings = await getNewsletterSettingsAdmin();

  const resendApiKey = process.env.RESEND_API_KEY || "";
  const isResendConfigured = Boolean(
    resendApiKey &&
      resendApiKey.startsWith("re_") &&
      !resendApiKey.includes("your_resend") &&
      !resendApiKey.includes("your-api-key")
  );

  const resendApiKeyMasked = isResendConfigured
    ? `${resendApiKey.slice(0, 6)}••••••••${resendApiKey.slice(-4)}`
    : null;

  const resendFromEmail =
    process.env.RESEND_FROM_EMAIL || settings.sender_email || "Made By AI Games <newsletter@madebyaigames.com>";

  if (!isSupabaseConfigured) {
    return {
      isEnabled: settings.is_enabled,
      disabledReason: settings.disabled_reason,
      activeSubscribers: 128,
      inactiveSubscribers: 6,
      totalSubscribers: 134,
      churnRate: 4.47,
      isResendConfigured,
      resendApiKeyMasked,
      resendFromEmail,
      lastDispatchedAt: settings.last_dispatched_at,
      lastDispatchStatus: settings.last_dispatch_status,
      lastDispatchLog: settings.last_dispatch_log,
    };
  }

  try {
    const supabase = createAdminClient() || createServerClient();
    if (!supabase) {
      return {
        isEnabled: settings.is_enabled,
        disabledReason: settings.disabled_reason,
        activeSubscribers: 0,
        inactiveSubscribers: 0,
        totalSubscribers: 0,
        churnRate: 0,
        isResendConfigured,
        resendApiKeyMasked,
        resendFromEmail,
        lastDispatchedAt: settings.last_dispatched_at,
        lastDispatchStatus: settings.last_dispatch_status,
        lastDispatchLog: settings.last_dispatch_log,
      };
    }

    // Consulta contagens
    const [{ count: activeCount }, { count: inactiveCount }, { count: totalCount }] =
      await Promise.all([
        supabase
          .from("newsletter_subscribers")
          .select("*", { count: "exact", head: true })
          .eq("is_active", true),
        supabase
          .from("newsletter_subscribers")
          .select("*", { count: "exact", head: true })
          .eq("is_active", false),
        supabase
          .from("newsletter_subscribers")
          .select("*", { count: "exact", head: true }),
      ]);

    const active = activeCount || 0;
    const inactive = inactiveCount || 0;
    const total = totalCount || 0;
    const churn = total > 0 ? Number(((inactive / total) * 100).toFixed(2)) : 0;

    return {
      isEnabled: settings.is_enabled,
      disabledReason: settings.disabled_reason,
      activeSubscribers: active,
      inactiveSubscribers: inactive,
      totalSubscribers: total,
      churnRate: churn,
      isResendConfigured,
      resendApiKeyMasked,
      resendFromEmail,
      lastDispatchedAt: settings.last_dispatched_at,
      lastDispatchStatus: settings.last_dispatch_status,
      lastDispatchLog: settings.last_dispatch_log,
    };
  } catch (err) {
    console.warn("[Newsletter Admin] Erro ao buscar contagens:", err);
    return {
      isEnabled: settings.is_enabled,
      disabledReason: settings.disabled_reason,
      activeSubscribers: 0,
      inactiveSubscribers: 0,
      totalSubscribers: 0,
      churnRate: 0,
      isResendConfigured,
      resendApiKeyMasked,
      resendFromEmail,
      lastDispatchedAt: settings.last_dispatched_at,
      lastDispatchStatus: settings.last_dispatch_status,
      lastDispatchLog: settings.last_dispatch_log,
    };
  }
}

/**
 * Consulta a lista de inscritos com suporte a busca e filtros
 */
export async function getNewsletterSubscribersAdmin(options?: {
  search?: string;
  status?: "all" | "active" | "inactive";
  limit?: number;
}): Promise<NewsletterSubscriber[]> {
  const search = (options?.search || "").trim().toLowerCase();
  const status = options?.status || "all";
  const limit = options?.limit || 100;

  if (!isSupabaseConfigured) {
    const mockList: NewsletterSubscriber[] = [
      {
        id: "mock-sub-1",
        email: "lucas.gamer@gmail.com",
        is_active: true,
        subscribed_at: "2026-09-14T12:00:00Z",
        unsubscribed_at: null,
      },
      {
        id: "mock-sub-2",
        email: "ana.clara.games@outlook.com",
        is_active: true,
        subscribed_at: "2026-09-15T09:30:00Z",
        unsubscribed_at: null,
      },
      {
        id: "mock-sub-3",
        email: "rodrigo.tech@yahoo.com.br",
        is_active: false,
        subscribed_at: "2026-09-10T15:20:00Z",
        unsubscribed_at: "2026-09-15T18:00:00Z",
      },
      {
        id: "mock-sub-4",
        email: "marcos.rpg@uol.com.br",
        is_active: true,
        subscribed_at: "2026-09-16T08:15:00Z",
        unsubscribed_at: null,
      },
    ];

    return mockList.filter((s) => {
      const matchSearch = !search || s.email.toLowerCase().includes(search);
      const matchStatus =
        status === "all" ||
        (status === "active" && s.is_active) ||
        (status === "inactive" && !s.is_active);
      return matchSearch && matchStatus;
    });
  }

  try {
    const supabase = createAdminClient() || createServerClient();
    if (!supabase) return [];

    let query = supabase
      .from("newsletter_subscribers")
      .select("*")
      .order("subscribed_at", { ascending: false })
      .limit(limit);

    if (status === "active") {
      query = query.eq("is_active", true);
    } else if (status === "inactive") {
      query = query.eq("is_active", false);
    }

    if (search) {
      query = query.ilike("email", `%${search}%`);
    }

    const { data, error } = await query;
    if (error || !data) {
      console.warn("[Newsletter Admin] Erro ao listar assinantes:", error);
      return [];
    }

    return data as NewsletterSubscriber[];
  } catch (err) {
    console.warn("[Newsletter Admin] Exceção ao listar assinantes:", err);
    return [];
  }
}

/**
 * Alterna manualmente o status de um assinante
 */
export async function toggleSubscriberActiveAdmin(
  id: string,
  is_active: boolean
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) {
    return { success: true };
  }

  try {
    const supabase = createAdminClient() || createServerClient();
    if (!supabase) return { success: false, error: "Cliente indisponível." };

    const payload = is_active
      ? { is_active: true, unsubscribed_at: null }
      : { is_active: false, unsubscribed_at: new Date().toISOString() };

    const { error } = await (supabase.from("newsletter_subscribers") as any)
      .update(payload)
      .eq("id", id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

/**
 * Remove um assinante permanentemente
 */
export async function deleteSubscriberAdmin(
  id: string
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) {
    return { success: true };
  }

  try {
    const supabase = createAdminClient() || createServerClient();
    if (!supabase) return { success: false, error: "Cliente indisponível." };

    const { error } = await supabase
      .from("newsletter_subscribers")
      .delete()
      .eq("id", id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}
