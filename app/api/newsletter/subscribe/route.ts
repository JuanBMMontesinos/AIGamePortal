import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/database";
import { rateLimit, createRateLimitResponse } from "@/lib/utils/rate-limit";

export const dynamic = "force-dynamic";

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

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
 * Endpoint de Inscrição na Newsletter Gamer
 * Rota: POST /api/newsletter/subscribe
 * Body: { email: string }
 */
export async function POST(request: NextRequest) {
  // Rate Limit: 3 inscrições por IP por minuto (60s)
  const rl = await rateLimit(request, {
    limit: 3,
    windowSeconds: 60,
    prefix: "newsletter_subscribe",
  });

  if (!rl.success) {
    return createRateLimitResponse(
      rl,
      "Muitas tentativas de inscrição a partir deste IP. Por favor, aguarde antes de tentar novamente."
    );
  }

  try {
    const body = await request.json().catch(() => null);

    if (!body || typeof body.email !== "string") {
      return NextResponse.json(
        { success: false, error: "Endereço de e-mail é obrigatório." },
        { status: 400 }
      );
    }

    const cleanEmail = body.email.trim().toLowerCase();

    // Validação de formato e tamanho
    if (!cleanEmail || cleanEmail.length > 255 || !EMAIL_REGEX.test(cleanEmail)) {
      return NextResponse.json(
        { success: false, error: "Por favor, insira um e-mail válido (ex: gamer@dominio.com)." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // Fallback amigável se Supabase não estiver configurado em ambiente local de teste
    if (!supabase) {
      console.warn("[Newsletter Subscribe] Supabase não configurado. Simulando inscrição em mock local:", cleanEmail);
      return NextResponse.json(
        {
          success: true,
          message: "🎉 Inscrição confirmada! Você receberá nosso resumo gamer todo domingo.",
          mock: true,
        },
        { status: 200 }
      );
    }

    // 1. Verifica se o e-mail já existe na base
    const { data, error: selectError } = await supabase
      .from("newsletter_subscribers")
      .select("*")
      .eq("email", cleanEmail)
      .maybeSingle();

    if (selectError) {
      console.error("[Newsletter Subscribe] Erro ao consultar inscrito:", selectError);
      return NextResponse.json(
        { success: false, error: "Falha ao verificar inscrição. Tente novamente mais tarde." },
        { status: 500 }
      );
    }

    const existing = data as unknown as { id: string; email: string; is_active: boolean } | null;

    // 2. Trata caso já inscrito
    if (existing) {
      if (existing.is_active) {
        return NextResponse.json(
          {
            success: true,
            alreadySubscribed: true,
            message: "Você já está cadastrado em nossa lista! O próximo resumo chegará no domingo.",
          },
          { status: 200 }
        );
      }

      // Reativa inscrição previamente cancelada
      const { error: updateError } = await (supabase.from("newsletter_subscribers") as any)
        .update({
          is_active: true,
          unsubscribed_at: null,
          subscribed_at: new Date().toISOString(),
        })
        .eq("id", existing.id);

      if (updateError) {
        console.error("[Newsletter Subscribe] Erro ao reativar inscrito:", updateError);
        return NextResponse.json(
          { success: false, error: "Falha ao reativar inscrição. Tente novamente." },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          message: "🎉 Bem-vindo de volta! Sua inscrição foi reativada com sucesso.",
        },
        { status: 200 }
      );
    }

    // 3. Cadastra novo assinante
    const { error: insertError } = await (supabase.from("newsletter_subscribers") as any)
      .insert({
        email: cleanEmail,
        is_active: true,
        subscribed_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error("[Newsletter Subscribe] Erro ao salvar novo inscrito:", insertError);
      return NextResponse.json(
        { success: false, error: "Não foi possível concluir sua inscrição. Tente novamente." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "🎉 Inscrição confirmada! Você receberá nosso resumo gamer todo domingo.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[Newsletter Subscribe] Erro inesperado:", error);
    return NextResponse.json(
      { success: false, error: "Ocorreu um erro interno. Tente novamente em instantes." },
      { status: 500 }
    );
  }
}
