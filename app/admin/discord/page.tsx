import { Metadata } from "next";
import {
  getDiscordSettingsAdmin,
  getDiscordKPIsAdmin,
  getDiscordDealsHistoryAdmin,
  maskDiscordWebhookUrl,
} from "@/lib/data/discord-admin";
import { AdminDiscordView } from "./admin-view";
import { AdminDiscordLoginForm } from "./login-form";
import { isServerAdminAuthenticated } from "@/lib/utils/admin-auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Painel do Discord | Administração Made By AI Games",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminDiscordPage() {
  const isAuthenticated = await isServerAdminAuthenticated();

  // Se não estiver autenticado, exibe formulário de acesso
  if (!isAuthenticated) {
    return <AdminDiscordLoginForm />;
  }

  // Carrega configurações, KPIs e histórico de ofertas no servidor
  const [settings, kpis, history] = await Promise.all([
    getDiscordSettingsAdmin(),
    getDiscordKPIsAdmin(),
    getDiscordDealsHistoryAdmin({ page: 1, limit: 15 }),
  ]);

  const safeSettings = {
    ...settings,
    deals_webhook_url: maskDiscordWebhookUrl(settings.deals_webhook_url),
    news_webhook_url: maskDiscordWebhookUrl(settings.news_webhook_url),
  };

  return (
    <AdminDiscordView
      initialSettings={safeSettings}
      initialKpis={kpis}
      initialHistory={history}
    />
  );
}
