import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

// Fallback universal de WebSocket para ambientes Node.js sem WebSocket nativo
if (typeof (globalThis as any).WebSocket === "undefined") {
  (globalThis as any).WebSocket = class DummyWebSocket {
    static readonly CONNECTING = 0;
    static readonly OPEN = 1;
    static readonly CLOSING = 2;
    static readonly CLOSED = 3;
    addEventListener() {}
    removeEventListener() {}
    close() {}
    send() {}
  };
}

import Parser from "rss-parser";
import { extract } from "@extractus/article-extractor";
import * as cheerio from "cheerio";
import { GoogleGenAI, Type } from "@google/genai";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Category, GameMetadata, Post, Source } from "../types/database";
import { publishToSocialNetworks } from "../lib/services/social-publisher";
import { matchOrSuggestGameHub } from "../lib/services/hub-matcher";
import { sendDiscordNewsAlert } from "../lib/services/discord-notifier";
import { enrichGameMetadata } from "../lib/services/game-enricher";

// ============================================================================
// CONFIGURAÇÕES & FONTES OFICIAIS
// ============================================================================

interface FeedConfig {
  name: string;
  url: string;
  websiteUrl: string;
  defaultCategorySlug: string;
  isCommunityOrRumor?: boolean;
}

const OFFICIAL_FEEDS: FeedConfig[] = [
  // 1. Fontes Primárias & Plataformas Oficiais (Item 2)
  {
    name: "PlayStation Blog",
    url: "https://blog.playstation.com/feed/",
    websiteUrl: "https://blog.playstation.com",
    defaultCategorySlug: "playstation",
  },
  {
    name: "Xbox Wire",
    url: "https://news.xbox.com/en-us/feed/",
    websiteUrl: "https://news.xbox.com",
    defaultCategorySlug: "xbox",
  },
  {
    name: "Nintendo Everything",
    url: "https://nintendoeverything.com/feed/",
    websiteUrl: "https://nintendoeverything.com",
    defaultCategorySlug: "nintendo",
  },
  {
    name: "Steam News",
    url: "https://store.steampowered.com/feeds/news.xml",
    websiteUrl: "https://store.steampowered.com",
    defaultCategorySlug: "pc-gaming",
  },
  {
    name: "Games Press",
    url: "https://www.gamespress.com/feed",
    websiteUrl: "https://www.gamespress.com",
    defaultCategorySlug: "industria",
  },

  // 2. Jornalismo Especializado Internacional (Item 1)
  {
    name: "VGC (Video Games Chronicle)",
    url: "https://www.videogameschronicle.com/feed/",
    websiteUrl: "https://www.videogameschronicle.com",
    defaultCategorySlug: "industria",
  },
  {
    name: "Eurogamer",
    url: "https://www.eurogamer.net/feed",
    websiteUrl: "https://www.eurogamer.net",
    defaultCategorySlug: "geral",
  },
  {
    name: "Gematsu",
    url: "https://www.gematsu.com/feed",
    websiteUrl: "https://www.gematsu.com",
    defaultCategorySlug: "geral",
  },
  {
    name: "PC Gamer",
    url: "https://www.pcgamer.com/rss/",
    websiteUrl: "https://www.pcgamer.com",
    defaultCategorySlug: "pc-gaming",
  },
  {
    name: "Rock Paper Shotgun",
    url: "https://www.rockpapershotgun.com/feed",
    websiteUrl: "https://www.rockpapershotgun.com",
    defaultCategorySlug: "pc-gaming",
  },
  {
    name: "Destructoid",
    url: "https://www.destructoid.com/feed/",
    websiteUrl: "https://www.destructoid.com",
    defaultCategorySlug: "geral",
  },
  {
    name: "IGN Games",
    url: "https://feeds.feedburner.com/ign/all",
    websiteUrl: "https://www.ign.com",
    defaultCategorySlug: "geral",
  },
  {
    name: "GamesIndustry.biz",
    url: "https://www.gamesindustry.biz/feed",
    websiteUrl: "https://www.gamesindustry.biz",
    defaultCategorySlug: "industria",
  },

  // 3. Comunidades Auditadas & Fóruns Moderados (Item 4)
  {
    name: "r/Games",
    url: "https://www.reddit.com/r/Games/.rss",
    websiteUrl: "https://www.reddit.com/r/Games",
    defaultCategorySlug: "geral",
    isCommunityOrRumor: true,
  },
  {
    name: "r/GamingLeaksAndRumours",
    url: "https://www.reddit.com/r/GamingLeaksAndRumours/.rss",
    websiteUrl: "https://www.reddit.com/r/GamingLeaksAndRumours",
    defaultCategorySlug: "geral",
    isCommunityOrRumor: true,
  },
];

// Limite de itens por feed em cada execução (para respeitar limites de tempo e quota de IA)
const MAX_ITEMS_PER_FEED = Number(process.env.MAX_ITEMS_PER_FEED) || 3;
const SIMILARITY_THRESHOLD = 0.82;
const LOOKBACK_HOURS = 48;

// Fallback de imagens gamer de alta qualidade categorizadas por plataforma/assunto
const FALLBACK_COVERS_BY_CATEGORY: Record<string, string[]> = {
  playstation: [
    "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?q=80&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1200&auto=format&fit=crop",
  ],
  xbox: [
    "https://images.unsplash.com/photo-1621259182978-fbf93132d53d?q=80&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1605901309584-818e25960a8f?q=80&w=1200&auto=format&fit=crop",
  ],
  nintendo: [
    "https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1563089145-599997674d42?q=80&w=1200&auto=format&fit=crop",
  ],
  "pc-gaming": [
    "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?q=80&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1200&auto=format&fit=crop",
  ],
  hardware: [
    "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?q=80&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?q=80&w=1200&auto=format&fit=crop",
  ],
  industria: [
    "https://images.unsplash.com/photo-1551836022-d5d88e9218df?q=80&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1200&auto=format&fit=crop",
  ],
  geral: [
    "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=1200&auto=format&fit=crop",
  ],
};

// ============================================================================
// SYSTEM PROMPT & DIRETRIZES EDITORIAIS (GEMINI 1.5 FLASH)
// ============================================================================

const SYSTEM_INSTRUCTION = `Você é o Agente Redator Sênior & Especialista em SEO do portal "Made By AI Games".
Sua missão é atuar como um jornalista gamer profissional de elite, transformando textos raspados de notícias de videogames (em inglês ou português) em artigos jornalísticos completos, 100% originais, aprofundados, atraentes para a comunidade gamer e otimizados para mecanismos de busca (Google Discover e Google Search).

======================================================================
1. PILARES EDITORIAIS & PROTEÇÃO CONTRA PENALIZAÇÕES (HELPFUL CONTENT)
======================================================================
- PROIBIÇÃO DE TRADUÇÃO LITERAL OU RESUMO SUPERFICIAL:
  Nunca traduza parágrafo por parágrafo nem gere resumos telegráficos. Você deve reescrever o fato utilizando a técnica jornalística da "Pirâmide Invertida Moderna": comece com a revelação principal mais impactante, contextualize o histórico da franquia/estúdio, detalhe as novidades de gameplay/tecnologia, apresente a ficha técnica estruturada e feche com o pulso da comunidade.

- VOZ EDITORIAL MADE BY AI GAMES:
  - Tom: Entusiasta, dinâmico, perspicaz, bem informado e gamer-nativo.
  - Idioma: Português do Brasil (pt-BR), com pontuação impecável e vocabulário fluido.
  - Banimento de Clichês de IA: NUNCA use frases batidas como "No vibrante mundo dos games", "Em um anúncio que abalou as estruturas", "Mergulhe de cabeça nesta jornada", "É crucial notar", "Em suma" ou "Vale ressaltar". Escreva como um redator humano experiente de veículos como IGN, Eurogamer, Voxel ou The Verge.

- ESTRUTURAÇÃO DO CORPO EM MARKDOWN (campo 'content'):
  - Divida a matéria em seções utilizando cabeçalhos semânticos H2 (##) e H3 (###). NUNCA utilize H1 no corpo (o título já é o H1 da página).
  - Crie entre 4 e 7 parágrafos robustos, divididos em subtítulos temáticos atraentes.
  - Inclua OBRIGATORIAMENTE uma TABELA MARKDOWN de "Ficha Técnica Rápida" dentro do 'content'.
  - Dedique os parágrafos finais à repercussão do anúncio (debates de jogadores, expectativas e controvérsias).
  - Ao final do texto, atribua o crédito jornalístico E-E-A-T com link canônico para o veículo de origem.

======================================================================
2. POLÍTICA ANTI-ALUCINAÇÃO RIGOROSA (ZERO FAKE NEWS)
======================================================================
- DIRETRIZ INEGOCIÁVEL DE INTEGRIDADE FACTUAL:
  Você só pode afirmar fatos, números, datas, preços e plataformas que estejam EXPLICITAMENTE citados e confirmados no texto original fornecido.

- REGRA PARA INFORMAÇÕES AUSENTES OU INCERTAS:
  Se qualquer dado relevante (como data de lançamento, preço oficial, plataformas disponíveis, resolução/taxa de quadros ou requisitos de PC) NÃO estiver expressamente confirmado no texto original raspado:
  - É EXPRESSAMENTE PROIBIDO inventar, deduzir por conta própria ou presumir dados de versões anteriores.
  - No corpo do texto ('content') e nas tabelas, você DEVE declarar explicitamente a seguinte frase padronizada:
    "Informação ainda não confirmada oficialmente pelo estúdio/distribuidora."
  - No campo JSON 'release_date', se a data não estiver clara e confirmada, preencha estritamente com a string:
    "Não divulgada oficialmente"

======================================================================
3. PROTOCOLO DE FACT-CHECKING & CLASSIFICAÇÃO DE CONFIABILIDADE (FASE 2)
======================================================================
Você deve atuar com o rigor de um editor-chefe de checagem de fatos, analisando criticamente a procedência e a solidez das fontes da notícia:

- ANÁLISE DE FONTES & CLASSIFICAÇÃO DE RUMOR ('is_rumor'):
  * SE a notícia for baseada em vazamentos ("leak", "datamine", "insider", patente, registro não oficial, fórum, perfil anônimo, vaga de emprego ou especulação):
    - Marque OBRIGATORIAMENTE 'is_rumor': true.
    - Defina a nota de confiabilidade ('reliability_score') em uma escala de 1 a 5:
      * 1: Boato de fórum anônimo ou perfil sem histórico (ex: 4chan, post não verificado no Reddit).
      * 2: Datamine preliminar ou leaker com histórico misto.
      * 3: Patente registrada, registro em órgão governamental de classificação indicativa ou vaga de emprego.
      * 4: Reportagem investigativa com múltiplas fontes confiáveis da indústria (ex: Jason Schreier, Bloomberg, Eurogamer, The Verge).
    - Gere uma frase explicativa de cautela no campo 'rumor_warning' (ex: "Informações baseadas em supostos vazamentos da indústria. A desenvolvedora e a publicadora não confirmaram os detalhes oficialmente.").
  * SE a fonte for um CANAL OFICIAL (PlayStation Blog, Xbox Wire, Nintendo Direct, pronunciamento/press release oficial de desenvolvedora ou publicadora):
    - Marque OBRIGATORIAMENTE 'is_rumor': false.
    - Defina 'reliability_score': 5.
    - Defina 'rumor_warning': "" (string vazia).

- DIRETRIZ DE OURO (TRATAMENTO DE RUMORES NO TEXTO):
  * NUNCA trate rumores, vazamentos ou patentes como fatos consumados no título ('title'), no resumo ('tldr') ou no corpo do artigo ('content').
  * Utilize SEMPRE termos condicionais e construções jornalísticas atributivas:
    - Ex: "suposto", "aponta vazamento", "segundo rumor", "estaria desenvolvendo", "indica registro", "fontes afirmam".
  * Exemplo de título PROIBIDO: "Resident Evil 9 terá mundo aberto e chega em 2026"
  * Exemplo de título CORRETO: "Resident Evil 9: Suposto vazamento aponta ambição de mundo aberto"

======================================================================
4. FORMATO DE SAÍDA EXCLUSIVO (STRICT JSON)
======================================================================
Você DEVE responder UNICAMENTE com um objeto JSON válido correspondente ao schema solicitado.
- 'title': Máximo 75 caracteres, forte gancho jornalístico sem clickbait enganoso e com cautela em rumores.
- 'slug': Minúsculo, apenas a-z, números e hifens simples (ex: 'diablo-5-anuncio-oficial-blizzcon-2026').
- 'tldr': Array de exatamente 3 a 4 strings curtas com os fatos principais.
- 'excerpt': String persuasiva de 140 a 160 caracteres para meta description.
- 'suggested_category': Estritamente uma entre: "PlayStation", "Xbox", "Nintendo", "PC Gaming", "Hardware", "Indústria", "Geral".
- 'keywords': Array com 3 a 6 tags curtas em minúsculas.
- 'is_rumor': Booleano (true para rumores/vazamentos/patentes, false para comunicados oficiais).
- 'reliability_score': Inteiro de 1 a 5 avaliando a solidez da fonte.
- 'rumor_warning': String de cautela se is_rumor for true, ou string vazia "" se is_rumor for false.`;

// ============================================================================
// TIPOS INTERNOS
// ============================================================================

interface AIArticleOutput {
  title: string;
  slug: string;
  tldr: string[];
  excerpt: string;
  content: string;
  community_sentiment: string;
  game_metadata: {
    game_name: string;
    platforms: string[];
    release_date: string;
    developer: string;
    publisher: string;
  };
  suggested_category: "PlayStation" | "Xbox" | "Nintendo" | "PC Gaming" | "Hardware" | "Indústria" | "Geral";
  keywords: string[];
  is_rumor: boolean;
  reliability_score: number;
  rumor_warning: string | null;
}

interface ScrapedContent {
  title: string;
  cleanText: string;
  imageUrl: string | null;
  canonicalUrl: string;
}

// ============================================================================
// FUNÇÕES AUXILIARES DE EXTRAÇÃO & FORMATAÇÃO
// ============================================================================

/**
 * Normaliza e gera um slug seguro a partir de texto
 */
function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/--+/g, "-")
    .slice(0, 80);
}

/**
 * Higieniza fragmentos HTML extraindo parágrafos legíveis e limpando ruídos
 */
function cleanHtmlText(html: string): string {
  if (!html) return "";
  const $ = cheerio.load(html);

  // Remove elementos indesejados
  $(
    "script, style, noscript, iframe, svg, form, button, input, nav, footer, header, aside, .ad, .advertisement, .social-share, .comments"
  ).remove();

  const paragraphs: string[] = [];
  $("p, h2, h3, li").each((_, el) => {
    const text = $(el).text().trim();
    if (text.length > 25 && !text.toLowerCase().includes("cookie") && !text.toLowerCase().includes("subscribe")) {
      paragraphs.push(text);
    }
  });

  if (paragraphs.length > 0) {
    return paragraphs.join("\n\n");
  }

  // Fallback geral de texto do body
  return $("body").text().replace(/\s+/g, " ").trim();
}

/**
 * Valida se uma string é uma URL válida de imagem HTTP/HTTPS e descarta áudios/vídeos, SVGs e placeholders
 */
function isValidImageUrl(url?: string | null): boolean {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) return false;

  // Rejeita extensões de áudio e vídeo comuns em feeds/enclosures
  if (/\.(mp3|wav|ogg|m4a|aac|flac|mp4|webm|mkv|avi)(\?.*)?$/i.test(trimmed)) {
    return false;
  }

  // Rejeita SVGs (geralmente ícones, logos ou placeholders 1x1, como o placeholder.svg do PlayStation Blog)
  if (/\.svg(\?.*)?$/i.test(trimmed)) {
    return false;
  }

  // Rejeita termos comuns de imagens de placeholder ou rastreadores
  const lower = trimmed.toLowerCase();
  if (
    lower.includes("placeholder") ||
    lower.includes("blank.gif") ||
    lower.includes("pixel.gif") ||
    lower.includes("spacer.gif") ||
    lower.includes("/1x1.")
  ) {
    return false;
  }

  // Rejeita CDNs que utilizam Cloudflare Bot Challenge bloqueando hotlinking (ex: Nintendo Life)
  if (lower.includes("images.nintendolife.com")) {
    return false;
  }

  return true;
}

/**
 * Extrai URL de campos complexos de mídia RSS (media:content, media:thumbnail)
 */
function extractMediaUrl(media: any): string | null {
  if (!media) return null;
  if (typeof media === "string" && isValidImageUrl(media)) return media;
  if (Array.isArray(media)) {
    for (const m of media) {
      const found = extractMediaUrl(m);
      if (found) return found;
    }
    return null;
  }
  if (media.$ && media.$.url && isValidImageUrl(media.$.url)) {
    return media.$.url;
  }
  if (media.url && isValidImageUrl(media.url)) {
    return media.url;
  }
  return null;
}

/**
 * Tenta obter a imagem OpenGraph diretamente da página web via fetch com headers reais
 */
async function fetchOgImage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    const ogMatch =
      html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i) ||
      html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i);
    if (ogMatch && isValidImageUrl(ogMatch[1])) {
      return ogMatch[1];
    }
  } catch {
    // Falha silenciosa permitindo seguir para os outros fallbacks
  }
  return null;
}

/**
 * Extrai o corpo de texto e capa de uma matéria com múltiplas estratégias defensivas
 */
async function scrapeArticle(item: Parser.Item, feedConfig: FeedConfig): Promise<ScrapedContent> {
  let url = item.link?.trim() || "";
  const originalTitle = item.title?.trim() || "Sem título";
  let cleanText = "";
  let imageUrl: string | null = null;
  const rawItem = item as any;

  // Suporte a feeds Reddit (Atom): extrair URL externa referenciada por [link]
  if (url.includes("reddit.com/r/")) {
    const rawFeedHtml =
      rawItem.contentEncoded || rawItem["content:encoded"] || item.content || item.contentSnippet || rawItem.summary || "";
    if (rawFeedHtml) {
      try {
        const $ = cheerio.load(rawFeedHtml);
        $("a").each((_, el) => {
          const href = $(el).attr("href");
          const text = $(el).text().trim().toLowerCase();
          if (text === "[link]" && href && !href.includes("reddit.com") && href.startsWith("http")) {
            url = href;
            return false;
          }
        });
      } catch {
        // Fallback mantém url original
      }
    }
  }

  // 1. Tentar obter imagem das tags media:content ou media:thumbnail (Nintendo Everything, IGN, PC Gamer)
  const mediaContentUrl = extractMediaUrl(rawItem.mediaContent || rawItem["media:content"]);
  const mediaThumbnailUrl = extractMediaUrl(rawItem.mediaThumbnail || rawItem["media:thumbnail"]);

  if (mediaContentUrl) {
    imageUrl = mediaContentUrl;
  } else if (mediaThumbnailUrl) {
    imageUrl = mediaThumbnailUrl;
  }

  // 2. Tentar obter imagem de tag enclosure (rejeitando arquivos de áudio/podcast como .mp3)
  if (!imageUrl && item.enclosure && item.enclosure.url) {
    const isAudio = item.enclosure.type?.toLowerCase().includes("audio");
    if (!isAudio && isValidImageUrl(item.enclosure.url)) {
      imageUrl = item.enclosure.url;
    }
  }

  // 3. Para feeds sem media:content (como PlayStation Blog), buscar diretamente a capa OpenGraph na página
  // A capa OpenGraph é a imagem destacada oficial em alta resolução (1080p), superior a imagens inline
  if (!imageUrl && url) {
    const ogImg = await fetchOgImage(url);
    if (ogImg) {
      imageUrl = ogImg;
    }
  }

  // 4. Extração primária do texto via @extractus/article-extractor
  try {
    const article = await extract(url);
    if (article && article.content) {
      cleanText = cleanHtmlText(article.content);
      if (!imageUrl && isValidImageUrl(article.image)) {
        imageUrl = article.image!;
      }
    }
  } catch (error: any) {
    // Falha esperada em sites com anti-bot
  }

  // 5. Tentar obter imagem embutida no HTML do feed caso ainda não tenhamos capa
  const rawFeedHtml =
    rawItem.contentEncoded || rawItem["content:encoded"] || item.content || item.contentSnippet || rawItem.summary || "";

  if (!imageUrl && rawFeedHtml && rawFeedHtml.includes("<img")) {
    const $ = cheerio.load(rawFeedHtml);
    $("img").each((_, el) => {
      const src = $(el).attr("src");
      if (!imageUrl && isValidImageUrl(src)) {
        imageUrl = src!;
      }
    });
  }

  // 6. Fallback para conteúdo embutido no feed caso o extrator tenha falhado
  if (!cleanText || cleanText.length < 150) {
    if (rawFeedHtml) {
      cleanText = cleanHtmlText(rawFeedHtml);
    }
  }

  // 7. Fallback final temático por plataforma/categoria com URLs verificadas
  if (!imageUrl) {
    const categoryCovers =
      FALLBACK_COVERS_BY_CATEGORY[feedConfig.defaultCategorySlug] || FALLBACK_COVERS_BY_CATEGORY.geral;
    const hash = Math.abs(originalTitle.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0));
    imageUrl = categoryCovers[hash % categoryCovers.length];
  }

  return {
    title: originalTitle,
    cleanText: cleanText || item.contentSnippet || originalTitle,
    imageUrl,
    canonicalUrl: url,
  };
}

// ============================================================================
// OPERAÇÕES DE INTELIGÊNCIA ARTIFICIAL (GOOGLE GEMINI)
// ============================================================================

// Modelos candidatos ordenados por preferência e disponibilidade
const EMBEDDING_MODELS = ["gemini-embedding-001", "text-embedding-004", "gemini-embedding-2"];
const GENERATION_MODELS = ["gemini-3.6-flash", "gemini-flash-latest", "gemini-1.5-flash"];

/**
 * Gera vetor denso de 768 dimensões com suporte resiliente a múltiplos modelos
 */
async function generateEmbedding(ai: GoogleGenAI, text: string): Promise<number[] | null> {
  const cleanSnippet = text.slice(0, 2048);

  for (const model of EMBEDDING_MODELS) {
    try {
      const response = await ai.models.embedContent({
        model,
        contents: cleanSnippet,
        config: { outputDimensionality: 768 },
      });

      const values = response.embeddings?.[0]?.values || (response as any).embedding?.values;
      if (Array.isArray(values) && values.length === 768) {
        return values;
      }
    } catch (error: any) {
      // Tenta próximo modelo na lista se este não estiver disponível
    }
  }

  console.warn("  ⚠️ [Embedding] Não foi possível gerar vetor 768d com nenhum dos modelos disponíveis.");
  return null;
}

/**
 * Reescreve a matéria com voz gamer, SEO e estrutura JSON pelo Gemini Flash
 */
async function rewriteArticleWithGemini(
  ai: GoogleGenAI,
  scraped: ScrapedContent,
  sourceName: string
): Promise<AIArticleOutput | null> {
  const userPrompt = `URL Canônica da Fonte: ${scraped.canonicalUrl}
Veículo de Origem: ${sourceName}
Título Original do Feed: ${scraped.title}

Conteúdo Extraído da Matéria:
${scraped.cleanText}`;

  for (const model of GENERATION_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        config: {
          temperature: 0.2,
          topP: 0.85,
          topK: 40,
          maxOutputTokens: 4096,
          responseMimeType: "application/json",
          systemInstruction: SYSTEM_INSTRUCTION,
          responseSchema: {
            type: Type.OBJECT,
            required: [
              "title",
              "slug",
              "tldr",
              "excerpt",
              "content",
              "community_sentiment",
              "game_metadata",
              "suggested_category",
              "keywords",
              "is_rumor",
              "reliability_score",
              "rumor_warning",
            ],
            properties: {
              title: { type: Type.STRING },
              slug: { type: Type.STRING },
              tldr: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              excerpt: { type: Type.STRING },
              content: { type: Type.STRING },
              community_sentiment: { type: Type.STRING },
              game_metadata: {
                type: Type.OBJECT,
                required: ["game_name", "platforms", "release_date", "developer", "publisher"],
                properties: {
                  game_name: { type: Type.STRING },
                  platforms: { type: Type.ARRAY, items: { type: Type.STRING } },
                  release_date: { type: Type.STRING },
                  developer: { type: Type.STRING },
                  publisher: { type: Type.STRING },
                },
              },
              suggested_category: {
                type: Type.STRING,
                enum: ["PlayStation", "Xbox", "Nintendo", "PC Gaming", "Hardware", "Indústria", "Geral"],
              },
              keywords: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              is_rumor: {
                type: Type.BOOLEAN,
                description: "Verdadeiro se for baseado em vazamento, datamine, boato ou patente não confirmada.",
              },
              reliability_score: {
                type: Type.INTEGER,
                description: "Nota de confiabilidade de 1 a 5 da fonte.",
              },
              rumor_warning: {
                type: Type.STRING,
                description: "Mensagem contextual de aviso para o leitor se for rumor, ou vazio se oficial.",
              },
            },
          },
        },
        contents: [
          {
            role: "user",
            parts: [{ text: userPrompt }],
          },
        ],
      });

      const responseText = response.text;
      if (!responseText) {
        continue;
      }

      // Remove eventuais blocos de código se presentes
      const sanitizedJson = responseText.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
      const parsed: AIArticleOutput = JSON.parse(sanitizedJson);

      // Validação de integridade dos campos obrigatórios
      if (!parsed.title || !parsed.content || !Array.isArray(parsed.tldr)) {
        continue;
      }

      return parsed;
    } catch (error: any) {
      console.warn(`    ⚠️ [Gemini ${model}] Erro: ${error?.message || error}`);
    }
  }

  console.error("  ❌ [Gemini Flash] Falha na redação com IA com todos os modelos candidatos.");
  return null;
}

// ============================================================================
// BANCO DE DADOS & SUPABASE
// ============================================================================

/**
 * Carrega ou sincroniza as fontes oficiais na tabela public.sources
 */
async function syncSources(supabase: SupabaseClient): Promise<Map<string, string>> {
  const sourceMap = new Map<string, string>(); // feed_url -> source_id

  for (const feed of OFFICIAL_FEEDS) {
    const { data, error } = await supabase
      .from("sources")
      .upsert(
        {
          name: feed.name,
          feed_url: feed.url,
          website_url: feed.websiteUrl,
          is_active: true,
        },
        { onConflict: "feed_url" }
      )
      .select("id, feed_url")
      .single();

    if (data) {
      const row = data as { id: string; feed_url: string };
      sourceMap.set(row.feed_url, row.id);
    } else if (error) {
      console.warn(`  ⚠️ Aviso ao sincronizar fonte "${feed.name}": ${error.message}`);
    }
  }

  return sourceMap;
}

/**
 * Carrega o mapa de categorias (nome e slug -> category_id)
 */
async function loadCategories(supabase: SupabaseClient): Promise<Map<string, string>> {
  const categoryMap = new Map<string, string>();

  const { data: categories, error } = await supabase.from("categories").select("id, name, slug");

  if (error || !categories) {
    console.warn("  ⚠️ Não foi possível carregar categorias do Supabase:", error?.message);
    return categoryMap;
  }

  for (const cat of categories as { id: string; name: string; slug: string }[]) {
    categoryMap.set(cat.slug.toLowerCase(), cat.id);
    categoryMap.set(cat.name.toLowerCase(), cat.id);
  }

  return categoryMap;
}

/**
 * Resolve a categoria mais adequada a partir da sugestão da IA
 */
function resolveCategoryId(
  suggestedCategory: string,
  defaultSlug: string,
  categoryMap: Map<string, string>
): string | null {
  const normalizedSuggestion = (suggestedCategory || "").toLowerCase().trim();
  const normalizedDefault = (defaultSlug || "geral").toLowerCase().trim();

  return (
    categoryMap.get(normalizedSuggestion) ||
    categoryMap.get(slugify(normalizedSuggestion)) ||
    categoryMap.get(normalizedDefault) ||
    categoryMap.get("geral") ||
    null
  );
}

// ============================================================================
// REVALIDAÇÃO DE CACHE (ISR NEXT.JS)
// ============================================================================

async function triggerISRRevalidation(siteUrl: string, secret: string, slug: string): Promise<boolean> {
  const cleanBaseUrl = siteUrl.replace(/\/+$/, "");
  const targetUrl = `${cleanBaseUrl}/api/revalidate?secret=${encodeURIComponent(secret)}&slug=${encodeURIComponent(slug)}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(targetUrl, {
      method: "POST",
      headers: { "User-Agent": "MadeByAIGames-Ingestion/1.0" },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const body = await res.json().catch(() => ({}));
      console.log(`  🚀 [ISR Revalidate] Sucesso para /noticias/${slug} (status: ${res.status})`);
      return true;
    } else {
      console.warn(`  ⚠️ [ISR Revalidate] Endpoint retornou HTTP ${res.status}: ${await res.text().catch(() => "")}`);
      return false;
    }
  } catch (error: any) {
    console.warn(`  ⚠️ [ISR Revalidate] Não foi possível contatar ${targetUrl}: ${error?.message || error}`);
    return false;
  }
}

async function revalidateCustomPath(siteUrl: string, secret: string, customPath: string): Promise<boolean> {
  const cleanBaseUrl = siteUrl.replace(/\/+$/, "");
  const targetUrl = `${cleanBaseUrl}/api/revalidate?secret=${encodeURIComponent(secret)}&path=${encodeURIComponent(customPath)}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(targetUrl, {
      method: "POST",
      headers: { "User-Agent": "MadeByAIGames-Ingestion/1.0" },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      console.log(`  🚀 [ISR Revalidate] Sucesso para rota ${customPath}`);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Avalia se a notícia tem impacto crítico (Nível 5/5) para disparar alerta urgente no Discord
 * Exemplos: Anúncios de novos consoles, trailers mundiais, aquisições de peso ou encerramentos de estúdios.
 */
function isHighImpactBreakingNews(
  title: string,
  content: string,
  reliabilityScore: number,
  category?: string
): boolean {
  // Apenas fontes de altíssima confiabilidade (nota 4 ou 5) podem acionar breaking news
  if (reliabilityScore < 4) return false;

  const textToScan = `${title} ${content.slice(0, 1000)}`.toLowerCase();

  // Padrões de alto impacto na indústria gamer
  const impactPatterns = [
    // Hardware e Novos Consoles
    /\b(switch\s*2|playstation\s*6|ps6|xbox\s*next|novo\s*console|sucessor\s*do|novo\s*hardware)\b/i,
    // Revelações Globais e Grandes Franquias
    /\b(anunciado\s*oficialmente|revelado\s*oficialmente|data\s*de\s*lan[çc]amento\s*confirmada|world\s*premiere|gta\s*6|gta\s*vi|novo\s*trailer\s*mundial)\b/i,
    // Terremotos na Indústria (Cancelamentos, Fechamentos, Aquisições)
    /\b(est[uú]dio\s*fechado|encerra\s*atividades|fechamento\s*de\s*est[uú]dio|cancelamento\s*definitivo|cancelado\s*pela|aquisi[çc][ãa]o\s*bilion[áa]ria|comprada\s*pela)\b/i,
  ];

  const hasHighImpactMatch = impactPatterns.some((pattern) => pattern.test(textToScan));

  // Categoria Hardware de fontes oficiais tem peso adicional
  const isOfficialHardware =
    (category?.toLowerCase() === "hardware" || category?.toLowerCase() === "indústria") &&
    reliabilityScore === 5;

  return hasHighImpactMatch || (isOfficialHardware && /\b(novo|an[úu]ncio|revela[çc][ãa]o)\b/i.test(textToScan));
}

/**
 * Verifica se os disparos de Breaking News para o Discord estão autorizados no painel admin
 */
async function checkDiscordNewsEnabled(supabase: SupabaseClient): Promise<boolean> {
  try {
    const { data } = await supabase
      .from("discord_settings")
      .select("is_news_enabled")
      .eq("id", "default")
      .maybeSingle();

    return Boolean(data && (data as any).is_news_enabled === true);
  } catch {
    return false;
  }
}

// ============================================================================
// PIPELINE PRINCIPAL DE EXECUÇÃO
// ============================================================================

export async function runNewsSync() {
  const startTime = Date.now();
  console.log("====================================================================");
  console.log("🎮 [Made By AI Games] Iniciando Pipeline de Ingestão de Notícias Gamer");
  console.log(`🕒 Data/Hora: ${new Date().toISOString()}`);
  console.log("====================================================================");

  // 1. Validação de credenciais de ambiente
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const revalidateSecret =
    process.env.REVALIDATE_SECRET ||
    process.env.REVALIDATION_SECRET ||
    "aigameportal_super_secret_token_2026";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "http://localhost:3000";

  if (!supabaseUrl || !supabaseKey) {
    console.error("❌ ERRO CRÍTICO: Credenciais do Supabase ausentes (SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY).");
    process.exit(1);
  }

  if (!geminiApiKey) {
    console.error("❌ ERRO CRÍTICO: GEMINI_API_KEY ausente. Configure a chave para embeddings e geração.");
    process.exit(1);
  }

  // 2. Inicialização dos Clientes
  const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });
  const ai = new GoogleGenAI({ apiKey: geminiApiKey });
  const parser = new Parser({
    headers: {
      "User-Agent":
        "MadeByAIGames/1.0 (Gaming News Aggregator; +https://madebyaigames.com; contact@madebyaigames.com)",
      Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, */*",
    },
    customFields: {
      item: [
        ["media:content", "mediaContent"],
        ["media:thumbnail", "mediaThumbnail"],
        ["content:encoded", "contentEncoded"],
      ],
    },
    timeout: 15000,
  });

  // 3. Carregar Fontes e Categorias do Supabase
  console.log("\n📦 Carregando fontes e categorias no Supabase...");
  const [sourceMap, categoryMap] = await Promise.all([syncSources(supabase), loadCategories(supabase)]);
  console.log(`✅ Fontes ativas sincronizadas: ${sourceMap.size} | Categorias indexadas: ${categoryMap.size / 2}`);

  // 4. Métricas da Execução
  let totalFeedsRead = 0;
  let totalItemsInspected = 0;
  let totalUrlDuplicates = 0;
  let totalSemanticDuplicates = 0;
  let totalPublished = 0;
  let totalErrors = 0;

  // 5. Iteração pelas fontes oficiais
  for (const feedConfig of OFFICIAL_FEEDS) {
    console.log(`\n📡 [Feed] Lendo: ${feedConfig.name} (${feedConfig.url})`);
    if (feedConfig.url.includes("reddit.com")) {
      // Pausa defensiva preventiva para respeitar o rate-limit do Reddit
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }

    let feedData: Parser.Output<Parser.Item>;
    try {
      feedData = await parser.parseURL(feedConfig.url);
      totalFeedsRead++;
    } catch (feedError: any) {
      if (feedConfig.url.includes("reddit.com") && feedError?.message?.includes("429")) {
        console.warn(`  ⏳ [Reddit Rate Limit] Aguardando 3s para retentativa em "${feedConfig.name}"...`);
        await new Promise((resolve) => setTimeout(resolve, 3000));
        try {
          feedData = await parser.parseURL(feedConfig.url);
          totalFeedsRead++;
        } catch (retryErr: any) {
          console.error(`❌ Falha persistente ao obter feed "${feedConfig.name}": ${retryErr?.message || retryErr}`);
          totalErrors++;
          continue;
        }
      } else {
        console.error(`❌ Falha ao obter feed "${feedConfig.name}": ${feedError?.message || feedError}`);
        totalErrors++;
        continue; // Não interrompe os demais feeds
      }
    }

    const itemsToProcess = (feedData.items || []).slice(0, MAX_ITEMS_PER_FEED);
    console.log(`  🔎 ${itemsToProcess.length} itens recentes selecionados para análise.`);

    for (const item of itemsToProcess) {
      totalItemsInspected++;
      const itemUrl = (item.link || "").trim();
      const itemTitle = (item.title || "").trim();

      if (!itemUrl) {
        continue;
      }

      console.log(`\n  👉 Avaliando: "${itemTitle}"`);
      console.log(`     URL: ${itemUrl}`);

      // ----------------------------------------------------------------------
      // PASSO A: Deduplicação Determinística (URL original no banco)
      // ----------------------------------------------------------------------
      try {
        const { data: existingPost } = await supabase
          .from("posts")
          .select("id, title, slug")
          .eq("source_original_url", itemUrl)
          .maybeSingle();

        if (existingPost) {
          const post = existingPost as { id: string; title: string; slug: string };
          console.log(`     ⏭️ [Deduplicação URL] Matéria já publicada com esta URL: "${post.title}". Pulando.`);
          totalUrlDuplicates++;
          continue;
        }
      } catch (err: any) {
        console.warn(`     ⚠️ Erro ao consultar URL original no banco: ${err?.message || err}`);
      }

      // ----------------------------------------------------------------------
      // PASSO B: Extração e Limpeza do Conteúdo
      // ----------------------------------------------------------------------
      console.log("     🧹 Extraindo corpo textual da matéria...");
      const scraped = await scrapeArticle(item, feedConfig);

      if (!scraped.cleanText || scraped.cleanText.length < 80) {
        console.log("     ⚠️ Conteúdo extraído insuficiente para redação de qualidade. Pulando item.");
        continue;
      }

      // ----------------------------------------------------------------------
      // PASSO C: Deduplicação Semântica via pgvector (text-embedding-004)
      // ----------------------------------------------------------------------
      console.log("     🧠 Gerando vetor de embedding (text-embedding-004)...");
      const embeddingText = `${itemTitle}\n\n${scraped.cleanText.slice(0, 1200)}`;
      const embedding = await generateEmbedding(ai, embeddingText);

      if (embedding) {
        try {
          const { data: matches, error: rpcError } = await supabase.rpc("match_recent_articles", {
            query_embedding: embedding,
            match_threshold: SIMILARITY_THRESHOLD,
            hours_limit: LOOKBACK_HOURS,
          });

          if (rpcError) {
            console.warn(`     ⚠️ Erro na RPC match_recent_articles: ${rpcError.message}`);
          } else if (matches && Array.isArray(matches) && matches.length > 0) {
            const bestMatch = matches[0] as {
              id: string;
              title: string;
              slug: string;
              similarity: number;
              published_at: string;
              source_original_url: string;
            };
            const simPercentage = (bestMatch.similarity * 100).toFixed(1);
            console.log(
              `     🛑 [Deduplicação Semântica] Conteúdo duplicado detectado! Similaridade: ${simPercentage}% (>= 82%)`
            );
            console.log(`        Match recente: "${bestMatch.title}" (/noticias/${bestMatch.slug})`);
            totalSemanticDuplicates++;
            continue; // Pula notícia já coberta recentemente
          } else {
            console.log("     ✅ Nenhuma cobertura recente similar encontrada. Notícia inédita!");
          }
        } catch (rpcCatch: any) {
          console.warn(`     ⚠️ Falha na execução da busca vetorial: ${rpcCatch?.message || rpcCatch}`);
        }
      }

      // ----------------------------------------------------------------------
      // PASSO D: Redação e Otimização SEO com Gemini 1.5 Flash
      // ----------------------------------------------------------------------
      console.log("     ✍️ Redigindo artigo jornalístico com Gemini 1.5 Flash (Temp 0.2)...");
      const generated = await rewriteArticleWithGemini(ai, scraped, feedConfig.name);

      if (!generated) {
        console.log("     ❌ Não foi possível gerar o artigo estruturado. Pulando.");
        totalErrors++;
        continue;
      }

      // ----------------------------------------------------------------------
      // PASSO E: Persistência no Supabase
      // ----------------------------------------------------------------------
      try {
        // Garantir slug único
        let finalSlug = slugify(generated.slug || generated.title);
        const { data: slugMatch } = await supabase.from("posts").select("id").eq("slug", finalSlug).maybeSingle();
        if (slugMatch) {
          finalSlug = `${finalSlug}-${Date.now().toString().slice(-4)}`;
        }

        const categoryId = resolveCategoryId(generated.suggested_category, feedConfig.defaultCategorySlug, categoryMap);
        const sourceId = sourceMap.get(feedConfig.url) || null;

        // Fact-Checking & Confiabilidade (Fase 2 + Item 4)
        let isRumor = Boolean(generated.is_rumor);
        let rawScore = Number(generated.reliability_score);

        // Salvaguarda mandatória para feeds especializados em rumores ou vazamentos
        if (feedConfig.name.includes("GamingLeaksAndRumours") || feedConfig.isCommunityOrRumor && isRumor) {
          isRumor = true;
          rawScore = Math.min(isNaN(rawScore) ? 2 : rawScore, 3);
        }

        const reliabilityScore = !isNaN(rawScore) ? Math.max(1, Math.min(5, Math.round(rawScore))) : (isRumor ? 2 : 5);
        const rumorWarning = isRumor
          ? (generated.rumor_warning?.trim() || "Atenção: Esta notícia é baseada em rumores, vazamentos ou discussões comunitárias não confirmadas oficialmente pelas publicadoras envolvidas. Trate os detalhes com cautela.")
          : null;

        console.log(`     🔎 [Fact-Checking] Rumor: ${isRumor ? "SIM ⚠️ (Vazamento/Especulação)" : "NÃO ✅ (Canal Oficial)"} | Confiabilidade: ${reliabilityScore}/5`);
        if (isRumor && rumorWarning) {
          console.log(`        Aviso Editorial: "${rumorWarning}"`);
        }

        // --------------------------------------------------------------------
        // Enriquecimento Estruturado de Metadados (Item 3: RAWG / OpenCritic)
        // --------------------------------------------------------------------
        let enrichedGameMetadata: GameMetadata = {
          ...generated.game_metadata,
        };
        if (generated.game_metadata?.game_name) {
          console.log(`     🎲 [Enriquecimento API] Validando dados para "${generated.game_metadata.game_name}"...`);
          try {
            enrichedGameMetadata = await enrichGameMetadata(
              generated.game_metadata.game_name,
              generated.game_metadata
            );
          } catch (enrichErr: any) {
            console.warn(`     ⚠️ Aviso no enriquecedor de metadados: ${enrichErr?.message || enrichErr}`);
          }
        }

        // --------------------------------------------------------------------
        // Auto-Clustering de Tópicos & Hubs de Jogos Permanentes (Fase 4)
        // --------------------------------------------------------------------
        console.log("     🎮 Avaliando associação a Hubs de Jogos Permanentes...");
        let gameHubId: string | null = null;
        let associatedHubSlug: string | null = null;

        try {
          const hubMatch = await matchOrSuggestGameHub({
            supabase,
            title: generated.title,
            content: generated.content,
            gameMetadata: enrichedGameMetadata,
            aiClient: ai,
            autoCreate: true,
            defaultCoverUrl: scraped.imageUrl,
          });

          if (hubMatch.matched && hubMatch.hubId) {
            gameHubId = hubMatch.hubId;
            associatedHubSlug = hubMatch.hub?.slug || null;
            console.log(`     🎯 [Game Hub] Matéria vinculada ao Hub: "${hubMatch.hub?.name}" (/jogos/${associatedHubSlug}) ${hubMatch.isNew ? "(✨ Hub Criado pela IA)" : ""}`);
          } else {
            console.log("     ℹ️ [Game Hub] Nenhum Hub associado para esta matéria geral.");
          }
        } catch (hubErr: any) {
          console.warn(`     ⚠️ Erro ao processar Hub de Jogo: ${hubErr?.message || hubErr}`);
        }

        const newPost = {
          title: generated.title,
          slug: finalSlug,
          tldr: generated.tldr,
          content: generated.content,
          excerpt: generated.excerpt || scraped.cleanText.slice(0, 155),
          cover_image_url: scraped.imageUrl,
          cover_image_alt: generated.title,
          category_id: categoryId,
          source_id: sourceId,
          game_hub_id: gameHubId,
          source_original_url: itemUrl,
          source_original_title: itemTitle,
          game_metadata: enrichedGameMetadata || {},
          community_sentiment: generated.community_sentiment || null,
          embedding: embedding || null,
          is_rumor: isRumor,
          reliability_score: reliabilityScore,
          rumor_warning: rumorWarning,
          status: "published",
          views_count: 0,
          published_at: new Date().toISOString(),
        };

        const { data: insertedPost, error: insertError } = await supabase
          .from("posts")
          .insert(newPost as any)
          .select("id, title, slug")
          .single();

        if (insertError || !insertedPost) {
          throw new Error(`Erro no insert do Supabase: ${insertError?.message}`);
        }

        const saved = insertedPost as { id: string; title: string; slug: string };
        console.log(`     🎉 Artigo publicado com sucesso!`);
        console.log(`        Título: "${saved.title}"`);
        console.log(`        Slug: /noticias/${saved.slug}`);
        totalPublished++;

        // --------------------------------------------------------------------
        // PASSO F: Revalidação On-Demand do Cache Next.js (ISR)
        // --------------------------------------------------------------------
        await triggerISRRevalidation(siteUrl, revalidateSecret, saved.slug);
        if (associatedHubSlug) {
          await revalidateCustomPath(siteUrl, revalidateSecret, `/jogos/${associatedHubSlug}`);
          await revalidateCustomPath(siteUrl, revalidateSecret, "/jogos");
        }

        // --------------------------------------------------------------------
        // PASSO G: Distribuição Multi-canal Automática (Telegram & Twitter/X)
        // --------------------------------------------------------------------
        const canonicalArticleUrl = `${siteUrl.replace(/\/+$/, "")}/noticias/${saved.slug}`;
        await publishToSocialNetworks({
          title: saved.title,
          slug: saved.slug,
          url: canonicalArticleUrl,
          tldr: generated.tldr || [],
          category: feedConfig.defaultCategorySlug || generated.suggested_category || "geral",
          coverImageUrl: scraped.imageUrl,
          isRumor: isRumor,
          reliabilityScore: reliabilityScore,
          platforms: generated.game_metadata?.platforms,
        });

        // --------------------------------------------------------------------
        // PASSO G.1: Alerta de Breaking News no Discord (Impacto 5/5)
        // --------------------------------------------------------------------
        if (isHighImpactBreakingNews(saved.title, generated.content, reliabilityScore, generated.suggested_category)) {
          const isNewsAuthorized = await checkDiscordNewsEnabled(supabase);
          if (isNewsAuthorized) {
            console.log(`        🔥 [DiscordBreakingNews] Notícia de alto impacto detectada (5/5). Disparando alerta prioritário no Discord...`);
            await sendDiscordNewsAlert({
              title: saved.title,
              slug: saved.slug,
              url: canonicalArticleUrl,
              tldr: generated.tldr || [],
              excerpt: generated.excerpt,
              category: feedConfig.defaultCategorySlug || generated.suggested_category || "geral",
              coverImageUrl: scraped.imageUrl,
              isRumor: isRumor,
              reliabilityScore: reliabilityScore,
              platforms: generated.game_metadata?.platforms,
              sourceName: feedConfig.name,
            });
          } else {
            console.log(`        ℹ️ [DiscordBreakingNews] Notícia de alto impacto detectada (5/5), mas disparos para Discord estão DESABILITADOS em /admin/discord.`);
          }
        }

        // --------------------------------------------------------------------
        // PASSO H: Auto-Cadastro de Produto Afiliado na Amazon (Forma 1 de Automação)
        // --------------------------------------------------------------------
        await autoRegisterAffiliateProductFromNews(supabase, generated, scraped.imageUrl);
      } catch (insertCatch: any) {
        console.error(`     ❌ Erro ao salvar artigo no Supabase: ${insertCatch?.message || insertCatch}`);
        totalErrors++;
      }
    }
  }

  // ==========================================================================
  // RELATÓRIO FINAL CONSOLIDADO
  // ==========================================================================
  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log("\n====================================================================");
  console.log("📊 [Made By AI Games] Relatório de Execução do Pipeline");
  console.log("====================================================================");
  console.log(`⏱️ Tempo total decorrido: ${durationSec}s`);
  console.log(`📡 Feeds processados com sucesso: ${totalFeedsRead}/${OFFICIAL_FEEDS.length}`);
  console.log(`🔎 Total de itens analisados: ${totalItemsInspected}`);
  console.log(`⏭️ Duplicatas descartadas por URL: ${totalUrlDuplicates}`);
  console.log(`🛑 Duplicatas semânticas (pgvector >= 82%): ${totalSemanticDuplicates}`);
  console.log(`🎉 Artigos inéditos publicados: ${totalPublished}`);
  console.log(`⚠️ Falhas ou erros pontuais: ${totalErrors}`);
  console.log("====================================================================\n");
}

/**
 * Auto-Cadastro Inteligente de Produtos de Afiliado na Amazon (Forma 1 de Automação)
 * Extrai o jogo dos metadados e insere no Supabase affiliate_products com a tag oficial.
 */
async function autoRegisterAffiliateProductFromNews(
  supabase: SupabaseClient,
  generated: AIArticleOutput,
  imageUrl: string | null
): Promise<void> {
  const gameName = generated.game_metadata?.game_name?.trim();
  if (!gameName || gameName.length < 3 || gameName.toLowerCase().includes("desconhecido")) {
    return;
  }

  const amazonTag = process.env.NEXT_PUBLIC_AMAZON_AFFILIATE_TAG || "aigameportal-20";
  const cleanName = gameName.replace(/[^\w\s-]/gi, "").trim();
  const lowerName = cleanName.toLowerCase();

  try {
    // 1. Verifica se já existe produto cadastrado para este título
    const { data: existing } = await supabase
      .from("affiliate_products")
      .select("id, title")
      .ilike("title", `%${cleanName}%`)
      .limit(1);

    if (existing && existing.length > 0) {
      return; // Já cadastrado anteriormente
    }

    // 2. Determina palavras-chave
    const extraKeywords = (generated.keywords || [])
      .map((k) => k.toLowerCase().trim())
      .filter((k) => k.length >= 3 && k !== lowerName)
      .slice(0, 4);

    const keywords = Array.from(new Set([lowerName, ...extraKeywords]));

    // 3. Monta URL com a tag oficial da Amazon
    const encodedSearch = encodeURIComponent(cleanName);
    const affiliateUrl = `https://www.amazon.com.br/s?k=${encodedSearch}&tag=${amazonTag}`;

    let category = "Jogo";
    if (generated.suggested_category === "Hardware") category = "Hardware";
    else if (
      generated.suggested_category === "PlayStation" ||
      generated.suggested_category === "Xbox" ||
      generated.suggested_category === "Nintendo"
    ) {
      category = "Console";
    }

    const { error } = await supabase.from("affiliate_products").insert({
      title: `${cleanName} (Edições e Acessórios)`,
      category,
      keywords,
      store_name: "Amazon Brasil",
      affiliate_url: affiliateUrl,
      image_url:
        imageUrl ||
        "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?q=80&w=800&auto=format&fit=crop",
      is_active: true,
    } as any);

    if (!error) {
      console.log(`     🛒 Produto afiliado auto-cadastrado na Amazon Brasil: "${cleanName}"`);
    }
  } catch (err) {
    console.warn("     ⚠️ Aviso: Erro não-crítico ao auto-cadastrar produto afiliado:", err);
  }
}

// Execução direta via CLI (tsx scripts/sync-news.ts)
if (require.main === module || process.argv[1]?.endsWith("sync-news.ts")) {
  runNewsSync().catch((err) => {
    console.error("💥 Erro fatal não tratado no pipeline de notícias:", err);
    process.exit(1);
  });
}
