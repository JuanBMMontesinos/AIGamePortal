import { NextRequest, NextResponse } from "next/server";
import { getAffiliateProductById, recordAffiliateClick } from "@/lib/data/affiliates";

export const dynamic = "force-dynamic";

/**
 * Endpoint de Redirecionamento e Tracking de Afiliados
 * Rota: GET /api/out/[id]?postId=...&ref=...
 *
 * 1. Valida o ID do produto afiliado no acervo.
 * 2. Registra o evento de clique na tabela `affiliate_clicks` de forma assíncrona.
 * 3. Redireciona com HTTP 307 (Temporary Redirect) para a URL com tag de afiliado.
 * 4. Trata produtos inválidos/inativos com redirecionamento de segurança para a Home.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://aigameportal.com").replace(/\/+$/, "");

  // Se ID não fornecido, redireciona para a home
  if (!id || typeof id !== "string" || id.trim().length === 0) {
    return NextResponse.redirect(new URL("/", siteUrl), { status: 307 });
  }

  const cleanId = id.trim();
  const searchParams = request.nextUrl.searchParams;
  const postId = searchParams.get("postId");
  const directRef = searchParams.get("ref");
  const headerReferer = request.headers.get("referer");
  const userAgent = request.headers.get("user-agent") || "";
  const referrer = directRef || headerReferer || "";

  try {
    const product = await getAffiliateProductById(cleanId);

    // Se o produto não existe ou está inativo, faz fallback para a home
    if (!product || !product.is_active || !product.affiliate_url) {
      console.warn(`[Affiliate Out] Produto não encontrado ou inativo para id: ${cleanId}`);
      return NextResponse.redirect(new URL("/", siteUrl), { status: 307 });
    }

    // Registro analítico assíncrono (não bloqueante para velocidade do usuário)
    recordAffiliateClick({
      productId: product.id,
      postId: postId || null,
      referrer: referrer || null,
      userAgent: userAgent || null,
    }).catch((err) => {
      console.error("[Affiliate Out] Erro ao registrar clique:", err);
    });

    // Retorna redirecionamento HTTP 307 para o link de parceiro com headers anti-cache
    const response = NextResponse.redirect(product.affiliate_url, { status: 307 });
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");

    return response;
  } catch (error) {
    console.error("[Affiliate Out] Falha no processamento de redirecionamento:", error);
    return NextResponse.redirect(new URL("/", siteUrl), { status: 307 });
  }
}
