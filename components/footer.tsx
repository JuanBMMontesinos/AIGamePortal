import Link from "next/link";
import { Gamepad2, ShieldCheck, Sparkles, Cpu, ExternalLink, Rss } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full border-t border-zinc-200 dark:border-gamer-800 bg-zinc-50 dark:bg-gamer-950 transition-colors">
      {/* Top Banner: AI Journalism Guarantee */}
      <div className="border-b border-zinc-200/80 dark:border-gamer-800/80 bg-zinc-100/60 dark:bg-gamer-900/40 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-brand-purple/10 border border-brand-purple/30 text-brand-purple shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  Compromisso com Veracidade & E-E-A-T
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
                    Anti-Alucinação
                  </span>
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1 max-w-2xl">
                  Todas as matérias do Made By AI Games são geradas a partir de feeds oficiais (PlayStation Blog, Xbox Wire, Nintendo, etc.), com deduplicação semântica vetorial e atribuição canônica obrigatória.
                </p>
              </div>
            </div>
            <Link
              href="/transparencia-editorial"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-purple hover:bg-brand-purple/90 text-white font-semibold text-sm shadow-neon-purple transition-all shrink-0"
            >
              <Sparkles className="w-4 h-4" />
              Ver Diretrizes Editoriais
            </Link>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: Brand */}
          <div className="space-y-4 md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-brand-purple to-brand-cyan p-0.5">
                <div className="w-full h-full bg-zinc-950 rounded-[7px] flex items-center justify-center">
                  <Gamepad2 className="w-4 h-4 text-white" />
                </div>
              </div>
              <span className="font-extrabold text-lg tracking-tight text-zinc-900 dark:text-white">
                MADE BY <span className="text-brand-purple">AI GAMES</span>
              </span>
            </Link>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              O portal gamer de nova geração alimentado por inteligência artificial, curadoria em tempo real e arquitetura moderna em Next.js e Supabase.
            </p>
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <Cpu className="w-4 h-4 text-brand-cyan" />
              <span>Stack: Next.js 15 • Supabase • Gemini</span>
            </div>
          </div>

          {/* Col 2: Plataformas */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-white mb-3">
              Plataformas & Cobertura
            </h4>
            <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
              <li>
                <Link href="/categoria/playstation" className="hover:text-brand-purple transition-colors">
                  PlayStation (PS5 / PS5 Pro)
                </Link>
              </li>
              <li>
                <Link href="/categoria/xbox" className="hover:text-brand-purple transition-colors">
                  Xbox Series X|S & Cloud
                </Link>
              </li>
              <li>
                <Link href="/categoria/nintendo" className="hover:text-brand-purple transition-colors">
                  Nintendo Switch & Switch 2
                </Link>
              </li>
              <li>
                <Link href="/categoria/pc-gaming" className="hover:text-brand-purple transition-colors">
                  PC Gaming & Steam
                </Link>
              </li>
              <li>
                <Link href="/categoria/hardware" className="hover:text-brand-purple transition-colors">
                  Hardware & GPUs
                </Link>
              </li>
              <li>
                <Link href="/categoria/industria" className="hover:text-brand-purple transition-colors">
                  Indústria & Mercado
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Institucional */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-white mb-3">
              Transparência & Governança
            </h4>
            <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
              <li>
                <Link href="/transparencia-editorial" className="hover:text-brand-purple transition-colors flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-brand-purple" />
                  Transparência Editorial
                </Link>
              </li>
              <li>
                <Link href="/transparencia-editorial#anti-alucinacao" className="hover:text-brand-purple transition-colors">
                  Política Anti-Alucinação
                </Link>
              </li>
              <li>
                <Link href="/transparencia-editorial#fontes-monitoradas" className="hover:text-brand-purple transition-colors flex items-center gap-1.5">
                  <Rss className="w-3.5 h-3.5 text-brand-cyan" />
                  Fontes RSS Oficiais
                </Link>
              </li>
              <li>
                <span className="text-xs text-zinc-500">
                  Revalidação ISR ativada sob demanda
                </span>
              </li>
            </ul>
          </div>

          {/* Col 4: Feeds & Automação */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-white mb-3">
              Fontes Monitoradas
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {[
                "PlayStation Blog",
                "Xbox Wire",
                "Nintendo Everything",
                "Nintendo Life",
                "PC Gamer",
                "Eurogamer",
                "GamesIndustry.biz",
              ].map((source) => (
                <span
                  key={source}
                  className="inline-flex items-center gap-1 px-2 py-1 text-[11px] rounded-md bg-zinc-200/70 dark:bg-gamer-850 text-zinc-700 dark:text-zinc-300 border border-zinc-300/50 dark:border-gamer-700"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  {source}
                </span>
              ))}
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-500 mt-4 leading-relaxed">
              Todos os direitos de imagem e marcas registradas pertencem aos seus respectivos detentores de direitos autorais.
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-6 border-t border-zinc-200 dark:border-gamer-850 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <p>© 2026 Made By AI Games — Todos os direitos reservados. Feito com Next.js & Supabase.</p>
          <div className="flex items-center gap-4">
            <Link href="/transparencia-editorial" className="hover:underline">
              Termos de Uso & IA
            </Link>
            <span>•</span>
            <Link href="/transparencia-editorial#contato" className="hover:underline">
              Reportar Inconsistência
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
