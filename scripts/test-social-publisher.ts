import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { TwitterApi } from "twitter-api-v2";
import { generateSocialCopy, publishToSocialNetworks, SocialArticlePayload } from "../lib/services/social-publisher";

const isLive = process.argv.includes("--live");

const mockPayload: SocialArticlePayload = {
  title: "PlayStation anuncia novo State of Play com grandes novidades para 2026",
  slug: "playstation-anuncia-novo-state-of-play-2026",
  url: "https://aigameportal.vercel.app/noticias/playstation-anuncia-novo-state-of-play-2026",
  tldr: [
    "Sony confirma transmissão especial focada nos próximos lançamentos de PS5.",
    "Expectativa de novidades sobre jogos exclusivos e atualizações de estúdios parceiros.",
    "Evento será transmitido ao vivo nos canais oficiais da PlayStation."
  ],
  category: "playstation",
  coverImageUrl: "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=1200&q=80",
  isRumor: false,
  reliabilityScore: 95,
  platforms: ["PS5"],
};

async function run() {
  console.log("====================================================================");
  console.log("🧪 [Teste Social Publisher] Verificação de Configurações");
  console.log("====================================================================");

  console.log("\n1. Verificando Variáveis de Ambiente:");
  console.log(`   - TELEGRAM_BOT_TOKEN: ${process.env.TELEGRAM_BOT_TOKEN ? "✅ Configurado" : "❌ Ausente"}`);
  console.log(`   - TELEGRAM_CHAT_ID: ${process.env.TELEGRAM_CHAT_ID ? "✅ Configurado" : "❌ Ausente"}`);
  console.log(`   - TWITTER_API_KEY: ${process.env.TWITTER_API_KEY ? "✅ Configurado" : "❌ Ausente"}`);
  console.log(`   - TWITTER_API_SECRET: ${process.env.TWITTER_API_SECRET ? "✅ Configurado" : "❌ Ausente"}`);
  console.log(`   - TWITTER_ACCESS_TOKEN: ${process.env.TWITTER_ACCESS_TOKEN ? "✅ Configurado" : "❌ Ausente"}`);
  console.log(`   - TWITTER_ACCESS_SECRET: ${process.env.TWITTER_ACCESS_SECRET ? "✅ Configurado" : "❌ Ausente"}`);

  console.log("\n2. Teste de Formatação de Cópias (Preview):");
  const copies = generateSocialCopy(mockPayload);
  console.log("\n--- [X / Twitter Copy] ---");
  console.log(copies.twitter);
  console.log(`Caracteres: ${copies.twitter.length}/280`);

  console.log("\n--- [Telegram Copy] ---");
  console.log(copies.telegram);

  if (!isLive) {
    console.log("\n====================================================================");
    console.log("ℹ️ Modo DRY-RUN concluído! Nenhum post real foi enviado.");
    console.log("👉 Para testar a publicação real agora, execute:");
    console.log("   npx tsx scripts/test-social-publisher.ts --live");
    console.log("====================================================================");

    // Testar autenticação da API do Twitter sem postar
    if (process.env.TWITTER_API_KEY && process.env.TWITTER_ACCESS_TOKEN) {
      console.log("\n🔍 Testando autenticação de leitura com as credenciais do X...");
      try {
        const client = new TwitterApi({
          appKey: process.env.TWITTER_API_KEY.trim(),
          appSecret: process.env.TWITTER_API_SECRET?.trim() || "",
          accessToken: process.env.TWITTER_ACCESS_TOKEN.trim(),
          accessSecret: process.env.TWITTER_ACCESS_SECRET?.trim() || "",
        });
        const me = await client.v2.me();
        console.log(`   ✅ Autenticação no X realizada com sucesso!`);
        console.log(`      Usuário: @${me.data.username} (Nome: ${me.data.name}, ID: ${me.data.id})`);
      } catch (err: any) {
        console.error(`   ❌ Falha na autenticação do X:`, err?.message || err);
        if (err?.data) {
          console.error(`      Detalhes da API do X:`, JSON.stringify(err.data, null, 2));
        }
      }
    }
    return;
  }

  console.log("\n🚀 Executando publicação REAL em modo --live...");
  const result = await publishToSocialNetworks(mockPayload);
  console.log("\nResultado final:", JSON.stringify(result, null, 2));
}

run().catch((e) => {
  console.error("Erro no script de teste:", e);
  process.exit(1);
});
