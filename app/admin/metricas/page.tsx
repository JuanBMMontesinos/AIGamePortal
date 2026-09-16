import { Metadata } from "next";
import { cookies } from "next/headers";
import { getB2BMetricsSummary } from "@/lib/data/metrics-summary";
import { AdminMetricsView } from "./admin-view";
import { AdminMetricsLoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Métricas B2B & Patrocínio | AIGamePortal Admin",
  description: "Painel de telemetria interna, KPIs de conversão e relatórios para patrocinadores e marcas.",
  robots: {
    index: false,
    follow: false,
  },
};

const SESSION_TOKEN = "aigameportal_admin_authenticated_v1";
const ADMIN_SECRET = process.env.ADMIN_SECRET_KEY || "aigameportal_admin_2026";

interface AdminMetricsPageProps {
  searchParams: Promise<{
    key?: string;
  }>;
}

export default async function AdminMetricsPage({ searchParams }: AdminMetricsPageProps) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");

  // Autenticação dupla: via Cookie de Sessão OU via Query Param (?key=...)
  const isKeyValid = Boolean(params.key && params.key === ADMIN_SECRET);
  const isSessionValid = session?.value === SESSION_TOKEN;
  const isAuthenticated = isKeyValid || isSessionValid;

  if (!isAuthenticated) {
    return <AdminMetricsLoginForm />;
  }

  // Carrega os dados consolidados de telemetria no servidor
  const summary = await getB2BMetricsSummary();

  return <AdminMetricsView initialSummary={summary} />;
}
