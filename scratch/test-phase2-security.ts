import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { generateUnsubscribeToken, verifyUnsubscribeToken } from "../lib/utils/security";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

async function runTests() {
  console.log("====================================================================");
  console.log("🧪 TESTES DE SEGURANÇA E VALIDAÇÃO DA FASE 2");
  console.log("====================================================================");
  console.log(`🌐 Base URL: ${BASE_URL}\n`);

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
  // 1. TESTES UNITÁRIOS DE CRIPTOGRAFIA (HMAC-SHA256)
  // ----------------------------------------------------------------------------
  console.log("📌 [1/4] Testando Assinatura e Validação de Tokens HMAC-SHA256...");
  const emailA = "gamer.pro@example.com";
  const emailB = "hacker@evil.com";

  const tokenA = generateUnsubscribeToken(emailA);
  const tokenB = generateUnsubscribeToken(emailB);

  assert(typeof tokenA === "string" && tokenA.length === 64, "Token HMAC tem 64 caracteres hexadecimais");
  assert(verifyUnsubscribeToken(emailA, tokenA), "Token válido para o e-mail original é aceito");
  assert(!verifyUnsubscribeToken(emailB, tokenA), "Token de emailA é rejeitado para emailB (Mitigação de falsificação)");
  assert(!verifyUnsubscribeToken(emailA, tokenA.slice(0, -1) + "0"), "Token adulterado por 1 caractere é rejeitado");
  assert(!verifyUnsubscribeToken("", tokenA), "E-mail vazio é rejeitado");
  assert(!verifyUnsubscribeToken(emailA, ""), "Token vazio é rejeitado");

  // ----------------------------------------------------------------------------
  // 2. TESTE DO ENDPOINT DE DESCADASTRO (GET sem mutação e POST com autenticação)
  // ----------------------------------------------------------------------------
  console.log("\n📌 [2/4] Testando Endpoints de Unsubscribe (/api/newsletter/unsubscribe)...");

  // GET deve redirecionar (status 302/307/manual)
  try {
    const getRes = await fetch(`${BASE_URL}/api/newsletter/unsubscribe?email=${encodeURIComponent(emailA)}&token=${tokenA}`, {
      method: "GET",
      redirect: "manual",
    });
    const isRedirect = getRes.status === 302 || getRes.status === 307 || getRes.status === 308;
    const location = getRes.headers.get("location") || "";
    assert(isRedirect && location.includes("/newsletter/unsubscribe"), "GET /api/newsletter/unsubscribe redireciona para a página de confirmação sem mutação", `Status: ${getRes.status}, Location: ${location}`);
  } catch (err: any) {
    assert(false, "GET /api/newsletter/unsubscribe", err.message);
  }

  // POST sem token deve falhar com 400 ou 403
  try {
    const postNoToken = await fetch(`${BASE_URL}/api/newsletter/unsubscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: emailA }),
    });
    assert(postNoToken.status === 400 || postNoToken.status === 403, "POST sem token retorna 400 ou 403", `Status: ${postNoToken.status}`);
  } catch (err: any) {
    assert(false, "POST sem token", err.message);
  }

  // POST com token adulterado deve falhar com 403 Forbidden
  try {
    const postBadToken = await fetch(`${BASE_URL}/api/newsletter/unsubscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: emailA, token: "invalid_tampered_token_12345" }),
    });
    assert(postBadToken.status === 403, "POST com token adulterado é bloqueado com HTTP 403 Forbidden", `Status: ${postBadToken.status}`);
  } catch (err: any) {
    assert(false, "POST com token adulterado", err.message);
  }

  // POST com token válido deve ter sucesso (200)
  try {
    const postValid = await fetch(`${BASE_URL}/api/newsletter/unsubscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: emailA, token: tokenA }),
    });
    const body = await postValid.json().catch(() => ({}));
    assert(postValid.status === 200 && body.success === true, "POST com token válido é aceito com HTTP 200", `Status: ${postValid.status}`);
  } catch (err: any) {
    assert(false, "POST com token válido", err.message);
  }

  // ----------------------------------------------------------------------------
  // 3. TESTE DE RATE LIMITING: NEWSLETTER SUBSCRIBE (Limite 3/min)
  // ----------------------------------------------------------------------------
  console.log("\n📌 [3/4] Testando Rate Limiting em /api/newsletter/subscribe (Máximo: 3 req/min)...");
  try {
    const results: number[] = [];
    let retryAfterHeader: string | null = null;

    for (let i = 1; i <= 4; i++) {
      const res = await fetch(`${BASE_URL}/api/newsletter/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: `burst_test_${i}@example.com` }),
      });
      results.push(res.status);
      if (res.status === 429) {
        retryAfterHeader = res.headers.get("retry-after");
      }
    }

    const fourthIs429 = results[3] === 429;
    assert(fourthIs429, `A 4ª requisição rápida foi bloqueada com HTTP 429 (Sequência: ${results.join(", ")})`);
    assert(Boolean(retryAfterHeader && Number(retryAfterHeader) > 0), `Cabeçalho Retry-After presente e válido na resposta 429: ${retryAfterHeader}s`);
  } catch (err: any) {
    assert(false, "Rate limit newsletter subscribe", err.message);
  }

  // ----------------------------------------------------------------------------
  // 4. TESTE DE RATE LIMITING: ADMIN AUTH (Limite 5/15min)
  // ----------------------------------------------------------------------------
  console.log("\n📌 [4/4] Testando Rate Limiting em /api/admin/auth (Máximo: 5 req/15min)...");
  try {
    const results: number[] = [];
    let retryAfterHeader: string | null = null;

    for (let i = 1; i <= 6; i++) {
      const res = await fetch(`${BASE_URL}/api/admin/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secretKey: `wrong_attempt_${i}` }),
      });
      results.push(res.status);
      if (res.status === 429) {
        retryAfterHeader = res.headers.get("retry-after");
      }
    }

    const sixthIs429 = results[5] === 429;
    assert(sixthIs429, `A 6ª tentativa de login foi bloqueada com HTTP 429 (Sequência: ${results.join(", ")})`);
    assert(Boolean(retryAfterHeader && Number(retryAfterHeader) > 0), `Cabeçalho Retry-After presente no bloqueio de login: ${retryAfterHeader}s`);
  } catch (err: any) {
    assert(false, "Rate limit admin auth", err.message);
  }

  console.log("\n====================================================================");
  console.log(`📊 RESULTADO FINAL DOS TESTES: ${passed} Passaram, ${failed} Falharam`);
  console.log("====================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
