import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { safeConstantTimeCompare } from "@/lib/utils/security";

const ADMIN_SECRET = process.env.ADMIN_SECRET_KEY || "aigameportal_admin_2026";
const COOKIE_NAME = "admin_session";
const SESSION_TOKEN = "aigameportal_admin_authenticated_v1";

/**
 * Endpoint de Autenticação do Administrador
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { secretKey } = body;

    if (!secretKey || !safeConstantTimeCompare(secretKey, ADMIN_SECRET)) {
      return NextResponse.json(
        { success: false, message: "Chave de Administrador incorreta ou ausente." },
        { status: 401 }
      );
    }

    const cookieStore = await cookies();
    cookieStore.set({
      name: COOKIE_NAME,
      value: SESSION_TOKEN,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 dias
      path: "/",
    });

    return NextResponse.json({
      success: true,
      message: "Autenticação de administrador realizada com sucesso.",
    });
  } catch {
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
  cookieStore.delete(COOKIE_NAME);
  return NextResponse.json({ success: true, message: "Sessão encerrada com sucesso." });
}

/**
 * Verifica se a sessão atual é válida
 */
export async function GET() {
  const cookieStore = await cookies();
  const session = cookieStore.get(COOKIE_NAME);
  const isAuthenticated = Boolean(session?.value && safeConstantTimeCompare(session.value, SESSION_TOKEN));

  return NextResponse.json({
    authenticated: isAuthenticated,
  });
}
