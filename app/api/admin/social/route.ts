import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  getSocialSettingsAdmin,
  updateSocialSettingsAdmin,
  getSocialKPIsAdmin,
  recordSocialDispatchTelemetry,
} from "@/lib/data/social-admin";
import { TwitterApi } from "twitter-api-v2";

const ADMIN_SECRET = process.env.ADMIN_SECRET_KEY || "aigameportal_admin_2026";
const COOKIE_NAME = "admin_session";
const SESSION_TOKEN = "aigameportal_admin_authenticated_v1";

async function isAuthorized(request: NextRequest): Promise<boolean> {
  const headerKey = request.headers.get("x-admin-key");
  if (headerKey && headerKey === ADMIN_SECRET) return true;

  const cookieStore = await cookies();
  const session = cookieStore.get(COOKIE_NAME);
  return session?.value === SESSION_TOKEN;
}

/**
 * GET /api/admin/social
 * Consulta configurações atuais, credenciais mascaradas e telemetria de disparos
 */
export async function GET(request: NextRequest) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ error: "Acesso não autorizado." }, { status: 401 });
  }

  try {
    const [settings, kpis] = await Promise.all([
      getSocialSettingsAdmin(),
      getSocialKPIsAdmin(),
    ]);

    return NextResponse.json({ settings, kpis });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Falha ao carregar configurações sociais", details: err?.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/social
 * Atualiza status de habilitação (is_twitter_enabled, is_telegram_enabled) e motivos de pausa
 */
export async function PATCH(request: NextRequest) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ error: "Acesso não autorizado." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      is_twitter_enabled,
      is_telegram_enabled,
      twitter_disabled_reason,
      telegram_disabled_reason,
    } = body;

    const payload: Record<string, any> = {};

    if (typeof is_twitter_enabled === "boolean") {
      payload.is_twitter_enabled = is_twitter_enabled;
    }
    if (typeof is_telegram_enabled === "boolean") {
      payload.is_telegram_enabled = is_telegram_enabled;
    }
    if (typeof twitter_disabled_reason === "string") {
      payload.twitter_disabled_reason = twitter_disabled_reason.trim() || null;
    }
    if (typeof telegram_disabled_reason === "string") {
      payload.telegram_disabled_reason = telegram_disabled_reason.trim() || null;
    }

    const result = await updateSocialSettingsAdmin(payload);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "Configurações de redes sociais atualizadas com sucesso.",
      settings: result.settings,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Erro ao atualizar configurações de redes sociais", details: err?.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/social
 * Disparos controlados de teste para validação de conexões e créditos
 */
export async function POST(request: NextRequest) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ error: "Acesso não autorizado." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const action = body?.action;

    // 1. Teste de conexão e envio de Tweet no X
    if (action === "test_twitter") {
      const appKey = process.env.TWITTER_API_KEY?.trim();
      const appSecret = process.env.TWITTER_API_SECRET?.trim();
      const accessToken = process.env.TWITTER_ACCESS_TOKEN?.trim();
      const accessSecret = process.env.TWITTER_ACCESS_SECRET?.trim();

      if (!appKey || !appSecret || !accessToken || !accessSecret) {
        return NextResponse.json(
          { error: "Credenciais do X (Twitter) não configuradas no servidor (.env.local)." },
          { status: 400 }
        );
      }

      const client = new TwitterApi({
        appKey,
        appSecret,
        accessToken,
        accessSecret,
      });

      const testCopy = `🎮 Made By AI Games • Teste Operacional do Portal\n\nValidação de integração de API executada via Painel Administrativo (/admin/redes) em ${new Date().toLocaleString("pt-BR")}.\n\n#MadeByAiGames #Games`;

      try {
        const tweet = await client.readWrite.v2.tweet(testCopy);
        const tweetId = tweet.data?.id;

        await recordSocialDispatchTelemetry(
          "twitter",
          "success",
          `Tweet de teste postado com sucesso via Painel Admin (ID: ${tweetId})`
        );

        return NextResponse.json({
          success: true,
          message: "Tweet de teste publicado com sucesso no X!",
          tweetId,
          data: tweet.data,
        });
      } catch (tweetErr: any) {
        let errorDetail = tweetErr?.message || String(tweetErr);
        if (tweetErr?.data?.detail) {
          errorDetail = `${errorDetail} - ${tweetErr.data.detail}`;
        }
        if (tweetErr?.code === 402 || tweetErr?.data?.detail?.includes("credits depleted")) {
          errorDetail = "Saldo de créditos esgotado no X (HTTP 402 credits depleted). Adicione saldo em developer.x.com.";
        }

        await recordSocialDispatchTelemetry("twitter", "failed", errorDetail);

        return NextResponse.json(
          {
            error: `Falha ao postar no X: ${errorDetail}`,
            details: tweetErr?.data || tweetErr?.message,
            code: tweetErr?.code || tweetErr?.status,
          },
          { status: 502 }
        );
      }
    }

    // 2. Teste de envio de Mensagem para o Telegram
    if (action === "test_telegram") {
      const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
      const chatId = process.env.TELEGRAM_CHAT_ID?.trim() || process.env.TELEGRAM_CHANNEL_ID?.trim();

      if (!token || !chatId) {
        return NextResponse.json(
          { error: "Credenciais do Telegram não configuradas no servidor." },
          { status: 400 }
        );
      }

      const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://aigameportal.vercel.app").replace(/\/+$/, "");
      const testText = `🎮 <b>Made By AI Games • Teste Administrativo</b>\n\nDisparo de teste homologado com sucesso a partir do Painel de Redes Sociais (<code>/admin/redes</code>).\n\n🕒 ${new Date().toLocaleString("pt-BR")}`;

      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: testText,
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [[{ text: "Acessar Portal 🎮", url: siteUrl }]],
          },
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.ok) {
        const msgId = data.result?.message_id;
        await recordSocialDispatchTelemetry(
          "telegram",
          "success",
          `Mensagem de teste enviada com sucesso via Painel Admin (ID: ${msgId})`
        );

        return NextResponse.json({
          success: true,
          message: "Mensagem de teste enviada com sucesso para o Telegram!",
          messageId: msgId,
        });
      } else {
        const errMsg = data.description || `HTTP ${res.status}`;
        await recordSocialDispatchTelemetry("telegram", "failed", errMsg);

        return NextResponse.json(
          { error: `Falha no envio ao Telegram: ${errMsg}`, details: data },
          { status: 502 }
        );
      }
    }

    return NextResponse.json(
      { error: "Ação não reconhecida. Use 'test_twitter' ou 'test_telegram'." },
      { status: 400 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: "Exceção ao processar teste social", details: err?.message },
      { status: 500 }
    );
  }
}
