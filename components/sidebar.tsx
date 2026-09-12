import Link from "next/link";
import { Flame, TrendingUp, ShieldCheck, Radio, Sparkles, ArrowUpRight } from "lucide-react";
import { Post, Category } from "@/types/database";
import { formatRelativeTime } from "@/lib/utils";

interface SidebarProps {
  trendingPosts: Post[];
  categories: Category[];
}

export function Sidebar({ trendingPosts, categories }: SidebarProps) {
  return (
    <aside className="w-full space-y-8">
      {/* 1. Mais Lidas / Em Alta */}
      <div className="rounded-2xl border border-zinc-200 dark:border-gamer-800 bg-white dark:bg-gamer-900 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500">
              <Flame className="w-4 h-4 fill-current" />
            </div>
            <h3 className="font-bold text-base text-zinc-900 dark:text-white">
              Mais Lidas da Semana
            </h3>
          </div>
          <span className="text-[11px] font-semibold text-zinc-400">Em Alta</span>
        </div>

        <div className="space-y-4 divide-y divide-zinc-100 dark:divide-gamer-800/80">
          {trendingPosts.map((post, idx) => (
            <div key={post.id} className={idx === 0 ? "" : "pt-4"}>
              <Link href={`/noticias/${post.slug}`} className="group flex items-start gap-3.5">
                <span className="font-black text-2xl text-zinc-300 dark:text-gamer-600 group-hover:text-brand-purple transition-colors shrink-0 w-6">
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-purple">
                    {post.categories?.name || "Games"}
                  </span>
                  <h4 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 group-hover:text-brand-purple dark:group-hover:text-brand-purple transition-colors line-clamp-2 mt-0.5 leading-snug">
                    {post.title}
                  </h4>
                  <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-1">
                    <span>{formatRelativeTime(post.published_at)}</span>
                    <span>•</span>
                    <span className="text-zinc-500 font-medium">{post.views_count.toLocaleString("pt-BR")} views</span>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Radar de Sentimento da Comunidade (AI Sentiment Pulse) */}
      <div className="rounded-2xl border border-zinc-200 dark:border-gamer-800 bg-gradient-to-b from-brand-purple/5 to-brand-cyan/5 dark:from-brand-purple/10 dark:to-transparent p-6 relative overflow-hidden">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 rounded-lg bg-brand-cyan/10 text-brand-cyan">
            <TrendingUp className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-base text-zinc-900 dark:text-white">
            Pulso da Comunidade
          </h3>
        </div>
        <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-4 leading-relaxed">
          Nossa IA analisa em tempo real reações no Reddit, X e fóruns especializados para medir o hype e a recepção pública dos maiores lançamentos.
        </p>

        <div className="space-y-3">
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-zinc-700 dark:text-zinc-300">Ghost of Yōtei</span>
              <span className="text-emerald-500">94% Positivo</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-zinc-200 dark:bg-gamer-800 overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full w-[94%]" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-zinc-700 dark:text-zinc-300">GTA VI Trailer 2</span>
              <span className="text-brand-purple">98% Hype Extremo</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-zinc-200 dark:bg-gamer-800 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-brand-purple to-brand-cyan rounded-full w-[98%]" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-zinc-700 dark:text-zinc-300">Switch 2 Preço/Specs</span>
              <span className="text-amber-500">82% Empolgado</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-zinc-200 dark:bg-gamer-800 overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full w-[82%]" />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Atalhos Rápidos por Categoria */}
      <div className="rounded-2xl border border-zinc-200 dark:border-gamer-800 bg-white dark:bg-gamer-900 p-6 shadow-sm">
        <h3 className="font-bold text-base text-zinc-900 dark:text-white mb-4">
          Explorar por Plataforma
        </h3>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/categoria/${cat.slug}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-gamer-800 hover:bg-brand-purple hover:text-white dark:hover:bg-brand-purple text-zinc-700 dark:text-zinc-300 transition-all border border-zinc-200 dark:border-gamer-700/60"
            >
              <span>{cat.name}</span>
              <ArrowUpRight className="w-3 h-3 opacity-60" />
            </Link>
          ))}
        </div>
      </div>

      {/* 4. Transparência & Governança Callout */}
      <div className="rounded-2xl border border-brand-purple/30 bg-brand-purple/5 p-6 space-y-3">
        <div className="flex items-center gap-2 text-brand-purple">
          <ShieldCheck className="w-5 h-5" />
          <h4 className="font-bold text-sm">Governança Algorítmica</h4>
        </div>
        <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
          Nenhum artigo é publicado sem deduplicação semântica vetorial (Gemini 768d) e atribuição de link canônico para preservar os créditos das redações originais.
        </p>
        <Link
          href="/transparencia-editorial"
          className="inline-flex items-center gap-1 text-xs font-bold text-brand-purple hover:underline"
        >
          Leia nosso manifesto editorial →
        </Link>
      </div>
    </aside>
  );
}
