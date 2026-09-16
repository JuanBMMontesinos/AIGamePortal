/**
 * ==============================================================================
 * PROJETO: AIGamePortal (Fase 4 - Bot de Alertas & Notificações Discord)
 * MÓDULO: Discord Notifier via Webhooks de Alta Resiliência
 * ==============================================================================
 *
 * Suporta despacho serverless/cron sem necessidade de WebSocket contínuo 24/7.
 * Trata nativamente:
 *  - Rich Embeds estilizados para Jogos Grátis e Breaking News
 *  - ActionRow com Link Buttons (style 5) e fallback inline em markdown
 *  - Rate-limiting (HTTP 429 com retry_after)
 *  - Fallback automático caso o webhook rejeite componentes interativos
 */

import { isValidImageUrl } from "../utils";

// ==============================================================================
// TIPAGEM OFICIAL DISCORD WEBHOOK API
// ==============================================================================

export interface DiscordEmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

export interface DiscordEmbedFooter {
  text: string;
  icon_url?: string;
}

export interface DiscordEmbedImage {
  url: string;
}

export interface DiscordEmbedAuthor {
  name: string;
  url?: string;
  icon_url?: string;
}

export interface DiscordEmbed {
  title?: string;
  description?: string;
  url?: string;
  color?: number;
  fields?: DiscordEmbedField[];
  author?: DiscordEmbedAuthor;
  footer?: DiscordEmbedFooter;
  image?: DiscordEmbedImage;
  thumbnail?: DiscordEmbedImage;
  timestamp?: string;
}

export interface DiscordButtonComponent {
  type: 2; // Button
  style: 5; // Link button
  label: string;
  url: string;
  emoji?: {
    name?: string;
    id?: string;
  };
}

export interface DiscordActionRowComponent {
  type: 1; // ActionRow
  components: DiscordButtonComponent[];
}

export interface DiscordWebhookPayload {
  content?: string;
  username?: string;
  avatar_url?: string;
  embeds?: DiscordEmbed[];
  components?: DiscordActionRowComponent[];
}

export interface DiscordSendResult {
  success: boolean;
  messageId?: string;
  skipped?: boolean;
  error?: string;
  rateLimited?: boolean;
}

// ==============================================================================
// INTERFACES DE DOMÍNIO
// ==============================================================================

export interface FreeGameDeal {
  id: number | string;
  title: string;
  worth?: string;
  thumbnail?: string;
  image?: string;
  description?: string;
  instructions?: string;
  open_giveaway_url: string;
  published_date?: string;
  type?: string;
  platforms?: string;
  end_date?: string;
  users?: number;
  status?: string;
  gamerpower_url?: string;
}

export interface DiscordNewsPayload {
  title: string;
  slug: string;
  url: string;
  tldr?: string[] | string;
  excerpt?: string | null;
  category?: string;
  coverImageUrl?: string | null;
  isRumor?: boolean;
  reliabilityScore?: number;
  platforms?: string[];
  sourceName?: string;
}

// ==============================================================================
// CONSTANTES VISUAIS
// ==============================================================================

const DISCORD_COLORS = {
  FREE_GAME_EMERALD: 0x10b981, // Verde esmeralda gamer (RGB: 16, 185, 129)
  BREAKING_NEWS_RED: 0xdc2626, // Vermelho alerta urgente (RGB: 220, 38, 38)
  RUMOR_AMBER: 0xf59e0b, // Âmbar de atenção para rumores (RGB: 245, 158, 11)
  BLURPLE: 0x5865f2, // Azul oficial Discord
};

const DEFAULT_AVATARS = {
  DEALS: "https://images.unsplash.com/photo-1612287233215-680459a0f0f5?q=80&w=200&auto=format&fit=crop",
  NEWS: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=200&auto=format&fit=crop",
};

// ==============================================================================
// FUNÇÕES AUXILIARES DE FORMATAÇÃO
// ==============================================================================

/**
 * Higieniza o título da oferta removendo sufixos redundantes como "Giveaway" ou "(Steam)"
 */
export function sanitizeDealTitle(title: string): string {
  if (!title) return "Jogo Gratuito";
  return title
    .replace(/\s*Giveaway\s*$/i, "")
    .replace(/\s*\((Steam|Epic Games|GOG|Ubisoft|IndieGala|Prime|Origin|EA)\)\s*$/i, "")
    .trim();
}

/**
 * Formata o valor comercial original de forma atraente
 */
export function formatDealPrice(worth?: string | null): string {
  if (!worth || worth.trim() === "N/A" || worth.trim() === "$0.00") {
    return "🔥 **100% GRÁTIS!**";
  }

  const cleanWorth = worth.trim();
  return `De ~~${cleanWorth}~~ por **GRÁTIS!** 🏷️`;
}

/**
 * Formata a data limite da oferta para o fuso brasileiro (BRT) ou retorna aviso amigável
 */
export function formatExpiryDate(endDate?: string | null): string {
  if (!endDate || endDate.trim() === "N/A") {
    return "⏳ Tempo limitado / Até esgotarem as chaves";
  }

  try {
    const parsed = new Date(endDate.replace(" ", "T"));
    if (isNaN(parsed.getTime())) {
      return "⏳ Tempo limitado";
    }

    const day = String(parsed.getDate()).padStart(2, "0");
    const month = String(parsed.getMonth() + 1).padStart(2, "0");
    const year = parsed.getFullYear();
    const hours = String(parsed.getHours()).padStart(2, "0");
    const minutes = String(parsed.getMinutes()).padStart(2, "0");

    return `📅 Até ${day}/${month}/${year} às ${hours}:${minutes} (ou até durar o estoque)`;
  } catch {
    return "⏳ Tempo limitado";
  }
}

/**
 * Normaliza a lista de marcadores do TL;DR
 */
function normalizeBullets(tldr?: string[] | string): string[] {
  if (!tldr) return [];
  if (Array.isArray(tldr)) {
    return tldr.map((b) => b.replace(/^[•▪\-\*]\s*/, "").trim()).filter(Boolean);
  }
  return tldr
    .split(/\n|•|▪|-/)
    .map((b) => b.replace(/^[•▪\-\*]\s*/, "").trim())
    .filter((b) => b.length > 5);
}

// ==============================================================================
// MOTOR DE EXECUÇÃO DE WEBHOOKS
// ==============================================================================

/**
 * Despacha um payload para um webhook do Discord com suporte a retries, rate limits e fallback
 */
export async function executeDiscordWebhook(
  webhookUrl: string | undefined,
  payload: DiscordWebhookPayload,
  options: { maxRetries?: number; timeoutMs?: number; allowComponents?: boolean } = {}
): Promise<DiscordSendResult> {
  const { maxRetries = 2, timeoutMs = 10000, allowComponents = true } = options;

  if (!webhookUrl || !webhookUrl.trim()) {
    console.warn("  ℹ️ [DiscordNotifier] Webhook URL não informada. Disparo ignorado.");
    return { success: false, skipped: true, error: "Webhook URL não configurada" };
  }

  const trimmedUrl = webhookUrl.trim();
  if (
    !trimmedUrl.startsWith("https://discord.com/api/webhooks/") &&
    !trimmedUrl.startsWith("https://discordapp.com/api/webhooks/")
  ) {
    console.warn(`  ⚠️ [DiscordNotifier] URL de webhook inválida: ${trimmedUrl.slice(0, 35)}...`);
    return { success: false, error: "Formato de Webhook URL inválido" };
  }

  // Clona payload para permitir mutação segura em caso de fallback
  const bodyPayload: DiscordWebhookPayload = { ...payload };
  if (!allowComponents) {
    delete bodyPayload.components;
  }

  // URL com query param wait=true para receber o objeto Message criado como resposta
  const targetUrl = trimmedUrl.includes("?")
    ? `${trimmedUrl}&wait=true`
    : `${trimmedUrl}?wait=true`;

  let attempt = 0;

  while (attempt <= maxRetries) {
    attempt++;

    try {
      const response = await fetch(targetUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload),
        signal: AbortSignal.timeout(timeoutMs),
      });

      // 1. Sucesso (HTTP 200 ou 204)
      if (response.ok) {
        let messageId: string | undefined;
        try {
          const data = await response.json();
          messageId = data?.id;
        } catch {
          // 204 No Content não tem body
        }
        return { success: true, messageId };
      }

      // 2. Tratamento de Rate-Limit (HTTP 429)
      if (response.status === 429) {
        const data = await response.json().catch(() => ({}));
        const retryAfterSec = Number(data?.retry_after) || 2;
        const waitMs = Math.min(Math.ceil(retryAfterSec * 1000) + 500, 10000);

        console.warn(
          `  ⏳ [DiscordNotifier] Rate-limit atingido (HTTP 429). Aguardando ${waitMs}ms antes de tentar novamente... (Tentativa ${attempt}/${maxRetries + 1})`
        );

        if (attempt <= maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, waitMs));
          continue;
        }

        return {
          success: false,
          rateLimited: true,
          error: `Discord rate-limit excedido após retries (retry_after: ${retryAfterSec}s)`,
        };
      }

      // 3. Fallback para erro 400 em componentes
      // Se a requisição falhar com 400 e tiver components, tenta novamente sem os componentes
      if (response.status === 400 && bodyPayload.components && bodyPayload.components.length > 0) {
        console.warn(
          "  ⚠️ [DiscordNotifier] Discord rejeitou 'components' no webhook (HTTP 400). Tentando fallback apenas com Embeds..."
        );
        delete bodyPayload.components;
        continue;
      }

      // 4. Outros erros HTTP
      const errText = await response.text().catch(() => "");
      console.error(
        `  ❌ [DiscordNotifier] Erro HTTP ${response.status} ao disparar webhook: ${errText.slice(0, 200)}`
      );
      return { success: false, error: `HTTP ${response.status}: ${errText.slice(0, 100)}` };
    } catch (err: any) {
      console.error(
        `  ❌ [DiscordNotifier] Falha de conexão ao enviar webhook (Tentativa ${attempt}): ${err?.message || err}`
      );

      if (attempt <= maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 1500 * attempt));
        continue;
      }

      return { success: false, error: err?.message || String(err) };
    }
  }

  return { success: false, error: "Número máximo de tentativas de reenvio excedido" };
}

// ==============================================================================
// DISPARADOR: ALERTAS DE JOGOS GRÁTIS
// ==============================================================================

/**
 * Envia um alerta estilizado de jogo gratuito para o canal do Discord
 */
export async function sendDiscordFreeGameAlert(
  deal: FreeGameDeal,
  customWebhookUrl?: string
): Promise<DiscordSendResult> {
  const webhookUrl = customWebhookUrl || process.env.DISCORD_WEBHOOK_FREE_GAMES;
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://aigameportal.com").replace(/\/+$/, "");

  const cleanTitle = sanitizeDealTitle(deal.title);
  const formattedPrice = formatDealPrice(deal.worth);
  const formattedExpiry = formatExpiryDate(deal.end_date);
  const platform = deal.platforms || "PC / Multiplataforma";
  const portalDealsUrl = `${siteUrl}/jogos`;
  const highResImage = deal.image || deal.thumbnail;

  console.log(`\n🎁 [DiscordNotifier] Preparando alerta de Jogo Grátis: "${cleanTitle}"`);

  // Monta campos ricos do Embed
  const fields: DiscordEmbedField[] = [
    {
      name: "🎮 Plataforma",
      value: `**${platform}**`,
      inline: true,
    },
    {
      name: "💰 Preço Original",
      value: formattedPrice,
      inline: true,
    },
    {
      name: "⏰ Resgate Até",
      value: formattedExpiry,
      inline: false,
    },
  ];

  // Descrição persuasiva com links markdown nativos de fallback
  const description = [
    deal.description ? `> *${deal.description.slice(0, 250).trim()}...*` : "",
    "",
    `🎁 **[Clique aqui para resgatar na loja oficial](${deal.open_giveaway_url})**`,
    `🌐 **[Confira mais ofertas no AIGamePortal](${portalDealsUrl})**`,
  ]
    .filter(Boolean)
    .join("\n");

  // Rich Embed Principal
  const embed: DiscordEmbed = {
    title: `🚨 JOGO GRÁTIS: ${cleanTitle}`,
    url: deal.open_giveaway_url,
    description: description,
    color: DISCORD_COLORS.FREE_GAME_EMERALD,
    fields: fields,
    footer: {
      text: "AIGamePortal • Alertas Automáticos de Jogos Grátis",
      icon_url: DEFAULT_AVATARS.DEALS,
    },
    timestamp: new Date().toISOString(),
  };

  if (isValidImageUrl(highResImage)) {
    embed.image = { url: highResImage! };
  }

  // Componentes interativos: ActionRow com Link Buttons
  const components: DiscordActionRowComponent[] = [
    {
      type: 1,
      components: [
        {
          type: 2,
          style: 5,
          label: "Resgatar na Loja 🎁",
          url: deal.open_giveaway_url,
        },
        {
          type: 2,
          style: 5,
          label: "Ver no AIGamePortal 🌐",
          url: portalDealsUrl,
        },
      ],
    },
  ];

  const payload: DiscordWebhookPayload = {
    username: "AIGamePortal Deals Bot",
    avatar_url: DEFAULT_AVATARS.DEALS,
    embeds: [embed],
    components: components,
  };

  const result = await executeDiscordWebhook(webhookUrl, payload);

  if (result.success) {
    console.log(`  ✅ [DiscordNotifier] Alerta de "${cleanTitle}" postado com sucesso no Discord!`);
  } else if (result.skipped) {
    console.log(`  ⏭️ [DiscordNotifier] Alerta de "${cleanTitle}" ignorado (Webhook não configurado).`);
  } else {
    console.error(`  ❌ [DiscordNotifier] Falha ao postar alerta de "${cleanTitle}": ${result.error}`);
  }

  return result;
}

// ==============================================================================
// DISPARADOR: BREAKING NEWS (NOTÍCIAS URGENTES IMPACTO 5/5)
// ==============================================================================

/**
 * Envia um alerta de Breaking News para o canal de notícias prioritárias do Discord
 */
export async function sendDiscordNewsAlert(
  post: DiscordNewsPayload,
  customWebhookUrl?: string
): Promise<DiscordSendResult> {
  const webhookUrl = customWebhookUrl || process.env.DISCORD_WEBHOOK_NEWS;
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://aigameportal.com").replace(/\/+$/, "");

  const fullPostUrl = post.url.startsWith("http")
    ? post.url
    : `${siteUrl}/noticias/${post.slug}`;

  console.log(`\n🚨 [DiscordNotifier] Preparando alerta de Breaking News: "${post.title}"`);

  const bullets = normalizeBullets(post.tldr);
  const bulletsText = bullets.length > 0
    ? bullets.map((b) => `▪️ ${b}`).join("\n")
    : post.excerpt || "Confira todos os detalhes completos desta revelação na matéria.";

  const prefix = post.isRumor ? "🚨 [RUMOR BOMBA]" : "🔥 [BREAKING NEWS]";
  const embedColor = post.isRumor ? DISCORD_COLORS.RUMOR_AMBER : DISCORD_COLORS.BREAKING_NEWS_RED;

  const fields: DiscordEmbedField[] = [];

  if (post.category) {
    fields.push({
      name: "🏷️ Categoria",
      value: `**${post.category}**`,
      inline: true,
    });
  }

  if (post.platforms && post.platforms.length > 0) {
    fields.push({
      name: "🎮 Plataformas",
      value: post.platforms.join(", "),
      inline: true,
    });
  }

  if (post.reliabilityScore) {
    fields.push({
      name: "🛡️ Confiabilidade da Fonte",
      value: `${"⭐".repeat(Math.min(5, Math.max(1, post.reliabilityScore)))} (${post.reliabilityScore}/5)`,
      inline: true,
    });
  }

  const description = [
    `**${post.title}**`,
    "",
    bulletsText,
    "",
    `🔗 **[Clique aqui para ler a matéria completa com exclusividade no AIGamePortal](${fullPostUrl})**`,
  ].join("\n");

  const embed: DiscordEmbed = {
    title: `${prefix} ${post.title.slice(0, 180)}`,
    url: fullPostUrl,
    description: description,
    color: embedColor,
    fields: fields.length > 0 ? fields : undefined,
    footer: {
      text: "AIGamePortal • Jornalismo Gamer em Tempo Real",
      icon_url: DEFAULT_AVATARS.NEWS,
    },
    timestamp: new Date().toISOString(),
  };

  if (isValidImageUrl(post.coverImageUrl)) {
    embed.image = { url: post.coverImageUrl! };
  }

  const components: DiscordActionRowComponent[] = [
    {
      type: 1,
      components: [
        {
          type: 2,
          style: 5,
          label: "Ler Matéria Completa 🎮",
          url: fullPostUrl,
        },
      ],
    },
  ];

  const payload: DiscordWebhookPayload = {
    username: "AIGamePortal Plantão Gamer",
    avatar_url: DEFAULT_AVATARS.NEWS,
    embeds: [embed],
    components: components,
  };

  const result = await executeDiscordWebhook(webhookUrl, payload);

  if (result.success) {
    console.log(`  ✅ [DiscordNotifier] Notícia urgente enviada ao Discord com sucesso!`);
  } else if (result.skipped) {
    console.log(`  ⏭️ [DiscordNotifier] Notícia urgente ignorada (DISCORD_WEBHOOK_NEWS não configurado).`);
  } else {
    console.error(`  ❌ [DiscordNotifier] Falha ao enviar notícia urgente ao Discord: ${result.error}`);
  }

  return result;
}
