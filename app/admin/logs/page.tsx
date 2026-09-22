import { Metadata } from "next";
import { getSystemLogsAdmin, getSystemLogsKPIsAdmin } from "@/lib/data/logs-admin";
import { AdminLogsView } from "./admin-view";
import { AdminLogsLoginForm } from "./login-form";
import { isServerAdminAuthenticated } from "@/lib/utils/admin-auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Central de Logs & Auditoria de IA | Administração Made By AI Games",
  description: "Painel em tempo real de auditoria de requisições de IA, integridade de pipelines e disparos sociais.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminLogsPage() {
  const isAuthenticated = await isServerAdminAuthenticated();

  if (!isAuthenticated) {
    return <AdminLogsLoginForm />;
  }

  // Carrega lista inicial de logs paginada e KPIs consolidados no servidor
  const [logsResult, kpis] = await Promise.all([
    getSystemLogsAdmin({ page: 1, limit: 20 }),
    getSystemLogsKPIsAdmin(),
  ]);

  return <AdminLogsView initialLogsResult={logsResult} initialKpis={kpis} />;
}
