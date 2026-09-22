import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import assert from "assert";
import { NextRequest } from "next/server";
import {
  getSystemLogsAdmin,
  getSystemLogsKPIsAdmin,
  resolveLogAdmin,
  purgeOldLogsAdmin,
} from "@/lib/data/logs-admin";
import { GET, PATCH, DELETE } from "@/app/api/admin/logs/route";
import { logAITask } from "@/lib/services/logger";

async function runLogsAdminTestSuite() {
  console.log("==============================================================================");
  console.log("SUÍTE DE TESTES: FASE 4 - CAMADA DE DADOS E ENDPOINT /api/admin/logs");
  console.log("==============================================================================\n");

  const adminSecret = process.env.ADMIN_SECRET_KEY || "test_admin_secret";

  // ----------------------------------------------------------------------------
  // TESTE 1: Inserção de Log Teste para Validação
  // ----------------------------------------------------------------------------
  console.log("[TESTE 1] Inserção de log sintético para teste de ciclo de vida...");
  const testLog = await logAITask({
    service: "ai_writer",
    action: "test_verification_run",
    level: "error",
    status: "failed",
    task_completed: false,
    failure_reason_code: "GEMINI_QUOTA_EXCEEDED",
    message: "Erro sintético gerado pela suíte de teste da Fase 4",
    error: new Error("Test simulation error"),
    metadata: { test_run_id: "phase_4_test", origin: "unit_test" },
  });
  console.log(`  ✅ Log de teste criado com sucesso (ID: ${testLog.id})`);
  assert(testLog.id, "ID do log sintético deve existir");
  assert.strictEqual(testLog.task_completed, false, "task_completed deve ser false");

  // ----------------------------------------------------------------------------
  // TESTE 2: Paginação Segura em getSystemLogsAdmin
  // ----------------------------------------------------------------------------
  console.log("\n[TESTE 2] Consulta paginada via getSystemLogsAdmin...");
  const pageResult = await getSystemLogsAdmin({ page: 1, limit: 5 });
  console.log(`  📄 Total de registros: ${pageResult.total} | Itens na página: ${pageResult.logs.length} | Total de páginas: ${pageResult.totalPages}`);
  assert(Array.isArray(pageResult.logs), "pageResult.logs deve ser um array");
  assert(pageResult.logs.length <= 5, "Não deve exceder o limite de 5 itens");
  assert(pageResult.total >= 1, "Total deve ser maior ou igual a 1");
  assert.strictEqual(pageResult.page, 1, "Página retornada deve ser 1");
  console.log("  ✅ Paginação validada com sucesso!");

  // ----------------------------------------------------------------------------
  // TESTE 3: Filtro Estrito incompleteOnly
  // ----------------------------------------------------------------------------
  console.log("\n[TESTE 3] Filtro estrito incompleteOnly (task_completed = false)...");
  const incompleteResult = await getSystemLogsAdmin({ incompleteOnly: true, limit: 10 });
  console.log(`  🔍 Registros incompletos encontrados: ${incompleteResult.logs.length}`);
  for (const log of incompleteResult.logs) {
    assert.strictEqual(
      log.task_completed,
      false,
      `Log ${log.id} deve ter task_completed = false`
    );
  }
  console.log("  ✅ Filtro incompleteOnly verificado com sucesso!");

  // ----------------------------------------------------------------------------
  // TESTE 4: Filtros Específicos por Serviço e Severidade
  // ----------------------------------------------------------------------------
  console.log("\n[TESTE 4] Filtros combinados por serviço e severidade...");
  const serviceResult = await getSystemLogsAdmin({
    service: "ai_writer",
    level: "error",
    limit: 10,
  });
  console.log(`  🔍 Registros encontrados para ai_writer/error: ${serviceResult.logs.length}`);
  for (const log of serviceResult.logs) {
    assert.strictEqual(log.service, "ai_writer");
    assert.strictEqual(log.level, "error");
  }
  console.log("  ✅ Filtros combinados validados!");

  // ----------------------------------------------------------------------------
  // TESTE 5: Busca Textual com Sanitização contra Injeção
  // ----------------------------------------------------------------------------
  console.log("\n[TESTE 5] Busca textual com caracteres especiais (mitigação OWASP Top 10 A03)...");
  // Teste com caracteres potencialmente maliciosos para PostgREST
  const searchResult = await getSystemLogsAdmin({
    search: "sintético,)(][\\'\"",
    limit: 10,
  });
  console.log(`  🔍 Registros encontrados para busca sanitizada: ${searchResult.logs.length}`);
  assert(
    searchResult.logs.some((l) => l.id === testLog.id),
    "A busca textual sanitizada deve encontrar o log de teste recém-criado"
  );
  console.log("  ✅ Busca textual sanitizada e imune a injeções validada!");

  // ----------------------------------------------------------------------------
  // TESTE 6: Métricas Agregadas e KPIs em Tempo Real
  // ----------------------------------------------------------------------------
  console.log("\n[TESTE 6] Obtenção de KPIs consolidados via getSystemLogsKPIsAdmin...");
  const kpis = await getSystemLogsKPIsAdmin();
  console.log(`  📊 KPIs Obtidos:`);
  console.log(`     - Total de Logs: ${kpis.totalLogs}`);
  console.log(`     - Total de Falhas: ${kpis.totalFailures}`);
  console.log(`     - Falhas 24h: ${kpis.failures24h} | Falhas 7d: ${kpis.failures7d}`);
  console.log(`     - Taxa de Sucesso: ${kpis.successRatePercentage}% | Taxa de Falha: ${kpis.failureRatePercentage}%`);
  console.log(`     - Falhas IA: Writer=${kpis.failuresByAIModule.writer}, Embedding=${kpis.failuresByAIModule.embedding}, Hub=${kpis.failuresByAIModule.hub}`);
  console.log(`     - Falhas Redes: X=${kpis.failuresBySocialNetwork.x}, Telegram=${kpis.failuresBySocialNetwork.telegram}, Discord=${kpis.failuresBySocialNetwork.discord}, Instagram=${kpis.failuresBySocialNetwork.instagram}`);
  console.log(`     - Top Causas de Falha: ${kpis.topFailureReasons.map((r) => `${r.reason}(${r.count})`).join(", ") || "Nenhuma"}`);

  assert(kpis.totalLogs >= 1, "Deve haver ao menos 1 log no banco");
  assert(typeof kpis.successRatePercentage === "number", "Taxa de sucesso deve ser numérica");
  assert(typeof kpis.failureRatePercentage === "number", "Taxa de falha deve ser numérica");
  assert(Array.isArray(kpis.topFailureReasons), "topFailureReasons deve ser array");
  assert(Array.isArray(kpis.servicesHealth), "servicesHealth deve ser array");
  console.log("  ✅ KPIs consolidados validados com sucesso!");

  // ----------------------------------------------------------------------------
  // TESTE 7: Resolução de Log Administrativo (resolveLogAdmin)
  // ----------------------------------------------------------------------------
  console.log("\n[TESTE 7] Resolução de log administrativo via resolveLogAdmin...");
  const resolveResult = await resolveLogAdmin(testLog.id, "secops_engineer");
  assert.strictEqual(resolveResult.success, true, "resolveLogAdmin deve retornar success: true");
  assert(resolveResult.log?.resolved_at, "resolved_at deve ser preenchido");
  assert.strictEqual(resolveResult.log?.resolved_by, "secops_engineer", "resolved_by deve ser secops_engineer");
  console.log(`  ✅ Log marcado como resolvido: resolved_at = ${resolveResult.log?.resolved_at}, resolved_by = ${resolveResult.log?.resolved_by}`);

  // ----------------------------------------------------------------------------
  // TESTE 8: Expurgo via RPC (purgeOldLogsAdmin)
  // ----------------------------------------------------------------------------
  console.log("\n[TESTE 8] Execução de expurgo via RPC purgeOldLogsAdmin...");
  // Teste seguro com 365 dias para não apagar logs recentes do ambiente
  const purgeResult = await purgeOldLogsAdmin(365);
  assert.strictEqual(purgeResult.success, true, "purgeOldLogsAdmin deve retornar success: true");
  assert(typeof purgeResult.deletedCount === "number", "deletedCount deve ser número");
  console.log(`  ✅ RPC executada com sucesso! Registros expurgados (>365d): ${purgeResult.deletedCount}`);

  // ----------------------------------------------------------------------------
  // TESTE 9: Simulação de Rota de API - Proteção contra Acesso Não Autorizado (OWASP A01)
  // ----------------------------------------------------------------------------
  console.log("\n[TESTE 9] Endpoint /api/admin/logs: Rejeição de requisição sem credenciais...");
  const unauthReq = new NextRequest("http://localhost:3000/api/admin/logs?page=1&limit=5", {
    method: "GET",
  });
  const unauthRes = await GET(unauthReq);
  console.log(`  🔒 Status HTTP retornado: ${unauthRes.status}`);
  assert.strictEqual(unauthRes.status, 401, "Requisição sem autenticação deve retornar HTTP 401");
  const cacheHeader = unauthRes.headers.get("cache-control");
  assert(cacheHeader?.includes("no-cache"), "Header de cache no-cache deve estar presente");
  console.log("  ✅ Blindagem contra A01 (Broken Access Control) validada!");

  // ----------------------------------------------------------------------------
  // TESTE 10: Simulação de Rota de API - GET com Header x-admin-key Válido
  // ----------------------------------------------------------------------------
  console.log("\n[TESTE 10] Endpoint /api/admin/logs: GET com autenticação válida...");
  const authGetReq = new NextRequest("http://localhost:3000/api/admin/logs?page=1&limit=5&incompleteOnly=true", {
    method: "GET",
    headers: {
      "x-admin-key": adminSecret,
    },
  });
  const authGetRes = await GET(authGetReq);
  console.log(`  🔓 Status HTTP retornado: ${authGetRes.status}`);
  assert.strictEqual(authGetRes.status, 200, "Requisição autorizada deve retornar HTTP 200");
  const getBody = await authGetRes.json();
  assert.strictEqual(getBody.success, true, "Payload deve conter success: true");
  assert(Array.isArray(getBody.logs), "Payload deve conter array logs");
  assert(getBody.kpis, "Payload deve conter objeto kpis");
  console.log(`  ✅ GET autorizado retornou ${getBody.logs.length} logs e KPIs completos!`);

  // ----------------------------------------------------------------------------
  // TESTE 11: Simulação de Rota de API - PATCH com Ação 'resolve'
  // ----------------------------------------------------------------------------
  console.log("\n[TESTE 11] Endpoint /api/admin/logs: PATCH para resolver ocorrência...");
  const patchReq = new NextRequest("http://localhost:3000/api/admin/logs", {
    method: "PATCH",
    headers: {
      "x-admin-key": adminSecret,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      logId: testLog.id,
      action: "resolve",
      resolvedBy: "api_patch_operator",
    }),
  });
  const patchRes = await PATCH(patchReq);
  console.log(`  🔓 Status HTTP retornado: ${patchRes.status}`);
  assert.strictEqual(patchRes.status, 200, "PATCH autorizado deve retornar HTTP 200");
  const patchBody = (await patchRes.json()) as any;
  assert.strictEqual(patchBody.success, true, "PATCH deve retornar success: true");
  assert.strictEqual(patchBody.log.resolved_by, "api_patch_operator", "resolved_by deve ser atualizado");
  console.log("  ✅ PATCH de resolução via API validado com sucesso!");

  // ----------------------------------------------------------------------------
  // TESTE 12: Simulação de Rota de API - DELETE para Política de Retenção
  // ----------------------------------------------------------------------------
  console.log("\n[TESTE 12] Endpoint /api/admin/logs: DELETE para política de retenção...");
  const deleteReq = new NextRequest("http://localhost:3000/api/admin/logs", {
    method: "DELETE",
    headers: {
      "x-admin-key": adminSecret,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      daysToKeep: 180,
    }),
  });
  const deleteRes = await DELETE(deleteReq);
  console.log(`  🔓 Status HTTP retornado: ${deleteRes.status}`);
  assert.strictEqual(deleteRes.status, 200, "DELETE autorizado deve retornar HTTP 200");
  const deleteBody = await deleteRes.json();
  assert.strictEqual(deleteBody.success, true, "DELETE deve retornar success: true");
  assert(typeof deleteBody.deletedCount === "number", "deletedCount deve ser retornado");
  console.log(`  ✅ DELETE via API validado com sucesso! Contagem: ${deleteBody.deletedCount}`);

  console.log("\n==============================================================================");
  console.log("🎉 TODOS OS 12 TESTES DA FASE 4 FORAM CONCLUÍDOS COM SUCESSO TOTAL!");
  console.log("==============================================================================");
}

runLogsAdminTestSuite().catch((err) => {
  console.error("\n❌ FALHA NA SUÍTE DE TESTES DA FASE 4:", err);
  process.exit(1);
});
