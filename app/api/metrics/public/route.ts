import { NextRequest, NextResponse } from "next/server";
import { getPublicMetricsSummary } from "@/lib/data/metrics-summary";
import { rateLimit, createRateLimitResponse } from "@/lib/utils/rate-limit";

export const dynamic = "force-dynamic";

/**
 * Endpoint de Métricas Públicas Sanitizadas
 * Exibe exclusivamente contadores gerais inofensivos (total de posts e distribuição de plataformas).
 * Omitindo estritamente quaisquer dados comerciais, afiliados, GMV, comissões, custos de API,
 * dados de assinantes da newsletter ou precificação de pacotes de patrocínio.
 */
export async function GET(request: NextRequest) {
  // Rate Limit: Máximo de 60 requisições por minuto por IP
  const rl = await rateLimit(request, {
    limit: 60,
    windowSeconds: 60,
    prefix: "metrics_public",
  });

  if (!rl.success) {
    return createRateLimitResponse(
      rl,
      "Limite de requisições excedido para métricas públicas. Por favor, aguarde."
    );
  }

  try {
    const data = await getPublicMetricsSummary();

    return NextResponse.json(
      {
        success: true,
        data,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
          "CDN-Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
          "Cloudflare-CDN-Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (error: any) {
    console.error("[API Metrics Public] Erro ao obter métricas públicas:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Falha ao obter métricas públicas.",
      },
      { status: 500 }
    );
  }
}
