import { TwitterApi } from "twitter-api-v2";
import { isValidImageUrl } from "../utils";
import { getSocialSettingsAdmin, recordSocialDispatchTelemetry } from "../data/social-admin";

// ============================================================================
// TIPAGEM & INTERFACES
// ============================================================================

export interface SocialArticlePayload {
  title: string;
  slug: string;
  url: string;
  tldr: string[] | string;
  category: string;
  coverImageUrl?: string | null;
  isRumor?: boolean;
  reliabilityScore?: number;
  platforms?: string[];
}

export interface SocialCopy {
  telegram: string;
  twitter: string;
  hook: string;
  bullets: string[];
  hashtags: string[];
}

export interface ChannelPublishResult {
  success: boolean;
  messageId?: string | number;
  tweetId?: string;
  error?: string;
  skipped?: boolean;
}

export interface SocialPublishResult {
  telegram: ChannelPublishResult;
  twitter: ChannelPublishResult;
}

// ============================================================================
// CONFIGURAÇÕES E HASHTAGS POR PLATAFORMA/CATEGORIA
// ============================================================================

const CATEGORY_HASHTAGS: Record<string, string[]> = {
  playstation: ["#PlayStation", "#PS5", "#Games", "#Gaming"],
  xbox: ["#Xbox", "#XboxSeriesX", "#GamePass", "#Games"],
  nintendo: ["#Nintendo", "#NintendoSwitch", "#Games", "#Gaming"],
  "pc-gaming": ["#PCGaming", "#Steam", "#PCGamer", "#Games"],
  geral: ["#Games", "#Gaming", "#NoticiasGames", "#Gamer"],
};

// ============================================================================
// UTILITÁRIOS DE TEXTO & SANITIZAÇÃO
// ============================================================================

/**
 * Escapa caracteres HTML para garantir compatibilidade estrita com a Telegram Bot API (parse_mode: 'HTML')
 */
export function escapeTelegramHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Normaliza e seleciona 2 bullet points ultra-resumidos a partir do TL;DR
 */
export function extractKeyBullets(tldr: string[] | string, maxBullets = 2): string[] {
  let list: string[] = [];

  if (Array.isArray(tldr)) {
    list = tldr;
  } else if (typeof tldr === "string") {
    list = tldr
      .split(/\n|•|▪|-/)
      .map((item) => item.trim())
      .filter((item) => item.length > 5);
  }

  return list
    .map((item) => item.replace(/^[•▪\-\*]\s*/, "").trim())
    .filter(Boolean)
    .slice(0, maxBullets);
}

/**
 * Seleciona 3 a 4 hashtags temáticas adequadas para a categoria e contexto do artigo
 */
export function resolveHashtags(category: string, isRumor = false, platforms: string[] = []): string[] {
  const normCategory = (category || "geral").toLowerCase().trim();
  const baseTags = [...(CATEGORY_HASHTAGS[normCategory] || CATEGORY_HASHTAGS.geral)];

  // Se houver menção explícita de plataformas nos metadados, enriquecer hashtags
  if (platforms && Array.isArray(platforms)) {
    const platformTags = platforms
      .map((p) => p.replace(/[^a-zA-Z0-9]/g, ""))
      .filter(Boolean)
      .map((p) => `#${p}`);

    for (const tag of platformTags) {
      if (!baseTags.includes(tag) && baseTags.length < 4) {
        baseTags.splice(2, 0, tag);
      }
    }
  }

  // Se for rumor, inclui #Rumor estrategicamente
  if (isRumor) {
    if (!baseTags.includes("#Rumor")) {
      baseTags.splice(1, 0, "#Rumor");
    }
  }

  return baseTags.slice(0, 4);
}

// ============================================================================
// GERADOR DE COPY DE REDES SOCIAIS (SOCIAL COPYWRITER)
// ============================================================================

/**
 * Gera copies otimizadas e engajadoras para Telegram (HTML rica) e X/Twitter (<= 280 caracteres)
 */
export function generateSocialCopy(payload: SocialArticlePayload): SocialCopy {
  const { title, tldr, category, url, isRumor = false, platforms = [] } = payload;

  const rawBullets = extractKeyBullets(tldr, 2);
  const hashtags = resolveHashtags(category, isRumor, platforms);
  const hashtagsLine = hashtags.join(" ");

  // 1. Gancho forte com emojis gamers
  const emoji = isRumor ? "🚨 [RUMOR]" : "🎮";
  const rawHook = `${emoji} ${title.trim()}`;

  // --------------------------------------------------------------------------
  // A. Formatação para Telegram (HTML rica, limite de 1024 caracteres na legenda)
  // --------------------------------------------------------------------------
  const safeHook = isRumor
    ? `🚨 <b>[RUMOR] ${escapeTelegramHtml(title.trim())}</b>`
    : `🎮 <b>${escapeTelegramHtml(title.trim())}</b>`;

  const safeBulletsTelegram = rawBullets
    .map((b) => `▪️ ${escapeTelegramHtml(b)}`)
    .join("\n");

  const telegramCopy = [
    safeHook,
    "",
    safeBulletsTelegram,
    "",
    `🔗 <a href="${url}">${url.replace(/^https?:\/\//, "")}</a>`,
    "",
    hashtagsLine,
  ]
    .filter((line) => line !== undefined)
    .join("\n");

  // --------------------------------------------------------------------------
  // B. Formatação para X (Twitter) — Limite Estrito de 280 Caracteres
  // --------------------------------------------------------------------------
  // Twitter conta URLs como 23 caracteres (t.co wrap).
  // Para máxima segurança, garantimos que tanto o comprimento bruto quanto o
  // comprimento ponderado pelo t.co fiquem dentro da margem de 280 chars.
  const twitterCopy = buildTwitterCopy({
    hook: rawHook,
    bullets: rawBullets,
    url,
    hashtagsLine,
  });

  return {
    telegram: telegramCopy,
    twitter: twitterCopy,
    hook: rawHook,
    bullets: rawBullets,
    hashtags,
  };
}

/**
 * Constrói a copy do Twitter respeitando estritamente o limite de 280 caracteres
 */
interface TwitterCopyInput {
  hook: string;
  bullets: string[];
  url: string;
  hashtagsLine: string;
}

export function buildTwitterCopy(input: TwitterCopyInput): string {
  const { hook, bullets, url, hashtagsLine } = input;
  const TCO_URL_LENGTH = 23;
  const MAX_LIMIT = 280;

  function calculateTwitterLength(text: string): number {
    // Substitui a URL pelo tamanho fixo de 23 caracteres do t.co
    const replaced = text.replace(url, "x".repeat(TCO_URL_LENGTH));
    return replaced.length;
  }

  // Tentativa 1: Hook completo + 2 bullets compactos + URL + Hashtags
  let formattedBullets = bullets.map((b) => `▪️ ${b}`).join("\n");
  let candidate = `${hook}\n\n${formattedBullets}\n\n👉 ${url}\n\n${hashtagsLine}`.trim();

  if (calculateTwitterLength(candidate) <= MAX_LIMIT) {
    return candidate;
  }

  // Tentativa 2: Encurtar cada bullet point para no máximo 60 caracteres
  const shortenedBullets = bullets
    .map((b) => (b.length > 58 ? `${b.slice(0, 55).trim()}...` : b))
    .map((b) => `▪️ ${b}`)
    .join("\n");

  candidate = `${hook}\n\n${shortenedBullets}\n\n👉 ${url}\n\n${hashtagsLine}`.trim();
  if (calculateTwitterLength(candidate) <= MAX_LIMIT) {
    return candidate;
  }

  // Tentativa 3: Manter apenas 1 bullet point
  if (bullets.length > 0) {
    const singleBullet = bullets[0].length > 70 ? `${bullets[0].slice(0, 67).trim()}...` : bullets[0];
    candidate = `${hook}\n\n▪️ ${singleBullet}\n\n👉 ${url}\n\n${hashtagsLine}`.trim();
    if (calculateTwitterLength(candidate) <= MAX_LIMIT) {
      return candidate;
    }
  }

  // Tentativa 4: Sem bullets (apenas Hook + URL + Hashtags)
  candidate = `${hook}\n\n👉 ${url}\n\n${hashtagsLine}`.trim();
  if (calculateTwitterLength(candidate) <= MAX_LIMIT) {
    return candidate;
  }

  // Tentativa 5: Truncar o gancho/título para caber com URL e Hashtags
  // Estrutura fixa: "... \n\n👉 " + 23 + "\n\n" + hashtagsLine
  const fixedLength = 4 + 4 + TCO_URL_LENGTH + 2 + hashtagsLine.length;
  const maxHookLength = Math.max(20, MAX_LIMIT - fixedLength - 4);
  const truncatedHook = `${hook.slice(0, maxHookLength).trim()}...`;

  return `${truncatedHook}\n\n👉 ${url}\n\n${hashtagsLine}`.trim();
}

// ============================================================================
// ENVIO TELEGRAM (BOT API)
// ============================================================================

/**
 * Envia publicação para canal ou grupo do Telegram com imagem e botão inline
 */
export async function sendToTelegram(
  payload: SocialArticlePayload,
  copy: string
): Promise<ChannelPublishResult> {
  const settings = await getSocialSettingsAdmin();
  if (!settings.is_telegram_enabled) {
    const reason = settings.telegram_disabled_reason || "Envio para o Telegram pausado pelo administrador no painel /admin/redes";
    console.log(`  ℹ️ [SocialPublisher:Telegram] ${reason}. Disparo pulado.`);
    await recordSocialDispatchTelemetry("telegram", "skipped", reason);
    return { success: false, skipped: true, error: reason };
  }

  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();

  if (!token || !chatId) {
    console.warn("  ℹ️ [SocialPublisher:Telegram] Credenciais não configuradas (TELEGRAM_BOT_TOKEN ou TELEGRAM_CHAT_ID ausentes). Disparo pulado.");
    await recordSocialDispatchTelemetry("telegram", "skipped", "Credenciais do Telegram ausentes");
    return { success: false, skipped: true, error: "Credenciais do Telegram ausentes" };
  }

  const replyMarkup = {
    inline_keyboard: [
      [
        {
          text: "Ler Matéria Completa 🎮",
          url: payload.url,
        },
      ],
    ],
  };

  const hasValidImage = isValidImageUrl(payload.coverImageUrl);

  // Tentativa 1: Enviar foto com legenda caso haja imagem de capa válida
  if (hasValidImage && payload.coverImageUrl) {
    try {
      const photoEndpoint = `https://api.telegram.org/bot${token}/sendPhoto`;
      const res = await fetch(photoEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          photo: payload.coverImageUrl,
          caption: copy,
          parse_mode: "HTML",
          reply_markup: replyMarkup,
        }),
        signal: AbortSignal.timeout(10000),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.ok) {
        const msgId = data.result?.message_id;
        console.log(`  ✈️ [SocialPublisher:Telegram] Foto publicada com sucesso! (Message ID: ${msgId})`);
        await recordSocialDispatchTelemetry("telegram", "success", `Foto postada com sucesso (Message ID: ${msgId})`);
        return { success: true, messageId: msgId };
      } else {
        console.warn(
          `  ⚠️ [SocialPublisher:Telegram] sendPhoto falhou (HTTP ${res.status}): ${data.description || "Erro desconhecido"}. Tentando fallback sendMessage...`
        );
      }
    } catch (photoErr: any) {
      console.warn(
        `  ⚠️ [SocialPublisher:Telegram] Erro de rede em sendPhoto: ${photoErr?.message || photoErr}. Tentando fallback sendMessage...`
      );
    }
  }

  // Tentativa 2 / Fallback: Enviar como mensagem de texto
  try {
    const textEndpoint = `https://api.telegram.org/bot${token}/sendMessage`;
    const res = await fetch(textEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: copy,
        parse_mode: "HTML",
        disable_web_page_preview: false,
        reply_markup: replyMarkup,
      }),
      signal: AbortSignal.timeout(10000),
    });

    const data = await res.json().catch(() => ({}));

    if (res.ok && data.ok) {
      const msgId = data.result?.message_id;
      console.log(`  ✈️ [SocialPublisher:Telegram] Mensagem publicada com sucesso! (Message ID: ${msgId})`);
      await recordSocialDispatchTelemetry("telegram", "success", `Mensagem postada com sucesso (Message ID: ${msgId})`);
      return { success: true, messageId: msgId };
    } else {
      const errMsg = data.description || `HTTP ${res.status}`;
      console.error(`  ❌ [SocialPublisher:Telegram] Erro ao enviar mensagem: ${errMsg}`);
      await recordSocialDispatchTelemetry("telegram", "failed", errMsg);
      return { success: false, error: errMsg };
    }
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    console.error(`  ❌ [SocialPublisher:Telegram] Exceção na requisição: ${errMsg}`);
    await recordSocialDispatchTelemetry("telegram", "failed", errMsg);
    return { success: false, error: errMsg };
  }
}

// ============================================================================
// ENVIO X (TWITTER API V2)
// ============================================================================

/**
 * Envia tweet via twitter-api-v2 com credenciais OAuth 1.0a User Context
 */
export async function sendToTwitter(
  _payload: SocialArticlePayload,
  copy: string
): Promise<ChannelPublishResult> {
  const settings = await getSocialSettingsAdmin();
  if (!settings.is_twitter_enabled) {
    const reason = settings.twitter_disabled_reason || "Envio para o X/Twitter pausado pelo administrador no painel /admin/redes";
    console.log(`  ℹ️ [SocialPublisher:Twitter] ${reason}. Disparo pulado.`);
    await recordSocialDispatchTelemetry("twitter", "skipped", reason);
    return { success: false, skipped: true, error: reason };
  }

  const appKey = process.env.TWITTER_API_KEY?.trim();
  const appSecret = process.env.TWITTER_API_SECRET?.trim();
  const accessToken = process.env.TWITTER_ACCESS_TOKEN?.trim();
  const accessSecret = process.env.TWITTER_ACCESS_SECRET?.trim();

  if (!appKey || !appSecret || !accessToken || !accessSecret) {
    console.warn("  ℹ️ [SocialPublisher:Twitter] Credenciais não configuradas (TWITTER_API_KEY/SECRET ou ACCESS_TOKEN/SECRET ausentes). Disparo pulado.");
    await recordSocialDispatchTelemetry("twitter", "skipped", "Credenciais do X/Twitter ausentes");
    return { success: false, skipped: true, error: "Credenciais do X/Twitter ausentes" };
  }

  try {
    const client = new TwitterApi({
      appKey,
      appSecret,
      accessToken,
      accessSecret,
    });

    const rwClient = client.readWrite;
    const tweet = await rwClient.v2.tweet(copy);

    if (tweet.data && tweet.data.id) {
      console.log(`  🐦 [SocialPublisher:Twitter] Tweet postado com sucesso! (Tweet ID: ${tweet.data.id})`);
      await recordSocialDispatchTelemetry("twitter", "success", `Tweet postado com sucesso (Tweet ID: ${tweet.data.id})`);
      return { success: true, tweetId: tweet.data.id };
    } else {
      console.warn("  ⚠️ [SocialPublisher:Twitter] Tweet enviado sem retorno de ID:", tweet);
      await recordSocialDispatchTelemetry("twitter", "success", "Tweet postado sem retorno de ID");
      return { success: true };
    }
  } catch (err: any) {
    let errorDetail = err?.message || String(err);
    if (err?.data?.detail) {
      errorDetail = `${errorDetail} - ${err.data.detail}`;
    }
    if (err?.code === 429 || err?.status === 429) {
      errorDetail = `Rate limit atingido (HTTP 429): ${errorDetail}`;
    } else if (
      err?.code === 402 ||
      err?.status === 402 ||
      err?.data?.detail?.includes("credits depleted") ||
      String(err).includes("credits depleted")
    ) {
      errorDetail = `Saldo de créditos esgotado no X Developer Portal (HTTP 402 - credits depleted). O X/Twitter opera no modelo pré-pago (pay-per-use) e requer a adição de saldo/créditos em https://developer.x.com (seção Billing/Credits) para liberar a criação de posts.`;
    } else if (
      err?.code === 403 ||
      err?.status === 403 ||
      err?.data?.type?.includes("oauth1-permissions") ||
      err?.data?.detail?.includes("oauth1 app permissions")
    ) {
      errorDetail = `Permissão insuficiente no X Developer Portal (HTTP 403 Forbidden). O App precisa de permissão "Read and Write" em "User authentication settings" e os tokens (TWITTER_ACCESS_TOKEN e TWITTER_ACCESS_SECRET) devem ser REGENERADOS após alterar a permissão. Detalhe: ${err?.data?.detail || errorDetail}`;
    }
    console.error(`  ❌ [SocialPublisher:Twitter] Erro ao postar tweet: ${errorDetail}`);
    await recordSocialDispatchTelemetry("twitter", "failed", errorDetail);
    return { success: false, error: errorDetail };
  }
}

// ============================================================================
// ORQUESTRADOR PRINCIPAL MULTI-CANAL
// ============================================================================

/**
 * Dispara automaticamente publicações nas redes sociais conectadas (Telegram & X/Twitter)
 * de forma 100% não-bloqueante e segura contra exceções.
 */
export async function publishToSocialNetworks(
  payload: SocialArticlePayload
): Promise<SocialPublishResult> {
  console.log(`\n📢 [SocialPublisher] Iniciando distribuição social para: "${payload.title}"`);

  // Gera as copies adaptadas para cada canal
  const copy = generateSocialCopy(payload);

  // Executa o disparo para todos os canais de forma paralela e resiliente
  const [telegramOutcome, twitterOutcome] = await Promise.allSettled([
    sendToTelegram(payload, copy.telegram),
    sendToTwitter(payload, copy.twitter),
  ]);

  const telegramResult: ChannelPublishResult =
    telegramOutcome.status === "fulfilled"
      ? telegramOutcome.value
      : { success: false, error: telegramOutcome.reason?.message || String(telegramOutcome.reason) };

  const twitterResult: ChannelPublishResult =
    twitterOutcome.status === "fulfilled"
      ? twitterOutcome.value
      : { success: false, error: twitterOutcome.reason?.message || String(twitterOutcome.reason) };

  console.log(
    `📢 [SocialPublisher] Concluído: Telegram: ${
      telegramResult.success ? "✅ OK" : telegramResult.skipped ? "⏭️ Pulado" : "❌ Falhou"
    } | X/Twitter: ${
      twitterResult.success ? "✅ OK" : twitterResult.skipped ? "⏭️ Pulado" : "❌ Falhou"
    }`
  );

  return {
    telegram: telegramResult,
    twitter: twitterResult,
  };
}
