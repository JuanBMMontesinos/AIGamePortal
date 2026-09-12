import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import {
  generateSocialCopy,
  publishToSocialNetworks,
  SocialArticlePayload,
} from "../lib/services/social-publisher";

// ============================================================================
// DADOS MOCKADOS DE TESTE
// ============================================================================

const MOCK_OFFICIAL_ARTICLE: SocialArticlePayload = {
  title: "PlayStation anuncia novo State of Play com 40 minutos de novidades e trailers do PS5",
  slug: "playstation-anuncia-novo-state-of-play-com-novidades-ps5",
  url: "https://aigameportal.com.br/noticias/playstation-anuncia-novo-state-of-play-com-novidades-ps5",
  tldr: [
    "Transmissão ao vivo acontecerá na próxima quinta-feira às 18h no horário de Brasília com foco em títulos first-party.",
    "Mais de 15 jogos para PlayStation 5 e PS VR2 receberão datas de lançamento e atualizações de desenvolvimento.",
    "Apresentação terá duração aproximada de 40 minutos com transmissões oficiais no YouTube e Twitch.",
  ],
  category: "playstation",
  coverImageUrl: "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?q=80&w=1200&auto=format&fit=crop",
  isRumor: false,
  reliabilityScore: 5,
  platforms: ["PS5", "PSVR2"],
};

const MOCK_RUMOR_ARTICLE: SocialArticlePayload = {
  title: "Vazamento revela especificações completas e previsão de preço do aguardado Nintendo Switch 2",
  slug: "vazamento-especificacoes-nintendo-switch-2",
  url: "https://aigameportal.com.br/noticias/vazamento-especificacoes-nintendo-switch-2",
  tldr: [
    "Documentos confidenciais apontam para tela OLED de 8 polegadas com suporte a DLSS e resolução 4K no modo dock.",
    "Preço sugerido inicial seria de US$ 399, com lançamento planejado para o primeiro trimestre de 2025.",
    "Compatibilidade com cartuchos da geração atual foi citada por múltiplas fontes ligadas à cadeia de suprimentos.",
  ],
  category: "nintendo",
  coverImageUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=1200&auto=format&fit=crop",
  isRumor: true,
  reliabilityScore: 2,
  platforms: ["Switch"],
};

// ============================================================================
// EXECUÇÃO DO TESTE
// ============================================================================

async function runSocialPublisherTests() {
  const isLive = process.argv.includes("--live");

  console.log("====================================================================");
  console.log("🧪 [AIGamePortal] Teste de Distribuição em Redes Sociais");
  console.log(`🔧 Modo: ${isLive ? "🚀 DISPARO REAL (--live)" : "🔍 DRY-RUN (Apenas visualização)"}`);
  console.log("====================================================================\n");

  const testCases = [
    { name: "Caso 1: Notícia Oficial (PlayStation)", payload: MOCK_OFFICIAL_ARTICLE },
    { name: "Caso 2: Notícia Baseada em Rumor (Nintendo)", payload: MOCK_RUMOR_ARTICLE },
  ];

  for (const tc of testCases) {
    console.log(`--------------------------------------------------------------------`);
    console.log(`📌 ${tc.name}`);
    console.log(`--------------------------------------------------------------------`);

    const copy = generateSocialCopy(tc.payload);

    console.log(`\n✈️ [TELEGRAM PREVIEW - HTML]`);
    console.log(`Botão Inline: "Ler Matéria Completa 🎮" -> ${tc.payload.url}`);
    console.log(`Capa: ${tc.payload.coverImageUrl || "Sem capa"}`);
    console.log(`Legenda/Texto (${copy.telegram.length} caracteres):\n`);
    console.log(copy.telegram);

    console.log(`\n🐦 [X / TWITTER PREVIEW]`);
    const twitterLen = copy.twitter.replace(tc.payload.url, "x".repeat(23)).length;
    console.log(`Caracteres Brutos: ${copy.twitter.length} | Ponderados Twitter (t.co=23): ${twitterLen}/280`);
    if (twitterLen <= 280) {
      console.log(`✅ Cumpre o limite estrito de 280 caracteres!`);
    } else {
      console.error(`❌ ALERTA: Excedeu o limite de 280 caracteres (${twitterLen})!`);
    }
    console.log(`Texto do Tweet:\n`);
    console.log(copy.twitter);
    console.log("\n");

    if (isLive) {
      console.log(`🚀 Executando envio real para o artigo "${tc.payload.title}"...`);
      const result = await publishToSocialNetworks(tc.payload);
      console.log(`Resultado do Envio:`, JSON.stringify(result, null, 2));
    }
  }

  console.log("====================================================================");
  console.log("🏁 Testes concluídos com sucesso!");
  console.log("====================================================================\n");
}

runSocialPublisherTests().catch((err) => {
  console.error("💥 Erro durante os testes do social-publisher:", err);
  process.exit(1);
});
