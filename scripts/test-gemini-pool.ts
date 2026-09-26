import {
  GeminiPool,
  maskApiKey,
  classifyGeminiError,
  GeminiAllKeysExhaustedError,
} from "../lib/services/gemini-pool";

async function runGeminiPoolTests() {
  console.log("====================================================================");
  console.log("🧪 INICIANDO TESTES UNITÁRIOS E DE INTEGRAÇÃO DO GEMINI KEY POOL");
  console.log("====================================================================\n");

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++;
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`  ❌ [FAIL] ${testName}${detail ? ` -> ${detail}` : ""}`);
    }
  }

  // TESTE 1: Mascaramento Seguro de Chaves
  console.log("📌 1. Testando Mascaramento de Chaves (maskApiKey):");
  assert(
    maskApiKey("AIzaSyA1234567890abcdef") === "AIzaSyA1...cdef",
    "Mascara chave longa mantendo prefixo e sufixo de 4 caracteres"
  );
  assert(
    maskApiKey("shortkey") === "••••••••",
    "Mascara chave curta como asteriscos de segurança"
  );
  assert(maskApiKey("") === "empty_key", "Retorna empty_key para string vazia");

  // TESTE 2: Classificação de Erros de Quota vs Segurança
  console.log("\n📌 2. Testando Classificação de Erros (classifyGeminiError):");
  const errRpm = {
    status: 429,
    message: "Resource has been exhausted (e.g. check quota). Queries per minute exceeded.",
  };
  const classRpm = classifyGeminiError(errRpm);
  assert(classRpm.isQuota === true, "Identifica erro HTTP 429 como quota");
  assert(classRpm.isDaily === false, "Identifica limite de minuto (RPM)");

  const errRpd = {
    message: "429 Quota exceeded for quota metric 'Requests per day' and limit 'Requests per day'",
  };
  const classRpd = classifyGeminiError(errRpd);
  assert(classRpd.isQuota === true, "Identifica mensagem com 429 no texto como quota");
  assert(classRpd.isDaily === true, "Identifica limite diário (RPD)");

  const errSafety = {
    message: "Response was blocked due to SAFETY policy violation.",
  };
  const classSafety = classifyGeminiError(errSafety);
  assert(classSafety.isQuota === false, "Não confunde erro de SAFETY com quota");
  assert(classSafety.isSafety === true, "Identifica erro de SAFETY");

  // TESTE 3: Inicialização do Pool e Deduplicação
  console.log("\n📌 3. Testando Inicialização do Pool e Deduplicação:");
  const testKeys = [
    "AIzaSyDummyKeyNumber1AAA",
    "AIzaSyDummyKeyNumber2BBB",
    "AIzaSyDummyKeyNumber1AAA", // Duplicata proposital
    "  AIzaSyDummyKeyNumber3CCC  ",
  ];
  const pool = new GeminiPool(testKeys, { rpmCooldownMs: 500, logKeyRotation: false });
  assert(pool.size === 3, "Deduplica chaves idênticas e remove espaços");

  const statusInit = pool.getStatus();
  assert(statusInit.totalKeys === 3, "Total de 3 chaves registradas");
  assert(statusInit.healthyKeys === 3, "Todas as 3 chaves inicializam saudáveis");

  // TESTE 4: Rotação e Failover Automático com 429
  console.log("\n📌 4. Testando Failover e Isolamento de Chave Esgotada:");
  let executionCount = 0;
  const usedKeys: string[] = [];

  // Operação simulada que falha com 429 na primeira chave tentada e sucede na segunda
  const result = await pool.execute(
    async (ai, entry) => {
      executionCount++;
      usedKeys.push(entry.maskedKey);

      if (entry.key === "AIzaSyDummyKeyNumber1AAA") {
        throw {
          status: 429,
          message: "Quota exceeded for quota metric 'Queries per minute'",
        };
      }
      return `Sucesso com ${entry.label}!`;
    },
    { contextName: "TesteFailover" }
  );

  assert(result.startsWith("Sucesso com"), "Operação completou com sucesso via failover");
  assert(executionCount === 2, "Executou 2 tentativas (falhou na 1ª, sucedeu na 2ª)");

  const statusAfter = pool.getStatus();
  assert(statusAfter.healthyKeys === 2, "1 chave colocada em cooling_down e 2 permanecem saudáveis");
  assert(statusAfter.coolingDownKeys === 1, "Exatamente 1 chave em cooldown");

  // TESTE 5: Auto-recuperação após expiração do cooldown
  console.log("\n📌 5. Testando Auto-recuperação do Cooldown:");
  console.log("  ⏳ Aguardando 600ms para expiração do cooldown de teste...");
  await new Promise((resolve) => setTimeout(resolve, 600));

  const statusRecovered = pool.getStatus();
  assert(
    statusRecovered.healthyKeys === 3,
    "Chave em cooldown se auto-recuperou e voltou a ser saudável"
  );
  assert(statusRecovered.coolingDownKeys === 0, "Nenhuma chave em cooldown após tempo expirado");

  // TESTE 6: Exaustão Total de Chaves
  console.log("\n📌 6. Testando Exceção GeminiAllKeysExhaustedError quando todas esgotam:");
  let caughtExhaustion = false;
  try {
    await pool.execute(async () => {
      throw { status: 429, message: "RESOURCE_EXHAUSTED" };
    });
  } catch (err: any) {
    if (err instanceof GeminiAllKeysExhaustedError) {
      caughtExhaustion = true;
    }
  }
  assert(
    caughtExhaustion === true,
    "Lança GeminiAllKeysExhaustedError quando todas as chaves atingem quota"
  );

  console.log("\n====================================================================");
  console.log(`📊 RESULTADO DOS TESTES: ${passedTests}/${totalTests} PASSARAM`);
  console.log("====================================================================");

  if (passedTests === totalTests) {
    console.log("🎉 TODOS OS TESTES PASSARAM COM SUCESSO!\n");
    process.exit(0);
  } else {
    console.error("❌ ALGUNS TESTES FALHARAM.\n");
    process.exit(1);
  }
}

runGeminiPoolTests().catch((err) => {
  console.error("❌ Erro fatal nos testes:", err);
  process.exit(1);
});
