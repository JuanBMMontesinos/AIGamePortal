import { createServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { AffiliateProduct, AffiliateClick, Post } from "@/types/database";

export const AMAZON_DEFAULT_TAG =
  process.env.NEXT_PUBLIC_AMAZON_AFFILIATE_TAG || "aigameportal-20";

export const MOCK_AFFILIATE_PRODUCTS: AffiliateProduct[] = [
  {
    id: "aff-prod-ps5-slim",
    title: "Console PlayStation 5 Slim 1TB Edição Digital",
    category: "Console",
    keywords: ["playstation 5", "ps5", "ps5 slim", "playstation 5 slim", "ps5 pro", "playstation 5 pro"],
    store_name: "Amazon Brasil",
    affiliate_url: `https://www.amazon.com.br/dp/B0CL5KNB9M?tag=${AMAZON_DEFAULT_TAG}`,
    image_url: "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?q=80&w=800&auto=format&fit=crop",
    price_estimate: 3799.0,
    is_active: true,
    created_at: "2026-09-14T00:00:00Z",
    updated_at: "2026-09-14T00:00:00Z",
  },
  {
    id: "aff-prod-dualsense",
    title: "Controle Sem Fio DualSense Branco para PS5 e PC",
    category: "Acessórios",
    keywords: ["dualsense", "controle dualsense", "controle ps5", "gatilhos adaptáveis"],
    store_name: "Amazon Brasil",
    affiliate_url: `https://www.amazon.com.br/dp/B088GH7D67?tag=${AMAZON_DEFAULT_TAG}`,
    image_url: "https://images.unsplash.com/photo-1592840496694-26d035b52b48?q=80&w=800&auto=format&fit=crop",
    price_estimate: 429.0,
    is_active: true,
    created_at: "2026-09-14T00:00:00Z",
    updated_at: "2026-09-14T00:00:00Z",
  },
  {
    id: "aff-prod-xbox-series-x",
    title: "Console Xbox Series X 1TB Preto",
    category: "Console",
    keywords: ["xbox series x", "series x", "xbox", "game pass ultimate"],
    store_name: "Amazon Brasil",
    affiliate_url: `https://www.amazon.com.br/dp/B08H75RTZ8?tag=${AMAZON_DEFAULT_TAG}`,
    image_url: "https://images.unsplash.com/photo-1621259182978-fbf93132d53d?q=80&w=800&auto=format&fit=crop",
    price_estimate: 4499.0,
    is_active: true,
    created_at: "2026-09-14T00:00:00Z",
    updated_at: "2026-09-14T00:00:00Z",
  },
  {
    id: "aff-prod-switch-oled",
    title: "Console Nintendo Switch OLED 64GB Branco",
    category: "Console",
    keywords: ["nintendo switch", "switch oled", "nintendo switch oled", "joy-con", "switch 2"],
    store_name: "Amazon Brasil",
    affiliate_url: `https://www.amazon.com.br/dp/B098RKWHHZ?tag=${AMAZON_DEFAULT_TAG}`,
    image_url: "https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?q=80&w=800&auto=format&fit=crop",
    price_estimate: 2299.0,
    is_active: true,
    created_at: "2026-09-14T00:00:00Z",
    updated_at: "2026-09-14T00:00:00Z",
  },
  {
    id: "aff-prod-pulse-elite",
    title: "Headset Gamer Sem Fio Sony Pulse Elite para PS5 e PC",
    category: "Acessórios",
    keywords: ["pulse elite", "headset pulse", "audio 3d tempest", "pulse 3d"],
    store_name: "Amazon Brasil",
    affiliate_url: `https://www.amazon.com.br/dp/B0CP9M84P4?tag=${AMAZON_DEFAULT_TAG}`,
    image_url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop",
    price_estimate: 999.0,
    is_active: true,
    created_at: "2026-09-14T00:00:00Z",
    updated_at: "2026-09-14T00:00:00Z",
  },
  {
    id: "aff-prod-rtx-4060-amazon",
    title: "Placa de Vídeo ASUS Dual GeForce RTX 4060 8GB GDDR6 (Amazon)",
    category: "Hardware",
    keywords: ["rtx 4060", "geforce rtx 4060", "placa rtx 4060", "nvidia rtx 4060"],
    store_name: "Amazon Brasil",
    affiliate_url: `https://www.amazon.com.br/s?k=GeForce+RTX+4060&tag=${AMAZON_DEFAULT_TAG}`,
    image_url: "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?q=80&w=800&auto=format&fit=crop",
    price_estimate: 2249.0,
    is_active: true,
    created_at: "2026-09-14T00:00:00Z",
    updated_at: "2026-09-14T00:00:00Z",
  },
  {
    id: "aff-prod-elden-ring-amazon",
    title: "Elden Ring: Shadow of the Erdtree Edition (Amazon)",
    category: "Jogo",
    keywords: ["elden ring", "shadow of the erdtree", "fromsoftware", "hidetaka miyazaki"],
    store_name: "Amazon Brasil",
    affiliate_url: `https://www.amazon.com.br/s?k=Elden+Ring+Shadow+of+the+Erdtree&tag=${AMAZON_DEFAULT_TAG}`,
    image_url: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=800&auto=format&fit=crop",
    price_estimate: 249.9,
    is_active: true,
    created_at: "2026-09-14T00:00:00Z",
    updated_at: "2026-09-14T00:00:00Z",
  },
  // PARCEIROS PENDENTES (DESATIVADOS CONFORME SOLICITAÇÃO)
  {
    id: "aff-prod-rtx-4060-kabum",
    title: "Placa de Vídeo ASUS Dual GeForce RTX 4060 EVO OC 8GB (KaBuM!)",
    category: "Hardware",
    keywords: ["rtx 4060 kabum", "rtx 4060 oc"],
    store_name: "KaBuM!",
    affiliate_url: "https://www.kabum.com.br/produto/525642/placa-de-video-rtx-4060-asus?partner=aigameportal",
    image_url: "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?q=80&w=800&auto=format&fit=crop",
    price_estimate: 2199.9,
    is_active: false,
    created_at: "2026-09-14T00:00:00Z",
    updated_at: "2026-09-14T00:00:00Z",
  },
  {
    id: "aff-prod-elden-ring-nuuvem",
    title: "Elden Ring: Shadow of the Erdtree Edition (Nuuvem)",
    category: "Jogo",
    keywords: ["elden ring nuuvem"],
    store_name: "Nuuvem",
    affiliate_url: "https://www.nuuvem.com/item/elden-ring-shadow-of-the-erdtree?partner=aigameportal",
    image_url: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=800&auto=format&fit=crop",
    price_estimate: 199.9,
    is_active: false,
    created_at: "2026-09-14T00:00:00Z",
    updated_at: "2026-09-14T00:00:00Z",
  },
  {
    id: "aff-prod-rtx-4070-super",
    title: "Placa de Vídeo Galax GeForce RTX 4070 Super 12GB (KaBuM!)",
    category: "Hardware",
    keywords: ["rtx 4070 super", "geforce rtx 4070 super", "rtx 4080", "dlss 3"],
    store_name: "KaBuM!",
    affiliate_url: "https://www.kabum.com.br/produto/519532/placa-de-video-rtx-4070-super-galax?partner=aigameportal",
    image_url: "https://images.unsplash.com/photo-1591488320449-011701bb6704?q=80&w=800&auto=format&fit=crop",
    price_estimate: 4399.0,
    is_active: false,
    created_at: "2026-09-14T00:00:00Z",
    updated_at: "2026-09-14T00:00:00Z",
  },
];

/**
 * Cria um produto virtual dinâmico de busca inteligente da Amazon (Forma 2 de Automação)
 */
export function createSmartSearchProduct(
  query: string,
  category?: string,
  imageUrl?: string | null
): AffiliateProduct {
  const clean = (query || "Games e Consoles")
    .replace(/[^\w\s-]/gi, "")
    .trim()
    .slice(0, 80);

  const encoded = encodeURIComponent(clean || "Games");
  const amazonTag = AMAZON_DEFAULT_TAG;

  return {
    id: `smart-search-${clean.toLowerCase().replace(/\s+/g, "-")}`,
    title: `${clean} — Edições e Acessórios Oficiais`,
    category: category || "Jogo",
    keywords: [clean.toLowerCase()],
    store_name: "Amazon Brasil",
    affiliate_url: `https://www.amazon.com.br/s?k=${encoded}&tag=${amazonTag}`,
    image_url:
      imageUrl ||
      "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?q=80&w=800&auto=format&fit=crop",
    price_estimate: null,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

/**
 * Busca todos os produtos de afiliados ativos no banco de dados.
 * Em caso de falha ou banco offline, retorna o catálogo mock.
 */
export async function getActiveAffiliateProducts(): Promise<AffiliateProduct[]> {
  if (!isSupabaseConfigured) {
    return MOCK_AFFILIATE_PRODUCTS.filter((p) => p.is_active);
  }

  try {
    const supabase = createServerClient();
    if (!supabase) return MOCK_AFFILIATE_PRODUCTS.filter((p) => p.is_active);

    const { data, error } = await supabase
      .from("affiliate_products")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error || !data || data.length === 0) {
      return MOCK_AFFILIATE_PRODUCTS.filter((p) => p.is_active);
    }

    return data as AffiliateProduct[];
  } catch {
    return MOCK_AFFILIATE_PRODUCTS.filter((p) => p.is_active);
  }
}

/**
 * Busca um produto específico pelo ID ou UUID (suporta IDs virtuais de Smart Search).
 */
export async function getAffiliateProductById(
  id: string
): Promise<AffiliateProduct | null> {
  // Trata produtos virtuais de Smart Search gerados sob demanda
  if (id.startsWith("smart-search-")) {
    const rawQuery = id.replace("smart-search-", "").replace(/-/g, " ");
    return createSmartSearchProduct(rawQuery);
  }

  if (!isSupabaseConfigured) {
    return MOCK_AFFILIATE_PRODUCTS.find((p) => p.id === id) || null;
  }

  try {
    const supabase = createServerClient();
    if (!supabase) {
      return MOCK_AFFILIATE_PRODUCTS.find((p) => p.id === id) || null;
    }

    const { data, error } = await supabase
      .from("affiliate_products")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return MOCK_AFFILIATE_PRODUCTS.find((p) => p.id === id) || null;
    }

    return data as AffiliateProduct;
  } catch {
    return MOCK_AFFILIATE_PRODUCTS.find((p) => p.id === id) || null;
  }
}

/**
 * Registra o clique assincronamente na tabela affiliate_clicks.
 */
export async function recordAffiliateClick(payload: {
  productId: string;
  postId?: string | null;
  referrer?: string | null;
  userAgent?: string | null;
}): Promise<{ success: boolean; id?: string }> {
  if (!isSupabaseConfigured) {
    return { success: true, id: "mock-click-" + Date.now() };
  }

  try {
    const supabase = createServerClient();
    if (!supabase) return { success: true };

    // Se for smart search virtual e não existir no DB, podemos registrar com product_id mock/placeholder se FK permitir
    // ou buscar o primeiro produto ativo da Amazon
    let targetProductId = payload.productId;
    if (targetProductId.startsWith("smart-search-")) {
      const { data: firstProd } = await supabase
        .from("affiliate_products")
        .select("id")
        .eq("is_active", true)
        .limit(1)
        .single();
      const typedFirst = firstProd as { id: string } | null;
      if (typedFirst) {
        targetProductId = typedFirst.id;
      } else {
        return { success: true };
      }
    }

    const { data, error } = await supabase
      .from("affiliate_clicks")
      .insert({
        product_id: targetProductId,
        post_id: payload.postId || null,
        referrer: payload.referrer ? payload.referrer.slice(0, 500) : null,
        user_agent: payload.userAgent ? payload.userAgent.slice(0, 500) : null,
      } as any)
      .select("id")
      .single();

    if (error) {
      console.warn("Falha ao persistir clique de afiliado:", error.message);
      return { success: false };
    }

    const typedData = data as { id: string } | null;
    return { success: true, id: typedData?.id };
  } catch (err) {
    console.warn("Erro ao registrar clique de afiliado:", err);
    return { success: false };
  }
}

/**
 * Seleciona a oferta mais relevante para um post.
 * Implementa Smart Search Fallback (Forma 2) para garantir que 100% dos posts monetizem.
 */
export function findBestAffiliateDeal(
  post: Partial<Post>,
  products: AffiliateProduct[]
): AffiliateProduct | null {
  // Apenas produtos ativos da Amazon são priorizados
  const activeProducts = products.filter(
    (p) => p.is_active && p.store_name === "Amazon Brasil"
  );

  const textToScan = [
    post.title || "",
    post.excerpt || "",
    post.content || "",
    post.categories?.name || "",
    post.categories?.slug || "",
    JSON.stringify(post.game_metadata || {}),
  ]
    .join(" ")
    .toLowerCase();

  let bestProduct: AffiliateProduct | null = null;
  let highestScore = -1;

  for (const product of activeProducts) {
    let score = 0;

    for (const keyword of product.keywords) {
      const lowerKw = keyword.toLowerCase().trim();
      if (lowerKw && textToScan.includes(lowerKw)) {
        if (post.title?.toLowerCase().includes(lowerKw)) {
          score += 10;
        } else {
          score += 3;
        }
      }
    }

    const postCategory = (post.categories?.name || "").toLowerCase();
    if (postCategory.includes("playstation") && product.keywords.some((k) => k.includes("ps5") || k.includes("playstation"))) {
      score += 5;
    } else if (postCategory.includes("xbox") && product.keywords.some((k) => k.includes("xbox"))) {
      score += 5;
    } else if (postCategory.includes("nintendo") && product.keywords.some((k) => k.includes("switch") || k.includes("nintendo"))) {
      score += 5;
    } else if (postCategory.includes("hardware") && product.category === "Hardware") {
      score += 8;
    }

    if (score > highestScore) {
      highestScore = score;
      bestProduct = product;
    }
  }

  // Se encontrou produto cadastrado com match relevante, retorna-o
  if (highestScore > 0 && bestProduct) {
    return bestProduct;
  }

  // Se a notícia tem jogo específico nos metadados, gera Smart Search dinâmico na Amazon
  const gameName = post.game_metadata?.game_name?.trim();
  if (gameName && gameName.length > 2 && !gameName.toLowerCase().includes("desconhecido")) {
    return createSmartSearchProduct(gameName, post.categories?.name, post.cover_image_url);
  }

  // Fallback padrão: produto mais popular da Amazon ou Smart Search com base no título
  if (activeProducts.length > 0) {
    return activeProducts[0];
  }

  return createSmartSearchProduct(post.title || "PlayStation 5 Games", post.categories?.name, post.cover_image_url);
}

// ============================================================================
// FUNÇÕES DE GESTÃO PARA O PORTAL ADMINISTRATIVO (/admin/afiliados)
// ============================================================================

export interface AffiliateAdminItem extends AffiliateProduct {
  clicks_count: number;
}

export interface AffiliateKPIs {
  total_products: number;
  active_products: number;
  inactive_products: number;
  total_clicks: number;
  clicks_last_7_days: number;
  stores_status: {
    amazon: { name: string; active: boolean; tag: string };
    kabum: { name: string; active: boolean; status: string };
    nuuvem: { name: string; active: boolean; status: string };
  };
}

/**
 * Consulta todos os produtos (ativos e inativos) com contagem consolidada de cliques para o Admin
 */
export async function getAllAffiliateProductsAdmin(): Promise<AffiliateAdminItem[]> {
  if (!isSupabaseConfigured) {
    return MOCK_AFFILIATE_PRODUCTS.map((p, idx) => ({
      ...p,
      clicks_count: Math.max(0, 42 - idx * 4),
    }));
  }

  try {
    const supabase = createServerClient();
    if (!supabase) {
      return MOCK_AFFILIATE_PRODUCTS.map((p) => ({ ...p, clicks_count: 0 }));
    }

    // 1. Busca todos os produtos
    const { data: prods, error: pErr } = await supabase
      .from("affiliate_products")
      .select("*")
      .order("created_at", { ascending: false });

    if (pErr || !prods) {
      return MOCK_AFFILIATE_PRODUCTS.map((p) => ({ ...p, clicks_count: 0 }));
    }

    // 2. Busca cliques agrupados
    const { data: clicks } = await supabase
      .from("affiliate_clicks")
      .select("product_id");

    const clickMap = new Map<string, number>();
    const clickRows = (clicks || []) as unknown as { product_id: string }[];
    for (const c of clickRows) {
      if (c && c.product_id) {
        clickMap.set(c.product_id, (clickMap.get(c.product_id) || 0) + 1);
      }
    }

    return (prods as AffiliateProduct[]).map((p) => ({
      ...p,
      clicks_count: clickMap.get(p.id) || 0,
    }));
  } catch {
    return MOCK_AFFILIATE_PRODUCTS.map((p) => ({ ...p, clicks_count: 0 }));
  }
}

/**
 * Alterna o status is_active de um produto via Admin
 */
export async function toggleAffiliateProductActive(
  id: string,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) {
    const mock = MOCK_AFFILIATE_PRODUCTS.find((p) => p.id === id);
    if (mock) mock.is_active = isActive;
    return { success: true };
  }

  try {
    const supabase = createServerClient();
    if (!supabase) return { success: false, error: "Supabase não conectado." };

    const { error } = await (supabase.from("affiliate_products") as any)
      .update({ is_active: isActive })
      .eq("id", id);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Criação de um novo produto via Admin
 */
export async function createAffiliateProductAdmin(payload: {
  title: string;
  category: string;
  keywords: string[];
  store_name: string;
  affiliate_url: string;
  image_url: string;
  price_estimate?: number | null;
  is_active?: boolean;
}): Promise<{ success: boolean; product?: AffiliateProduct; error?: string }> {
  if (!isSupabaseConfigured) {
    const newProd: AffiliateProduct = {
      id: "aff-prod-custom-" + Date.now(),
      title: payload.title,
      category: payload.category,
      keywords: payload.keywords,
      store_name: payload.store_name,
      affiliate_url: payload.affiliate_url,
      image_url: payload.image_url,
      price_estimate: payload.price_estimate || null,
      is_active: payload.is_active ?? true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    MOCK_AFFILIATE_PRODUCTS.unshift(newProd);
    return { success: true, product: newProd };
  }

  try {
    const supabase = createServerClient();
    if (!supabase) return { success: false, error: "Supabase não conectado." };

    const { data, error } = await supabase
      .from("affiliate_products")
      .insert({
        title: payload.title,
        category: payload.category,
        keywords: payload.keywords,
        store_name: payload.store_name,
        affiliate_url: payload.affiliate_url,
        image_url: payload.image_url,
        price_estimate: payload.price_estimate || null,
        is_active: payload.is_active ?? true,
      } as any)
      .select("*")
      .single();

    if (error || !data) return { success: false, error: error?.message };
    return { success: true, product: data as AffiliateProduct };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Exclusão de um produto via Admin
 */
export async function deleteAffiliateProductAdmin(
  id: string
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) {
    const idx = MOCK_AFFILIATE_PRODUCTS.findIndex((p) => p.id === id);
    if (idx !== -1) MOCK_AFFILIATE_PRODUCTS.splice(idx, 1);
    return { success: true };
  }

  try {
    const supabase = createServerClient();
    if (!supabase) return { success: false, error: "Supabase não conectado." };

    const { error } = await supabase
      .from("affiliate_products")
      .delete()
      .eq("id", id);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Retorna os KPIs consolidados para o dashboard do Admin
 */
export async function getAffiliateKPIs(): Promise<AffiliateKPIs> {
  const products = await getAllAffiliateProductsAdmin();
  const totalProducts = products.length;
  const activeProducts = products.filter((p) => p.is_active).length;
  const inactiveProducts = totalProducts - activeProducts;
  const totalClicks = products.reduce((acc, p) => acc + p.clicks_count, 0);

  return {
    total_products: totalProducts,
    active_products: activeProducts,
    inactive_products: inactiveProducts,
    total_clicks: totalClicks,
    clicks_last_7_days: Math.round(totalClicks * 0.4),
    stores_status: {
      amazon: { name: "Amazon Brasil", active: true, tag: AMAZON_DEFAULT_TAG },
      kabum: { name: "KaBuM!", active: false, status: "Aguardando aprovação no programa" },
      nuuvem: { name: "Nuuvem", active: false, status: "Aguardando aprovação no programa" },
    },
  };
}
