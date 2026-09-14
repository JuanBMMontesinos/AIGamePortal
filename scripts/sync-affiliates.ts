import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { createClient } from "@supabase/supabase-js";
import { Database, AffiliateProduct } from "../types/database";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const amazonTag = process.env.NEXT_PUBLIC_AMAZON_AFFILIATE_TAG || "aigameportal-20";

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Erro: Variáveis do Supabase (URL e Service Role Key) não configuradas.");
  process.exit(1);
}

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

async function runAffiliateSync() {
  console.log("====================================================================");
  console.log("🛒 [AIGamePortal] Sincronização & Auditoria de Afiliados (Forma 3)");
  console.log("====================================================================");
  console.log(`🏷️ Tag Ativa da Amazon Brasil: ${amazonTag}`);
  console.log(`🔒 Parceiros Bloqueados: KaBuM! e Nuuvem (Aguardando Aprovação)`);
  console.log("--------------------------------------------------------------------\n");

  // 1. Busca todos os produtos cadastrados
  const { data: products, error } = await supabase
    .from("affiliate_products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("❌ Falha ao consultar affiliate_products:", error.message);
    process.exit(1);
  }

  const allProducts = (products || []) as AffiliateProduct[];
  console.log(`📦 Total de produtos no banco: ${allProducts.length}`);

  let updatedTagsCount = 0;
  let deactivatedCount = 0;

  for (const product of allProducts) {
    let needsUpdate = false;
    let newUrl = product.affiliate_url;
    let newIsActive = product.is_active;

    // Regra A: Garantir tag da Amazon
    if (product.store_name === "Amazon Brasil") {
      if (newUrl.includes("tag=") && !newUrl.includes(`tag=${amazonTag}`)) {
        newUrl = newUrl.replace(/tag=[^&]+/g, `tag=${amazonTag}`);
        needsUpdate = true;
        updatedTagsCount++;
      } else if (!newUrl.includes("tag=")) {
        newUrl += (newUrl.includes("?") ? "&" : "?") + `tag=${amazonTag}`;
        needsUpdate = true;
        updatedTagsCount++;
      }
    }

    // Regra B: Desativar KaBuM! e Nuuvem até aprovação
    if ((product.store_name === "KaBuM!" || product.store_name === "Nuuvem") && product.is_active) {
      newIsActive = false;
      needsUpdate = true;
      deactivatedCount++;
    }

    if (needsUpdate) {
      await (supabase.from("affiliate_products") as any)
        .update({
          affiliate_url: newUrl,
          is_active: newIsActive,
        })
        .eq("id", product.id);

      console.log(`   ✏️ Atualizado: "${product.title}" -> ativo: ${newIsActive}`);
    }
  }

  // 2. Consulta métricas de cliques recentes
  const { data: clicks } = await supabase
    .from("affiliate_clicks")
    .select("id, product_id, clicked_at")
    .order("clicked_at", { ascending: false });

  const clickRows = (clicks || []) as unknown as { id: string; product_id: string; clicked_at: string }[];
  const totalClicks = clickRows.length;
  const now = Date.now();
  const last24hClicks = clickRows.filter(
    (c) => now - new Date(c.clicked_at).getTime() <= 24 * 60 * 60 * 1000
  ).length;

  console.log("\n====================================================================");
  console.log("📊 Relatório de Auditoria de Afiliados");
  console.log("====================================================================");
  console.log(`🔄 Tags da Amazon corrigidas: ${updatedTagsCount}`);
  console.log(`⏸️ Produtos pausados (KaBuM/Nuuvem): ${deactivatedCount}`);
  console.log(`📈 Total de cliques acumulados: ${totalClicks}`);
  console.log(`⚡ Cliques nas últimas 24 horas: ${last24hClicks}`);
  console.log("====================================================================\n");
}

runAffiliateSync().catch((err) => {
  console.error("💥 Erro fatal no sync de afiliados:", err);
  process.exit(1);
});
