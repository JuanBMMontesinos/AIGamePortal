import { Metadata } from "next";
import {
  getNewsletterSettingsAdmin,
  getNewsletterKPIsAdmin,
  getNewsletterSubscribersAdmin,
} from "@/lib/data/newsletter-admin";
import { AdminNewsletterView } from "./admin-view";
import { AdminNewsletterLoginForm } from "./login-form";
import { isServerAdminAuthenticated } from "@/lib/utils/admin-auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Painel da Newsletter | Administração Made By AI Games",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminNewsletterPage() {
  const isAuthenticated = await isServerAdminAuthenticated();

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
