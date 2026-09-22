import { Metadata } from "next";
import {
  getAllAffiliateProductsAdmin,
  getAffiliateKPIs,
} from "@/lib/data/affiliates";
import { AdminAffiliatesView } from "./admin-view";
import { AdminLoginForm } from "./login-form";
import { isServerAdminAuthenticated } from "@/lib/utils/admin-auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Painel de Afiliados | Administração Made By AI Games",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminAffiliatesPage() {
  const isAuthenticated = await isServerAdminAuthenticated();

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
