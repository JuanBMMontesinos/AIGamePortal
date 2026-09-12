import { Zap, Sparkles } from "lucide-react";

interface TldrBoxProps {
  bullets: string[];
}

export function TldrBox({ bullets }: TldrBoxProps) {
  if (!bullets || bullets.length === 0) return null;

  return (
    <section aria-labelledby="tldr-heading" className="my-8 rounded-2xl border-2 border-brand-purple/40 bg-gradient-to-br from-brand-purple/10 via-zinc-900/60 to-brand-cyan/10 p-6 sm:p-7 shadow-neon-purple/20 relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-36 h-36 bg-brand-purple/20 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-4 pb-3 border-b border-brand-purple/20">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-purple text-white shadow-neon-purple">
            <Zap className="w-4 h-4 fill-current" />
          </div>
          <div>
            <h2 id="tldr-heading" className="text-base sm:text-lg font-black tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
              TL;DR • Resumo em 30 Segundos
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Sintetizado por IA para leitura ágil
            </p>
          </div>
        </div>

        <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-brand-purple/20 text-brand-purple dark:text-purple-300 border border-brand-purple/30">
          <Sparkles className="w-3 h-3" /> Fatos Principais
        </span>
      </div>

      {/* Bullet Points */}
      <ul className="space-y-3">
        {bullets.map((bullet, idx) => (
          <li key={idx} className="flex items-start gap-3">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-brand-purple/20 text-brand-purple font-bold text-xs shrink-0 mt-0.5 border border-brand-purple/30">
              {idx + 1}
            </span>
            <span className="text-sm sm:text-base text-zinc-800 dark:text-zinc-200 leading-relaxed font-normal">
              {bullet}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
