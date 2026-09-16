import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Calendar,
  Clock,
  Bot,
  ShieldCheck,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { getPostBySlug, getAllPostSlugs, getLatestPosts } from "@/lib/data/api";
import { calculateReadingTime, formatDate, formatRelativeTime, isValidImageUrl } from "@/lib/utils";
import { TldrBox } from "@/components/tldr-box";
import { GameMetadataCard } from "@/components/game-metadata-card";
import { CommunitySentimentBox } from "@/components/community-sentiment-box";
import { EeatAttributionBox } from "@/components/eeat-attribution-box";
import { ShareButtons } from "@/components/share-buttons";
import { MarkdownContent } from "@/components/markdown-content";
import { NewsCard } from "@/components/news-card";
import { RumorBanner } from "@/components/RumorBanner";
import { ArticleCoverImage } from "@/components/article-cover-image";
import { AffiliateDealCard } from "@/components/AffiliateDealCard";
import { AdBanner } from "@/components/AdBanner";
import { NewsletterBox } from "@/components/NewsletterBox";
import { ParsedArticleContent } from "@/lib/utils/content-parser";
import { getActiveAffiliateProducts, findBestAffiliateDeal } from "@/lib/data/affiliates";
import { injectAffiliateLinks } from "@/lib/services/affiliate-matcher";

export const revalidate = 300; // ISR revalidate fallback a cada 5 minutos

interface PostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  const slugs = await getAllPostSlugs();
  return slugs.map((item) => ({
    slug: item.slug,
  }));
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return {
      title: "Matéria Não Encontrada",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://aigameportal.com").replace(/\/+$/, "");
  const postUrl = `${siteUrl}/noticias/${post.slug}`;

  const hasValidCover = isValidImageUrl(post.cover_image_url);
  const coverUrl = hasValidCover
    ? (post.cover_image_url!.startsWith("http") ? post.cover_image_url! : `${siteUrl}${post.cover_image_url}`)
    : `${siteUrl}/og-image.png`;

  const description =
    post.excerpt?.trim() ||
    (post.tldr && post.tldr.length > 0 ? post.tldr.join(" ") : `Leia a cobertura completa de ${post.title} no AIGamePortal.`);

  return {
    title: post.title,
    description,
    alternates: {
      canonical: postUrl,
    },
    robots: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    openGraph: {
      type: "article",
      locale: "pt_BR",
      title: post.title,
      description,
      url: postUrl,
      siteName: "AIGamePortal",
      publishedTime: new Date(post.published_at).toISOString(),
      modifiedTime: new Date(post.updated_at || post.published_at).toISOString(),
      section: post.categories?.name || "Games",
      images: [
        {
          url: coverUrl,
          width: 1200,
          height: 630,
          alt: post.cover_image_alt || post.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description,
      images: [coverUrl],
    },
  };
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const readingTime = calculateReadingTime(post.content);
  const formattedDate = formatDate(post.published_at);
  const relativeDate = formatRelativeTime(post.published_at);
  const categoryName = post.categories?.name || "Geral";
  const categorySlug = post.categories?.slug || "geral";

  // Fetch related posts for bottom section
  const allLatest = await getLatestPosts(4);
  const relatedPosts = allLatest.filter((p) => p.slug !== post.slug).slice(0, 3);

  // Afiliados Inteligentes (Fase 3): Busca de produtos ativos e injeção contextual
  const affiliateProducts = await getActiveAffiliateProducts();
  const { processedContent, matchedProducts } = injectAffiliateLinks(
    post.content,
    affiliateProducts,
    { postId: post.id, maxLinks: 3 }
  );

  // Seleciona a oferta mais relevante para o card ao final da matéria
  const dealProduct =
    matchedProducts.length > 0
      ? matchedProducts[0]
      : findBestAffiliateDeal(post, affiliateProducts);

  // Schema.org Structured Data (NewsArticle + BreadcrumbList)
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://aigameportal.com").replace(/\/+$/, "");
  const postUrl = `${siteUrl}/noticias/${post.slug}`;

  // Headline limitado a 110 caracteres conforme especificação técnica do Google Rich Results / NewsArticle
  const rawTitle = post.title?.trim() || "Notícia Gamer";
  const headline = rawTitle.length <= 110 ? rawTitle : rawTitle.slice(0, 107).trim() + "...";

  // Descrição/TL;DR sanitizada
  const description =
    post.excerpt?.trim() ||
    (post.tldr && post.tldr.length > 0 ? post.tldr.join(" ") : post.title);

  // URL absoluta de imagem com largura mínima de 1200px para elegibilidade no Google Discover
  const hasValidCover = isValidImageUrl(post.cover_image_url);
  const absoluteImageUrl = hasValidCover
    ? (post.cover_image_url!.startsWith("http") ? post.cover_image_url! : `${siteUrl}${post.cover_image_url}`)
    : `${siteUrl}/og-image.png`;

  const datePublishedIso = new Date(post.published_at).toISOString();
  const dateModifiedIso = new Date(post.updated_at || post.published_at).toISOString();

  const newsArticleJsonLd = {
    "@type": "NewsArticle",
    "headline": headline,
    "description": description,
    "image": [absoluteImageUrl],
    "datePublished": datePublishedIso,
    "dateModified": dateModifiedIso,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": postUrl,
    },
    "author": {
      "@type": "Organization",
      "name": "Redação AIGamePortal",
      "url": `${siteUrl}/transparencia-editorial`,
    },
    "publisher": {
      "@type": "Organization",
      "name": "AIGamePortal",
      "url": siteUrl,
      "logo": {
        "@type": "ImageObject",
        "url": `${siteUrl}/logo.png`,
        "width": 600,
        "height": 60,
      },
    },
  };

  const breadcrumbJsonLd = {
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Início",
        "item": siteUrl,
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": categoryName,
        "item": `${siteUrl}/categoria/${categorySlug}`,
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": post.title,
        "item": postUrl,
      },
    ],
  };

  const jsonLdGraph = {
    "@context": "https://schema.org",
    "@graph": [newsArticleJsonLd, breadcrumbJsonLd],
  };

  return (
    <div className="max-w-7xl mx-auto py-4 sm:py-8">
      {/* Structured Data Script */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdGraph) }}
      />

      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 mb-6">
        <Link href="/" className="hover:text-brand-purple transition-colors">
          Início
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link
          href={`/categoria/${categorySlug}`}
          className="hover:text-brand-purple transition-colors font-medium text-zinc-700 dark:text-zinc-300"
        >
          {categoryName}
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="truncate max-w-[200px] sm:max-w-xs text-zinc-400">
          {post.title}
        </span>
      </nav>

      {/* Banner de Alerta para Rumores / Vazamentos (Topo da Matéria) */}
      {post.is_rumor && (
        <div className="mb-6">
          <RumorBanner
            warning={post.rumor_warning}
            reliabilityScore={post.reliability_score}
          />
        </div>
      )}

      {/* Layout de Leitura Responsivo: Matéria Principal (8 cols) + Sidebar Sticky (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
        {/* Coluna Principal da Notícia */}
        <article className="lg:col-span-8 min-w-0">
          {/* Editorial Header */}
          <header className="space-y-5">
            {/* Category & AI Supervision Badges */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Link
                  href={`/categoria/${categorySlug}`}
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-brand-purple/10 text-brand-purple border border-brand-purple/30 hover:bg-brand-purple hover:text-white transition-colors"
                >
                  {categoryName}
                </Link>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/25">
                  <Sparkles className="w-3 h-3" />
                  Síntese Autônoma por IA
                </span>
              </div>

              {/* Share Buttons top */}
              <ShareButtons title={post.title} />
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-zinc-900 dark:text-white leading-tight">
              {post.title}
            </h1>

            {/* Excerpt */}
            {post.excerpt && (
              <p className="text-base sm:text-xl text-zinc-600 dark:text-zinc-300 leading-relaxed font-normal">
                {post.excerpt}
              </p>
            )}

            {/* Author & Editorial Trust Block */}
            <div className="pt-4 border-t border-b border-zinc-200 dark:border-gamer-800 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-brand-purple to-brand-cyan text-white shadow-neon-purple shrink-0">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-zinc-900 dark:text-white">
                      IA Curadoria & Redação Editorial
                    </span>
                    <Link
                      href="/transparencia-editorial"
                      className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 hover:underline"
                      title="Ver política anti-alucinação"
                    >
                      <ShieldCheck className="w-3 h-3" />
                      Anti-Alucinação
                    </Link>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-brand-cyan" />
                      {formattedDate} ({relativeDate})
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-brand-purple" />
                      {readingTime} min de leitura
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-xs text-zinc-400">
                Fonte Primária: <strong className="text-zinc-600 dark:text-zinc-300">{post.sources?.name || "Feed Oficial"}</strong>
              </div>
            </div>
          </header>

          {/* Featured Cover Image */}
          <div className="mt-6">
            <ArticleCoverImage
              src={post.cover_image_url}
              alt={post.cover_image_alt || post.title}
            />
          </div>

          {/* TL;DR (Resumo em 30 Segundos) */}
          <div className="mt-6">
            <TldrBox bullets={post.tldr} />
          </div>

          {/* SLOT 1: Banner Horizontal de Topo (in-article-top: 728x90 desktop / 300x250 mobile) */}
          <div className="my-6">
            <AdBanner format="in-article-top" fallbackProduct={dealProduct} />
          </div>

          {/* Ficha Técnica do Jogo */}
          <div className="my-6">
            <GameMetadataCard metadata={post.game_metadata} />
          </div>

          {/* SLOT 2: Inserção Dinâmica no Meio do Artigo (após o 3º parágrafo da notícia) */}
          <div className="my-8">
            <ParsedArticleContent
              content={processedContent}
              paragraphThreshold={3}
              adSlot={<AdBanner format="in-article-mid" fallbackProduct={dealProduct} />}
            />
          </div>

          {/* Card de Oferta Recomendada de Afiliado (Fase 3) */}
          {dealProduct && (
            <div className="my-10">
              <AffiliateDealCard product={dealProduct} postId={post.id} />
            </div>
          )}

          {/* O Que a Comunidade Está Dizendo */}
          <div className="my-8">
            <CommunitySentimentBox sentimentText={post.community_sentiment} />
          </div>

          {/* Box de Atribuição E-E-A-T */}
          <div className="my-8">
            <EeatAttributionBox
              sourceOriginalUrl={post.source_original_url}
              sourceOriginalTitle={post.source_original_title}
              source={post.sources}
            />
          </div>

          {/* Bottom Share & Feedback Bar */}
          <div className="mt-12 pt-6 border-t border-zinc-200 dark:border-gamer-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-zinc-500">
              Gostou deste resumo inteligente? Compartilhe com outros gamers:
            </span>
            <ShareButtons title={post.title} />
          </div>
        </article>

        {/* SLOT 3: Barra Lateral de Leitura com Banner Fixo (sidebar-sticky: 300x600 Half-Page) */}
        <aside className="lg:col-span-4 space-y-6">
          {/* 1. Bloco de Notícias Relacionadas em Alta para Retenção */}
          {relatedPosts.length > 0 && (
            <div className="rounded-2xl border border-zinc-200 dark:border-gamer-800 bg-white dark:bg-gamer-900 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-xs uppercase tracking-wider text-brand-purple">
                  Destaques do Portal
                </h3>
                <Link href="/" className="text-[10px] text-zinc-400 hover:text-brand-purple transition-colors">
                  Ver todos
                </Link>
              </div>

              <div className="space-y-3.5 divide-y divide-zinc-100 dark:divide-gamer-800/80">
                {relatedPosts.map((rPost, idx) => (
                  <div key={rPost.id} className={idx === 0 ? "" : "pt-3.5"}>
                    <Link href={`/noticias/${rPost.slug}`} className="group block">
                      <span className="text-[10px] font-bold text-brand-cyan uppercase">
                        {rPost.categories?.name || "Games"}
                      </span>
                      <h4 className="font-semibold text-xs text-zinc-800 dark:text-zinc-200 group-hover:text-brand-purple transition-colors line-clamp-2 leading-snug mt-0.5">
                        {rPost.title}
                      </h4>
                      <span className="text-[10px] text-zinc-400 mt-1 block">
                        {formatRelativeTime(rPost.published_at)}
                      </span>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. Caixa de Captura da Newsletter Gamer */}
          <NewsletterBox variant="sidebar" />

          {/* 3. Banner Fixo Skyscraper (Doca suavemente no topo durante a rolagem do artigo) */}
          <div className="sticky top-24 pt-2">
            <AdBanner format="sidebar-sticky" fallbackProduct={dealProduct} />
          </div>
        </aside>
      </div>

      {/* Related News Section (Inferior em Grid Completo) */}
      {relatedPosts.length > 0 && (
        <section className="mt-16 pt-8 border-t border-zinc-200 dark:border-gamer-800">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
              Mais Notícias do Portal
            </h2>
            <Link
              href="/"
              className="text-xs font-bold text-brand-purple hover:underline"
            >
              Ver Todas →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedPosts.map((rPost) => (
              <NewsCard key={rPost.id} post={rPost} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
