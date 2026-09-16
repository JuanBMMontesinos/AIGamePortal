import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Gamepad2, Sparkles, Calendar, Layers, ShieldCheck, ChevronRight, Award } from "lucide-react";
import { getGameHubs, getLatestPosts } from "@/lib/data/api";
import { isValidImageUrl } from "@/lib/utils";

export const revalidate = 3600; // ISR revalidate fallback a cada 1 hora

export const metadata: Metadata = {
  title: "Centrais de Jogos & Franquias • Hubs Permanentes",
  description:
    "Explore as centrais permanentes das maiores franquias do mundo dos games. Notícias em tempo real, fichas técnicas, datas de lançamento, notas Metacritic e onde comprar os melhores jogos.",
  alternates: {
    canonical: `${(process.env.NEXT_PUBLIC_SITE_URL || "https://aigameportal.com").replace(/\/+$/, "")}/jogos`,
  },
  openGraph: {
    title: "Centrais de Jogos & Franquias • Hubs Permanentes | AIGamePortal",
    description:
      "Tudo sobre GTA VI, Monster Hunter Wilds, Elden Ring, Ghost of Yōtei e muito mais. Cobertura jornalística unificada por franquia.",
    type: "website",
    locale: "pt_BR",
    url: "/jogos",
  },
  twitter: {
    card: "summary_large_image",
    title: "Centrais de Jogos & Franquias • AIGamePortal",
    description: "Cobertura completa e centralizada das maiores franquias gamer em tempo real.",
  },
};

export default async function JogosPage() {
  const hubs = await getGameHubs();
  const allPosts = await getLatestPosts(50);
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://aigameportal.com").replace(/\/+$/, "");

  // Schema.org BreadcrumbList
  const breadcrumbJsonLd = {
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
    ],
  };

  return (
    <div className="min-w-0 pb-16">
      {/* Schema.org JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* Hero da Seção */}
      <section className="relative overflow-hidden border-b border-zinc-200/80 dark:border-gamer-800/80 bg-gradient-to-b from-zinc-50 via-white to-zinc-100 dark:from-gamer-950 dark:via-gamer-900 dark:to-gamer-950 py-12 md:py-16">
        <div className="absolute inset-0 bg-cyber-grid bg-[size:32px_32px] opacity-40 dark:opacity-20 pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-brand-purple/10 dark:bg-brand-purple/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-brand-cyan/10 dark:bg-brand-cyan/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-purple/10 dark:bg-brand-purple/20 border border-brand-purple/30 text-brand-purple dark:text-purple-300 text-xs font-bold uppercase tracking-wider mb-4">
              <Gamepad2 className="w-4 h-4" />
              SEO de Cauda Longa • Hubs Permanentes
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-zinc-900 dark:text-white leading-tight">
              Centrais de <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-purple via-purple-400 to-brand-cyan">Grandes Jogos</span>
            </h1>

            <p className="mt-4 text-base sm:text-lg text-zinc-600 dark:text-zinc-300 leading-relaxed">
              Linha do tempo completa, notícias apuradas por IA, ficha técnica oficial e links para comprar os lançamentos mais aguardados e franquias lendárias.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-brand-purple" />
                Clusterização Automática por IA
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-emerald-500" />
                Metacritic & Ficha Técnica Oficial
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-brand-cyan" />
                Deduplicação de Cobertura
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Grid de Hubs */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
              Franquias e Jogos em Destaque
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
              Clique em um hub para acessar a cobertura cronológica completa e novidades.
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-zinc-100 dark:bg-gamer-850 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-gamer-700">
            {hubs.length} Centrais Ativas
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 lg:gap-8">
          {hubs.map((hub) => {
            // Contar notícias vinculadas a este hub
            const hubPosts = allPosts.filter((p) => {
              if (p.game_hub_id === hub.id) return true;
              const gName = p.game_metadata?.game_name?.toLowerCase() || "";
              const title = p.title?.toLowerCase() || "";
              return (
                gName.includes(hub.name.toLowerCase()) ||
                title.includes(hub.name.toLowerCase()) ||
                (hub.aliases && hub.aliases.some((a) => title.includes(a.toLowerCase())))
              );
            });

            const hasValidBanner = isValidImageUrl(hub.banner_image_url);
            const hasValidCover = isValidImageUrl(hub.cover_image_url);

            return (
              <article
                key={hub.id}
                className="group relative flex flex-col rounded-2xl border border-zinc-200/90 dark:border-gamer-800/90 bg-white dark:bg-gamer-900 overflow-hidden shadow-sm hover:shadow-neon-purple transition-all duration-300 hover:border-brand-purple/50"
              >
                {/* Banner de fundo no topo */}
                <div className="relative h-44 sm:h-52 w-full overflow-hidden bg-gamer-950">
                  {hasValidBanner ? (
                    <Image
                      src={hub.banner_image_url}
                      alt={`Banner panorâmico de ${hub.name}`}
                      fill
                      className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-r from-brand-purple/30 to-brand-cyan/20 flex items-center justify-center">
                      <Gamepad2 className="w-12 h-12 text-zinc-500/50" />
                    </div>
                  )}

                  {/* Gradiente escurecido */}
                  <div className="absolute inset-0 bg-gradient-to-t from-white via-white/50 to-transparent dark:from-gamer-900 dark:via-gamer-900/60 dark:to-transparent" />

                  {/* Metacritic Badge no topo do banner */}
                  <div className="absolute top-3 right-3 flex items-center gap-2">
                    {hub.metacritic_score !== null ? (
                      <div
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-black tracking-wide shadow-md ${
                          hub.metacritic_score >= 90
                            ? "bg-emerald-500 text-white"
                            : hub.metacritic_score >= 75
                            ? "bg-amber-500 text-white"
                            : "bg-rose-500 text-white"
                        }`}
                        title="Nota Metacritic Oficial"
                      >
                        <Award className="w-3.5 h-3.5" />
                        <span>{hub.metacritic_score}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-zinc-900/80 text-zinc-300 backdrop-blur-md border border-zinc-700/50">
                        <span>Aguardando Nota</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Conteúdo do Card */}
                <div className="relative p-5 sm:p-6 -mt-16 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Linha superior com Capa em miniatura e Metadados */}
                    <div className="flex items-start gap-4 mb-4">
                      <div className="relative w-20 h-28 sm:w-24 sm:h-32 rounded-xl overflow-hidden shadow-xl border-2 border-white dark:border-gamer-700 bg-gamer-950 flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
                        {hasValidCover ? (
                          <Image
                            src={hub.cover_image_url}
                            alt={`Capa oficial de ${hub.name}`}
                            fill
                            className="object-cover"
                            sizes="96px"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gamer-850">
                            <Gamepad2 className="w-8 h-8 text-brand-purple" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0 pt-10 sm:pt-12">
                        <h3 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white tracking-tight group-hover:text-brand-purple transition-colors truncate">
                          <Link href={`/jogos/${hub.slug}`}>{hub.name}</Link>
                        </h3>

                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                          <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                            {hub.developer}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-zinc-400" />
                            {hub.release_date}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Plataformas */}
                    <div className="flex flex-wrap items-center gap-1.5 mb-3">
                      {hub.platforms.slice(0, 4).map((plat) => (
                        <span
                          key={plat}
                          className="px-2 py-0.5 text-[11px] font-bold rounded bg-zinc-100 dark:bg-gamer-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-gamer-700"
                        >
                          {plat}
                        </span>
                      ))}
                      {hub.platforms.length > 4 && (
                        <span className="text-[10px] font-semibold text-zinc-400">
                          +{hub.platforms.length - 4}
                        </span>
                      )}
                    </div>

                    {/* Sinopse resumida */}
                    <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 line-clamp-3 leading-relaxed mb-4">
                      {hub.synopsis}
                    </p>
                  </div>

                  {/* Rodapé do Card */}
                  <div className="pt-4 border-t border-zinc-100 dark:border-gamer-800 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                      <Layers className="w-3.5 h-3.5 text-brand-cyan" />
                      <span>
                        {hubPosts.length}{" "}
                        {hubPosts.length === 1 ? "matéria apurada" : "matérias apuradas"}
                      </span>
                    </div>

                    <Link
                      href={`/jogos/${hub.slug}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-brand-purple to-purple-600 hover:from-purple-600 hover:to-brand-purple shadow-sm transition-all group-hover:scale-105"
                    >
                      <span>Acessar Central</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
