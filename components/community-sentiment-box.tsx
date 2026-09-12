import { MessageSquare, Users, ThumbsUp, Flame } from "lucide-react";

interface CommunitySentimentBoxProps {
  sentimentText?: string | null;
}

export function CommunitySentimentBox({ sentimentText }: CommunitySentimentBoxProps) {
  if (!sentimentText) return null;

  return (
    <section aria-labelledby="community-heading" className="my-8 rounded-2xl border border-zinc-200 dark:border-gamer-800 bg-white dark:bg-gamer-900 p-6 shadow-sm overflow-hidden relative">
      <div className="flex items-center justify-between gap-4 mb-4 pb-3 border-b border-zinc-100 dark:border-gamer-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h2 id="community-heading" className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              O Que a Comunidade Está Dizendo
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Síntese de comentários e discussões no Reddit & X/Twitter
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-semibold border border-emerald-500/20">
          <ThumbsUp className="w-3.5 h-3.5" />
          <span>Voz dos Players</span>
        </div>
      </div>

      <div className="flex items-start gap-4">
        <div className="flex -space-x-2 overflow-hidden shrink-0 pt-1">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-orange-600/20 text-orange-500 text-xs font-bold border border-orange-500/30">
            r/
          </span>
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-zinc-800 text-white text-xs font-bold border border-zinc-700">
            𝕏
          </span>
        </div>

        <blockquote className="text-sm sm:text-base text-zinc-700 dark:text-zinc-300 leading-relaxed italic">
          "{sentimentText}"
        </blockquote>
      </div>
    </section>
  );
}
