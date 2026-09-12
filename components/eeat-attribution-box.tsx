import Link from "next/link";
import { ShieldCheck, ExternalLink, FileText, Sparkles } from "lucide-react";
import { Source } from "@/types/database";

interface EeatAttributionBoxProps {
  sourceOriginalUrl: string;
  sourceOriginalTitle?: string | null;
  source?: Source | null;
}

export function EeatAttributionBox({
  sourceOriginalUrl,
  sourceOriginalTitle,
  source,
}: EeatAttributionBoxProps) {
  const sourceName = source?.name || "Fonte Oficial Primária";

  return (
    <div className="my-8 rounded-2xl border border-zinc-200 dark:border-gamer-800 bg-zinc-50 dark:bg-gamer-950 p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-gamer-850">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-brand-purple/10 text-brand-purple border border-brand-purple/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              Atribuição de Fonte & Transparência E-E-A-T
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Conformidade editorial, ética e respeito aos direitos autorais
            </p>
          </div>
        </div>

        <Link
          href="/transparencia-editorial"
          className="text-xs font-semibold text-brand-purple hover:underline inline-flex items-center gap-1"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Nossa Política de IA
        </Link>
      </div>

      <div className="mt-4 space-y-3">
        <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
          Esta cobertura foi redigida e estruturada por nossos agentes autônomos de IA a partir do comunicado ou artigo publicado originalmente por{" "}
          <strong className="text-zinc-900 dark:text-zinc-100 font-semibold">{sourceName}</strong>. 
          Verificamos a fidelidade dos fatos contra a fonte primária para evitar alucinações.
        </p>

        {sourceOriginalTitle && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-white dark:bg-gamer-900 border border-zinc-200/60 dark:border-gamer-800 text-xs">
            <FileText className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-zinc-400 block font-medium">Título da Matéria Original:</span>
              <span className="text-zinc-800 dark:text-zinc-200 font-semibold">{sourceOriginalTitle}</span>
            </div>
          </div>
        )}

        <div className="pt-2 flex items-center">
          <a
            href={sourceOriginalUrl}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-bold text-xs hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors shadow-sm"
          >
            <span>Acessar Notícia na Fonte Original ({sourceName})</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
