import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  getDiscordSettingsAdmin,
  updateDiscordSettingsAdmin,
  getDiscordKPIsAdmin,
  getDiscordDealsHistoryAdmin,
  maskDiscordWebhookUrl,
} from "@/lib/data/discord-admin";
import {
  sendDiscordFreeGameAlert,
  sendDiscordNewsAlert,
  FreeGameDeal,
  DiscordNewsPayload,
} from "@/lib/services/discord-notifier";
import { rateLimit, createRateLimitResponse } from "@/lib/utils/rate-limit";
import { isServerAdminAuthenticated } from "@/lib/utils/admin-auth";

/**
 * GET /api/admin/discord
 * Consulta de configurações, KPIs e histórico de ofertas disparadas
 */
export async function GET(request: NextRequest) {
  if (!(await isServerAdminAuthenticated(request))) {
    return NextResponse.json({ error: "Acesso não autorizado." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || undefined;
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "15", 10);

  try {
    const [settings, kpis, history] = await Promise.all([
      getDiscordSettingsAdmin(),
      getDiscordKPIsAdmin(),
      getDiscordDealsHistoryAdmin({ search, page, limit }),
    ]);

    const safeSettings = {
      ...settings,
      deals_webhook_url: maskDiscordWebhookUrl(settings.deals_webhook_url),
      news_webhook_url: maskDiscordWebhookUrl(settings.news_webhook_url),
    };

    return NextResponse.json({ settings: safeSettings, kpis, history });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Falha ao carregar dados do Discord Admin", details: err?.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/discord
 * Atualiza configurações de habilitação (is_deals_enabled, is_news_enabled, motivos e webhooks)
 */
export async function PATCH(request: NextRequest) {
  if (!(await isServerAdminAuthenticated(request))) {
    return NextResponse.json({ error: "Acesso não autorizado." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      is_deals_enabled,
      is_news_enabled,
      deals_disabled_reason,
      news_disabled_reason,
      deals_webhook_url,
      news_webhook_url,
    } = body;

    const payload: Record<string, any> = {};

    if (typeof is_deals_enabled === "boolean") payload.is_deals_enabled = is_deals_enabled;
    if (typeof is_news_enabled === "boolean") payload.is_news_enabled = is_news_enabled;
    if (typeof deals_disabled_reason === "string")
      payload.deals_disabled_reason = deals_disabled_reason.trim();
    if (typeof news_disabled_reason === "string")
      payload.news_disabled_reason = news_disabled_reason.trim();
    if (typeof deals_webhook_url === "string")
      payload.deals_webhook_url = deals_webhook_url.trim() || null;
    if (typeof news_webhook_url === "string")
      payload.news_webhook_url = news_webhook_url.trim() || null;

    const result = await updateDiscordSettingsAdmin(payload);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const safeSettings = result.settings
      ? {
          ...result.settings,
          deals_webhook_url: maskDiscordWebhookUrl(result.settings.deals_webhook_url),
          news_webhook_url: maskDiscordWebhookUrl(result.settings.news_webhook_url),
        }
      : undefined;

    return NextResponse.json({
      success: true,
      message: "Configurações do Discord atualizadas com sucesso.",
      settings: safeSettings,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Erro ao atualizar configurações", details: err?.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/discord
 * Executa disparos de teste controlados diretamente para os webhooks
 */
export async function POST(request: NextRequest) {
  if (!(await isServerAdminAuthenticated(request))) {
    return NextResponse.json({ error: "Acesso não autorizado." }, { status: 401 });
  }

  // Rate limit: Máximo de 3 disparos de teste por minuto por IP
  const rl = await rateLimit(request, {
    limit: 3,
    windowSeconds: 60,
    prefix: "admin_discord_test",
  });

  if (!rl.success) {
    return createRateLimitResponse(
      rl,
      "Limite de disparos de teste do Discord excedido (máximo 3 por minuto). Por favor, aguarde."
    );
  }

  try {
    const body = await request.json();
    const action = body?.action;

    // 1. Teste de Alerta de Jogo Grátis
    if (action === "test_deal") {
      const targetWebhook =
        body?.webhook_url ||
        process.env.DISCORD_WEBHOOK_FREE_GAMES;

      if (!targetWebhook) {
        return NextResponse.json(
          { error: "Webhook de jogos grátis não configurado no .env.local nem informado no corpo." },
          { status: 400 }
        );
      }

      const testDeal: FreeGameDeal = {
        id: "test-deal-admin",
        title: "Made By AI Games Test Edition (Steam / Epic Games)",
        worth: "$29.99",
        platforms: "PC, Steam, Epic Games Store",
        open_giveaway_url: (process.env.NEXT_PUBLIC_SITE_URL || "https://aigameportal.com") + "/jogos",
        description:
          "Esta é uma mensagem de validação de webhook enviada com sucesso a partir do Painel Administrativo (/admin/discord). Se você está lendo isso, a integração com o Discord está homologada!",
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        image: "https://images.unsplash.com/photo-1612287233215-680459a0f0f5?q=80&w=1200&auto=format&fit=crop",
      };

      const result = await sendDiscordFreeGameAlert(testDeal, targetWebhook);

      if (!result.success) {
        return NextResponse.json(
          { error: `Falha no envio ao Discord: ${result.error}`, details: result },
          { status: 502 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Alerta de teste de jogo grátis disparado com sucesso no Discord!",
        result,
      });
    }

    // 2. Teste de Alerta de Breaking News
    if (action === "test_news") {
      const targetWebhook =
        body?.webhook_url ||
        process.env.DISCORD_WEBHOOK_NEWS;

      if (!targetWebhook) {
        return NextResponse.json(
          { error: "Webhook de notícias não configurado no .env.local nem informado no corpo." },
          { status: 400 }
        );
      }

      const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://aigameportal.com").replace(/\/+$/, "");
      const testNews: DiscordNewsPayload = {
        title: "Made By AI Games • Teste de Notificação Urgente (Plantão Gamer)",
        slug: "teste-integracao-discord",
        url: siteUrl,
        tldr: [
          "Disparo controlado executado via Painel Administrativo (/admin/discord)",
          "Validação de entrega de Rich Embeds e formatação com cores neon",
          "Canal de Breaking News operacional e pronto para eventos nível 5/5",
        ],
        category: "Hardware",
        reliabilityScore: 5,
        platforms: ["PlayStation 5", "Xbox Series X", "PC", "Nintendo Switch"],
        coverImageUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1200&auto=format&fit=crop",
      };

      const result = await sendDiscordNewsAlert(testNews, targetWebhook);

      if (!result.success) {
        return NextResponse.json(
          { error: `Falha no envio ao Discord: ${result.error}`, details: result },
          { status: 502 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Alerta de teste de Breaking News disparado com sucesso no Discord!",
        result,
      });
    }

    return NextResponse.json(
      { error: "Ação não reconhecida. Use 'test_deal' ou 'test_news'." },
      { status: 400 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: "Exceção ao processar teste do Discord", details: err?.message },
      { status: 500 }
    );
  }
}
