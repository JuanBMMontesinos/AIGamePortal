import { Metadata } from "next";
import { getPaginatedLatestPosts, getTrendingPosts, getCategories } from "@/lib/data/api";
import { HeroFeatured } from "@/components/hero-featured";
import { NewsCard } from "@/components/news-card";
import { Sidebar } from "@/components/sidebar";
import { NewsletterBox } from "@/components/NewsletterBox";
import { Pagination } from "@/components/pagination";
import { Newspaper, Zap } from "lucide-react";

export const revalidate = 120; // ISR fallback a cada 2 minutos (também revalidável sob demanda via /api/revalidate)

interface HomePageProps {
  searchParams?: Promise<{
    page?: string;
  }>;
}

export async function generateMetadata({
  searchParams,
}: HomePageProps): Promise<Metadata> {
  const resolvedSearchParams = await searchParams;
  const pageParam = parseInt(resolvedSearchParams?.page || "1", 10);
  const currentPage = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://aigameportal.com").replace(/\/+$/, "");

  if (currentPage > 1) {
    return {
      title: `Notícias Gamer com IA em Tempo Real • Página ${currentPage} | Made By AI Games`,
      description: `Explore a página ${currentPage} das últimas notícias do mundo dos games com curadoria de IA e resumos instantâneos no Made By AI Games.`,
      alternates: {
        canonical: `${siteUrl}?page=${currentPage}`,
      },
    };
  }

  return {
    title: "Made By AI Games • Notícias Gamer com IA em Tempo Real",
    description:
      "Descubra as últimas notícias, análises de sentimento e resumos em 30 segundos dos maiores lançamentos do mundo dos games.",
    alternates: {
      canonical: siteUrl,
    },
  };
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const resolvedSearchParams = await searchParams;
  const pageParam = parseInt(resolvedSearchParams?.page || "1", 10);
  const currentPage = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;

  const [{ posts, totalPages }, trendingPosts, categories] = await Promise.all([
    getPaginatedLatestPosts(currentPage, 10),
    getTrendingPosts(5),
    getCategories(),
  ]);

  const isFirstPage = currentPage === 1;
  const heroPost = isFirstPage && posts.length > 0 ? posts[0] : null;
  const gridPosts = isFirstPage && posts.length > 1 ? posts.slice(1) : posts;

  return (
    <div className="space-y-12">
      {/* 1. Hero Section (Apenas na Página 1 para não sobrecarregar navegações secundárias) */}
      {heroPost && <HeroFeatured post={heroPost} />}

      {/* 2. Main Content Grid & Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
        {/* Left Column: Latest News Grid (8 cols) */}
        <section className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-gamer-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-brand-purple/10 text-brand-purple border border-brand-purple/20">
                <Newspaper className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
                  <span>Últimas Notícias</span>
                  {!isFirstPage && (
                    <span className="text-xs font-normal px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-gamer-800 text-zinc-500 dark:text-zinc-400">
                      Página {currentPage} de {totalPages}
                    </span>
                  )}
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {isFirstPage
                    ? "Atualizado em tempo real pelo pipeline autônomo"
                    : `Mostrando registros do acervo histórico do portal`}
                </p>
              </div>
            </div>

            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/25">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Feed Ao Vivo
            </span>
          </div>

          {gridPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {gridPosts.map((post, idx) => (
                <NewsCard key={post.id} post={post} priority={isFirstPage && idx < 2} />
              ))}
            </div>
          ) : (
            <div className="p-12 text-center rounded-2xl border border-zinc-200 dark:border-gamer-800 bg-white dark:bg-gamer-900">
              <Zap className="w-8 h-8 mx-auto text-brand-purple opacity-50 mb-3" />
              <p className="text-zinc-600 dark:text-zinc-400 text-sm">
                Novas matérias estão sendo sintetizadas por nossa IA. Volte em instantes!
              </p>
            </div>
          )}

          {/* Paginação Discreta */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            baseUrl="/"
          />
        </section>

        {/* Right Column: Sidebar (4 cols) */}
        <div className="lg:col-span-4">
          <Sidebar
            trendingPosts={trendingPosts}
            categories={categories}
            pulsePosts={posts}
          />
        </div>
      </div>

      {/* 3. Seção Especial de Inscrição da Newsletter Gamer */}
      <section className="pt-4">
        <NewsletterBox variant="default" />
      </section>
    </div>
  );
}
