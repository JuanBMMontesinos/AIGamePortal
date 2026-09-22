import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  getAllAffiliateProductsAdmin,
  getAffiliateKPIs,
  toggleAffiliateProductActive,
  createAffiliateProductAdmin,
  deleteAffiliateProductAdmin,
} from "@/lib/data/affiliates";
import { safeConstantTimeCompare } from "@/lib/utils/security";

const ADMIN_SECRET = process.env.ADMIN_SECRET_KEY || "aigameportal_admin_2026";
const COOKIE_NAME = "admin_session";
const SESSION_TOKEN = "aigameportal_admin_authenticated_v1";

async function isAuthorized(request: NextRequest): Promise<boolean> {
  const headerKey = request.headers.get("x-admin-key");
  if (headerKey && safeConstantTimeCompare(headerKey, ADMIN_SECRET)) return true;

  const cookieStore = await cookies();
  const session = cookieStore.get(COOKIE_NAME);
  return Boolean(session?.value && safeConstantTimeCompare(session.value, SESSION_TOKEN));
}

/**
 * Listagem e KPIs para o Painel Admin
 */
export async function GET(request: NextRequest) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ error: "Acesso não autorizado." }, { status: 401 });
  }

  try {
    const [products, kpis] = await Promise.all([
      getAllAffiliateProductsAdmin(),
      getAffiliateKPIs(),
    ]);

    return NextResponse.json({ products, kpis });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Falha ao carregar dados de afiliados", details: err?.message },
      { status: 500 }
    );
  }
}

/**
 * Cadastro de Novo Produto Afiliado
 */
export async function POST(request: NextRequest) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ error: "Acesso não autorizado." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, category, keywords, store_name, affiliate_url, image_url, price_estimate, is_active } = body;

    if (!title || !store_name || !affiliate_url) {
      return NextResponse.json(
        { error: "Campos obrigatórios: title, store_name, affiliate_url" },
        { status: 400 }
      );
    }

    const cleanKeywords = Array.isArray(keywords)
      ? keywords
      : typeof keywords === "string"
      ? keywords.split(",").map((k: string) => k.trim()).filter(Boolean)
      : [];

    const result = await createAffiliateProductAdmin({
      title,
      category: category || "Jogo",
      keywords: cleanKeywords,
      store_name,
      affiliate_url,
      image_url: image_url || "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?q=80&w=800&auto=format&fit=crop",
      price_estimate: price_estimate ? Number(price_estimate) : null,
      is_active: is_active ?? true,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, product: result.product });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}

/**
 * Atualização / Toggle de Status (is_active)
 */
export async function PATCH(request: NextRequest) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ error: "Acesso não autorizado." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, is_active } = body;

    if (!id || typeof is_active !== "boolean") {
      return NextResponse.json(
        { error: "Parâmetros 'id' e 'is_active' são obrigatórios." },
        { status: 400 }
      );
    }

    const result = await toggleAffiliateProductActive(id, is_active);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, is_active });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}

/**
 * Exclusão de Produto
 */
export async function DELETE(request: NextRequest) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ error: "Acesso não autorizado." }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID do produto é obrigatório." }, { status: 400 });
  }

  const result = await deleteAffiliateProductAdmin(id);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
