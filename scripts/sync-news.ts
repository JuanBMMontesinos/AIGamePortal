import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();
import Parser from "rss-parser";
import { extract } from "@extractus/article-extractor";
import * as cheerio from "cheerio";
import { GoogleGenAI, Type } from "@google/genai";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Category, GameMetadata, Post, Source } from "../types/database";

// ============================================================================
// CONFIGURAÇÕES & FONTES OFICIAIS
// ============================================================================

interface FeedConfig {
  name: string;
  url: string;
  websiteUrl: string;
  defaultCategorySlug: string;
}

const OFFICIAL_FEEDS: FeedConfig[] = [
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
    name: "Nintendo Life",
    url: "https://www.nintendolife.com/feeds/latest",
    websiteUrl: "https://www.nintendolife.com",
    defaultCategorySlug: "nintendo",
  },
  {
    name: "PC Gamer",
    url: "https://www.pcgamer.com/rss/",
    websiteUrl: "https://www.pcgamer.com",
    defaultCategorySlug: "pc-gaming",
  },
  {
    name: "IGN Games",
    url: "https://feeds.feedburner.com/ign/all",
    websiteUrl: "https://www.ign.com",
    defaultCategorySlug: "geral",
  },
];

// Limite de itens por feed em cada execução (para respeitar limites de tempo e quota de IA)
const MAX_ITEMS_PER_FEED = Number(process.env.MAX_ITEMS_PER_FEED) || 3;
const SIMILARITY_THRESHOLD = 0.82;
const LOOKBACK_HOURS = 48;

// Fallback de imagens gamer de alta qualidade caso o artigo original não possua capa
const FALLBACK_COVERS = [
  "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=1200&auto=format&fit=crop",
];

// ============================================================================
// SYSTEM PROMPT & DIRETRIZES EDITORIAIS (GEMINI 1.5 FLASH)
// ============================================================================

const SYSTEM_INSTRUCTION = `Você é o Agente Redator Sênior & Especialista em SEO do portal "AIGamePortal" (aigameportal.com.br).
Sua missão é atuar como um jornalista gamer profissional de elite, transformando textos raspados de notícias de videogames (em inglês ou português) em artigos jornalísticos completos, 100% originais, aprofundados, atraentes para a comunidade gamer e otimizados para mecanismos de busca (Google Discover e Google Search).

======================================================================
1. PILARES EDITORIAIS & PROTEÇÃO CONTRA PENALIZAÇÕES (HELPFUL CONTENT)
======================================================================
- PROIBIÇÃO DE TRADUÇÃO LITERAL OU RESUMO SUPERFICIAL:
  Nunca traduza parágrafo por parágrafo nem gere resumos telegráficos. Você deve reescrever o fato utilizando a técnica jornalística da "Pirâmide Invertida Moderna": comece com a revelação principal mais impactante, contextualize o histórico da franquia/estúdio, detalhe as novidades de gameplay/tecnologia, apresente a ficha técnica estruturada e feche com o pulso da comunidade.

- VOZ EDITORIAL AIGAMEPORTAL:
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
3. FORMATO DE SAÍDA EXCLUSIVO (STRICT JSON)
======================================================================
Você DEVE responder UNICAMENTE com um objeto JSON válido correspondente ao schema solicitado.
- 'title': Máximo 75 caracteres, forte gancho jornalístico sem clickbait enganoso.
- 'slug': Minúsculo, apenas a-z, números e hifens simples (ex: 'diablo-5-anuncio-oficial-blizzcon-2026').
- 'tldr': Array de exatamente 3 a 4 strings curtas com os fatos principais.
- 'excerpt': String persuasiva de 140 a 160 caracteres para meta description.
- 'suggested_category': Estritamente uma entre: "PlayStation", "Xbox", "Nintendo", "PC Gaming", "Hardware", "Geral".
- 'keywords': Array com 3 a 6 tags curtas em minúsculas.`;

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
  suggested_category: "PlayStation" | "Xbox" | "Nintendo" | "PC Gaming" | "Hardware" | "Geral";
  keywords: string[];
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
 * Extrai o corpo de texto e capa de uma matéria com múltiplas estratégias defensivas
 */
async function scrapeArticle(item: Parser.Item, feedConfig: FeedConfig): Promise<ScrapedContent> {
  const url = item.link?.trim() || "";
  const originalTitle = item.title?.trim() || "Sem título";
  let cleanText = "";
  let imageUrl: string | null = null;

  // 1. Tentar obter imagem das tags RSS
  if (item.enclosure && item.enclosure.url) {
    imageUrl = item.enclosure.url;
  } else if ((item as any)["media:content"]?.["$"]?.url) {
    imageUrl = (item as any)["media:content"]["$"].url;
  } else if ((item as any)["media:thumbnail"]?.["$"]?.url) {
    imageUrl = (item as any)["media:thumbnail"]["$"].url;
  }

  // 2. Extração primária via @extractus/article-extractor
  try {
    const article = await extract(url);
    if (article && article.content) {
      cleanText = cleanHtmlText(article.content);
      if (!imageUrl && article.image) {
        imageUrl = article.image;
      }
    }
  } catch (error: any) {
    // Falha esperada em sites com anti-bot (ex: 403 no Nintendo Life / IGN)
    // O pipeline continuará com a estratégia de fallback abaixo
  }

  // 3. Fallback: Usar conteúdo já embutido no item RSS
  if (!cleanText || cleanText.length < 150) {
    const rawFeedHtml =
      (item as any)["content:encoded"] || item.content || item.contentSnippet || (item as any).summary || "";

    if (rawFeedHtml) {
      cleanText = cleanHtmlText(rawFeedHtml);

      // Tentar capturar imagem do HTML do feed caso ainda não tenhamos capa
      if (!imageUrl && rawFeedHtml.includes("<img")) {
        const $ = cheerio.load(rawFeedHtml);
        const imgSrc = $("img").first().attr("src");
        if (imgSrc && imgSrc.startsWith("http")) {
          imageUrl = imgSrc;
        }
      }
    }
  }

  // Se a imagem ainda for nula, seleciona uma capa padrão temática
  if (!imageUrl) {
    const hash = Math.abs(originalTitle.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0));
    imageUrl = FALLBACK_COVERS[hash % FALLBACK_COVERS.length];
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
                enum: ["PlayStation", "Xbox", "Nintendo", "PC Gaming", "Hardware", "Geral"],
              },
              keywords: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
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
      // Se der erro de cota ou modelo 404, tenta o próximo modelo
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
      headers: { "User-Agent": "AIGamePortal-Ingestion/1.0" },
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

// ============================================================================
// PIPELINE PRINCIPAL DE EXECUÇÃO
// ============================================================================

export async function runNewsSync() {
  const startTime = Date.now();
  console.log("====================================================================");
  console.log("🎮 [AIGamePortal] Iniciando Pipeline de Ingestão de Notícias Gamer");
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
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    },
    timeout: 12000,
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
    let feedData: Parser.Output<Parser.Item>;

    try {
      feedData = await parser.parseURL(feedConfig.url);
      totalFeedsRead++;
    } catch (feedError: any) {
      console.error(`❌ Falha ao obter feed "${feedConfig.name}": ${feedError?.message || feedError}`);
      totalErrors++;
      continue; // Não interrompe os demais feeds
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
          source_original_url: itemUrl,
          source_original_title: itemTitle,
          game_metadata: generated.game_metadata || {},
          community_sentiment: generated.community_sentiment || null,
          embedding: embedding || null,
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
  console.log("📊 [AIGamePortal] Relatório de Execução do Pipeline");
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

// Execução direta via CLI (tsx scripts/sync-news.ts)
if (require.main === module || process.argv[1]?.endsWith("sync-news.ts")) {
  runNewsSync().catch((err) => {
    console.error("💥 Erro fatal não tratado no pipeline de notícias:", err);
    process.exit(1);
  });
}
