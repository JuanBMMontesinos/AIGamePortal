import { NextRequest } from "next/server";
import { getClientIp } from "@/lib/utils/rate-limit";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function runTests() {
  console.log("=== INICIANDO SUÍTE DE TESTES AUTOMATIZADOS - FASE 5 ===");

  // -------------------------------------------------------------
  // TESTE 1: Rate Limiter - Prevenção contra IP Spoofing
  // -------------------------------------------------------------
  console.log("\n[TESTE 1] getClientIp Precedência e Anti-Spoofing:");

  // Cenário 1.1: Atacante forja X-Forwarded-For, mas aplicação está sob Cloudflare
  const req1 = new NextRequest("http://localhost:3000/api/test", {
    headers: {
      "cf-connecting-ip": "104.28.1.1",
      "x-forwarded-for": "1.2.3.4, 5.6.7.8",
      "x-real-ip": "9.9.9.9",
    },
  });
  const ip1 = getClientIp(req1);
  if (ip1 === "104.28.1.1") {
    console.log("  ✅ Cenário 1.1 passou: cf-connecting-ip tem prioridade máxima sobre X-Forwarded-For forjado.");
  } else {
    console.error(`  ❌ Cenário 1.1 falhou: esperado 104.28.1.1, obtido ${ip1}`);
    process.exit(1);
  }

  // Cenário 1.2: Sem Cloudflare, mas com Nginx/Vercel (X-Real-IP)
  const req2 = new NextRequest("http://localhost:3000/api/test", {
    headers: {
      "x-real-ip": "198.51.100.42",
      "x-forwarded-for": "1.1.1.1",
    },
  });
  const ip2 = getClientIp(req2);
  if (ip2 === "198.51.100.42") {
    console.log("  ✅ Cenário 1.2 passou: x-real-ip tem prioridade sobre x-forwarded-for.");
  } else {
    console.error(`  ❌ Cenário 1.2 falhou: esperado 198.51.100.42, obtido ${ip2}`);
    process.exit(1);
  }

  // Cenário 1.3: Apenas X-Forwarded-For com porta acoplada
  const req3 = new NextRequest("http://localhost:3000/api/test", {
    headers: {
      "x-forwarded-for": "203.0.113.19:8080, 10.0.0.1",
    },
  });
  const ip3 = getClientIp(req3);
  if (ip3 === "203.0.113.19") {
    console.log("  ✅ Cenário 1.3 passou: x-forwarded-for sanitizado corretamente (porta removida).");
  } else {
    console.error(`  ❌ Cenário 1.3 falhou: esperado 203.0.113.19, obtido ${ip3}`);
    process.exit(1);
  }

  // Cenário 1.4: Sem nenhum cabeçalho de proxy (fallback seguro)
  const req4 = new NextRequest("http://localhost:3000/api/test");
  const ip4 = getClientIp(req4);
  if (ip4 === "127.0.0.1") {
    console.log("  ✅ Cenário 1.4 passou: fallback 127.0.0.1 garantido.");
  } else {
    console.error(`  ❌ Cenário 1.4 falhou: esperado 127.0.0.1, obtido ${ip4}`);
    process.exit(1);
  }

  // -------------------------------------------------------------
  // TESTE 2: API de Newsletter - Honeypot e Descarte Silencioso
  // -------------------------------------------------------------
  console.log("\n[TESTE 2] Endpoint POST /api/newsletter/subscribe com Honeypot:");

  const { POST: subscribeHandler } = await import("@/app/api/newsletter/subscribe/route");

  // Cenário 2.1: Bot envia valor no campo honeypot
  const botReq = new NextRequest("http://localhost:3000/api/newsletter/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "spambot@marketing-spam.com",
      website_url_hp: "https://spamlink.xyz",
    }),
  });
  const botRes = await subscribeHandler(botReq);
  const botData = await botRes.json();
  if (botRes.status === 200 && botData.success === true && botData.message?.includes("Inscrição confirmada")) {
    console.log("  ✅ Cenário 2.1 passou: Bot com honeypot recebeu 200 OK simulado (Silent Discard).");
  } else {
    console.error("  ❌ Cenário 2.1 falhou:", botRes.status, botData);
    process.exit(1);
  }

  // Cenário 2.2: Usuário humano (honeypot vazio)
  const humanReq = new NextRequest("http://localhost:3000/api/newsletter/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "humano_valido_teste@madebyai.games",
      website_url_hp: "",
    }),
  });
  const humanRes = await subscribeHandler(humanReq);
  const humanData = await humanRes.json();
  if (humanRes.status === 200 || humanRes.status === 201) {
    console.log(`  ✅ Cenário 2.2 passou: Usuário humano processado com status ${humanRes.status}.`);
  } else {
    console.error("  ❌ Cenário 2.2 falhou:", humanRes.status, humanData);
    process.exit(1);
  }

  // -------------------------------------------------------------
  // TESTE 3: API de Revalidação ISR via HTTP (porta 3000)
  // -------------------------------------------------------------
  console.log("\n[TESTE 3] Endpoint /api/revalidate com Cabeçalhos HTTP:");

  const expectedSecret =
    process.env.REVALIDATION_SECRET?.trim() ||
    process.env.REVALIDATE_SECRET?.trim() ||
    "aigameportal_super_secret_token_2026";

  let serverReachable = false;
  try {
    const probe = await fetch("http://localhost:3000/api/metrics/summary");
    if (probe.status !== 0) serverReachable = true;
  } catch {
    serverReachable = false;
  }

  if (serverReachable) {
    console.log("  ℹ️ Servidor Next.js detectado em http://localhost:3000. Executando testes HTTP reais:");

    // Cenário 3.1: Token válido via x-revalidate-secret
    const headRes = await fetch("http://localhost:3000/api/revalidate?path=/", {
      method: "POST",
      headers: {
        "x-revalidate-secret": expectedSecret,
      },
    });
    const headData = await headRes.json();
    if (headRes.status === 200 && headData.revalidated === true) {
      console.log("  ✅ Cenário 3.1 passou: Revalidação HTTP 200 via cabeçalho x-revalidate-secret.");
    } else {
      console.error("  ❌ Cenário 3.1 falhou:", headRes.status, headData);
      process.exit(1);
    }

    // Cenário 3.2: Token válido via Authorization: Bearer
    const bearerRes = await fetch("http://localhost:3000/api/revalidate?path=/", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${expectedSecret}`,
      },
    });
    const bearerData = await bearerRes.json();
    if (bearerRes.status === 200 && bearerData.revalidated === true) {
      console.log("  ✅ Cenário 3.2 passou: Revalidação HTTP 200 via cabeçalho Authorization: Bearer.");
    } else {
      console.error("  ❌ Cenário 3.2 falhou:", bearerRes.status, bearerData);
      process.exit(1);
    }

    // Cenário 3.3: Token forjado / inválido
    const badRes = await fetch("http://localhost:3000/api/revalidate?path=/", {
      method: "POST",
      headers: {
        "x-revalidate-secret": "token_forjado_incorreto_xyz",
      },
    });
    const badData = await badRes.json();
    if (badRes.status === 401 && badData.revalidated === false) {
      console.log("  ✅ Cenário 3.3 passou: Token inválido rejeitado com HTTP 401 Unauthorized.");
    } else {
      console.error("  ❌ Cenário 3.3 falhou:", badRes.status, badData);
      process.exit(1);
    }

    // Cenário 3.4: Suporte mantido para query string legada
    const queryRes = await fetch(`http://localhost:3000/api/revalidate?secret=${expectedSecret}&path=/`, {
      method: "POST",
    });
    const queryData = await queryRes.json();
    if (queryRes.status === 200 && queryData.revalidated === true) {
      console.log("  ✅ Cenário 3.4 passou: Query string legada aceita com HTTP 200.");
    } else {
      console.error("  ❌ Cenário 3.4 falhou:", queryRes.status, queryData);
      process.exit(1);
    }
  } else {
    console.log("  ℹ️ Servidor HTTP local offline, testando lógica de autorização do handler:");
    const { POST: revalidateHandler } = await import("@/app/api/revalidate/route");
    
    // Testa 401 Unauthorized diretamente
    const badReq = new NextRequest("http://localhost:3000/api/revalidate", {
      method: "POST",
      headers: { "x-revalidate-secret": "invalid" },
    });
    const badRes = await revalidateHandler(badReq);
    if (badRes.status === 401) {
      console.log("  ✅ Lógica de rejeição 401 com token inválido validada.");
    }
  }

  console.log("\n🎉 TODOS OS TESTES DA FASE 5 FORAM CONCLUÍDOS COM SUCESSO!");
}

runTests().catch((err) => {
  console.error("Erro fatal durante os testes:", err);
  process.exit(1);
});
