import { NextRequest, NextResponse } from "next/server";
import { recordAffiliateClick } from "@/lib/data/affiliates";

export const dynamic = "force-dynamic";

/**
 * Endpoint de Smart Search Fallback (Forma 2 de Automação de Afiliados)
 * Rota: GET /api/out/search?q=...&postId=...&ref=...
 *
 * 1. Recebe a query de busca (ex: nome do jogo ou console citado no artigo).
 * 2. Registra o evento de clique na tabela `affiliate_clicks` de forma assíncrona.
 * 3. Redireciona com HTTP 307 para a busca oficial da Amazon Brasil com a tag aigameportal-20.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const rawQuery = searchParams.get("q") || "Jogos PS5 Xbox Nintendo PC";
  const postId = searchParams.get("postId");
  const directRef = searchParams.get("ref");
  const headerReferer = request.headers.get("referer");
  const userAgent = request.headers.get("user-agent") || "";
  const referrer = directRef || headerReferer || "";

  const amazonTag = process.env.NEXT_PUBLIC_AMAZON_AFFILIATE_TAG || "aigameportal-20";
  const cleanQuery = rawQuery.replace(/[^\w\s-]/gi, "").trim().slice(0, 100) || "Games";
  const encodedQuery = encodeURIComponent(cleanQuery);
  const targetUrl = `https://www.amazon.com.br/s?k=${encodedQuery}&tag=${amazonTag}`;

  // Registro assíncrono do clique de busca inteligente
  recordAffiliateClick({
    productId: `smart-search-${cleanQuery.toLowerCase().replace(/\s+/g, "-").slice(0, 30)}`,
    postId: postId || null,
    referrer: referrer || null,
    userAgent: userAgent || null,
  }).catch((err) => {
    console.error("[Affiliate Smart Search] Erro ao registrar clique:", err);
  });

  const response = NextResponse.redirect(targetUrl, { status: 307 });
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");

  return response;
}
