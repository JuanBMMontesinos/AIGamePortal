import { Metadata } from "next";
import { cookies } from "next/headers";
import {
  getNewsletterSettingsAdmin,
  getNewsletterKPIsAdmin,
  getNewsletterSubscribersAdmin,
} from "@/lib/data/newsletter-admin";
import { AdminNewsletterView } from "./admin-view";
import { AdminNewsletterLoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Painel da Newsletter | Administração AIGamePortal",
  robots: {
    index: false,
    follow: false,
  },
};

const SESSION_TOKEN = "aigameportal_admin_authenticated_v1";

export default async function AdminNewsletterPage() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  const isAuthenticated = session?.value === SESSION_TOKEN;

  // Se não estiver autenticado, exibe formulário de acesso
  if (!isAuthenticated) {
    return <AdminNewsletterLoginForm />;
  }

  // Carrega configurações, métricas e assinantes no servidor
  const [settings, kpis, subscribers] = await Promise.all([
    getNewsletterSettingsAdmin(),
    getNewsletterKPIsAdmin(),
    getNewsletterSubscribersAdmin(),
  ]);

  return (
    <AdminNewsletterView
      initialSettings={settings}
      initialKpis={kpis}
      initialSubscribers={subscribers}
    />
  );
}
