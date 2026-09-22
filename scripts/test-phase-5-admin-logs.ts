import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import assert from "assert";

async function verifyPhase5() {
  console.log("==============================================================================");
  console.log("SUÍTE DE VERIFICAÇÃO VISUAL & ROTAS: FASE 5 - CENTRAL DE LOGS (/admin/logs)");
  console.log("==============================================================================\n");

  const baseUrl = "http://localhost:3000";
  const adminSecret = process.env.ADMIN_SECRET_KEY || "test_admin_secret";

  // 1. Acesso Deslogado ao /admin/logs -> Deve renderizar formulário de login gamer
  console.log("[TESTE 1] Verificando acesso deslogado em /admin/logs...");
  const unauthRes = await fetch(`${baseUrl}/admin/logs`);
  assert.strictEqual(unauthRes.status, 200, "Deve retornar HTTP 200 para renderizar o login-form");
  const unauthHtml = await unauthRes.text();
  assert(unauthHtml.includes("Central de Logs &amp; IA") || unauthHtml.includes("Central de Logs & IA"), "Deve conter o título Central de Logs");
  assert(unauthHtml.includes("Área Restrita DevSecOps"), "Deve conter badge Área Restrita DevSecOps");
  console.log("  ✅ Formulário de login gamer em /admin/logs renderizado com sucesso!");

  // 2. Autenticação Administrativa
  console.log("\n[TESTE 2] Efetuando autenticação via POST /api/admin/auth...");
  const authRes = await fetch(`${baseUrl}/api/admin/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ secretKey: adminSecret }),
  });
  assert.strictEqual(authRes.status, 200, "POST /api/admin/auth deve responder 200");
  const authJson = await authRes.json();
  assert.strictEqual(authJson.success, true, "Autenticação deve ser true");
  const setCookie = authRes.headers.get("set-cookie");
  assert(setCookie, "Cookie de sessão deve estar presente no header");
  console.log("  ✅ Sessão de administrador obtida com sucesso!");

  // 3. Acesso Autenticado ao /admin/logs -> Deve renderizar a Central de Logs Completa
  console.log("\n[TESTE 3] Verificando acesso autenticado em /admin/logs...");
  const authPageRes = await fetch(`${baseUrl}/admin/logs`, {
    headers: {
      Cookie: setCookie.split(";")[0],
    },
  });
  assert.strictEqual(authPageRes.status, 200, "Deve retornar HTTP 200 autenticado");
  const authHtml = await authPageRes.text();
  assert(authHtml.includes("Auditoria &amp; Observabilidade de IA") || authHtml.includes("Auditoria & Observabilidade de IA"), "Deve conter o cabeçalho de auditoria");
  assert(authHtml.includes("Tarefas Incompletas"), "Deve conter o card de Tarefas Incompletas");
  assert(authHtml.includes("Todas as Falhas"), "Deve conter as abas de filtro");
  console.log("  ✅ Painel completo de logs e auditoria renderizado com sucesso no servidor!");

  // 4. Verificação de Links nos outros 5 Painéis Administrativos
  console.log("\n[TESTE 4] Verificando a presença do 6º link (/admin/logs) nos 5 painéis...");
  const panels = [
    { name: "Métricas B2B", path: "/admin/metricas" },
    { name: "Afiliados", path: "/admin/afiliados" },
    { name: "Newsletter", path: "/admin/newsletter" },
    { name: "Discord", path: "/admin/discord" },
    { name: "Redes Sociais", path: "/admin/redes" },
  ];

  for (const panel of panels) {
    const res = await fetch(`${baseUrl}${panel.path}`, {
      headers: { Cookie: setCookie.split(";")[0] },
    });
    const html = await res.text();
    assert(html.includes("/admin/logs"), `Painel ${panel.name} (${panel.path}) deve conter link para /admin/logs`);
    console.log(`  ✅ Link /admin/logs verificado no painel ${panel.name}!`);
  }

  console.log("\n==============================================================================");
  console.log("🎉 TODOS OS TESTES DA FASE 5 FORAM CONCLUÍDOS COM SUCESSO TOTAL!");
  console.log("==============================================================================");
}

verifyPhase5().catch((err) => {
  console.error("\n❌ ERRO NA VERIFICAÇÃO DA FASE 5:", err);
  process.exit(1);
});
