import { Metadata } from "next";
import { cookies } from "next/headers";
import {
  getAllAffiliateProductsAdmin,
  getAffiliateKPIs,
} from "@/lib/data/affiliates";
import { AdminAffiliatesView } from "./admin-view";
import { AdminLoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Painel de Afiliados | Administração Made By AI Games",
  robots: {
    index: false,
    follow: false,
  },
};

const SESSION_TOKEN = "aigameportal_admin_authenticated_v1";

export default async function AdminAffiliatesPage() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  const isAuthenticated = session?.value === SESSION_TOKEN;

  // Se não estiver autenticado, exibe tela de login
  if (!isAuthenticated) {
    return <AdminLoginForm />;
  }

  // Carrega produtos e métricas no servidor
  const [products, kpis] = await Promise.all([
    getAllAffiliateProductsAdmin(),
    getAffiliateKPIs(),
  ]);

  return <AdminAffiliatesView initialProducts={products} initialKpis={kpis} />;
}
