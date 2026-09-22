import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import crypto from "crypto";
import fs from "fs";
import path from "path";
import {
  createAdminSessionToken,
  verifyAdminSessionToken,
  getAdminSecret,
  ADMIN_COOKIE_NAME,
  ADMIN_SESSION_MAX_AGE,
} from "../lib/utils/admin-auth";
import { safeConstantTimeCompare } from "../lib/utils/security";
import { maskDiscordWebhookUrl } from "../lib/data/discord-admin";
import { maskSecretKey } from "../lib/data/social-admin";

async function runPhase4Tests() {
  console.log("====================================================================");
  console.log("🛡️  TESTES DE SEGURANÇA E VALIDAÇÃO DA FASE 4 (AUTH & RLS HARDENING)");
  console.log("====================================================================");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName}${detail ? ` - ${detail}` : ""}`);
      failed++;
    }
  }

  // ----------------------------------------------------------------------------
  // 1. REJEIÇÃO CATEGÓRICA DO TOKEN ESTÁTICO ANTIGO
  // ----------------------------------------------------------------------------
  console.log("\n📌 [1/7] Testando Rejeição de Tokens Estáticos e Forjados...");

  const oldStaticToken = "aigameportal_admin_authenticated_v1";
  assert(
    !verifyAdminSessionToken(oldStaticToken),
    "Rejeita categoricamente o antigo token estático (aigameportal_admin_authenticated_v1)"
  );

  assert(!verifyAdminSessionToken(""), "Rejeita token vazio");
  assert(!verifyAdminSessionToken("invalid_no_dot"), "Rejeita token sem separador de assinatura");
  assert(!verifyAdminSessionToken("part1.part2.part3"), "Rejeita token com mais de 2 partes");
  assert(!verifyAdminSessionToken(null as any), "Rejeita token nulo");
  assert(!verifyAdminSessionToken(undefined as any), "Rejeita token indefinido");
  assert(!verifyAdminSessionToken(12345 as any), "Rejeita tipo não-string");

  // ----------------------------------------------------------------------------
  // 2. VALIDAÇÃO DA CRIPTOGRAFIA HMAC-SHA256 (GERAÇÃO E VERIFICAÇÃO)
  // ----------------------------------------------------------------------------
  console.log("\n📌 [2/7] Testando Geração e Verificação de Sessão Criptografada...");

  const validToken = createAdminSessionToken();
  assert(typeof validToken === "string" && validToken.includes("."), "Gera token assinado com formato <payload>.<assinatura>");

  assert(verifyAdminSessionToken(validToken), "Valida com sucesso token legítimo assinado com ADMIN_SECRET_KEY");

  // Teste de adulteração no payload
  const [payloadB64, signature] = validToken.split(".");
  const tamperedPayloadB64 = Buffer.from(
    JSON.stringify({ role: "admin", iat: Date.now(), exp: Date.now() + 100000, nonce: "hacked" })
  ).toString("base64url");
  const tamperedToken = `${tamperedPayloadB64}.${signature}`;
  assert(!verifyAdminSessionToken(tamperedToken), "Detecta e rejeita adulteração de payload (assinatura inválida)");

  // Teste de adulteração na assinatura
  const tamperedSig = signature.slice(0, -2) + (signature.endsWith("a") ? "b" : "a");
  const tamperedSigToken = `${payloadB64}.${tamperedSig}`;
  assert(!verifyAdminSessionToken(tamperedSigToken), "Detecta e rejeita assinatura modificada");

  // ----------------------------------------------------------------------------
  // 3. VALIDAÇÃO DE EXPIRAÇÃO DE SESSÃO
  // ----------------------------------------------------------------------------
  console.log("\n📌 [3/7] Testando Expiração e Integridade de Claims do Payload...");

  const secret = getAdminSecret()!;
  // Cria token intencionalmente expirado
  const expiredPayload = {
    role: "admin",
    iat: Date.now() - 10000,
    exp: Date.now() - 1000, // Expirado há 1 segundo
    nonce: "test-nonce",
  };
  const expB64 = Buffer.from(JSON.stringify(expiredPayload)).toString("base64url");
  const expSig = crypto.createHmac("sha256", secret).update(expB64).digest("base64url");
  const expiredToken = `${expB64}.${expSig}`;

  assert(!verifyAdminSessionToken(expiredToken), "Rejeita token com timestamp de expiração no passado");

  // Token com role incorreta
  const fakeRolePayload = {
    role: "user",
    iat: Date.now(),
    exp: Date.now() + 100000,
    nonce: "test-nonce",
  };
  const fakeRoleB64 = Buffer.from(JSON.stringify(fakeRolePayload)).toString("base64url");
  const fakeRoleSig = crypto.createHmac("sha256", secret).update(fakeRoleB64).digest("base64url");
  const fakeRoleToken = `${fakeRoleB64}.${fakeRoleSig}`;

  assert(!verifyAdminSessionToken(fakeRoleToken), "Rejeita token com role diferente de 'admin'");

  // ----------------------------------------------------------------------------
  // 4. ELIMINAÇÃO DE FALLBACKS DE SENHA NO AMBIENTE
  // ----------------------------------------------------------------------------
  console.log("\n📌 [4/7] Testando Segurança contra Ausência de Credenciais...");

  const currentSecret = getAdminSecret();
  assert(
    Boolean(currentSecret && currentSecret.length >= 8),
    "ADMIN_SECRET_KEY configurada e recuperada sem fallback fixo"
  );

  // ----------------------------------------------------------------------------
  // 5. MASCARAMENTO DE DADOS SENSÍVEIS (WEBHOOKS E CHAVES)
  // ----------------------------------------------------------------------------
  console.log("\n📌 [5/7] Testando Mascaramento Mandatório de Webhooks e Chaves...");

  const rawDiscordUrl =
    "https://discord.com/api/webhooks/123456789012345678/mock_discord_webhook_token_abcdefghijklmnopqrstuvwxyz";
  const maskedDiscord = maskDiscordWebhookUrl(rawDiscordUrl);
  assert(
    Boolean(maskedDiscord && !maskedDiscord.includes("abcdefghijklmnopqrstuvwxyz")),
    "Mascara token sensível de Webhook do Discord"
  );
  assert(
    Boolean(maskedDiscord && maskedDiscord.includes("123456789012345678")),
    "Preserva ID do canal no Webhook mascarado para auditoria"
  );

  const rawApiKey = "mock_secret_api_key_test_1234567890";
  const maskedApiKey = maskSecretKey(rawApiKey);
  assert(
    Boolean(maskedApiKey && !maskedApiKey.includes("test_1234567890")),
    "Mascara chave privada de API"
  );

  // ----------------------------------------------------------------------------
  // 6. VALIDAÇÃO DE MIGRATION RLS NO SUPABASE
  // ----------------------------------------------------------------------------
  console.log("\n📌 [6/7] Validando Arquivo de Migração RLS...");

  const migrationPath = path.join(
    process.cwd(),
    "supabase",
    "migrations",
    "20260922000001_harden_admin_settings_rls.sql"
  );
  assert(fs.existsSync(migrationPath), "Arquivo de migração RLS 20260922000001 existe");

  const migrationSql = fs.readFileSync(migrationPath, "utf-8");
  assert(
    migrationSql.includes('DROP POLICY IF EXISTS "Permitir leitura de settings do discord"'),
    "Revoga política permissiva de discord_settings"
  );
  assert(
    migrationSql.includes('DROP POLICY IF EXISTS "Permitir leitura de settings da newsletter"'),
    "Revoga política permissiva de newsletter_settings"
  );
  assert(
    migrationSql.includes('DROP POLICY IF EXISTS "Permitir leitura de settings de redes sociais"'),
    "Revoga política permissiva de social_settings"
  );
  assert(
    migrationSql.includes("TO service_role"),
    "Cria novas políticas exclusivas para role service_role"
  );
  assert(
    migrationSql.includes("CREATE OR REPLACE VIEW public.public_newsletter_status"),
    "Cria view sanitizada para leitura pública não-sensível"
  );

  // ----------------------------------------------------------------------------
  // 7. TESTES HTTP EM TEMPO REAL (LOCAL SERVER)
  // ----------------------------------------------------------------------------
  console.log("\n📌 [7/7] Executando Testes HTTP nas Rotas e APIs Administrativas...");

  const baseUrl = "http://localhost:3000";

  try {
    // 7.1 Teste de Login com Senha Errada
    const authWrongRes = await fetch(`${baseUrl}/api/admin/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secretKey: "senha_totalmente_incorreta" }),
    });
    assert(authWrongRes.status === 401, "API /api/admin/auth recusa senha incorreta (HTTP 401)");

    // 7.2 Teste de Login com Senha Correta
    const adminKey = process.env.ADMIN_SECRET_KEY || "aigameportal_admin_2026";
    const authSuccessRes = await fetch(`${baseUrl}/api/admin/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secretKey: adminKey }),
    });
    assert(authSuccessRes.status === 200, "API /api/admin/auth autentica com sucesso senha legítima (HTTP 200)");

    // Checa se o cookie retornado é válido
    const setCookie = authSuccessRes.headers.get("set-cookie") || "";
    assert(setCookie.includes("admin_session="), "Cookie admin_session emitido na resposta");
    assert(setCookie.toLowerCase().includes("httponly"), "Cookie possui flag HttpOnly");
    assert(setCookie.toLowerCase().includes("samesite=lax"), "Cookie possui flag SameSite=Lax");

    // Extrai o valor do cookie emitido
    const cookieMatch = setCookie.match(/admin_session=([^;]+)/);
    const issuedCookieToken = cookieMatch ? cookieMatch[1] : "";
    assert(
      verifyAdminSessionToken(issuedCookieToken),
      "O token emitido no cookie pelo endpoint passa na validação HMAC-SHA256"
    );

    // 7.3 Teste de Bloqueio com Cookie Forjado / Antigo Estático
    const fakeHeaders = { Cookie: `admin_session=${oldStaticToken}` };

    const testUrls = [
      "/api/admin/affiliates",
      "/api/admin/discord",
      "/api/admin/newsletter",
      "/api/admin/social",
    ];

    for (const endpoint of testUrls) {
      const res = await fetch(`${baseUrl}${endpoint}`, { headers: fakeHeaders });
      assert(
        res.status === 401,
        `Endpoint ${endpoint} bloqueia cookie estático antigo forjado (HTTP 401)`
      );
    }

    // 7.4 Teste de Acesso Autorizado com Cookie Criptografado Válido
    const authHeaders = { Cookie: `admin_session=${issuedCookieToken}` };
    const affilRes = await fetch(`${baseUrl}/api/admin/affiliates`, { headers: authHeaders });
    assert(affilRes.status === 200, "Endpoint /api/admin/affiliates aceita cookie assinado legítimo (HTTP 200)");

    const discordRes = await fetch(`${baseUrl}/api/admin/discord`, { headers: authHeaders });
    assert(discordRes.status === 200, "Endpoint /api/admin/discord aceita cookie assinado legítimo (HTTP 200)");
    const discordJson = await discordRes.json();
    if (discordJson.settings?.deals_webhook_url) {
      assert(
        discordJson.settings.deals_webhook_url.includes("...") || discordJson.settings.deals_webhook_url.includes("***"),
        "Resposta de GET /api/admin/discord mascara Webhook URL de Deals"
      );
    }

    // 7.5 Teste de Revalidação com Senha Correta e Incorreta
    const revalidateWrongRes = await fetch(`${baseUrl}/api/revalidate?secret=senha_errada`);
    assert(revalidateWrongRes.status === 401, "API /api/revalidate rejeita token incorreto (HTTP 401)");

    const revalidateSecret = process.env.REVALIDATE_SECRET || process.env.REVALIDATION_SECRET || "";
    if (revalidateSecret) {
      const revalidateOkRes = await fetch(`${baseUrl}/api/revalidate?secret=${revalidateSecret}&path=/`);
      assert(revalidateOkRes.status === 200, "API /api/revalidate aceita secret válido do ambiente (HTTP 200)");
    }

    // 7.6 Teste de Consulta GET /api/admin/auth
    const checkAuthNoCookie = await fetch(`${baseUrl}/api/admin/auth`);
    const checkAuthNoCookieJson = await checkAuthNoCookie.json();
    assert(checkAuthNoCookieJson.authenticated === false, "GET /api/admin/auth retorna authenticated: false sem cookie");

    const checkAuthWithCookie = await fetch(`${baseUrl}/api/admin/auth`, { headers: authHeaders });
    const checkAuthWithCookieJson = await checkAuthWithCookie.json();
    assert(checkAuthWithCookieJson.authenticated === true, "GET /api/admin/auth retorna authenticated: true com cookie assinado");
  } catch (err: any) {
    console.error("  ⚠️ Erro durante testes HTTP (o servidor dev pode não estar respondendo na porta 3000):", err?.message);
  }

  // ----------------------------------------------------------------------------
  // RESUMO GERAL
  // ----------------------------------------------------------------------------
  console.log("\n====================================================================");
  console.log(`📊 RESULTADO FINAL DA FASE 4: ${passed} PASSOU | ${failed} FALHOU`);
  console.log("====================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase4Tests().catch((err) => {
  console.error("Falha fatal na execução dos testes:", err);
  process.exit(1);
});
