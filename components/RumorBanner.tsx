import React from "react";
import { AlertTriangle, ShieldAlert, Info } from "lucide-react";

export interface RumorBannerProps {
  warning?: string | null;
  reliabilityScore?: number;
  className?: string;
}

const RELIABILITY_LABELS: Record<number, { text: string; color: string }> = {
  1: { text: "Boato de Fórum / Fonte Anônima", color: "text-rose-400" },
  2: { text: "Datamine / Vazamento Não Oficial", color: "text-amber-400" },
  3: { text: "Patente / Registro Regulatório", color: "text-yellow-400" },
  4: { text: "Investigação com Múltiplas Fontes", color: "text-blue-400" },
  5: { text: "Canal / Pronunciamento Oficial", color: "text-emerald-400" },
};

export function RumorBanner({
  warning,
  reliabilityScore = 2,
  className = "",
}: RumorBannerProps) {
  const safeScore = Math.max(1, Math.min(5, Math.round(reliabilityScore)));
  const scoreInfo = RELIABILITY_LABELS[safeScore] || RELIABILITY_LABELS[2];

  return (
    <aside
      role="alert"
      aria-labelledby="rumor-alert-title"
      className={`relative overflow-hidden rounded-2xl border border-amber-500/30 bg-amber-500/10 dark:bg-amber-500/[0.08] p-4 sm:p-5 backdrop-blur-sm shadow-sm transition-all my-6 ${className}`}
    >
      {/* Luz ambiente âmbar néon de fundo */}
      <div
        className="absolute -top-10 -right-10 w-36 h-36 bg-amber-500/15 rounded-full blur-2xl pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative flex flex-col sm:flex-row items-start gap-3.5">
        {/* Ícone de alerta em destaque com estilo gamer */}
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-500/20 text-amber-500 dark:text-amber-400 border border-amber-500/40 shrink-0 shadow-sm">
          <AlertTriangle className="w-5 h-5 animate-pulse" />
        </div>

        {/* Conteúdo textual */}
        <div className="flex-1 space-y-2">
          {/* Header do Alerta & Badge de Confiabilidade */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                Rumor / Vazamento Não Confirmado
              </span>
            </div>

            {/* Medidor visual de confiabilidade (1 a 5) */}
            <div
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-black/20 dark:bg-zinc-900/60 border border-amber-500/20 text-[11px]"
              title={`Classificação editorial de confiabilidade da fonte: ${safeScore} de 5`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
              <span className="text-zinc-600 dark:text-zinc-300 font-medium">Confiabilidade:</span>
              <div className="flex items-center gap-0.5" aria-label={`Nota ${safeScore} de 5`}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={`w-1.5 h-3.5 rounded-sm transition-colors ${
                      star <= safeScore
                        ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]"
                        : "bg-zinc-300 dark:bg-zinc-700 opacity-40"
                    }`}
                  />
                ))}
              </div>
              <span className={`font-semibold ml-1 ${scoreInfo.color}`}>
                {safeScore}/5 ({scoreInfo.text})
              </span>
            </div>
          </div>

          {/* Texto de aviso mandatório de conformidade E-E-A-T */}
          <p
            id="rumor-alert-title"
            className="text-sm font-semibold text-amber-950 dark:text-amber-200 leading-snug"
          >
            Atenção: Esta notícia é baseada em rumores ou vazamentos não confirmados oficialmente pelas empresas envolvidas. Trate as informações com cautela.
          </p>

          {/* Advertência explicativa personalizada gerada pela IA, se houver */}
          {warning && (
            <div className="flex items-start gap-2 pt-1 text-xs text-amber-900/90 dark:text-amber-300/90 leading-relaxed bg-amber-500/10 rounded-xl p-2.5 border border-amber-500/20">
              <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <span>
                <strong className="font-bold text-amber-950 dark:text-amber-100">Contexto Editorial: </strong>
                {warning}
              </span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

export default RumorBanner;
