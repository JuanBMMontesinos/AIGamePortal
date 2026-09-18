import { Metadata } from "next";
import { cookies } from "next/headers";
import {
  getDiscordSettingsAdmin,
  getDiscordKPIsAdmin,
  getDiscordDealsHistoryAdmin,
} from "@/lib/data/discord-admin";
import { AdminDiscordView } from "./admin-view";
import { AdminDiscordLoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Painel do Discord | Administração Made By AI Games",
  robots: {
    index: false,
    follow: false,
  },
};

const SESSION_TOKEN = "aigameportal_admin_authenticated_v1";

export default async function AdminDiscordPage() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  const isAuthenticated = session?.value === SESSION_TOKEN;

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

  return (
    <AdminDiscordView
      initialSettings={settings}
      initialKpis={kpis}
      initialHistory={history}
    />
  );
}
