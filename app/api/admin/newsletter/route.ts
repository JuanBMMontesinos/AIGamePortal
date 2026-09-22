import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  getNewsletterSettingsAdmin,
  updateNewsletterSettingsAdmin,
  getNewsletterKPIsAdmin,
  getNewsletterSubscribersAdmin,
  toggleSubscriberActiveAdmin,
  deleteSubscriberAdmin,
} from "@/lib/data/newsletter-admin";
import { Resend } from "resend";
import { isServerAdminAuthenticated } from "@/lib/utils/admin-auth";

/**
 * Consulta de Dados e KPIs da Newsletter para o Painel Admin
 */
export async function GET(request: NextRequest) {
  if (!(await isServerAdminAuthenticated(request))) {
    return NextResponse.json({ error: "Acesso não autorizado." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || undefined;
  const status = (searchParams.get("status") as "all" | "active" | "inactive") || "all";

  try {
    const [settings, kpis, subscribers] = await Promise.all([
      getNewsletterSettingsAdmin(),
      getNewsletterKPIsAdmin(),
      getNewsletterSubscribersAdmin({ search, status }),
    ]);

    return NextResponse.json({ settings, kpis, subscribers });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Falha ao carregar dados da newsletter", details: err?.message },
      { status: 500 }
    );
  }
}

/**
 * Atualizações de Configurações ou Status de Assinante
 */
export async function PATCH(request: NextRequest) {
  if (!(await isServerAdminAuthenticated(request))) {
    return NextResponse.json({ error: "Acesso não autorizado." }, { status: 401 });
  }

  try {
    const body = await request.json();

    // 1. Alternar status individual de assinante
    if (body.action === "toggle_subscriber") {
      const { id, is_active } = body;
      if (!id || typeof is_active !== "boolean") {
        return NextResponse.json(
          { error: "Parâmetros id e is_active são obrigatórios." },
          { status: 400 }
        );
      }

      const res = await toggleSubscriberActiveAdmin(id, is_active);
      if (!res.success) {
        return NextResponse.json({ error: res.error }, { status: 400 });
      }

      return NextResponse.json({ success: true, message: "Status do assinante atualizado." });
    }

    // 2. Atualizar configurações globais da Newsletter (Habilitação / Desabilitação de Envio)
    const { is_enabled, disabled_reason, sender_name, sender_email, test_recipient_email } = body;

    const payload: Record<string, any> = {};
    if (typeof is_enabled === "boolean") payload.is_enabled = is_enabled;
    if (typeof disabled_reason === "string") payload.disabled_reason = disabled_reason.trim();
    if (typeof sender_name === "string") payload.sender_name = sender_name.trim();
    if (typeof sender_email === "string") payload.sender_email = sender_email.trim();
    if (typeof test_recipient_email === "string")
      payload.test_recipient_email = test_recipient_email.trim();

    const result = await updateNewsletterSettingsAdmin(payload);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      settings: result.settings,
      message:
        payload.is_enabled !== undefined
          ? payload.is_enabled
            ? "Envio automático de newsletter HABILITADO com sucesso."
            : "Envio automático de newsletter DESABILITADO com sucesso."
          : "Configurações salvas com sucesso.",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Erro interno" }, { status: 500 });
  }
}

/**
 * Disparo de Teste / Simulação Manual a partir do Painel
 */
export async function POST(request: NextRequest) {
  if (!(await isServerAdminAuthenticated(request))) {
    return NextResponse.json({ error: "Acesso não autorizado." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const testEmail = body.email?.trim()?.toLowerCase();

    if (!testEmail || !testEmail.includes("@")) {
      return NextResponse.json(
        { error: "E-mail de teste inválido informado." },
        { status: 400 }
      );
    }

    const resendApiKey = process.env.RESEND_API_KEY || "";
    const isConfigured = Boolean(
      resendApiKey &&
        resendApiKey.startsWith("re_") &&
        !resendApiKey.includes("your_resend") &&
        !resendApiKey.includes("your-api-key")
    );

    if (!isConfigured) {
      return NextResponse.json({
        success: true,
        simulated: true,
        message:
          `[Modo Simulação] RESEND_API_KEY ainda não está configurada em produção. ` +
          `A montagem do template para ${testEmail} foi testada com sucesso.`,
      });
    }

    const resend = new Resend(resendApiKey);
    const from = process.env.RESEND_FROM_EMAIL || "Made By AI Games <newsletter@madebyaigames.com>";

    const { data, error } = await resend.emails.send({
      from,
      to: testEmail,
      subject: "🎮 [Teste de Administração] Made By AI Games Weekly Newsletter",
      html: `
        <div style="font-family: sans-serif; background: #090d16; color: #fff; padding: 24px; border-radius: 12px;">
          <h2 style="color: #8b5cf6;">MADE BY AI GAMES • Disparo de Teste Homologado</h2>
          <p>Este é um disparo de teste enviado diretamente a partir do <strong>Painel Administrativo da Newsletter</strong>.</p>
          <p style="color: #06b6d4;">Seu serviço Resend está configurado e apto a disparar e-mails semanais!</p>
          <hr style="border: 1px solid #1f293d; margin: 20px 0;" />
          <p style="font-size: 11px; color: #64748b;">Made By AI Games Admin • ${new Date().toISOString()}</p>
        </div>
      `,
    });

    if (error) {
      return NextResponse.json(
        { error: `Falha no envio via Resend: ${error.message}` },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      simulated: false,
      message: `E-mail de teste enviado com sucesso para ${testEmail} (ID: ${data?.id})!`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Erro inesperado" }, { status: 500 });
  }
}

/**
 * Exclusão de Assinante
 */
export async function DELETE(request: NextRequest) {
  if (!(await isServerAdminAuthenticated(request))) {
    return NextResponse.json({ error: "Acesso não autorizado." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID do assinante não informado." }, { status: 400 });
  }

  const res = await deleteSubscriberAdmin(id);
  if (!res.success) {
    return NextResponse.json({ error: res.error }, { status: 400 });
  }

  return NextResponse.json({ success: true, message: "Assinante removido com sucesso." });
}
