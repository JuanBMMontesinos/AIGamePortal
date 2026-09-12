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
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const postUrl = `${siteUrl}/noticias/${post.slug}`;

  return {
    title: post.title,
    description: post.excerpt || `Leia a cobertura completa de ${post.title} no AIGamePortal.`,
    alternates: {
      canonical: postUrl,
    },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt || "",
      url: postUrl,
      publishedTime: post.published_at,
      modifiedTime: post.updated_at,
      section: post.categories?.name || "Games",
      images: post.cover_image_url
        ? [
            {
              url: post.cover_image_url,
              width: 1200,
              height: 630,
              alt: post.cover_image_alt || post.title,
            },
          ]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt || "",
      images: post.cover_image_url ? [post.cover_image_url] : [],
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

  // Schema.org NewsArticle JSON-LD
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": post.title,
    "description": post.excerpt,
    "image": post.cover_image_url ? [post.cover_image_url] : [],
    "datePublished": post.published_at,
    "dateModified": post.updated_at,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `${siteUrl}/noticias/${post.slug}`,
    },
    "author": {
      "@type": "Organization",
      "name": "AIGamePortal AI Curadoria & Redação Editorial",
      "url": `${siteUrl}/transparencia-editorial`,
    },
    "publisher": {
      "@type": "Organization",
      "name": "AIGamePortal",
      "logo": {
        "@type": "ImageObject",
        "url": `${siteUrl}/logo.png`,
      },
    },
  };

  return (
    <article className="max-w-4xl mx-auto py-4 sm:py-8">
      {/* Structured Data Script */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
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
      {isValidImageUrl(post.cover_image_url) && (
        <div className="my-8 rounded-2xl md:rounded-3xl overflow-hidden border border-zinc-200 dark:border-gamer-800 shadow-lg relative aspect-[16/9] w-full bg-zinc-900">
          <Image
            src={post.cover_image_url!}
            alt={post.cover_image_alt || post.title}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 896px"
            className="object-cover object-center"
          />
        </div>
      )}

      {/* TL;DR (Resumo em 30 Segundos) */}
      <TldrBox bullets={post.tldr} />

      {/* Ficha Técnica do Jogo */}
      <GameMetadataCard metadata={post.game_metadata} />

      {/* Full Article Content */}
      <div className="my-10">
        <MarkdownContent content={post.content} />
      </div>

      {/* O Que a Comunidade Está Dizendo */}
      <CommunitySentimentBox sentimentText={post.community_sentiment} />

      {/* Box de Atribuição E-E-A-T */}
      <EeatAttributionBox
        sourceOriginalUrl={post.source_original_url}
        sourceOriginalTitle={post.source_original_title}
        source={post.sources}
      />

      {/* Bottom Share & Feedback Bar */}
      <div className="mt-12 pt-6 border-t border-zinc-200 dark:border-gamer-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="text-xs text-zinc-500">
          Gostou deste resumo inteligente? Compartilhe com outros gamers:
        </span>
        <ShareButtons title={post.title} />
      </div>

      {/* Related News Section */}
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
    </article>
  );
}
