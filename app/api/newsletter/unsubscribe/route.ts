import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { verifyUnsubscribeToken } from "@/lib/utils/security";
import { rateLimit, createRateLimitResponse } from "@/lib/utils/rate-limit";

export const dynamic = "force-dynamic";

/**
 * Validação de origem (CSRF Protection) para requisições de mutação de estado.
 */
function isAllowedOrigin(request: NextRequest, siteUrl: string): boolean {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");

  // Se não há cabeçalho de origem (ex: chamada de agente RFC 8058 ou curl), o token HMAC assinado já atua como prova criptográfica
  if (!origin && !referer) {
    return true;
  }

  try {
    const allowedUrl = new URL(siteUrl);
    if (origin) {
      const originUrl = new URL(origin);
      if (originUrl.host === allowedUrl.host || originUrl.host.includes("localhost")) {
        return true;
      }
    }
    if (referer) {
      const refererUrl = new URL(referer);
      if (refererUrl.host === allowedUrl.host || refererUrl.host.includes("localhost")) {
        return true;
      }
    }
  } catch {
    return false;
  }

  return false;
}

/**
 * GET /api/newsletter/unsubscribe
 *
 * Endpoint Idempotente (SEM MUTAÇÃO DE ESTADO).
 * Scanners de antivírus, robôs e links de e-mails são redirecionados de forma segura
 * para a interface amigável de confirmação com os parâmetros validados.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const rawEmail = searchParams.get("email");
  const token = searchParams.get("token") || "";
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://aigameportal.com").replace(/\/+$/, "");

  if (!rawEmail) {
    return NextResponse.redirect(new URL("/newsletter/unsubscribe?status=missing_email", siteUrl));
  }

  const cleanEmail = rawEmail.trim().toLowerCase();

  // Redireciona para a página amigável de confirmação com email e token
  const targetUrl = new URL("/newsletter/unsubscribe", siteUrl);
  targetUrl.searchParams.set("email", cleanEmail);
  if (token) {
    targetUrl.searchParams.set("token", token);
  }

  return NextResponse.redirect(targetUrl);
}

/**
 * POST /api/newsletter/unsubscribe
 *
 * Endpoint de Mutação Segura (Conformidade RFC 8058 & OWASP).
 * Exige token criptográfico HMAC-SHA256 gerado exclusivamente pelo servidor
 * para o e-mail do destinatário.
 */
export async function POST(request: NextRequest) {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://aigameportal.com").replace(/\/+$/, "");

  // 1. Rate Limiting: Máximo de 5 tentativas por IP por minuto
  const rl = await rateLimit(request, {
    limit: 5,
    windowSeconds: 60,
    prefix: "newsletter_unsubscribe",
  });
  if (!rl.success) {
    return createRateLimitResponse(rl, "Muitas tentativas de descadastro. Por favor, aguarde.");
  }

  // 2. Proteção CSRF (Same-Origin Verification)
  if (!isAllowedOrigin(request, siteUrl)) {
    return NextResponse.json(
      { success: false, error: "Origem da requisição não autorizada (CSRF bloqueado)." },
      { status: 403 }
    );
  }

  // 3. Extração dos parâmetros (Suporta JSON e Form-Data / Query Params para RFC 8058 One-Click)
  let email = "";
  let token = "";

  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const body = await request.json().catch(() => null);
    email = body?.email || "";
    token = body?.token || "";
  } else if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
    const formData = await request.formData().catch(() => null);
    if (formData) {
      email = (formData.get("email") as string) || "";
      token = (formData.get("token") as string) || "";
    }
  }

  // Fallback para query parameters se não enviado no corpo (compatibilidade RFC 8058)
  if (!email) {
    email = request.nextUrl.searchParams.get("email") || "";
  }
  if (!token) {
    token = request.nextUrl.searchParams.get("token") || "";
  }

  const cleanEmail = email.trim().toLowerCase();

  if (!cleanEmail || !token) {
    return NextResponse.json(
      { success: false, error: "E-mail e token de segurança são obrigatórios." },
      { status: 400 }
    );
  }

  // 4. Validação criptográfica do token assinado
  const isValidToken = verifyUnsubscribeToken(cleanEmail, token);
  if (!isValidToken) {
    console.warn(`[Newsletter Unsubscribe] Tentativa de descadastro com token inválido para: ${cleanEmail}`);
    return NextResponse.json(
      {
        success: false,
        error: "Token de cancelamento inválido, expirado ou assinatura de segurança incorreta.",
      },
      { status: 403 }
    );
  }

  // 5. Execução da mutação com service_role (contornando RLS administrativa)
  if (!isSupabaseConfigured) {
    return NextResponse.json({
      success: true,
      message: "Descadastro simulado com sucesso (Supabase offline).",
      mock: true,
    });
  }

  const supabase = createAdminClient() || createServerClient();
  if (!supabase) {
    return NextResponse.json(
      { success: false, error: "Serviço de banco de dados temporariamente indisponível." },
      { status: 503 }
    );
  }

  try {
    const { error } = await (supabase.from("newsletter_subscribers") as any)
      .update({
        is_active: false,
        unsubscribed_at: new Date().toISOString(),
      })
      .eq("email", cleanEmail);

    if (error) {
      console.error("[Newsletter Unsubscribe] Falha ao atualizar assinante no Supabase:", error);
      return NextResponse.json(
        { success: false, error: "Erro interno ao atualizar registro de inscrição." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Sua inscrição foi cancelada com sucesso. Você não receberá mais os resumos semanais.",
    });
  } catch (error: any) {
    console.error("[Newsletter Unsubscribe] Exceção inesperada:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno no servidor ao processar o cancelamento." },
      { status: 500 }
    );
  }
}
