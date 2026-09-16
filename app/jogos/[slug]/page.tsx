import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Gamepad2,
  Calendar,
  Layers,
  Award,
  ShieldCheck,
  Clock,
  ChevronRight,
  ExternalLink,
  ShoppingCart,
  Flame,
  Sparkles,
  Building2,
  Tv,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { getGameHubBySlug, getAllGameHubSlugs, getPostsByGameHub } from "@/lib/data/api";
import { getActiveAffiliateProducts } from "@/lib/data/affiliates";
import { formatDate, formatRelativeTime, isValidImageUrl, calculateReadingTime } from "@/lib/utils";
import { AffiliateProduct } from "@/types/database";

export const revalidate = 300; // ISR revalidate fallback a cada 5 minutos

interface GameHubPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  const slugs = await getAllGameHubSlugs();
  return slugs.map((item) => ({
    slug: item.slug,
  }));
}

export async function generateMetadata({ params }: GameHubPageProps): Promise<Metadata> {
  const { slug } = await params;
  const hub = await getGameHubBySlug(slug);

  if (!hub) {
    return {
      title: "Hub de Jogo Não Encontrado",
      robots: { index: false, follow: false },
    };
  }

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://aigameportal.com").replace(/\/+$/, "");
  const pageUrl = `${siteUrl}/jogos/${hub.slug}`;
  const title = `${hub.name} • Central de Notícias, Ficha Técnica & Onde Comprar`;
  const description =
    hub.synopsis.slice(0, 155) ||
    `Tudo sobre ${hub.name}: últimas notícias, atualizações, data de lançamento para ${hub.platforms.join(", ")}, notas e ofertas.`;

  return {
    title,
    description,
    alternates: {
      canonical: pageUrl,
    },
    robots: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
    openGraph: {
      type: "website",
      locale: "pt_BR",
      title,
      description,
      url: pageUrl,
      siteName: "AIGamePortal",
      images: [
        {
          url: hub.banner_image_url || hub.cover_image_url,
          width: 1200,
          height: 630,
          alt: `Central oficial de ${hub.name}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [hub.banner_image_url || hub.cover_image_url],
    },
  };
}

export default async function GameHubPage({ params }: GameHubPageProps) {
  const { slug } = await params;
  const hub = await getGameHubBySlug(slug);

  if (!hub) {
    notFound();
  }

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://aigameportal.com").replace(/\/+$/, "");
  const pageUrl = `${siteUrl}/jogos/${hub.slug}`;

  // 1. Carregar linha do tempo de matérias associadas ao hub
  const posts = await getPostsByGameHub(hub.id, 50);

  // 2. Carregar produtos de afiliados relevantes para o jogo
  const allAffiliates = await getActiveAffiliateProducts();
  const searchTerms = [
    hub.name.toLowerCase(),
    hub.slug.replace(/-/g, " "),
    ...(hub.aliases || []).map((a) => a.toLowerCase()),
  ];

  const matchedAffiliates = allAffiliates.filter((prod) => {
    const titleLower = prod.title.toLowerCase();
    const kwMatches = prod.keywords.some((kw) =>
      searchTerms.some((st) => kw.toLowerCase().includes(st) || st.includes(kw.toLowerCase()))
    );
    const titleMatches = searchTerms.some((st) => titleLower.includes(st));
    return kwMatches || titleMatches;
  });

  // Se não encontrar produtos específicos do jogo, exibir recomendações de hardware/consoles da plataforma
  const relevantProducts: AffiliateProduct[] =
    matchedAffiliates.length > 0 ? matchedAffiliates.slice(0, 4) : allAffiliates.slice(0, 4);

  // 3. Schema.org VideoGame + BreadcrumbList
  const videoGameSchema: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    name: hub.name,
    description: hub.synopsis,
    image: [hub.cover_image_url, hub.banner_image_url].filter(Boolean),
    operatingSystem: hub.platforms.join(", "),
    applicationCategory: "Game",
    author: {
      "@type": "Organization",
      name: hub.developer,
    },
    publisher: {
      "@type": "Organization",
      name: hub.publisher,
    },
    datePublished: hub.release_date,
    url: pageUrl,
  };

  if (typeof hub.metacritic_score === "number" && hub.metacritic_score > 0) {
    videoGameSchema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: hub.metacritic_score,
      bestRating: "100",
      worstRating: "0",
      ratingCount: 1,
    };
  }

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Início",
        item: siteUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Centrais de Jogos",
        item: `${siteUrl}/jogos`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: hub.name,
        item: pageUrl,
      },
    ],
  };

  const hasValidBanner = isValidImageUrl(hub.banner_image_url);
  const hasValidCover = isValidImageUrl(hub.cover_image_url);

  return (
    <div className="min-w-0 pb-20">
      {/* Schemas JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(videoGameSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      {/* ==================================================================== */}
      {/* 1. HERO HEADER IMERSIVO */}
      {/* ==================================================================== */}
      <section className="relative overflow-hidden border-b border-zinc-200/80 dark:border-gamer-800/80 bg-gamer-950 text-white">
        {/* Banner de fundo com blend mode escuro */}
        <div className="absolute inset-0 z-0">
          {hasValidBanner ? (
            <Image
              src={hub.banner_image_url}
              alt={`Banner imersivo de ${hub.name}`}
              fill
              priority
              className="object-cover object-center opacity-35 filter blur-[1px] scale-105"
              sizes="100vw"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-brand-purple/20 via-gamer-950 to-brand-cyan/20" />
          )}
          {/* Gradientes para contraste editorial */}
          <div className="absolute inset-0 bg-gradient-to-t from-gamer-950 via-gamer-950/80 to-transparent" />
          <div className="absolute inset-0 bg-cyber-grid bg-[size:30px_30px] opacity-25 pointer-events-none" />
        </div>

        {/* Conteúdo do Hero */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12 sm:pt-12 sm:pb-16">
          {/* Breadcrumb simples */}
          <nav className="flex items-center gap-2 text-xs font-semibold text-zinc-400 mb-6">
            <Link href="/" className="hover:text-white transition-colors">
              Início
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
            <Link href="/jogos" className="hover:text-white transition-colors">
              Centrais de Jogos
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
            <span className="text-brand-purple truncate max-w-[200px] sm:max-w-none">
              {hub.name}
            </span>
          </nav>

          <div className="flex flex-col md:flex-row items-center md:items-end gap-6 sm:gap-8">
            {/* Capa Vertical com Moldura Gamer e Efeito Glow */}
            <div className="relative w-36 h-52 sm:w-48 sm:h-68 md:w-52 md:h-72 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20 bg-gamer-900 flex-shrink-0 group">
              {hasValidCover ? (
                <Image
                  src={hub.cover_image_url}
                  alt={`Capa oficial de ${hub.name}`}
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 640px) 144px, 208px"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gamer-850">
                  <Gamepad2 className="w-12 h-12 text-brand-purple" />
                </div>
              )}
              <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10" />
            </div>

            {/* Informações Principais do Jogo */}
            <div className="flex-1 text-center md:text-left min-w-0">
              {/* Badge de Hub Permanente */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-purple/25 border border-brand-purple/40 text-purple-300 text-xs font-bold uppercase tracking-wider mb-3">
                <Gamepad2 className="w-3.5 h-3.5 text-brand-purple" />
                <span>Hub Permanente • SEO Long-Tail</span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight drop-shadow-md">
                {hub.name}
              </h1>

              {/* Desenvolvedora & Editora */}
              <div className="mt-3 flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-1 text-sm text-zinc-300 font-medium">
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-brand-cyan" />
                  Desenvolvedora: <strong className="text-white">{hub.developer}</strong>
                </span>
                <span className="hidden sm:inline text-zinc-600">•</span>
                <span>
                  Publicadora: <strong className="text-white">{hub.publisher}</strong>
                </span>
              </div>

              {/* Linha de Plataformas, Lançamento e Nota */}
              <div className="mt-5 flex flex-wrap items-center justify-center md:justify-start gap-3">
                {/* Metacritic Badge */}
                {hub.metacritic_score !== null ? (
                  <div
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-black tracking-wide shadow-lg ${
                      hub.metacritic_score >= 90
                        ? "bg-emerald-500 text-white"
                        : hub.metacritic_score >= 75
                        ? "bg-amber-500 text-white"
                        : "bg-rose-500 text-white"
                    }`}
                  >
                    <Award className="w-4 h-4" />
                    <span>Metacritic {hub.metacritic_score}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
                    <Clock className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Nota Crítica Em Breve</span>
                  </div>
                )}

                {/* Data de Lançamento */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800/90 text-zinc-200 border border-zinc-700/80 text-xs font-semibold backdrop-blur-md">
                  <Calendar className="w-3.5 h-3.5 text-brand-purple" />
                  <span>Lançamento: {hub.release_date}</span>
                </div>

                {/* Badges de Plataformas */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {hub.platforms.map((plat) => (
                    <span
                      key={plat}
                      className="px-2.5 py-1 text-xs font-bold rounded-lg bg-gamer-850 text-zinc-200 border border-gamer-700/80"
                    >
                      {plat}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* CORPO PRINCIPAL COM LAYOUT DUPLO (CONTEÚDO + SIDEBAR) */}
      {/* ==================================================================== */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
          {/* COLUNA PRINCIPAL (8 colunas no desktop) */}
          <main className="lg:col-span-8 space-y-10">
            {/* Box 1: Sinopse do Jogo */}
            <section className="p-6 sm:p-8 rounded-2xl border border-zinc-200 dark:border-gamer-800 bg-white dark:bg-gamer-900 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-brand-purple" />
                <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
                  Sobre {hub.name}
                </h2>
              </div>
              <p className="text-base sm:text-lg text-zinc-700 dark:text-zinc-200 leading-relaxed font-normal whitespace-pre-line">
                {hub.synopsis}
              </p>
            </section>

            {/* Box 2: Linha do Tempo de Notícias (Timeline) */}
            <section className="p-6 sm:p-8 rounded-2xl border border-zinc-200 dark:border-gamer-800 bg-white dark:bg-gamer-900 shadow-sm">
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-zinc-200 dark:border-gamer-800">
                <div>
                  <div className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-brand-cyan" />
                    <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
                      Linha do Tempo de Notícias
                    </h2>
                  </div>
                  <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                    Feed cronológico das apurações, novidades oficiais e rumores confirmados sobre {hub.name}.
                  </p>
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-brand-purple/10 text-brand-purple border border-brand-purple/30">
                  {posts.length} {posts.length === 1 ? "Artigo" : "Artigos"}
                </span>
              </div>

              {posts.length === 0 ? (
                <div className="py-12 text-center text-zinc-500 dark:text-zinc-400">
                  <Gamepad2 className="w-12 h-12 mx-auto text-zinc-400/60 mb-3" />
                  <p className="text-base font-semibold">Nenhuma notícia vinculada ainda a esta central.</p>
                  <p className="text-xs mt-1">O pipeline de IA monitora os feeds oficiais 24h e atualizará este feed assim que novos artigos forem publicados.</p>
                </div>
              ) : (
                <div className="relative border-l-2 border-brand-purple/30 dark:border-brand-purple/20 ml-3 sm:ml-4 pl-6 sm:pl-8 space-y-8">
                  {posts.map((post) => {
                    const readingTime = calculateReadingTime(post.content);
                    const formattedDate = formatDate(post.published_at);
                    const relativeTime = formatRelativeTime(post.published_at);
                    const hasCover = isValidImageUrl(post.cover_image_url);

                    return (
                      <article key={post.id} className="relative group">
                        {/* Ponto indicador na timeline */}
                        <div className="absolute -left-[31px] sm:-left-[39px] top-1.5 w-4 h-4 rounded-full bg-white dark:bg-gamer-900 border-2 border-brand-purple flex items-center justify-center group-hover:scale-125 transition-transform duration-200 shadow-neon-purple">
                          <div className="w-1.5 h-1.5 rounded-full bg-brand-purple" />
                        </div>

                        {/* Metadados de Data e Tags de Rumor */}
                        <div className="flex flex-wrap items-center gap-2 text-xs mb-2">
                          <span className="font-semibold text-brand-purple flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {formattedDate}
                          </span>
                          <span className="text-zinc-400 dark:text-zinc-600">•</span>
                          <span className="text-zinc-500 dark:text-zinc-400">
                            {relativeTime}
                          </span>
                          <span className="text-zinc-400 dark:text-zinc-600">•</span>
                          <span className="text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {readingTime} min de leitura
                          </span>

                          {/* Tag de Confiabilidade / Rumor */}
                          {post.is_rumor ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                              <AlertTriangle className="w-3 h-3" />
                              Rumor ({post.reliability_score}/5)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                              <CheckCircle2 className="w-3 h-3" />
                              Oficial
                            </span>
                          )}
                        </div>

                        {/* Título com Link */}
                        <h3 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white group-hover:text-brand-purple transition-colors leading-snug">
                          <Link href={`/noticias/${post.slug}`}>
                            {post.title}
                          </Link>
                        </h3>

                        {/* TL;DR Rápido */}
                        {post.tldr && post.tldr.length > 0 && (
                          <div className="mt-3 p-3.5 rounded-xl bg-zinc-50 dark:bg-gamer-850/80 border border-zinc-200/60 dark:border-gamer-750">
                            <div className="text-[11px] font-bold uppercase tracking-wider text-brand-purple flex items-center gap-1 mb-1.5">
                              <Sparkles className="w-3 h-3" /> Resumo Rápido TL;DR
                            </div>
                            <ul className="space-y-1">
                              {post.tldr.slice(0, 2).map((point, idx) => (
                                <li
                                  key={idx}
                                  className="text-xs text-zinc-600 dark:text-zinc-300 flex items-start gap-1.5"
                                >
                                  <span className="text-brand-purple font-bold">•</span>
                                  <span>{point}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Botão Ler Matéria */}
                        <div className="mt-3">
                          <Link
                            href={`/noticias/${post.slug}`}
                            className="inline-flex items-center gap-1 text-xs font-bold text-brand-purple hover:text-purple-400 transition-colors"
                          >
                            <span>Ler cobertura completa</span>
                            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                          </Link>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </main>

          {/* SIDEBAR LATERAL (4 colunas no desktop) */}
          <aside className="lg:col-span-4 space-y-8">
            {/* Box Ficha Técnica Completa */}
            <div className="p-6 rounded-2xl border border-zinc-200 dark:border-gamer-800 bg-white dark:bg-gamer-900 shadow-sm">
              <h3 className="text-base font-black text-zinc-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-zinc-200 dark:border-gamer-800 pb-3">
                <Gamepad2 className="w-4 h-4 text-brand-purple" />
                Ficha Técnica Oficial
              </h3>

              <dl className="space-y-3.5 text-xs sm:text-sm">
                <div className="flex justify-between items-start gap-2">
                  <dt className="text-zinc-500 dark:text-zinc-400 font-medium">Título Oficial</dt>
                  <dd className="font-bold text-zinc-900 dark:text-white text-right">{hub.name}</dd>
                </div>
                <div className="border-t border-zinc-100 dark:border-gamer-800 pt-2 flex justify-between items-start gap-2">
                  <dt className="text-zinc-500 dark:text-zinc-400 font-medium">Desenvolvedora</dt>
                  <dd className="font-semibold text-zinc-800 dark:text-zinc-200 text-right">{hub.developer}</dd>
                </div>
                <div className="border-t border-zinc-100 dark:border-gamer-800 pt-2 flex justify-between items-start gap-2">
                  <dt className="text-zinc-500 dark:text-zinc-400 font-medium">Publicadora</dt>
                  <dd className="font-semibold text-zinc-800 dark:text-zinc-200 text-right">{hub.publisher}</dd>
                </div>
                <div className="border-t border-zinc-100 dark:border-gamer-800 pt-2 flex justify-between items-start gap-2">
                  <dt className="text-zinc-500 dark:text-zinc-400 font-medium">Data de Lançamento</dt>
                  <dd className="font-bold text-zinc-900 dark:text-white text-right">{hub.release_date}</dd>
                </div>
                <div className="border-t border-zinc-100 dark:border-gamer-800 pt-2 flex justify-between items-start gap-2">
                  <dt className="text-zinc-500 dark:text-zinc-400 font-medium">Metacritic</dt>
                  <dd className="font-bold text-right">
                    {hub.metacritic_score !== null ? (
                      <span className="text-emerald-500 dark:text-emerald-400">
                        {hub.metacritic_score}/100
                      </span>
                    ) : (
                      <span className="text-zinc-400">Aguardando Avaliações</span>
                    )}
                  </dd>
                </div>
                <div className="border-t border-zinc-100 dark:border-gamer-800 pt-2">
                  <dt className="text-zinc-500 dark:text-zinc-400 font-medium mb-1.5">Plataformas Confirmadas</dt>
                  <dd className="flex flex-wrap gap-1.5">
                    {hub.platforms.map((plat) => (
                      <span
                        key={plat}
                        className="px-2 py-0.5 text-[11px] font-bold rounded bg-zinc-100 dark:bg-gamer-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-gamer-700"
                      >
                        {plat}
                      </span>
                    ))}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Box de Onde Comprar: Produtos de Afiliados */}
            <div className="p-6 rounded-2xl border border-brand-purple/30 bg-gradient-to-br from-white via-zinc-50 to-purple-50/20 dark:from-gamer-900 dark:via-gamer-900 dark:to-brand-purple/10 shadow-sm">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-200 dark:border-gamer-800">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-brand-purple" />
                  <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-wider">
                    Onde Comprar
                  </h3>
                </div>
                <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Parceiros Oficiais
                </span>
              </div>

              <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-4">
                Compre o jogo, consoles e acessórios temáticos através dos nossos links parceiros verificados para apoiar a redação.
              </p>

              <div className="space-y-3">
                {relevantProducts.map((product) => {
                  const hasProdImg = isValidImageUrl(product.image_url);
                  const priceFormatted =
                    typeof product.price_estimate === "number"
                      ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                          product.price_estimate
                        )
                      : null;

                  return (
                    <a
                      key={product.id}
                      href={product.affiliate_url}
                      target="_blank"
                      rel="sponsored nofollow"
                      className="group flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-gamer-850 border border-zinc-200/80 dark:border-gamer-700 hover:border-brand-purple transition-all duration-200 hover:shadow-md"
                    >
                      <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-zinc-100 dark:bg-gamer-950 flex-shrink-0">
                        {hasProdImg ? (
                          <Image
                            src={product.image_url}
                            alt={product.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform"
                            sizes="56px"
                          />
                        ) : (
                          <ShoppingCart className="w-6 h-6 m-auto text-zinc-400" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-zinc-900 dark:text-white group-hover:text-brand-purple transition-colors line-clamp-2 leading-tight">
                          {product.title}
                        </h4>
                        <div className="mt-1 flex items-center justify-between">
                          <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                            {priceFormatted || "Ver Preço"}
                          </span>
                          <span className="text-[10px] font-semibold text-zinc-400 flex items-center gap-0.5">
                            {product.store_name}
                            <ExternalLink className="w-2.5 h-2.5" />
                          </span>
                        </div>
                      </div>
                    </a>
                  );
                })}
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-200/60 dark:border-gamer-800/80 text-[10px] text-zinc-400 text-center">
                Preços de referência sujeitos a alteração pela loja anunciante.
              </div>
            </div>

            {/* Box de Outras Centrais */}
            <div className="p-6 rounded-2xl border border-zinc-200 dark:border-gamer-800 bg-white dark:bg-gamer-900 shadow-sm">
              <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-wider mb-3">
                Mais Centrais de Jogos
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
                Acompanhe o desenvolvimento de outros lançamentos de peso da indústria de games.
              </p>
              <Link
                href="/jogos"
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-gamer-850 hover:bg-zinc-200 dark:hover:bg-gamer-800 text-zinc-800 dark:text-zinc-200 text-xs font-bold transition-colors"
              >
                <Gamepad2 className="w-4 h-4 text-brand-purple" />
                <span>Ver Todos os Hubs de Jogos</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
