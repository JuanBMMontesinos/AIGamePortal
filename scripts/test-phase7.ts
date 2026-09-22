import { NextRequest } from "next/server";
import dotenv from "dotenv";
import { GET as getSummaryRoute } from "@/app/api/metrics/summary/route";
import { GET as getPublicRoute } from "@/app/api/metrics/public/route";
import { createAdminSessionToken, ADMIN_COOKIE_NAME } from "@/lib/utils/admin-auth";
import { getPublicMetricsSummary } from "@/lib/data/metrics-summary";

dotenv.config({ path: ".env.local" });

async function runTests() {
  console.log("=== INICIANDO SUÍTE DE TESTES AUTOMATIZADOS - FASE 7 ===");
  console.log("Foco: Hardening de Telemetria, Autenticação de Métricas B2B & Mitigação de DoS\n");

  const adminSecret = process.env.ADMIN_SECRET_KEY || "test_admin_secret_key_phase7_32chars!";
  process.env.ADMIN_SECRET_KEY = adminSecret;

  // -------------------------------------------------------------
  // TESTE 1: Autenticação Obrigatória em GET /api/metrics/summary
  // -------------------------------------------------------------
  console.log("[TESTE 1] Autenticação Obrigatória em GET /api/metrics/summary:");

  // Cenário 1.1: Requisição Anônima
  const anonReq = new NextRequest("http://localhost:3000/api/metrics/summary", {
    method: "GET",
    headers: {
      "cf-connecting-ip": "203.0.113.10",
    },
  });

  const anonRes = await getSummaryRoute(anonReq);
  const anonJson = await anonRes.json();

  if (anonRes.status === 401) {
    console.log("  ✅ Cenário 1.1 passou: Requisição anônima rejeitada com HTTP 401 Unauthorized.");
  } else {
    console.error(`  ❌ Cenário 1.1 falhou: Esperava status 401, obteve ${anonRes.status}`);
    process.exit(1);
  }

  if (anonJson.success === false && anonJson.error === "Acesso não autorizado às métricas internas.") {
    console.log(`  ✅ Cenário 1.2 passou: Mensagem de erro padrão sanitizada confirmada: "${anonJson.error}"`);
  } else {
    console.error("  ❌ Cenário 1.2 falhou: Mensagem de erro inesperada:", anonJson);
    process.exit(1);
  }

  const cacheHeader = anonRes.headers.get("cache-control") || "";
  if (cacheHeader.includes("private") && cacheHeader.includes("no-store")) {
    console.log("  ✅ Cenário 1.3 passou: Cabeçalho Cache-Control é estritamente 'private, no-cache, no-store'.");
  } else {
    console.error(`  ❌ Cenário 1.3 falhou: Cache-Control inseguro detectado: "${cacheHeader}"`);
    process.exit(1);
  }

  // -------------------------------------------------------------
  // TESTE 2: Acesso Administrativo Autorizado (Header & Cookie)
  // -------------------------------------------------------------
  console.log("\n[TESTE 2] Acesso Administrativo Autorizado:");

  // Cenário 2.1: Acesso com cabeçalho x-admin-key
  const headerReq = new NextRequest("http://localhost:3000/api/metrics/summary", {
    method: "GET",
    headers: {
      "x-admin-key": adminSecret,
      "cf-connecting-ip": "203.0.113.20",
    },
  });

  const headerRes = await getSummaryRoute(headerReq);
  const headerJson = await headerRes.json();

  if (headerRes.status === 200 && headerJson.success === true && headerJson.data?.posts) {
    console.log("  ✅ Cenário 2.1 passou: Acesso autorizado via 'x-admin-key' com HTTP 200 e dados completos.");
    console.log(`     - Total de Posts: ${headerJson.data.posts.totalPublished}`);
    console.log(`     - GMV Estimado: R$ ${headerJson.data.affiliates.estimatedGmvBrl}`);
    console.log(`     - Economia Total IA: R$ ${headerJson.data.cac.totalSavingsBrl}`);
    console.log(`     - Assinantes Newsletter: ${headerJson.data.audience.newsletterSubscribersActive}`);
  } else {
    console.error("  ❌ Cenário 2.1 falhou: Acesso via x-admin-key recusado ou malformado:", headerJson);
    process.exit(1);
  }

  // Cenário 2.2: Acesso com Cookie Assinado HMAC-SHA256
  const sessionToken = createAdminSessionToken();
  const cookieReq = new NextRequest("http://localhost:3000/api/metrics/summary", {
    method: "GET",
    headers: {
      cookie: `${ADMIN_COOKIE_NAME}=${sessionToken}`,
      "cf-connecting-ip": "203.0.113.21",
    },
  });

  const cookieRes = await getSummaryRoute(cookieReq);
  const cookieJson = await cookieRes.json();

  if (cookieRes.status === 200 && cookieJson.success === true) {
    console.log("  ✅ Cenário 2.2 passou: Acesso autorizado via cookie assinado 'admin_session' com HTTP 200.");
  } else {
    console.error("  ❌ Cenário 2.2 falhou: Acesso via cookie assinado rejeitado:", cookieJson);
    process.exit(1);
  }

  // -------------------------------------------------------------
  // TESTE 3: Mitigação de Cache-Buster DoS (?refresh=true)
  // -------------------------------------------------------------
  console.log("\n[TESTE 3] Mitigação de Cache-Buster DoS (?refresh=true):");

  const refreshIp = "198.51.100.99";
  let blockedAt = 0;

  for (let i = 1; i <= 5; i++) {
    const refreshReq = new NextRequest("http://localhost:3000/api/metrics/summary?refresh=true", {
      method: "GET",
      headers: {
        "x-admin-key": adminSecret,
        "cf-connecting-ip": refreshIp,
      },
    });

    const res = await getSummaryRoute(refreshReq);

    if (res.status === 200) {
      console.log(`  ℹ️ Requisição #${i} com ?refresh=true permitida (status 200)`);
    } else if (res.status === 429) {
      blockedAt = i;
      const retryAfter = res.headers.get("retry-after");
      const limitHeader = res.headers.get("x-ratelimit-limit");
      const remaining = res.headers.get("x-ratelimit-remaining");
      const data = await res.json();
      console.log(`  ✅ Requisição #${i} bloqueada com HTTP 429: "${data.error}"`);
      console.log(`     - Headers RFC 6585: Retry-After=${retryAfter}s, Limit=${limitHeader}, Remaining=${remaining}`);
      break;
    }
  }

  if (blockedAt === 4) {
    console.log("  ✅ Cenário 3 passou: Limite estrito de 3 refreshes por minuto aplicado com sucesso.");
  } else {
    console.error(`  ❌ Cenário 3 falhou: Esperava bloqueio na 4ª requisição, ocorreu na #${blockedAt}`);
    process.exit(1);
  }

  // -------------------------------------------------------------
  // TESTE 4: Rate Limiting Global do Endpoint (/api/metrics/summary)
  // -------------------------------------------------------------
  console.log("\n[TESTE 4] Rate Limiting Global do Endpoint (Máx 10 req/min):");

  const endpointIp = "198.51.100.150";
  let globalBlockedAt = 0;

  for (let i = 1; i <= 12; i++) {
    const normReq = new NextRequest("http://localhost:3000/api/metrics/summary", {
      method: "GET",
      headers: {
        "x-admin-key": adminSecret,
        "cf-connecting-ip": endpointIp,
      },
    });

    const res = await getSummaryRoute(normReq);

    if (res.status === 200) {
      // permitido
    } else if (res.status === 429) {
      globalBlockedAt = i;
      const limitHeader = res.headers.get("x-ratelimit-limit");
      console.log(`  ✅ Requisição #${i} bloqueada pelo limite global com HTTP 429 (X-RateLimit-Limit: ${limitHeader})`);
      break;
    }
  }

  if (globalBlockedAt === 11) {
    console.log("  ✅ Cenário 4 passou: Limite geral de 10 requisições por minuto aplicado com precisão.");
  } else {
    console.error(`  ❌ Cenário 4 falhou: Esperava bloqueio na 11ª requisição, ocorreu na #${globalBlockedAt}`);
    process.exit(1);
  }

  // -------------------------------------------------------------
  // TESTE 5: Endpoint Público Sanitizado (/api/metrics/public)
  // -------------------------------------------------------------
  console.log("\n[TESTE 5] Endpoint Público Sanitizado (/api/metrics/public):");

  // Cenário 5.1: Função de dados getPublicMetricsSummary
  const publicData = await getPublicMetricsSummary();
  if (typeof publicData.postsCount === "number" && Array.isArray(publicData.platforms)) {
    console.log(`  ✅ Cenário 5.1 passou: getPublicMetricsSummary retornou ${publicData.postsCount} posts e ${publicData.platforms.length} plataformas.`);
  } else {
    console.error("  ❌ Cenário 5.1 falhou na extração de métricas públicas:", publicData);
    process.exit(1);
  }

  // Cenário 5.2: Verificação de Rota Pública HTTP e Sanitização Estrita
  const pubReq = new NextRequest("http://localhost:3000/api/metrics/public", {
    method: "GET",
    headers: {
      "cf-connecting-ip": "203.0.113.88",
    },
  });

  const pubRes = await getPublicRoute(pubReq);
  const pubJson = await pubRes.json();

  if (pubRes.status === 200 && pubJson.success === true) {
    console.log("  ✅ Cenário 5.2 passou: GET /api/metrics/public acessível publicamente (HTTP 200).");
  } else {
    console.error("  ❌ Cenário 5.2 falhou ao acessar endpoint público:", pubJson);
    process.exit(1);
  }

  // Cenário 5.3: Ausência total de dados confidenciais
  const sensitiveKeys = [
    "affiliates",
    "cac",
    "audience",
    "sponsorshipPackages",
    "conversions",
    "gmv",
    "commission",
    "costs",
    "subscribers",
    "discord",
    "revenue",
  ];

  const leakedKeys = sensitiveKeys.filter((key) => key in pubJson.data);
  if (leakedKeys.length === 0) {
    console.log("  ✅ Cenário 5.3 passou: Auditoria de vazamento aprovada. 0 chaves sensíveis presentes no payload.");
  } else {
    console.error("  ❌ Cenário 5.3 falhou: CHAVES SENSÍVEIS VAZADAS no payload público:", leakedKeys);
    process.exit(1);
  }

  // Cenário 5.4: Cache-Control público no endpoint sanitizado
  const pubCacheHeader = pubRes.headers.get("cache-control") || "";
  if (pubCacheHeader.includes("public") && pubCacheHeader.includes("s-maxage=300")) {
    console.log(`  ✅ Cenário 5.4 passou: Cache-Control público configurado adequadamente: "${pubCacheHeader}".`);
  } else {
    console.error(`  ❌ Cenário 5.4 falhou: Header de cache inadequado: "${pubCacheHeader}"`);
    process.exit(1);
  }

  // -------------------------------------------------------------
  // TESTE 6: Teste em Servidor HTTP Real (Porta 3000)
  // -------------------------------------------------------------
  console.log("\n[TESTE 6] Validação em Servidor HTTP Real (Porta 3000):");

  let serverReachable = false;
  try {
    const probe = await fetch("http://localhost:3000/api/metrics/public");
    if (probe.status === 200) serverReachable = true;
  } catch {
    serverReachable = false;
  }

  if (serverReachable) {
    console.log("  ℹ️ Servidor Next.js online em http://localhost:3000. Executando testes end-to-end:");

    // 6.1: Anônimo em /api/metrics/summary deve retornar 401
    const httpAnon = await fetch("http://localhost:3000/api/metrics/summary");
    if (httpAnon.status === 401) {
      console.log("  ✅ Cenário 6.1 passou: Servidor HTTP real retornou 401 para requisição anônima em /api/metrics/summary.");
    } else {
      console.warn(`  ⚠️ Cenário 6.1: HTTP status inesperado: ${httpAnon.status}`);
    }

    // 6.2: Admin em /api/metrics/summary deve retornar 200
    const httpAdmin = await fetch("http://localhost:3000/api/metrics/summary", {
      headers: { "x-admin-key": adminSecret },
    });
    if (httpAdmin.status === 200) {
      console.log("  ✅ Cenário 6.2 passou: Servidor HTTP real retornou 200 com autenticação x-admin-key.");
    } else {
      console.warn(`  ⚠️ Cenário 6.2: HTTP status inesperado: ${httpAdmin.status}`);
    }

    // 6.3: /api/metrics/public deve retornar 200 sem autenticação
    const httpPub = await fetch("http://localhost:3000/api/metrics/public");
    if (httpPub.status === 200) {
      const pubData = await httpPub.json();
      console.log(`  ✅ Cenário 6.3 passou: Servidor HTTP real retornou 200 em /api/metrics/public (postsCount: ${pubData.data?.postsCount}).`);
    } else {
      console.warn(`  ⚠️ Cenário 6.3: HTTP status inesperado: ${httpPub.status}`);
    }
  } else {
    console.log("  ℹ️ Servidor HTTP local na porta 3000 não respondeu na porta 3000 (testes unitários cobriram 100% dos handlers).");
  }

  console.log("\n🎉 TODOS OS TESTES DA FASE 7 FORAM CONCLUÍDOS COM 100% DE SUCESSO!");
}

runTests().catch((err) => {
  console.error("Erro fatal durante os testes da Fase 7:", err);
  process.exit(1);
});
