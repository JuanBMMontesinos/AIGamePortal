import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import fs from "fs";
import path from "path";
import { Database, Post, AffiliateProduct, NewsletterSubscriber } from "../types/database";
import { MOCK_POSTS, MOCK_CATEGORIES } from "../lib/data/mock-news";
import { MOCK_AFFILIATE_PRODUCTS } from "../lib/data/affiliates";

// ==============================================================================
// CONFIGURAÇÕES & PARÂMETROS
// ==============================================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const resendApiKey = process.env.RESEND_API_KEY || "";
const resendFromEmail =
  process.env.RESEND_FROM_EMAIL || "AIGamePortal <newsletter@aigameportal.com>";
const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://aigameportal.com").replace(/\/+$/, "");

// Parse de argumentos CLI
const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run") || process.env.DRY_RUN === "true";
const isForce = args.includes("--force");
const testEmailArg = args.find((arg) => arg.startsWith("--test-email="))?.split("=")[1]?.trim();

console.log("====================================================================");
console.log("🎮 [AIGamePortal] Disparo Semanal de Newsletter Gamer Automática");
console.log("====================================================================");
console.log(`🌐 Site URL: ${siteUrl}`);
console.log(`✉️ Remetente (From): ${resendFromEmail}`);
console.log(`🧪 Modo Dry-Run: ${isDryRun ? "ATIVADO (Não enviará e-mails reais)" : "DESATIVADO"}`);
if (testEmailArg) {
  console.log(`🎯 Teste Direcionado para: ${testEmailArg}`);
}
console.log("--------------------------------------------------------------------\n");

const isSupabaseLive = Boolean(
  supabaseUrl &&
    supabaseServiceKey &&
    !supabaseUrl.includes("your-project") &&
    supabaseUrl.startsWith("http")
);

const supabase = isSupabaseLive
  ? createClient<Database>(supabaseUrl, supabaseServiceKey)
  : null;

// ==============================================================================
// 1. CONSULTA DE DADOS (SUPABASE COM FALLBACKS)
// ==============================================================================

async function fetchTopArticles(): Promise<Post[]> {
  if (!supabase) {
    console.log("⚠️ Supabase não configurado. Utilizando artigos do catálogo mock.");
    return [...MOCK_POSTS].sort((a, b) => b.views_count - a.views_count).slice(0, 5);
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // 1. Tenta buscar artigos dos últimos 7 dias com maior número de visualizações
  const { data: recentPosts, error: recentError } = await supabase
    .from("posts")
    .select(`
      *,
      categories (*),
      sources (*)
    `)
    .eq("status", "published")
    .gte("published_at", sevenDaysAgo)
    .order("views_count", { ascending: false })
    .limit(5);

  if (!recentError && recentPosts && recentPosts.length >= 3) {
    console.log(`📰 Encontrados ${recentPosts.length} artigos populares dos últimos 7 dias.`);
    return recentPosts as Post[];
  }

  // Fallback: se houver poucos artigos nos últimos 7 dias, pega os 5 mais recentes publicados
  console.log("ℹ️ Menos de 3 artigos nos últimos 7 dias. Buscando os 5 artigos publicados mais recentes...");
  const { data: fallbackPosts, error: fallbackError } = await supabase
    .from("posts")
    .select(`
      *,
      categories (*),
      sources (*)
    `)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(5);

  if (fallbackError || !fallbackPosts || fallbackPosts.length === 0) {
    console.warn("⚠️ Nenhum artigo retornado do Supabase. Utilizando mock.");
    return [...MOCK_POSTS].slice(0, 5);
  }

  return fallbackPosts as Post[];
}

async function fetchFeaturedDeals(): Promise<AffiliateProduct[]> {
  if (!supabase) {
    return MOCK_AFFILIATE_PRODUCTS.filter((p) => p.is_active).slice(0, 4);
  }

  const { data: products, error } = await supabase
    .from("affiliate_products")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(4);

  if (error || !products || products.length === 0) {
    return MOCK_AFFILIATE_PRODUCTS.filter((p) => p.is_active).slice(0, 4);
  }

  return products as AffiliateProduct[];
}

async function fetchActiveSubscribers(): Promise<string[]> {
  if (testEmailArg) {
    return [testEmailArg];
  }

  if (!supabase) {
    console.log("⚠️ Supabase não configurado. Modo de demonstração com e-mail simulado.");
    return ["demo-gamer@aigameportal.com"];
  }

  const { data, error } = await supabase
    .from("newsletter_subscribers")
    .select("email")
    .eq("is_active", true);

  if (error) {
    console.warn(
      "⚠️ Tabela newsletter_subscribers ainda não encontrada no Supabase (lembre-se de rodar a migration):",
      error.message
    );
    if (isDryRun) {
      console.log("ℹ️ Utilizando assinante de teste simulado para compilar a prévia no modo Dry-Run.");
      return ["preview-subscriber@aigameportal.com"];
    }
    return [];
  }

  const subscribers = (data || []) as unknown as { email: string }[];
  return subscribers.map((row) => row.email.trim().toLowerCase());
}

// ==============================================================================
// 2. CONSTRUTOR DO TEMPLATE HTML RESPONSIVO (GMAIL & OUTLOOK TESTED)
// ==============================================================================

function buildHtmlTemplate(
  featuredPost: Post,
  secondaryPosts: Post[],
  deals: AffiliateProduct[],
  subscriberEmail: string
): { html: string; text: string } {
  const unsubscribeUrl = `${siteUrl}/api/newsletter/unsubscribe?email=${encodeURIComponent(
    subscriberEmail
  )}`;
  const featuredUrl = `${siteUrl}/noticias/${featuredPost.slug}`;
  const currentDate = new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  const featuredCategory = featuredPost.categories?.name || "Destaque da Semana";
  const featuredImage =
    featuredPost.cover_image_url && featuredPost.cover_image_url.startsWith("http")
      ? featuredPost.cover_image_url
      : `${siteUrl}/og-image.png`;

  // Bullets do TL;DR da matéria principal
  const tldrBullets =
    featuredPost.tldr && featuredPost.tldr.length > 0
      ? featuredPost.tldr
          .map(
            (b) =>
              `<tr><td style="padding: 4px 0; color: #cbd5e1; font-size: 13px; line-height: 1.5;">⚡ ${b}</td></tr>`
          )
          .join("")
      : `<tr><td style="color: #cbd5e1; font-size: 13px;">${featuredPost.excerpt || ""}</td></tr>`;

  // Lista dos 4 artigos secundários
  const secondaryHtml = secondaryPosts
    .map((post, idx) => {
      const postUrl = `${siteUrl}/noticias/${post.slug}`;
      const catName = post.categories?.name || "Games";
      const summary =
        post.excerpt || (post.tldr && post.tldr[0]) || "Confira todos os detalhes desta matéria no portal.";

      return `
        <!-- Artigo Secundário ${idx + 1} -->
        <tr>
          <td style="padding: 16px 0; border-bottom: 1px solid #1f293d;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td>
                  <span style="display: inline-block; font-size: 11px; font-weight: 700; color: #06b6d4; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">
                    ${catName}
                  </span>
                  <h3 style="margin: 0 0 6px 0; font-size: 16px; font-weight: 700; line-height: 1.4;">
                    <a href="${postUrl}" style="color: #ffffff; text-decoration: none;" target="_blank">
                      ${post.title}
                    </a>
                  </h3>
                  <p style="margin: 0 0 8px 0; font-size: 13px; color: #94a3b8; line-height: 1.5;">
                    ${summary}
                  </p>
                  <a href="${postUrl}" style="font-size: 12px; font-weight: 600; color: #a78bfa; text-decoration: none;" target="_blank">
                    Ler matéria completa →
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      `;
    })
    .join("");

  // Grid de Ofertas Afiliadas
  const dealsHtml = deals
    .map((deal) => {
      const dealUrl = deal.affiliate_url;
      const priceText =
        deal.price_estimate && deal.price_estimate > 0
          ? `R$ ${deal.price_estimate.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
          : "Ver Melhor Preço";

      return `
        <!-- Deal Card -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 12px; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 12px; overflow: hidden;">
          <tr>
            <td style="padding: 16px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="70" valign="top" style="padding-right: 14px;">
                    <img src="${deal.image_url}" alt="${deal.title}" width="70" height="70" style="display: block; border-radius: 8px; object-fit: cover; border: 0;" />
                  </td>
                  <td valign="middle">
                    <span style="font-size: 10px; font-weight: 700; color: #06b6d4; text-transform: uppercase;">
                      ${deal.store_name}
                    </span>
                    <h4 style="margin: 2px 0 6px 0; font-size: 14px; font-weight: 600; color: #ffffff; line-height: 1.3;">
                      ${deal.title}
                    </h4>
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="font-size: 13px; font-weight: 700; color: #10b981; padding-right: 12px;">
                          ${priceText}
                        </td>
                        <td>
                          <a href="${dealUrl}" target="_blank" style="display: inline-block; padding: 6px 14px; background-color: #8b5cf6; color: #ffffff; font-size: 11px; font-weight: 700; text-decoration: none; border-radius: 6px;">
                            Aproveitar
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      `;
    })
    .join("");

  // Versão HTML Completa
  const html = `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="pt-BR">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>Resumo Gamer da Semana • AIGamePortal</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    table { border-collapse: collapse !important; }
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #090d16; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; }
    @media screen and (max-width: 600px) {
      .container-table { width: 100% !important; }
      .mobile-padding { padding-left: 16px !important; padding-right: 16px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #090d16; color: #f8fafc;">
  <!-- Preheader oculto para preview no cliente de e-mail -->
  <div style="display: none; font-size: 1px; color: #090d16; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
    🎮 O resumo definitivo com as 5 principais notícias e as melhores ofertas gamer da semana selecionadas por IA.
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #090d16;">
    <tr>
      <td align="center" style="padding: 24px 8px;">
        <!-- Container Centralizado Máximo 600px -->
        <table role="presentation" class="container-table" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%; background-color: #111827; border: 1px solid #1f293d; border-radius: 16px; overflow: hidden;">
          
          <!-- 1. HEADER DO AIGAMEPORTAL -->
          <tr>
            <td style="padding: 28px 24px 20px 24px; background: linear-gradient(135deg, #1e1b4b 0%, #111827 100%); border-bottom: 1px solid #1f293d; text-align: center;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center">
                    <span style="display: inline-block; padding: 4px 12px; background-color: rgba(139, 92, 246, 0.2); border: 1px solid rgba(139, 92, 246, 0.4); border-radius: 20px; font-size: 11px; font-weight: 700; color: #a78bfa; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px;">
                      ⚡ Resumo Semanal da Comunidade
                    </span>
                    <h1 style="margin: 0; font-size: 26px; font-weight: 900; letter-spacing: -0.5px; color: #ffffff;">
                      AI<span style="color: #8b5cf6;">GAME</span>PORTAL
                    </h1>
                    <p style="margin: 6px 0 0 0; font-size: 12px; color: #94a3b8;">
                      Edição de ${currentDate} • Curadoria Autônoma com IA
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 2. MATÉRIA PRINCIPAL DA SEMANA (HERO DESTAQUE) -->
          <tr>
            <td style="padding: 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #0f172a; border: 1px solid #1e293b; border-radius: 12px; overflow: hidden;">
                <tr>
                  <td>
                    <a href="${featuredUrl}" target="_blank" style="text-decoration: none; display: block;">
                      <img src="${featuredImage}" alt="${featuredPost.title}" width="550" style="display: block; width: 100%; max-width: 550px; height: auto; border: 0;" />
                    </a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 20px;">
                    <span style="display: inline-block; font-size: 11px; font-weight: 700; color: #8b5cf6; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">
                      🔥 Notícia Mais Quente da Semana • ${featuredCategory}
                    </span>
                    <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 800; line-height: 1.3;">
                      <a href="${featuredUrl}" style="color: #ffffff; text-decoration: none;" target="_blank">
                        ${featuredPost.title}
                      </a>
                    </h2>
                    
                    <!-- Bullets do TL;DR -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 18px;">
                      ${tldrBullets}
                    </table>

                    <!-- Botão CTA Principal -->
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center" style="border-radius: 8px; background-color: #8b5cf6;">
                          <a href="${featuredUrl}" target="_blank" style="display: inline-block; padding: 12px 24px; font-size: 13px; font-weight: 700; color: #ffffff; text-decoration: none; border-radius: 8px;">
                            Ler Matéria Completa →
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 3. MAIS 4 ARTIGOS DESTAQUE DA SEMANA -->
          <tr>
            <td style="padding: 0 24px 20px 24px;">
              <h3 style="margin: 0 0 14px 0; font-size: 16px; font-weight: 800; color: #f8fafc; border-left: 3px solid #8b5cf6; padding-left: 10px; text-transform: uppercase; letter-spacing: 0.5px;">
                Mais Lidas da Semana
              </h3>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                ${secondaryHtml}
              </table>
            </td>
          </tr>

          <!-- 4. OFERTAS GAMER DA SEMANA (AFILIADOS INTELIGENTES) -->
          <tr>
            <td style="padding: 0 24px 24px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(180deg, rgba(6, 182, 212, 0.08) 0%, rgba(139, 92, 246, 0.05) 100%); border: 1px solid rgba(6, 182, 212, 0.3); border-radius: 12px; padding: 20px;">
                <tr>
                  <td>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 14px;">
                      <tr>
                        <td>
                          <h3 style="margin: 0; font-size: 16px; font-weight: 800; color: #ffffff; letter-spacing: -0.3px;">
                            🛒 Ofertas Gamer da Semana
                          </h3>
                          <p style="margin: 4px 0 0 0; font-size: 12px; color: #94a3b8;">
                            Preços promocionais verificados em nossos parceiros oficiais.
                          </p>
                        </td>
                      </tr>
                    </table>

                    <!-- Cards de Produtos -->
                    ${dealsHtml}

                    <p style="margin: 10px 0 0 0; font-size: 11px; color: #64748b; text-align: center;">
                      *Comprando pelos nossos links, o AIGamePortal pode receber uma comissão sem custo adicional para você.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 5. FOOTER COM POLÍTICA EDITORIAL & DESCADASTRO (UNSUBSCRIBE) -->
          <tr>
            <td style="padding: 24px; background-color: #0b0f19; border-top: 1px solid #1f293d; text-align: center;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="font-size: 12px; color: #64748b; line-height: 1.6;">
                    <p style="margin: 0 0 8px 0;">
                      Você está recebendo este e-mail porque se cadastrou na newsletter de <strong style="color: #94a3b8;">${subscriberEmail}</strong> no AIGamePortal.
                    </p>
                    <p style="margin: 0 0 14px 0;">
                      Jornalismo Gamer com Curadoria por IA • Feito com Next.js, Supabase e Resend.
                    </p>
                    <p style="margin: 0;">
                      <a href="${siteUrl}" style="color: #8b5cf6; text-decoration: underline;" target="_blank">Acessar Portal</a>
                      &nbsp;•&nbsp;
                      <a href="${siteUrl}/transparencia-editorial" style="color: #8b5cf6; text-decoration: underline;" target="_blank">Transparência Editorial</a>
                      &nbsp;•&nbsp;
                      <a href="${unsubscribeUrl}" style="color: #ef4444; font-weight: 700; text-decoration: underline;" target="_blank">
                        Cancelar Inscrição (Unsubscribe)
                      </a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  // Versão Texto Puro
  const text = `
AIGAMEPORTAL • RESUMO GAMER DA SEMANA
Edição de: ${currentDate}

==================================================
🔥 NOTÍCIA MAIS QUENTE DA SEMANA
==================================================
${featuredPost.title}
Categoria: ${featuredCategory}
Link: ${featuredUrl}

${featuredPost.tldr?.map((b) => `- ${b}`).join("\n") || featuredPost.excerpt || ""}

==================================================
📰 MAIS LIDAS DA SEMANA
==================================================
${secondaryPosts
  .map((p, idx) => `${idx + 1}. ${p.title}\nLink: ${siteUrl}/noticias/${p.slug}\n`)
  .join("\n")}

==================================================
🛒 OFERTAS GAMER EM DESTAQUE
==================================================
${deals
  .map(
    (d) =>
      `• ${d.title} (${d.store_name})\n  Preço: ${
        d.price_estimate ? `R$ ${d.price_estimate.toFixed(2)}` : "Consulte"
      }\n  Link: ${d.affiliate_url}`
  )
  .join("\n\n")}

==================================================
Você recebeu este e-mail porque está cadastrado em ${subscriberEmail}.
Para cancelar sua inscrição, acesse: ${unsubscribeUrl}
AIGamePortal © 2026.
  `.trim();

  return { html, text };
}

// ==============================================================================
// 3. VERIFICAÇÃO DE HABILITAÇÃO ADMINISTRATIVA (SAFEGUARD)
// ==============================================================================

async function checkNewsletterEnabled(): Promise<{ isEnabled: boolean; reason: string | null }> {
  if (!supabase) {
    return {
      isEnabled: false,
      reason: "Supabase não configurado ou offline.",
    };
  }

  try {
    const { data, error } = await supabase
      .from("newsletter_settings")
      .select("is_enabled, disabled_reason")
      .eq("id", "default")
      .maybeSingle();

    if (error || !data) {
      // Padrão obrigatório de segurança: desabilitado
      return {
        isEnabled: false,
        reason: "Registro newsletter_settings não encontrado (padrão de segurança: desabilitado).",
      };
    }

    const row = data as any;
    return {
      isEnabled: row.is_enabled === true,
      reason: row.disabled_reason || null,
    };
  } catch (err: any) {
    return {
      isEnabled: false,
      reason: err?.message || "Erro ao consultar configurações da newsletter.",
    };
  }
}

// ==============================================================================
// 4. EXECUÇÃO PRINCIPAL
// ==============================================================================

async function runWeeklyNewsletter() {
  const startTime = Date.now();

  try {
    // 0. Verifica se o envio está autorizado no painel administrativo
    console.log("🔒 [0/4] Verificando autorização de envio no painel administrativo...");
    const { isEnabled, reason } = await checkNewsletterEnabled();

    if (!isEnabled) {
      if (isDryRun || testEmailArg || isForce) {
        console.log("⚠️ [AVISO] O envio de newsletters está DESABILITADO no painel administrativo.");
        console.log(`📌 Motivo registrado: "${reason}"`);
        console.log(
          `⚡ Prosseguindo exclusivamente devido à flag (${
            isDryRun ? "--dry-run" : testEmailArg ? "--test-email" : "--force"
          }).\n`
        );
      } else {
        console.log("🛑 [BLOQUEIO DE SEGURANÇA] O envio semanal está DESABILITADO no painel.");
        console.log(`📌 Motivo registrado: "${reason}"`);
        console.log("ℹ️ Acesse /admin/newsletter para habilitar os disparos quando o serviço estiver pronto.");
        console.log("✅ Execução encerrada com status seguro (SKIPPED). Nenhum e-mail foi disparado.\n");

        if (supabase) {
          try {
            await (supabase.from("newsletter_settings") as any)
              .update({
                last_dispatched_at: new Date().toISOString(),
                last_dispatch_status: "skipped",
                last_dispatch_log: `Disparo ignorado (desabilitado no painel): ${reason}`,
              })
              .eq("id", "default");
          } catch (err) {
            // Ignora se tabela ainda não tiver sido criada
          }
        }
        return;
      }
    } else {
      console.log("✅ Envio semanal HABILITADO no painel administrativo. Prosseguindo...\n");
    }

    // 1. Busca os dados
    console.log("🔍 [1/4] Buscando matérias mais relevantes dos últimos 7 dias...");
    const articles = await fetchTopArticles();
    if (articles.length === 0) {
      console.error("❌ Nenhum artigo encontrado para compor a newsletter. Abortando.");
      process.exit(1);
    }

    const featuredPost = articles[0];
    const secondaryPosts = articles.slice(1, 5);
    console.log(`✅ Artigo Principal: "${featuredPost.title}"`);
    console.log(`✅ Artigos Secundários: ${secondaryPosts.length}`);

    console.log("\n🛒 [2/4] Buscando ofertas gamer em destaque...");
    const deals = await fetchFeaturedDeals();
    console.log(`✅ Produtos em oferta selecionados: ${deals.length}`);

    console.log("\n👥 [3/4] Consultando base de assinantes ativos...");
    const subscribers = await fetchActiveSubscribers();
    console.log(`✅ Total de assinantes para disparo: ${subscribers.length}`);

    if (subscribers.length === 0) {
      console.log("ℹ️ Nenhum assinante ativo encontrado. Finalizando sem disparos.");
      return;
    }

    // 2. Modo Dry-Run: salva prévia do HTML em arquivo e sai sem gastar quotas
    if (isDryRun) {
      console.log("\n🧪 [DRY-RUN] Gerando arquivo de prévia HTML para inspeção...");
      const previewEmail = subscribers[0] || "preview@aigameportal.com";
      const { html, text } = buildHtmlTemplate(featuredPost, secondaryPosts, deals, previewEmail);

      const previewDir = path.join(process.cwd(), "scratch");
      if (!fs.existsSync(previewDir)) {
        fs.mkdirSync(previewDir, { recursive: true });
      }

      const previewPath = path.join(previewDir, "newsletter-preview.html");
      fs.writeFileSync(previewPath, html, "utf-8");
      console.log(`📄 Prévia HTML salva em: ${previewPath}`);
      console.log(`📝 Amostra de texto puro:\n\n${text.slice(0, 400)}...\n`);
      console.log("✅ Validação de montagem concluída com sucesso em modo Dry-Run!");
      return;
    }

    // 3. Validação da Chave Resend
    if (!resendApiKey || resendApiKey.includes("your-api-key")) {
      console.error(
        "❌ Chave RESEND_API_KEY não configurada no ambiente. Configure no .env.local ou secrets."
      );
      process.exit(1);
    }

    const resend = new Resend(resendApiKey);

    console.log(`\n🚀 [4/4] Iniciando disparos com Resend para ${subscribers.length} destinatário(s)...`);

    let sentCount = 0;
    let failedCount = 0;

    // Disparo iterativo com personalização do link de unsubscribe por inscrito
    for (let i = 0; i < subscribers.length; i++) {
      const email = subscribers[i];
      const subject = `🎮 Resumo Gamer: ${featuredPost.title}`;
      const { html, text } = buildHtmlTemplate(featuredPost, secondaryPosts, deals, email);

      try {
        const { data, error } = await resend.emails.send({
          from: resendFromEmail,
          to: email,
          subject: subject,
          html: html,
          text: text,
        });

        if (error) {
          console.error(`  ❌ [${i + 1}/${subscribers.length}] Falha para ${email}:`, error.message);
          failedCount++;
        } else {
          console.log(`  ✅ [${i + 1}/${subscribers.length}] Enviado com sucesso para ${email} (ID: ${data?.id})`);
          sentCount++;
        }

        // Intervalo de segurança para respeitar limites de taxa da Resend (ex: 200ms)
        if (i < subscribers.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 200));
        }
      } catch (err: any) {
        console.error(`  ❌ [${i + 1}/${subscribers.length}] Exceção para ${email}:`, err.message);
        failedCount++;
      }
    }

    if (supabase) {
      try {
        await (supabase.from("newsletter_settings") as any)
          .update({
            last_dispatched_at: new Date().toISOString(),
            last_dispatch_status: failedCount > 0 && sentCount === 0 ? "failed" : "success",
            last_dispatch_log: `Concluído: ${sentCount} enviados com sucesso, ${failedCount} falhas.`,
          })
          .eq("id", "default");
      } catch (err) {
        // Ignora se tabela ainda não tiver sido criada
      }
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log("\n====================================================================");
    console.log("📊 RELATÓRIO DO DISPARO DA NEWSLETTER");
    console.log("====================================================================");
    console.log(`⏱️ Tempo decorrido: ${elapsed}s`);
    console.log(`📫 Total processados: ${subscribers.length}`);
    console.log(`✅ Sucessos: ${sentCount}`);
    console.log(`❌ Falhas: ${failedCount}`);
    console.log("====================================================================\n");
  } catch (error: any) {
    console.error("❌ Falha crítica no pipeline da newsletter:", error.message || error);
    process.exit(1);
  }
}

runWeeklyNewsletter();
