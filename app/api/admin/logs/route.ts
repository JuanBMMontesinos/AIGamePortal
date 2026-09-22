import { NextRequest, NextResponse } from "next/server";
import { isServerAdminAuthenticated } from "@/lib/utils/admin-auth";
import { rateLimit, createRateLimitResponse } from "@/lib/utils/rate-limit";
import {
  getSystemLogsAdmin,
  getSystemLogsKPIsAdmin,
  resolveLogAdmin,
  purgeOldLogsAdmin,
  GetSystemLogsAdminParams,
} from "@/lib/data/logs-admin";
import {
  FailureReasonCode,
  LogLevel,
  LogService,
  LogStatus,
} from "@/types/database";

export const dynamic = "force-dynamic";

/**
 * Cabeçalhos de segurança obrigatórios para respostas administrativas sensíveis
 */
const SECURITY_HEADERS = {
  "Cache-Control": "private, no-cache, no-store, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

/**
 * Validação centralizada de autenticação e rate limiting para o endpoint de logs
 */
async function validateAdminRequest(
  request: NextRequest
): Promise<NextResponse | null> {
  // 1. Mitigação de DoS e Brute-force (OWASP Top 10 A04: Insecure Design)
  const rlResult = await rateLimit(request, {
    limit: 30,
    windowSeconds: 60,
    prefix: "admin_logs_api",
  });

  if (!rlResult.success) {
    return createRateLimitResponse(
      rlResult,
      "Muitas requisições ao endpoint administrativo de logs. Por favor, aguarde antes de tentar novamente."
    );
  }

  // 2. Autenticação Administrativa Rigorosa (OWASP Top 10 A01: Broken Access Control)
  const isAuthenticated = await isServerAdminAuthenticated(request);
  if (!isAuthenticated) {
    return NextResponse.json(
      { success: false, error: "Acesso administrativo não autorizado." },
      { status: 401, headers: SECURITY_HEADERS }
    );
  }

  return null;
}

/**
 * GET /api/admin/logs
 * Consulta lista paginada e filtrada de logs de IA e telemetria de disparos, acompanhada de KPIs em tempo real.
 */
export async function GET(request: NextRequest) {
  const authResponse = await validateAdminRequest(request);
  if (authResponse) return authResponse;

  try {
    const { searchParams } = request.nextUrl;

    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "20", 10) || 20)
    );

    const service = (searchParams.get("service") || undefined) as LogService | undefined;
    const level = (searchParams.get("level") || undefined) as LogLevel | undefined;
    const status = (searchParams.get("status") || undefined) as LogStatus | undefined;
    const failure_reason_code = (searchParams.get("failure_reason_code") ||
      undefined) as FailureReasonCode | undefined;
    const incompleteOnly = searchParams.get("incompleteOnly") === "true";
    const search = searchParams.get("search") || undefined;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;

    const params: GetSystemLogsAdminParams = {
      page,
      limit,
      service,
      level,
      status,
      failure_reason_code,
      incompleteOnly,
      search,
      startDate,
      endDate,
    };

    // Executa busca dos logs e cálculo de métricas agregadas em paralelo
    const [logsResult, kpis] = await Promise.all([
      getSystemLogsAdmin(params),
      getSystemLogsKPIsAdmin(),
    ]);

    return NextResponse.json(
      {
        success: true,
        logs: logsResult.logs,
        total: logsResult.total,
        page: logsResult.page,
        totalPages: logsResult.totalPages,
        limit: logsResult.limit,
        kpis,
      },
      {
        status: 200,
        headers: SECURITY_HEADERS,
      }
    );
  } catch (err: any) {
    console.error("[API Admin Logs][GET] Erro interno:", err?.message || err);
    return NextResponse.json(
      {
        success: false,
        error: "Falha interna ao processar consulta de logs administrativos.",
      },
      {
        status: 500,
        headers: SECURITY_HEADERS,
      }
    );
  }
}

/**
 * PATCH /api/admin/logs
 * Atualiza o status de resolução de um registro de falha de telemetria.
 * Payload esperado: { logId: string, action: 'resolve', resolvedBy?: string }
 */
export async function PATCH(request: NextRequest) {
  const authResponse = await validateAdminRequest(request);
  if (authResponse) return authResponse;

  try {
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Corpo da requisição JSON inválido." },
        { status: 400, headers: SECURITY_HEADERS }
      );
    }

    const { logId, action, resolvedBy } = body || {};

    if (!logId || typeof logId !== "string") {
      return NextResponse.json(
        { success: false, error: "O campo 'logId' é obrigatório e deve ser uma string UUID." },
        { status: 400, headers: SECURITY_HEADERS }
      );
    }

    if (action !== "resolve") {
      return NextResponse.json(
        {
          success: false,
          error: "Ação não suportada. Apenas action: 'resolve' é permitida no momento.",
        },
        { status: 400, headers: SECURITY_HEADERS }
      );
    }

    const result = await resolveLogAdmin(logId, resolvedBy);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400, headers: SECURITY_HEADERS }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Ocorrência de log marcada como resolvida com sucesso.",
        log: result.log,
      },
      {
        status: 200,
        headers: SECURITY_HEADERS,
      }
    );
  } catch (err: any) {
    console.error("[API Admin Logs][PATCH] Erro interno:", err?.message || err);
    return NextResponse.json(
      {
        success: false,
        error: "Falha interna ao atualizar status de resolução do log.",
      },
      {
        status: 500,
        headers: SECURITY_HEADERS,
      }
    );
  }
}

/**
 * DELETE /api/admin/logs
 * Executa a política de retenção expurgando logs mais antigos que o limite de dias especificado.
 * Payload esperado (ou query parameter): { daysToKeep: number } (padrão: 30)
 */
export async function DELETE(request: NextRequest) {
  const authResponse = await validateAdminRequest(request);
  if (authResponse) return authResponse;

  try {
    let daysToKeep = 30;

    // Tenta extrair daysToKeep do body JSON ou da query string
    try {
      const body = await request.json();
      if (body && typeof body.daysToKeep === "number") {
        daysToKeep = body.daysToKeep;
      }
    } catch {
      const queryDays = request.nextUrl.searchParams.get("daysToKeep");
      if (queryDays) {
        daysToKeep = parseInt(queryDays, 10) || 30;
      }
    }

    if (isNaN(daysToKeep) || daysToKeep < 1) {
      return NextResponse.json(
        {
          success: false,
          error: "O parâmetro 'daysToKeep' deve ser um número inteiro maior ou igual a 1.",
        },
        { status: 400, headers: SECURITY_HEADERS }
      );
    }

    const result = await purgeOldLogsAdmin(daysToKeep);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500, headers: SECURITY_HEADERS }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: `${result.deletedCount} registros de logs anteriores a ${daysToKeep} dias foram purgados com sucesso.`,
        deletedCount: result.deletedCount,
      },
      {
        status: 200,
        headers: SECURITY_HEADERS,
      }
    );
  } catch (err: any) {
    console.error("[API Admin Logs][DELETE] Erro interno:", err?.message || err);
    return NextResponse.json(
      {
        success: false,
        error: "Falha interna ao executar expurgo de logs antigos.",
      },
      {
        status: 500,
        headers: SECURITY_HEADERS,
      }
    );
  }
}
