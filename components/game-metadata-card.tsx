import { GameMetadata } from "@/types/database";
import { Gamepad, Monitor, Building2, Calendar, Award, Tag } from "lucide-react";
import { getMetacriticColor, formatDate } from "@/lib/utils";

interface GameMetadataCardProps {
  metadata?: GameMetadata | null;
}

export function GameMetadataCard({ metadata }: GameMetadataCardProps) {
  if (!metadata || (!metadata.game_name && !metadata.developer && (!metadata.platforms || metadata.platforms.length === 0))) {
    return null;
  }

  const metacritic = metadata.metacritic_score;
  const metaColor = getMetacriticColor(metacritic);

  return (
    <aside aria-label="Ficha Técnica do Jogo" className="my-8 rounded-2xl border border-zinc-200 dark:border-gamer-850 bg-zinc-50 dark:bg-gamer-900/90 p-6 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-gamer-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20">
            <Gamepad className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-white">
              Ficha Técnica
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {metadata.game_name || "Dados do Jogo"}
            </p>
          </div>
        </div>

        {/* Metacritic Score Badge */}
        {metacritic !== null && metacritic !== undefined ? (
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${metaColor.border} ${metaColor.bg}`}
            title={`Nota Metacritic: ${metacritic}/100`}
          >
            <Award className={`w-4 h-4 ${metaColor.text}`} />
            <div className="text-right">
              <span className={`text-sm font-black ${metaColor.text}`}>
                {metacritic}
              </span>
              <span className="text-[10px] text-zinc-400 block -mt-1 font-medium">
                Metascore
              </span>
            </div>
          </div>
        ) : (
          <span className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-zinc-200/60 dark:bg-gamer-800 text-zinc-500">
            Sem Metascore oficial
          </span>
        )}
      </div>

      {/* Grid of specifications */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
        {/* Plataformas */}
        {metadata.platforms && metadata.platforms.length > 0 && (
          <div className="space-y-1">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              <Monitor className="w-3.5 h-3.5 text-brand-purple" />
              Plataformas
            </span>
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {metadata.platforms.map((plat) => (
                <span
                  key={plat}
                  className="px-2 py-0.5 rounded-md text-xs font-medium bg-zinc-200/80 dark:bg-gamer-800 text-zinc-800 dark:text-zinc-200 border border-zinc-300/40 dark:border-gamer-700/50"
                >
                  {plat}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Desenvolvedora & Publicadora */}
        {(metadata.developer || metadata.publisher) && (
          <div className="space-y-1">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              <Building2 className="w-3.5 h-3.5 text-brand-cyan" />
              Estúdio & Produção
            </span>
            <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              {metadata.developer || metadata.publisher}
            </p>
            {metadata.publisher && metadata.developer && metadata.publisher !== metadata.developer && (
              <p className="text-xs text-zinc-500">Pub: {metadata.publisher}</p>
            )}
          </div>
        )}

        {/* Gênero */}
        {metadata.genre && (
          <div className="space-y-1">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              <Tag className="w-3.5 h-3.5 text-emerald-400" />
              Gênero
            </span>
            <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              {metadata.genre}
            </p>
          </div>
        )}

        {/* Data de Lançamento */}
        {metadata.release_date && (
          <div className="space-y-1 sm:col-span-2 lg:col-span-1">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              Previsão / Lançamento
            </span>
            <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              {formatDate(metadata.release_date)}
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
