import { NextRequest, NextResponse } from "next/server";
import { getB2BMetricsSummary } from "@/lib/data/metrics-summary";

export const dynamic = "force-dynamic";

/**
 * Endpoint de Telemetria Interna e Métricas B2B
 * Consolida dados agregados do Supabase com resposta cacheada em Edge/Memória
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get("refresh") === "true";

    // Busca o resumo consolidado com cache de 5 minutos
    const summary = await getB2BMetricsSummary(forceRefresh);

    return NextResponse.json(
      {
        success: true,
        data: summary,
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
    console.error("[API Metrics Summary] Erro ao consolidar métricas:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Falha interna ao gerar resumo de telemetria.",
        message: error?.message || "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}
