import { Metadata } from "next";
import Link from "next/link";
import {
  ShieldCheck,
  Cpu,
  CheckCircle2,
  FileCheck2,
  Layers,
  Rss,
  Mail,
  Scale,
  Sparkles,
  Search,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Transparência Editorial & Governança de IA",
  description:
    "Conheça as diretrizes éticas, a política anti-alucinação e o funcionamento do pipeline autônomo de inteligência artificial do AIGamePortal.",
};

export default function EditorialTransparencyPage() {
  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-10 space-y-12">
      {/* Header */}
      <header className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-brand-purple/10 text-brand-purple border border-brand-purple/30">
          <ShieldCheck className="w-4 h-4" />
          Manifesto de Ética e IA
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-zinc-900 dark:text-white tracking-tight leading-tight">
          Transparência Editorial & Diretrizes de Inteligência Artificial
        </h1>
        <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-300 leading-relaxed">
          No <strong>AIGamePortal</strong>, acreditamos que a automação jornalística por IA só tem valor se acompanhada de máxima clareza, respeito aos direitos autorais, combate rigoroso a alucinações e conformidade E-E-A-T.
        </p>
      </header>

      {/* 4 Pilares de Governança */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl border border-zinc-200 dark:border-gamer-800 bg-white dark:bg-gamer-900 space-y-3">
          <div className="p-2.5 w-fit rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-lg text-zinc-900 dark:text-white">
            1. Política Anti-Alucinação
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Nossos agentes de linguagem operam com instruções estritas de extração factual. Nenhuma data, especificação técnica ou citação é gerada sem correspondência explícita no comunicado ou matéria original de origem.
          </p>
        </div>

        <div className="p-6 rounded-2xl border border-zinc-200 dark:border-gamer-800 bg-white dark:bg-gamer-900 space-y-3">
          <div className="p-2.5 w-fit rounded-xl bg-brand-purple/10 text-brand-purple border border-brand-purple/20">
            <FileCheck2 className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-lg text-zinc-900 dark:text-white">
            2. Atribuição E-E-A-T e Links Canônicos
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Reconhecemos o trabalho árduo dos jornalistas e redações originais. Cada post publicado no AIGamePortal inclui um card proeminente com o nome do veículo original, título de origem e link direto (nofollow/canonical).
          </p>
        </div>

        <div className="p-6 rounded-2xl border border-zinc-200 dark:border-gamer-800 bg-white dark:bg-gamer-900 space-y-3">
          <div className="p-2.5 w-fit rounded-xl bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20">
            <Cpu className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-lg text-zinc-900 dark:text-white">
            3. Deduplicação Semântica Vetorial
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Para evitar matérias repetitivas sobre o mesmo anúncio, utilizamos o modelo de embedding do Google Gemini (768 dimensões) e índice HNSW no PostgreSQL para agrupar e descartar coberturas duplicadas em até 48 horas.
          </p>
        </div>

        <div className="p-6 rounded-2xl border border-zinc-200 dark:border-gamer-800 bg-white dark:bg-gamer-900 space-y-3">
          <div className="p-2.5 w-fit rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <Scale className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-lg text-zinc-900 dark:text-white">
            4. Resumos TL;DR Estruturados
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Entregamos valor direto para leitores mobile através de sínteses em 3 a 4 pontos objetivos (TL;DR) e fichas técnicas formatadas, economizando tempo sem perder contexto crítico.
          </p>
        </div>
      </div>

      {/* Como o Pipeline Funciona (Diagrama Textual / Step-by-Step) */}
      <section className="rounded-2xl border border-zinc-200 dark:border-gamer-800 bg-zinc-50 dark:bg-gamer-950 p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-brand-purple/10 text-brand-purple">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
              Como Nosso Pipeline Automatizado Opera
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Arquitetura auditável passo a passo
            </p>
          </div>
        </div>

        <ol className="space-y-4 text-sm text-zinc-700 dark:text-zinc-300">
          <li className="flex items-start gap-3">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-purple text-white font-bold text-xs shrink-0 mt-0.5">
              1
            </span>
            <div>
              <strong>Monitoramento Oficial de Feeds:</strong> Nossos crawlers consultam apenas canais de primeira mão (como PlayStation Blog, Xbox Wire, Nintendo Life, Eurogamer, PC Gamer e GamesIndustry.biz) em intervalos programados.
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-purple text-white font-bold text-xs shrink-0 mt-0.5">
              2
            </span>
            <div>
              <strong>Filtro Determinístico & Semântico:</strong> Verificamos a URL original e comparamos o embedding vetorial com o banco PostgreSQL no Supabase para garantir que notícias repetidas não sejam geradas.
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-purple text-white font-bold text-xs shrink-0 mt-0.5">
              3
            </span>
            <div>
              <strong>Síntese e Formatação Estruturada:</strong> O modelo Gemini extrai metadados do jogo (plataformas, data de lançamento, desenvolvedora), redige o resumo em 30 segundos e resume o sentimento em comunidades gamer.
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-purple text-white font-bold text-xs shrink-0 mt-0.5">
              4
            </span>
            <div>
              <strong>Revalidação Instantânea (ISR):</strong> Assim que a matéria é gravada com segurança no Supabase, um webhook chama nosso endpoint <code>/api/revalidate</code> no Next.js para colocar a página no ar em menos de 1 segundo.
            </div>
          </li>
        </ol>
      </section>

      {/* Fontes Oficiais Monitoradas */}
      <section id="fontes-monitoradas" className="space-y-4">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
          <Rss className="w-5 h-5 text-brand-cyan" />
          Fontes RSS Oficiais Homologadas
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          {[
            { name: "PlayStation Blog", url: "https://blog.playstation.com" },
            { name: "Xbox Wire", url: "https://news.xbox.com" },
            { name: "Nintendo Life", url: "https://www.nintendolife.com" },
            { name: "PC Gamer", url: "https://www.pcgamer.com" },
            { name: "Eurogamer", url: "https://www.eurogamer.net" },
            { name: "GamesIndustry.biz", url: "https://www.gamesindustry.biz" },
          ].map((src) => (
            <div
              key={src.name}
              className="p-3 rounded-xl border border-zinc-200 dark:border-gamer-800 bg-white dark:bg-gamer-900 flex items-center justify-between"
            >
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                {src.name}
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-500 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Ativo
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Contato & Correção Humana */}
      <section id="contato" className="p-8 rounded-2xl border-2 border-brand-purple/30 bg-brand-purple/5 space-y-4 text-center sm:text-left sm:flex sm:items-center sm:justify-between sm:space-y-0 gap-6">
        <div className="space-y-1">
          <h3 className="font-bold text-lg text-zinc-900 dark:text-white flex items-center gap-2 justify-center sm:justify-start">
            <Mail className="w-5 h-5 text-brand-purple" />
            Encontrou alguma inconsistência?
          </h3>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
            Nossa equipe técnica revisa qualquer apontamento da comunidade. Entre em contato para correções imediatas.
          </p>
        </div>

        <a
          href="mailto:editorial@aigameportal.com?subject=Reportar%20Inconsistencia%20em%20Materia"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-purple hover:bg-brand-purple/90 text-white font-bold text-xs shadow-neon-purple transition-all shrink-0"
        >
          <span>Reportar à Moderação</span>
        </a>
      </section>
    </div>
  );
}
