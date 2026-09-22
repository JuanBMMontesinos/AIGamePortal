import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { safeConstantTimeCompare } from "@/lib/utils/security";
import { rateLimit, createRateLimitResponse } from "@/lib/utils/rate-limit";
import {
  getAdminSecret,
  createAdminSessionToken,
  isServerAdminAuthenticated,
  ADMIN_COOKIE_NAME,
  ADMIN_COOKIE_OPTIONS,
} from "@/lib/utils/admin-auth";

/**
 * Endpoint de Autenticação do Administrador
 */
export async function POST(request: NextRequest) {
  // Mitigação contra força bruta: 5 tentativas por IP a cada 15 minutos (900s)
  const rl = await rateLimit(request, {
    limit: 5,
    windowSeconds: 15 * 60,
    prefix: "admin_auth",
  });

  if (!rl.success) {
    return createRateLimitResponse(
      rl,
      "Muitas tentativas de autenticação detectadas. Acesso bloqueado por segurança. Tente novamente mais tarde."
    );
  }

  try {
    const adminSecret = getAdminSecret();
    if (!adminSecret) {
      return NextResponse.json(
        {
          success: false,
          message: "Erro de configuração de segurança: ADMIN_SECRET_KEY não está configurada no servidor.",
        },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { secretKey } = body;

    if (!secretKey || !safeConstantTimeCompare(secretKey, adminSecret)) {
      return NextResponse.json(
        { success: false, message: "Chave de Administrador incorreta ou ausente." },
        { status: 401 }
      );
    }

    const sessionToken = createAdminSessionToken();
    const cookieStore = await cookies();
    cookieStore.set({
      name: ADMIN_COOKIE_NAME,
      value: sessionToken,
      ...ADMIN_COOKIE_OPTIONS,
    });

    return NextResponse.json({
      success: true,
      message: "Autenticação de administrador realizada com sucesso.",
    });
  } catch (err: any) {
    console.error("[Admin Auth API] Erro no processamento de login:", err?.message || err);
    return NextResponse.json(
      { success: false, message: "Erro interno no processamento de login." },
      { status: 500 }
    );
  }
}

/**
 * Logout do Administrador
 */
export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
  return NextResponse.json({ success: true, message: "Sessão encerrada com sucesso." });
}

/**
 * Verifica se a sessão atual é válida
 */
export async function GET(request: NextRequest) {
  const isAuthenticated = await isServerAdminAuthenticated(request);

  return NextResponse.json({
    authenticated: isAuthenticated,
  });
}

