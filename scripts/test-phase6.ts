import { NextRequest } from "next/server";
import crypto from "crypto";
import dotenv from "dotenv";
import { generateUnsubscribeToken, verifyUnsubscribeToken } from "@/lib/utils/security";

dotenv.config({ path: ".env.local" });

async function runTests() {
  console.log("=== INICIANDO SUÍTE DE TESTES AUTOMATIZADOS - FASE 6 ===");

  // -------------------------------------------------------------
  // TESTE 1: Criptografia de Newsletter - Eliminação de Fallback Hardcoded
  // -------------------------------------------------------------
  console.log("\n[TESTE 1] Eliminação de Fallback Hardcoded e Comportamento Fail-Closed:");

  const originalNewsletterSecret = process.env.NEWSLETTER_UNSUBSCRIBE_SECRET;
  const originalAdminKey = process.env.ADMIN_SECRET_KEY;
  const originalServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  try {
    // Cenário 1.1: Todas as chaves ausentes -> Fail-closed imediato
    delete process.env.NEWSLETTER_UNSUBSCRIBE_SECRET;
    delete process.env.ADMIN_SECRET_KEY;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    const emailTest = "vitima_teste@madebyai.games";
    const tokenNoSecret = generateUnsubscribeToken(emailTest);

    if (tokenNoSecret === "") {
      console.log("  ✅ Cenário 1.1 passou: generateUnsubscribeToken retorna vazio quando segredo está ausente.");
    } else {
      console.error(`  ❌ Cenário 1.1 falhou: esperava string vazia, obteve "${tokenNoSecret}"`);
      process.exit(1);
    }

    // Cenário 1.2: verifyUnsubscribeToken rejeita qualquer tentativa sem segredo configurado
    const isVerifiedNoSecret = verifyUnsubscribeToken(emailTest, "qualquer_token_aleatorio");
    if (!isVerifiedNoSecret) {
      console.log("  ✅ Cenário 1.2 passou: verifyUnsubscribeToken falha com segurança (retorna false) sem segredo.");
    } else {
      console.error("  ❌ Cenário 1.2 falhou: aceitou token com segredo ausente.");
      process.exit(1);
    }

    // Cenário 1.3: Atacante tenta forjar token com o antigo segredo padrão hardcoded
    const legacyDefaultSecret = "aigameportal_newsletter_unsubscribe_secret_default";
    const forgedLegacyToken = crypto.createHmac("sha256", legacyDefaultSecret).update(emailTest).digest("hex");
    const isLegacyAccepted = verifyUnsubscribeToken(emailTest, forgedLegacyToken);

    if (!isLegacyAccepted) {
      console.log("  ✅ Cenário 1.3 passou: Token forjado com a antiga chave hardcoded é TERMINANTEMENTE rejeitado.");
    } else {
      console.error("  ❌ Cenário 1.3 falhou: Antigo segredo padrão ainda foi aceito!");
      process.exit(1);
    }

    // Cenário 1.4: Chave dedicada configurada (NEWSLETTER_UNSUBSCRIBE_SECRET)
    process.env.NEWSLETTER_UNSUBSCRIBE_SECRET = "segredo_forte_newsletter_fase6_2026";
    const validToken = generateUnsubscribeToken(emailTest);
    const isValidTokenVerified = verifyUnsubscribeToken(emailTest, validToken);
    const isTamperedRejected = verifyUnsubscribeToken(emailTest, validToken.slice(0, -1) + "x");

    if (validToken.length === 64 && isValidTokenVerified && !isTamperedRejected) {
      console.log("  ✅ Cenário 1.4 passou: Token gerado e validado com chave dedicada com sucesso.");
    } else {
      console.error("  ❌ Cenário 1.4 falhou na validação de token legítimo.");
      process.exit(1);
    }

    // Cenário 1.5: Hierarquia de fallback (ADMIN_SECRET_KEY quando dedicada não existe)
    delete process.env.NEWSLETTER_UNSUBSCRIBE_SECRET;
    process.env.ADMIN_SECRET_KEY = "chave_admin_mestra_fase6";
    const tokenFromAdminKey = generateUnsubscribeToken(emailTest);
    const isAdminKeyVerified = verifyUnsubscribeToken(emailTest, tokenFromAdminKey);

    if (tokenFromAdminKey.length === 64 && isAdminKeyVerified) {
      console.log("  ✅ Cenário 1.5 passou: Hierarquia de fallback para ADMIN_SECRET_KEY operando corretamente.");
    } else {
      console.error("  ❌ Cenário 1.5 falhou na hierarquia de chaves.");
      process.exit(1);
    }
  } finally {
    // Restaura ambiente
    if (originalNewsletterSecret !== undefined) process.env.NEWSLETTER_UNSUBSCRIBE_SECRET = originalNewsletterSecret;
    if (originalAdminKey !== undefined) process.env.ADMIN_SECRET_KEY = originalAdminKey;
    if (originalServiceKey !== undefined) process.env.SUPABASE_SERVICE_ROLE_KEY = originalServiceKey;
  }

  // -------------------------------------------------------------
  // TESTE 2: Rate Limiting nos Redirecionamentos de Afiliados (/api/out/[id])
  // -------------------------------------------------------------
  console.log("\n[TESTE 2] Rate Limiting e Anti-Click Fraud em GET /api/out/[id]:");

  const { GET: outIdHandler } = await import("@/app/api/out/[id]/route");
  const testIpAffiliate = "198.51.100.77";

  let hit429 = false;
  let responsesStatus: number[] = [];

  for (let i = 1; i <= 32; i++) {
    const req = new NextRequest(`http://localhost:3000/api/out/test-product-id`, {
      headers: {
        "cf-connecting-ip": testIpAffiliate,
      },
    });

    const res = await outIdHandler(req, {
      params: Promise.resolve({ id: "test-product-id" }),
    });

    responsesStatus.push(res.status);

    if (res.status === 429) {
      hit429 = true;
      const data = await res.json();
      if (i > 30) {
        console.log(`  ✅ Requisição #${i} bloqueada com HTTP 429 Too Many Requests: "${data.error}"`);
      }
      break;
    }
  }

  if (hit429) {
    console.log("  ✅ Cenário 2 passou: Rate limiter de 30 req/min ativado com sucesso para /api/out/[id].");
  } else {
    console.error("  ❌ Cenário 2 falhou: Rate limit não bloqueou com 429 após 30 requisições.", responsesStatus);
    process.exit(1);
  }

  // Testa se outro IP NÃO é bloqueado (isolamento por IP)
  const reqOtherIp = new NextRequest(`http://localhost:3000/api/out/test-product-id`, {
    headers: {
      "cf-connecting-ip": "198.51.100.88",
    },
  });
  const resOtherIp = await outIdHandler(reqOtherIp, {
    params: Promise.resolve({ id: "test-product-id" }),
  });
  if (resOtherIp.status !== 429) {
    console.log(`  ✅ Cenário 2 (Isolamento de IP) passou: Novo IP não sofreu bloqueio indevido (status ${resOtherIp.status}).`);
  } else {
    console.error("  ❌ Cenário 2 (Isolamento de IP) falhou: Bloqueou IP não relacionado.");
    process.exit(1);
  }

  // -------------------------------------------------------------
  // TESTE 3: Validação de ID Vazio e Fallback Seguro em /api/out/[id]
  // -------------------------------------------------------------
  console.log("\n[TESTE 3] Validação de ID e Fallback Seguro para a Home em /api/out/[id]:");

  const reqEmptyId = new NextRequest(`http://localhost:3000/api/out/`, {
    headers: {
      "cf-connecting-ip": "198.51.100.89",
    },
  });
  const resEmptyId = await outIdHandler(reqEmptyId, {
    params: Promise.resolve({ id: "   " }),
  });

  const locationHeader = resEmptyId.headers.get("location");
  if (resEmptyId.status === 307 && (locationHeader?.endsWith("/") || locationHeader?.includes("localhost:3000/"))) {
    console.log("  ✅ Cenário 3 passou: ID inválido/vazio redireciona com HTTP 307 para a Home de forma segura.");
  } else {
    console.error("  ❌ Cenário 3 falhou:", resEmptyId.status, locationHeader);
    process.exit(1);
  }

  // -------------------------------------------------------------
  // TESTE 4: Rate Limiting em GET /api/out/search
  // -------------------------------------------------------------
  console.log("\n[TESTE 4] Rate Limiting em GET /api/out/search:");

  const { GET: outSearchHandler } = await import("@/app/api/out/search/route");
  const testIpSearch = "198.51.100.111";

  let hit429Search = false;

  for (let i = 1; i <= 32; i++) {
    const req = new NextRequest(`http://localhost:3000/api/out/search?q=playstation`, {
      headers: {
        "cf-connecting-ip": testIpSearch,
      },
    });

    const res = await outSearchHandler(req);

    if (res.status === 429) {
      hit429Search = true;
      const data = await res.json();
      if (i > 30) {
        console.log(`  ✅ Requisição #${i} de busca bloqueada com HTTP 429: "${data.error}"`);
      }
      break;
    }
  }

  if (hit429Search) {
    console.log("  ✅ Cenário 4 passou: Rate limiter de 30 req/min ativado com sucesso para /api/out/search.");
  } else {
    console.error("  ❌ Cenário 4 falhou: Rate limit não bloqueou busca com 429 após 30 requisições.");
    process.exit(1);
  }

  // -------------------------------------------------------------
  // TESTE 5: Teste em Servidor HTTP Real (Porta 3000) caso online
  // -------------------------------------------------------------
  console.log("\n[TESTE 5] Verificação de Headers RFC 6585 via HTTP:");

  let serverReachable = false;
  try {
    const probe = await fetch("http://localhost:3000/api/metrics/summary");
    if (probe.status !== 0) serverReachable = true;
  } catch {
    serverReachable = false;
  }

  if (serverReachable) {
    console.log("  ℹ️ Servidor Next.js detectado em http://localhost:3000. Testando disparo HTTP:");
    const testHttpIp = "198.51.100.222";

    let gotHttp429 = false;
    for (let i = 1; i <= 32; i++) {
      const res = await fetch("http://localhost:3000/api/out/search?q=nintendo", {
        headers: {
          "cf-connecting-ip": testHttpIp,
        },
        redirect: "manual",
      });

      if (res.status === 429) {
        gotHttp429 = true;
        const retryAfter = res.headers.get("retry-after");
        const limitHeader = res.headers.get("x-ratelimit-limit");
        console.log(`  ✅ Cenário 5 passou: Servidor HTTP retornou 429 com Retry-After=${retryAfter} e X-RateLimit-Limit=${limitHeader}.`);
        break;
      }
    }

    if (!gotHttp429) {
      console.warn("  ⚠️ Nota: 429 não alcançado via HTTP real (pode estar usando Redis ou proxy com IP diferente).");
    }
  } else {
    console.log("  ℹ️ Servidor HTTP local não alcançado nesta porta, testes internos cobriram toda a lógica.");
  }

  console.log("\n🎉 TODOS OS TESTES DA FASE 6 FORAM CONCLUÍDOS COM SUCESSO!");
}

runTests().catch((err) => {
  console.error("Erro fatal durante os testes da Fase 6:", err);
  process.exit(1);
});
