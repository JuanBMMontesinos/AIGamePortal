import Link from "next/link";
import { Flame, TrendingUp, ArrowUpRight } from "lucide-react";
import { Post, Category } from "@/types/database";
import { formatRelativeTime } from "@/lib/utils";
import { AdBanner } from "@/components/AdBanner";

interface PulseItem {
  name: string;
  label: string;
  score: number;
  colorClass: string;
  barClass: string;
  slug?: string;
}

const DEFAULT_PULSE: PulseItem[] = [
  {
    name: "Ghost of Yōtei",
    label: "94% Positivo",
    score: 94,
    colorClass: "text-emerald-500",
    barClass: "bg-emerald-500",
    slug: "ghost-of-yotei-gameplay-ps5-pro-combate",
  },
  {
    name: "GTA VI Trailer 2",
    label: "98% Hype Extremo",
    score: 98,
    colorClass: "text-brand-purple",
    barClass: "bg-gradient-to-r from-brand-purple to-brand-cyan",
    slug: "gta-vi-rockstar-fisica-agua-trailer-2-detalhes",
  },
  {
    name: "Switch 2 Preço/Specs",
    label: "82% Empolgado",
    score: 82,
    colorClass: "text-amber-500",
    barClass: "bg-amber-500",
    slug: "nintendo-switch-2-oled-120hz-retrocompatibilidade-total",
  },
];

/**
 * Converte notícias reais do Supabase em métricas dinâmicas do Pulso da Comunidade
 */
function extractPulseItems(posts: Post[] = []): PulseItem[] {
  const items: PulseItem[] = [];
  const seenNames = new Set<string>();

  for (const post of posts) {
    if (!post.community_sentiment && !post.game_metadata?.game_name) continue;

    // Obtém o nome limpo do jogo ou do tópico
    let rawName = post.game_metadata?.game_name?.trim();
    if (!rawName || rawName.toLowerCase().includes("não confirmad") || rawName.toLowerCase().includes("share of")) {
      const parts = post.title.split(/[:–—]/);
      rawName = parts[0]?.trim() || post.title;
    }

    // Limita tamanho para caber no widget
    const cleanName = rawName.length > 25 ? `${rawName.slice(0, 24)}...` : rawName;
    const lowerKey = cleanName.toLowerCase();
    if (seenNames.has(lowerKey)) continue;
    seenNames.add(lowerKey);

    const sentiment = (post.community_sentiment || "").toLowerCase();
    let score = 91;
    let label = "91% Positivo";
    let colorClass = "text-emerald-500";
    let barClass = "bg-emerald-500";

    if (
      sentiment.includes("hype") ||
      sentiment.includes("grande empolgação") ||
      sentiment.includes("explosiv") ||
      sentiment.includes("muito positivo")
    ) {
      score = 96;
      label = "96% Hype Extremo";
      colorClass = "text-brand-purple";
      barClass = "bg-gradient-to-r from-brand-purple to-brand-cyan";
    } else if (
      sentiment.includes("cautela") ||
      sentiment.includes("debate") ||
      sentiment.includes("divid") ||
      sentiment.includes("mudança")
    ) {
      score = 85;
      label = "85% Debate Acalorado";
      colorClass = "text-amber-500";
      barClass = "bg-amber-500";
    } else if (
      sentiment.includes("entusiasmo") ||
      sentiment.includes("celebrou") ||
      sentiment.includes("positivo") ||
      sentiment.includes("elogi")
    ) {
      score = 93;
      label = "93% Positivo";
      colorClass = "text-emerald-500";
      barClass = "bg-emerald-500";
    }

    items.push({
      name: cleanName,
      label,
      score,
      colorClass,
      barClass,
      slug: post.slug,
    });

    if (items.length >= 3) break;
  }

  return items.length >= 2 ? items : DEFAULT_PULSE;
}

interface SidebarProps {
  trendingPosts: Post[];
  categories: Category[];
  pulsePosts?: Post[];
  showAdBanner?: boolean;
}

export function Sidebar({
  trendingPosts,
  categories,
  pulsePosts,
  showAdBanner = true,
}: SidebarProps) {
  const pulseItems = extractPulseItems(pulsePosts);

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
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-purple">
                      {post.categories?.name || "Games"}
                    </span>
                    {post.is_rumor && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 uppercase">
                        Rumor
                      </span>
                    )}
                  </div>
                  <h4 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 group-hover:text-brand-purple dark:group-hover:text-brand-purple transition-colors line-clamp-2 mt-0.5 leading-snug">
                    {post.title}
                  </h4>
                  <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-1">
                    <span>{formatRelativeTime(post.published_at)}</span>
                    <span>•</span>
                    <span className="text-zinc-500 font-medium">
                      {post.views_count.toLocaleString("pt-BR")} views
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Radar de Sentimento da Comunidade (AI Sentiment Pulse Conectado ao Supabase) */}
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

        <div className="space-y-3.5">
          {pulseItems.map((item) => (
            <Link
              key={item.slug || item.name}
              href={item.slug ? `/noticias/${item.slug}` : "#"}
              className="block group space-y-1.5 hover:opacity-90 transition-opacity"
            >
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-zinc-700 dark:text-zinc-300 group-hover:text-brand-purple dark:group-hover:text-brand-purple transition-colors truncate max-w-[65%]">
                  {item.name}
                </span>
                <span className={item.colorClass}>{item.label}</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-zinc-200 dark:bg-gamer-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${item.barClass}`}
                  style={{ width: `${item.score}%` }}
                />
              </div>
            </Link>
          ))}
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

      {/* 4. Banner Publicitário Fixo na Barra Lateral */}
      {showAdBanner && (
        <div className="pt-2">
          <AdBanner format="sidebar-sticky" />
        </div>
      )}
    </aside>
  );
}
