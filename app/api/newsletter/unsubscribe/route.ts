import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/database";

export const dynamic = "force-dynamic";

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes("your-project")) {
    return null;
  }

  return createClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
    },
  });
}

/**
 * Endpoint de Descadastro da Newsletter (Unsubscribe)
 * Rota: GET /api/newsletter/unsubscribe?email=...
 *
 * Atualiza is_active para false e registra unsubscribed_at,
 * redirecionando para a página de confirmação amigável.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const rawEmail = searchParams.get("email");
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://aigameportal.com").replace(/\/+$/, "");

  if (!rawEmail) {
    return NextResponse.redirect(new URL("/newsletter/unsubscribe?status=missing_email", siteUrl));
  }

  const cleanEmail = rawEmail.trim().toLowerCase();
  const supabase = getSupabaseClient();

  if (!supabase) {
    // Redireciona com status simulado se Supabase offline
    return NextResponse.redirect(
      new URL(`/newsletter/unsubscribe?status=success&email=${encodeURIComponent(cleanEmail)}`, siteUrl)
    );
  }

  try {
    const { error } = await (supabase.from("newsletter_subscribers") as any)
      .update({
        is_active: false,
        unsubscribed_at: new Date().toISOString(),
      })
      .eq("email", cleanEmail);

    if (error) {
      console.error("[Newsletter Unsubscribe] Erro ao desativar inscrito:", error);
      return NextResponse.redirect(
        new URL(`/newsletter/unsubscribe?status=error&email=${encodeURIComponent(cleanEmail)}`, siteUrl)
      );
    }

    return NextResponse.redirect(
      new URL(`/newsletter/unsubscribe?status=success&email=${encodeURIComponent(cleanEmail)}`, siteUrl)
    );
  } catch (error) {
    console.error("[Newsletter Unsubscribe] Erro inesperado:", error);
    return NextResponse.redirect(
      new URL(`/newsletter/unsubscribe?status=error&email=${encodeURIComponent(cleanEmail)}`, siteUrl)
    );
  }
}
