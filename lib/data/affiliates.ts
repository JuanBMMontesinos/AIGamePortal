import { createServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { AffiliateProduct, AffiliateClick, Post } from "@/types/database";

export const MOCK_AFFILIATE_PRODUCTS: AffiliateProduct[] = [
  {
    id: "aff-prod-ps5-slim",
    title: "Console PlayStation 5 Slim 1TB Edição Digital",
    category: "Console",
    keywords: ["playstation 5", "ps5", "ps5 slim", "playstation 5 slim", "ps5 pro", "playstation 5 pro"],
    store_name: "Amazon Brasil",
    affiliate_url: "https://www.amazon.com.br/dp/B0CL5KNB9M?tag=aigameportal-20",
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
    affiliate_url: "https://www.amazon.com.br/dp/B088GH7D67?tag=aigameportal-20",
    image_url: "https://images.unsplash.com/photo-1592840496694-26d035b52b48?q=80&w=800&auto=format&fit=crop",
    price_estimate: 429.0,
    is_active: true,
    created_at: "2026-09-14T00:00:00Z",
    updated_at: "2026-09-14T00:00:00Z",
  },
  {
    id: "aff-prod-rtx-4060",
    title: "Placa de Vídeo ASUS Dual GeForce RTX 4060 EVO OC 8GB GDDR6",
    category: "Hardware",
    keywords: ["rtx 4060", "geforce rtx 4060", "placa rtx 4060", "nvidia rtx 4060", "rtx 4070"],
    store_name: "KaBuM!",
    affiliate_url: "https://www.kabum.com.br/produto/525642/placa-de-video-rtx-4060-asus?partner=aigameportal",
    image_url: "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?q=80&w=800&auto=format&fit=crop",
    price_estimate: 2199.9,
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
    affiliate_url: "https://www.amazon.com.br/dp/B08H75RTZ8?tag=aigameportal-20",
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
    affiliate_url: "https://www.amazon.com.br/dp/B098RKWHHZ?tag=aigameportal-20",
    image_url: "https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?q=80&w=800&auto=format&fit=crop",
    price_estimate: 2299.0,
    is_active: true,
    created_at: "2026-09-14T00:00:00Z",
    updated_at: "2026-09-14T00:00:00Z",
  },
  {
    id: "aff-prod-elden-ring",
    title: "Elden Ring: Shadow of the Erdtree Edition (PC Steam)",
    category: "Jogo",
    keywords: ["elden ring", "shadow of the erdtree", "fromsoftware", "hidetaka miyazaki"],
    store_name: "Nuuvem",
    affiliate_url: "https://www.nuuvem.com/item/elden-ring-shadow-of-the-erdtree?partner=aigameportal",
    image_url: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=800&auto=format&fit=crop",
    price_estimate: 199.9,
    is_active: true,
    created_at: "2026-09-14T00:00:00Z",
    updated_at: "2026-09-14T00:00:00Z",
  },
  {
    id: "aff-prod-rtx-4070-super",
    title: "Placa de Vídeo Galax GeForce RTX 4070 Super 1-Click OC 12GB",
    category: "Hardware",
    keywords: ["rtx 4070 super", "geforce rtx 4070 super", "rtx 4080", "dlss 3"],
    store_name: "KaBuM!",
    affiliate_url: "https://www.kabum.com.br/produto/519532/placa-de-video-rtx-4070-super-galax?partner=aigameportal",
    image_url: "https://images.unsplash.com/photo-1591488320449-011701bb6704?q=80&w=800&auto=format&fit=crop",
    price_estimate: 4399.0,
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
    affiliate_url: "https://www.amazon.com.br/dp/B0CP9M84P4?tag=aigameportal-20",
    image_url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop",
    price_estimate: 999.0,
    is_active: true,
    created_at: "2026-09-14T00:00:00Z",
    updated_at: "2026-09-14T00:00:00Z",
  },
];

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
 * Busca um produto específico pelo ID ou UUID.
 */
export async function getAffiliateProductById(
  id: string
): Promise<AffiliateProduct | null> {
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

    const { data, error } = await supabase
      .from("affiliate_clicks")
      .insert({
        product_id: payload.productId,
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
 * Seleciona a oferta mais relevante para um post caso nenhum produto específico
 * tenha sido determinado ou para reforçar a recomendação no AffiliateDealCard.
 */
export function findBestAffiliateDeal(
  post: Partial<Post>,
  products: AffiliateProduct[]
): AffiliateProduct | null {
  const activeProducts = products.filter((p) => p.is_active);
  if (activeProducts.length === 0) return null;

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

    // Pontuação por palavras-chave
    for (const keyword of product.keywords) {
      const lowerKw = keyword.toLowerCase().trim();
      if (lowerKw && textToScan.includes(lowerKw)) {
        // Títulos e metadados têm maior peso
        if (post.title?.toLowerCase().includes(lowerKw)) {
          score += 10;
        } else {
          score += 3;
        }
      }
    }

    // Afinidade por categoria
    const postCategory = (post.categories?.name || "").toLowerCase();
    if (postCategory.includes("playstation") && product.keywords.some((k) => k.includes("ps5") || k.includes("playstation"))) {
      score += 5;
    } else if (postCategory.includes("xbox") && product.keywords.some((k) => k.includes("xbox"))) {
      score += 5;
    } else if (postCategory.includes("nintendo") && product.keywords.some((k) => k.includes("switch") || k.includes("nintendo"))) {
      score += 5;
    } else if (postCategory.includes("pc") && (product.category === "Hardware" || product.category === "PC")) {
      score += 5;
    } else if (postCategory.includes("hardware") && product.category === "Hardware") {
      score += 8;
    }

    if (score > highestScore) {
      highestScore = score;
      bestProduct = product;
    }
  }

  // Se nenhuma pontuação relevante, retorna o primeiro produto disponível
  return highestScore > 0 ? bestProduct : activeProducts[0];
}
