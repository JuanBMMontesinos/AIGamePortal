import crypto from "crypto";
import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { safeConstantTimeCompare } from "@/lib/utils/security";

/**
 * Nome padrão do cookie de sessão administrativa
 */
export const ADMIN_COOKIE_NAME = "admin_session";

/**
 * Tempo de vida da sessão administrativa (7 dias em segundos)
 */
export const ADMIN_SESSION_MAX_AGE = 7 * 24 * 60 * 60; // 604800 segundos

/**
 * Opções de segurança obrigatórias para o cookie admin_session
 */
export const ADMIN_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: ADMIN_SESSION_MAX_AGE,
  path: "/",
};

interface AdminSessionPayload {
  role: "admin";
  iat: number;
  exp: number;
  nonce: string;
}

/**
 * Obtém a chave mestra do ambiente com verificação estrita.
 * NUNCA adota valor fallback; se ausente, loga erro crítico e retorna null.
 */
export function getAdminSecret(): string | null {
  const secret = process.env.ADMIN_SECRET_KEY?.trim();
  if (!secret) {
    console.error(
      "[CRITICAL SECURITY] ADMIN_SECRET_KEY não está configurada no ambiente do servidor!"
    );
    return null;
  }
  return secret;
}

/**
 * Gera um token assinado criptograficamente via HMAC-SHA256 para sessão administrativa.
 * O token possui payload codificado em base64url contendo:
 * - role: "admin"
 * - iat: timestamp de emissão
 * - exp: timestamp de expiração (7 dias)
 * - nonce: salt aleatório de 16 bytes para mitigar repetição
 *
 * Formato resultante: <base64urlPayload>.<base64urlSignature>
 */
export function createAdminSessionToken(): string {
  const secret = getAdminSecret();
  if (!secret) {
    throw new Error(
      "ADMIN_SECRET_KEY não está configurada no servidor. Geração de token recusada."
    );
  }

  const now = Date.now();
  const payload: AdminSessionPayload = {
    role: "admin",
    iat: now,
    exp: now + ADMIN_SESSION_MAX_AGE * 1000,
    nonce: crypto.randomBytes(16).toString("hex"),
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = crypto
    .createHmac("sha256", secret)
    .update(payloadB64)
    .digest("base64url");

  return `${payloadB64}.${signature}`;
}

/**
 * Valida a assinatura HMAC-SHA256, a integridade do payload e a expiração do token.
 * Utiliza safeConstantTimeCompare para proteção estrita contra Timing Attacks.
 *
 * @param token Token de sessão administrativa a validar
 * @returns true se o token for autêntico, válido e não expirado; false caso contrário.
 */
export function verifyAdminSessionToken(token: unknown): boolean {
  if (!token || typeof token !== "string" || !token.includes(".")) {
    return false;
  }

  const parts = token.split(".");
  if (parts.length !== 2) {
    return false;
  }

  const [payloadB64, signature] = parts;
  if (!payloadB64 || !signature) {
    return false;
  }

  const secret = getAdminSecret();
  if (!secret) {
    return false;
  }

  // 1. Recalcula a assinatura esperada com a chave do ambiente
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payloadB64)
    .digest("base64url");

  // 2. Compara em tempo constante para evitar vazamento de timing
  if (!safeConstantTimeCompare(signature, expectedSignature)) {
    return false;
  }

  // 3. Decodifica o payload e checa expiração e autoridade
  try {
    const payloadJson = Buffer.from(payloadB64, "base64url").toString("utf8");
    const payload: AdminSessionPayload = JSON.parse(payloadJson);

    if (payload.role !== "admin") {
      return false;
    }

    if (typeof payload.exp !== "number" || Date.now() > payload.exp) {
      return false; // Token expirado
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Função centralizada para autenticação administrativa server-side.
 * Pode ser executada em Route Handlers (com request) ou Server Components (via cookies()).
 *
 * Suporta:
 * 1. Cabeçalho 'x-admin-key' em requisições de API (comparação em tempo constante contra ADMIN_SECRET_KEY)
 * 2. Cookie seguro assinado 'admin_session' via HMAC-SHA256
 *
 * @param request Objeto NextRequest opcional (fornecido em route handlers)
 * @returns Promessa com true se autenticado; false se não autenticado.
 */
export async function isServerAdminAuthenticated(request?: NextRequest): Promise<boolean> {
  // 1. Verificação de cabeçalho 'x-admin-key' para integrações e scripts
  if (request) {
    const headerKey = request.headers.get("x-admin-key");
    const secret = getAdminSecret();
    if (headerKey && secret && safeConstantTimeCompare(headerKey, secret)) {
      return true;
    }

    // Checa cookie na própria requisição
    const requestCookie = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
    if (requestCookie && verifyAdminSessionToken(requestCookie)) {
      return true;
    }
  }

  // 2. Verificação de cookie via next/headers (Server Components ou Route Handlers)
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
    if (sessionCookie && verifyAdminSessionToken(sessionCookie)) {
      return true;
    }
  } catch (err) {
    // Caso invocado em contexto onde cookies() não esteja acessível
    console.warn("[Admin Auth] Não foi possível ler o cookieStore:", err);
  }

  return false;
}
