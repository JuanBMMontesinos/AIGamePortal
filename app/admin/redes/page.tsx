import { Metadata } from "next";
import {
  getSocialSettingsAdmin,
  getSocialKPIsAdmin,
} from "@/lib/data/social-admin";
import { AdminSocialView } from "./admin-view";
import { AdminSocialLoginForm } from "./login-form";
import { isServerAdminAuthenticated } from "@/lib/utils/admin-auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Painel de Redes Sociais | Administração Made By AI Games",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminSocialPage() {
  const isAuthenticated = await isServerAdminAuthenticated();

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
