import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { safeConstantTimeCompare } from "@/lib/utils/security";
import { rateLimit, createRateLimitResponse } from "@/lib/utils/rate-limit";

/**
 * Endpoint de Revalidação Incremental sob Demanda (ISR)
 * Disparado via Webhook HTTP pelo n8n ao inserir ou atualizar matérias no Supabase.
 *
 * Exemplo de chamada:
 * POST ou GET /api/revalidate?secret=SEU_SECRET&slug=ghost-of-yotei-gameplay-ps5-pro-combate
 */
export async function GET(request: NextRequest) {
  return handleRevalidation(request);
}

export async function POST(request: NextRequest) {
  return handleRevalidation(request);
}

async function handleRevalidation(request: NextRequest) {
  // Rate Limit: 10 revalidações por IP por minuto (60s)
  const rl = await rateLimit(request, {
    limit: 10,
    windowSeconds: 60,
    prefix: "revalidate",
  });

  if (!rl.success) {
    return createRateLimitResponse(
      rl,
      "Muitas requisições de revalidação de cache. Por favor, aguarde antes de tentar novamente."
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const secret = searchParams.get("secret");
  const slug = searchParams.get("slug");
  const path = searchParams.get("path");
  const tag = searchParams.get("tag");

  const expectedSecret = process.env.REVALIDATION_SECRET || "aigameportal_super_secret_token_2026";

  // 1. Validação de token de segurança
  if (!secret || !safeConstantTimeCompare(secret, expectedSecret)) {
    return NextResponse.json(
      {
        revalidated: false,
        message: "Token secreto de revalidação inválido ou ausente.",
      },
      { status: 401 }
    );
  }

  const revalidatedPaths: string[] = [];

  try {
    // 2. Revalidação por tag (se especificada)
    if (tag) {
      revalidateTag(tag);
    }

    // 3. Revalidação de matéria específica por slug
    if (slug) {
      const articlePath = `/noticias/${slug}`;
      revalidatePath(articlePath);
      revalidatedPaths.push(articlePath);

      // Sempre revalida também a Homepage para que o novo card apareça no grid
      revalidatePath("/");
      revalidatedPaths.push("/");
    }

    // 4. Revalidação de caminho arbitrário (ex: /categoria/playstation ou /)
    if (path) {
      revalidatePath(path);
      if (!revalidatedPaths.includes(path)) {
        revalidatedPaths.push(path);
      }
    }

    // Se nenhum parâmetro foi passado além do segredo, revalida ao menos a Home
    if (!slug && !path && !tag) {
      revalidatePath("/");
      revalidatedPaths.push("/");
    }

    return NextResponse.json({
      revalidated: true,
      paths: revalidatedPaths,
      tag: tag || null,
      timestamp: new Date().toISOString(),
      message: "Cache ISR atualizado com sucesso.",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        revalidated: false,
        message: "Erro interno durante a revalidação de cache.",
        error: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
