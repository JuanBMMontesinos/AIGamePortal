import { Metadata } from "next";
import { getB2BMetricsSummary } from "@/lib/data/metrics-summary";
import { AdminMetricsView } from "./admin-view";
import { AdminMetricsLoginForm } from "./login-form";
import { isServerAdminAuthenticated } from "@/lib/utils/admin-auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Métricas B2B & Patrocínio | Made By AI Games Admin",
  description: "Painel de telemetria interna, KPIs de conversão e relatórios para patrocinadores e marcas.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminMetricsPage() {
  const isAuthenticated = await isServerAdminAuthenticated();

  if (!isAuthenticated) {
    return <AdminMetricsLoginForm />;
  }

  // Carrega os dados consolidados de telemetria no servidor
  const summary = await getB2BMetricsSummary();

  return <AdminMetricsView initialSummary={summary} />;
}
