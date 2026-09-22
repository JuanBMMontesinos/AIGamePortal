import { NextRequest, NextResponse } from "next/server";
import { getB2BMetricsSummary } from "@/lib/data/metrics-summary";
import { isServerAdminAuthenticated } from "@/lib/utils/admin-auth";
import { rateLimit, createRateLimitResponse } from "@/lib/utils/rate-limit";

export const dynamic = "force-dynamic";

/**
 * Endpoint de Telemetria Interna e Métricas B2B (Restrito a Administradores)
 * Consolida dados agregados de telemetria, finanças, audiência e pacotes comerciais.
 * Protegido por autenticação HMAC-SHA256 / x-admin-key e rate limiting contra DoS.
 */
export async function GET(request: NextRequest) {
  // 1. Verificação de Autenticação Administrativa
  const isAuthenticated = await isServerAdminAuthenticated(request);
  if (!isAuthenticated) {
    return NextResponse.json(
      {
        success: false,
        error: "Acesso não autorizado às métricas internas.",
      },
      {
        status: 401,
        headers: {
          "Cache-Control": "private, no-cache, no-store, must-revalidate",
        },
      }
    );
  }

  // 2. Rate Limit Geral do Endpoint (Máximo de 10 requisições por minuto por IP)
  const baseRl = await rateLimit(request, {
    limit: 10,
    windowSeconds: 60,
    prefix: "metrics_summary_endpoint",
  });

  if (!baseRl.success) {
    return createRateLimitResponse(
      baseRl,
      "Limite de requisições excedido para o endpoint de métricas administrativas (máximo 10 por minuto). Por favor, aguarde."
    );
  }

  const { searchParams } = new URL(request.url);
  const forceRefresh = searchParams.get("refresh") === "true";

  // 3. Mitigação de Cache-Buster DoS (Máximo de 3 requisições por minuto com ?refresh=true)
  if (forceRefresh) {
    const refreshRl = await rateLimit(request, {
      limit: 3,
      windowSeconds: 60,
      prefix: "metrics_summary_refresh",
    });

    if (!refreshRl.success) {
      return createRateLimitResponse(
        refreshRl,
        "Limite de atualização forçada de cache excedido (máximo 3 por minuto). Por favor, aguarde antes de atualizar novamente."
      );
    }
  }

  try {
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
          "Cache-Control": "private, no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
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
