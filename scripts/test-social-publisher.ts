import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { TwitterApi } from "twitter-api-v2";
import { generateSocialCopy, publishToSocialNetworks, SocialArticlePayload } from "../lib/services/social-publisher";

const isTelegramOnly = process.argv.includes("--telegram");
const isFindId = process.argv.includes("--find-id");
const isLive = process.argv.includes("--live");

async function checkTelegramUpdates() {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!token) {
    console.error("❌ TELEGRAM_BOT_TOKEN não encontrado no .env.local");
    return;
  }
  console.log("🔍 Consultando mensagens recentes enviadas para o bot...");
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates`);
    const data = await res.json();
    if (!data.ok) {
      console.error("❌ Erro da API do Telegram:", data.description);
      return;
    }

    const updates = data.result || [];
    if (updates.length === 0) {
      console.log("\n⚠️ Nenhuma mensagem encontrada ainda!");
      console.log("👉 Faça o seguinte no Telegram:");
      console.log("   1. Abra o Telegram e procure pelo seu bot: @aigameportalbot");
      console.log("   2. Clique em Iniciar (ou envie qualquer mensagem, como 'olá')");
      console.log("   3. Rode novamente este comando: npx tsx scripts/test-social-publisher.ts --find-id");
      return;
    }

    console.log(`\n🎉 Foram encontradas ${updates.length} interação(ões) recentes:\n`);
    const seenChats = new Set<string>();

    for (const u of updates) {
      const msg = u.message || u.channel_post || u.my_chat_member;
      const chat = msg?.chat;
      if (chat && !seenChats.has(String(chat.id))) {
        seenChats.add(String(chat.id));
        console.log("------------------------------------------------------------");
        console.log(`📌 Tipo: ${chat.type.toUpperCase()}`);
        console.log(`👤 Nome: ${chat.first_name || chat.title || "N/A"} ${chat.last_name || ""}`);
        if (chat.username) console.log(`🔗 Username: @${chat.username}`);
        console.log(`🆔 SEU TELEGRAM_CHAT_ID: ${chat.id}`);
        console.log("------------------------------------------------------------");
        console.log(`Copie e cole no seu .env.local:`);
        console.log(`TELEGRAM_CHAT_ID=${chat.id}\n`);
      }
    }
  } catch (err: any) {
    console.error("❌ Erro ao conectar ao Telegram:", err?.message || err);
  }
}

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

import { createClient } from "@supabase/supabase-js";

async function getArticlePayload(): Promise<SocialArticlePayload> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://aigameportal.vercel.app").replace(/\/+$/, "");

  if (supabaseUrl && supabaseKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data } = await supabase
        .from("posts")
        .select("title, slug, tldr, cover_image_url, is_rumor, reliability_score, game_metadata")
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data && data.slug) {
        console.log(`📰 Usando artigo REAL do seu banco: "${data.title}"`);
        return {
          title: data.title,
          slug: data.slug,
          url: `${siteUrl}/noticias/${data.slug}`,
          tldr: data.tldr || [],
          category: "geral",
          coverImageUrl: data.cover_image_url,
          isRumor: data.is_rumor,
          reliabilityScore: data.reliability_score,
          platforms: data.game_metadata?.platforms,
        };
      }
    } catch (e) {
      // fallback
    }
  }

  console.log("ℹ️ Usando artigo fictício (mock) para testes.");
  return mockPayload;
}

async function run() {
  console.log("====================================================================");
  console.log("🧪 [Teste Social Publisher] Verificação de Configurações");
  console.log("====================================================================");

  if (isFindId) {
    await checkTelegramUpdates();
    return;
  }

  const payload = await getArticlePayload();

  if (isTelegramOnly) {
    console.log("\n🚀 Testando ENVIO REAL para o Telegram...");
    const copy = generateSocialCopy(payload);
    const { sendToTelegram } = await import("../lib/services/social-publisher");
    const result = await sendToTelegram(payload, copy.telegram);
    console.log("\nResultado Telegram:", JSON.stringify(result, null, 2));
    return;
  }

  console.log("\n1. Verificando Variáveis de Ambiente:");
  console.log(`   - TELEGRAM_BOT_TOKEN: ${process.env.TELEGRAM_BOT_TOKEN ? "✅ Configurado" : "❌ Ausente"}`);
  console.log(`   - TELEGRAM_CHAT_ID: ${process.env.TELEGRAM_CHAT_ID ? "✅ Configurado" : "❌ Ausente"}`);
  console.log(`   - TWITTER_API_KEY: ${process.env.TWITTER_API_KEY ? "✅ Configurado" : "❌ Ausente"}`);
  console.log(`   - TWITTER_API_SECRET: ${process.env.TWITTER_API_SECRET ? "✅ Configurado" : "❌ Ausente"}`);
  console.log(`   - TWITTER_ACCESS_TOKEN: ${process.env.TWITTER_ACCESS_TOKEN ? "✅ Configurado" : "❌ Ausente"}`);
  console.log(`   - TWITTER_ACCESS_SECRET: ${process.env.TWITTER_ACCESS_SECRET ? "✅ Configurado" : "❌ Ausente"}`);

  console.log("\n2. Teste de Formatação de Cópias (Preview):");
  const copies = generateSocialCopy(payload);
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

    // Testar autenticação do Telegram Bot API
    if (process.env.TELEGRAM_BOT_TOKEN) {
      console.log("\n🔍 Testando credenciais do Telegram Bot...");
      try {
        const token = process.env.TELEGRAM_BOT_TOKEN.trim();
        const getMeRes = await fetch(`https://api.telegram.org/bot${token}/getMe`);
        const getMeData = await getMeRes.json();
        if (getMeData.ok) {
          console.log(`   ✅ Bot autenticado: @${getMeData.result.username} (${getMeData.result.first_name})`);
        } else {
          console.error(`   ❌ Token do Telegram inválido: ${getMeData.description}`);
        }

        const chatId = process.env.TELEGRAM_CHAT_ID?.trim();
        if (chatId) {
          console.log(`🔍 Testando acesso ao Chat/Canal: "${chatId}"...`);
          const getChatRes = await fetch(`https://api.telegram.org/bot${token}/getChat?chat_id=${encodeURIComponent(chatId)}`);
          const getChatData = await getChatRes.json();
          if (getChatData.ok) {
            console.log(`   ✅ Chat/Canal encontrado: "${getChatData.result.title || getChatData.result.username}" (Tipo: ${getChatData.result.type})`);
          } else {
            console.error(`   ❌ Falha ao acessar chat "${chatId}": ${getChatData.description}`);
            console.error(`      💡 Dica: Se for um canal ou grupo, certifique-se de que o bot foi adicionado como ADMINISTRADOR.`);
          }
        }
      } catch (tgErr: any) {
        console.error(`   ❌ Erro de conexão com Telegram:`, tgErr?.message || tgErr);
      }
    }

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
        console.log(`   💡 Dica: O teste acima valida a autenticação e permissão de LEITURA (Read).`);
        console.log(`      Para que os posts sejam publicados sem erro 403, o App no X Developer Portal deve estar`);
        console.log(`      configurado como "Read and Write" em User Authentication Settings e os tokens de acesso`);
        console.log(`      (TWITTER_ACCESS_TOKEN e TWITTER_ACCESS_SECRET) devem ter sido REGENERADOS após essa alteração.`);
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
  const result = await publishToSocialNetworks(payload);
  console.log("\nResultado final:", JSON.stringify(result, null, 2));
}

run().catch((e) => {
  console.error("Erro no script de teste:", e);
  process.exit(1);
});
