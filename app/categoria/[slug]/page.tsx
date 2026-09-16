import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Gamepad2, Layers, Newspaper } from "lucide-react";
import {
  getPostsByCategory,
  getAllCategorySlugs,
  getCategoryBySlug,
} from "@/lib/data/api";
import { NewsCard } from "@/components/news-card";

export const revalidate = 1800; // 30 minutos (1800s) para Edge Caching Cloudflare/Vercel

interface CategoryPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  const slugs = await getAllCategorySlugs();
  return slugs.map((item) => ({
    slug: item.slug,
  }));
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) {
    return {
      title: "Categoria Não Encontrada",
    };
  }

  return {
    title: `${category.name} • Notícias e Lançamentos`,
    description: `Acompanhe as últimas notícias, análises e novidades de ${category.name} com curadoria e resumos em tempo real no AIGamePortal.`,
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const { category, posts } = await getPostsByCategory(slug);

  if (!category) {
    notFound();
  }

  return (
    <div className="space-y-8 py-4 sm:py-6">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
        <Link href="/" className="hover:text-brand-purple transition-colors">
          Início
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-zinc-800 dark:text-zinc-200 font-medium">
          Categorias
        </span>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-brand-purple font-semibold">{category.name}</span>
      </nav>

      {/* Category Banner Header */}
      <header className="rounded-2xl md:rounded-3xl border border-zinc-200 dark:border-gamer-800 bg-gradient-to-r from-brand-purple/10 via-zinc-900/40 to-brand-cyan/10 p-6 sm:p-10 relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-brand-purple/20 text-brand-purple dark:text-purple-300 border border-brand-purple/30 mb-3">
            <Layers className="w-3.5 h-3.5" />
            Canal Editorial
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-zinc-900 dark:text-white tracking-tight">
            {category.name}
          </h1>
          <p className="mt-2 text-sm sm:text-base text-zinc-600 dark:text-zinc-300 leading-relaxed">
            Cobertura automatizada e sintetizada dos principais lançamentos, comunicados oficiais e repercussão para {category.name}.
          </p>
        </div>

        <div className="absolute right-6 bottom-4 sm:bottom-6 opacity-10 dark:opacity-5 pointer-events-none">
          <Gamepad2 className="w-36 h-36 sm:w-48 sm:h-48 text-brand-purple" />
        </div>
      </header>

      {/* News Grid */}
      <section className="space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-gamer-800">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <Newspaper className="w-4 h-4 text-brand-purple" />
            Matérias em {category.name} ({posts.length})
          </h2>
        </div>

        {posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post, idx) => (
              <NewsCard key={post.id} post={post} priority={idx < 3} />
            ))}
          </div>
        ) : (
          <div className="p-16 text-center rounded-2xl border border-zinc-200 dark:border-gamer-800 bg-white dark:bg-gamer-900 space-y-3">
            <div className="flex justify-center">
              <div className="p-3 rounded-2xl bg-zinc-100 dark:bg-gamer-800 text-zinc-400">
                <Gamepad2 className="w-8 h-8" />
              </div>
            </div>
            <h3 className="font-bold text-lg text-zinc-800 dark:text-zinc-200">
              Nenhuma notícia publicada ainda nesta categoria
            </h3>
            <p className="text-sm text-zinc-500 max-w-md mx-auto">
              Nossos agentes estão monitorando os feeds RSS oficiais desta plataforma. Novas atualizações aparecerão automaticamente em breve.
            </p>
            <div className="pt-2">
              <Link
                href="/"
                className="inline-flex items-center px-4 py-2 rounded-xl bg-brand-purple text-white text-xs font-semibold hover:bg-brand-purple/90 transition-colors"
              >
                Voltar à Página Inicial
              </Link>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
