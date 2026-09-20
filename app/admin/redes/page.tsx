import { Metadata } from "next";
import { cookies } from "next/headers";
import {
  getSocialSettingsAdmin,
  getSocialKPIsAdmin,
} from "@/lib/data/social-admin";
import { AdminSocialView } from "./admin-view";
import { AdminSocialLoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Painel de Redes Sociais | Administração Made By AI Games",
  robots: {
    index: false,
    follow: false,
  },
};

const SESSION_TOKEN = "aigameportal_admin_authenticated_v1";

export default async function AdminSocialPage() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  const isAuthenticated = session?.value === SESSION_TOKEN;

  // Se não estiver autenticado, exibe formulário de acesso padrão
  if (!isAuthenticated) {
    return <AdminSocialLoginForm />;
  }

  // Carrega configurações e KPIs no servidor
  const [settings, kpis] = await Promise.all([
    getSocialSettingsAdmin(),
    getSocialKPIsAdmin(),
  ]);

  return (
    <AdminSocialView
      initialSettings={settings}
      initialKpis={kpis}
    />
  );
}
