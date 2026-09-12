import Link from "next/link";
import { Gamepad2, ArrowLeft, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 py-12">
      <div className="p-4 rounded-3xl bg-brand-purple/10 text-brand-purple border border-brand-purple/20 mb-6 shadow-neon-purple/20">
        <Gamepad2 className="w-12 h-12" />
      </div>

      <span className="text-xs font-bold uppercase tracking-widest text-brand-purple mb-2">
        Erro 404 • Game Over
      </span>

      <h1 className="text-3xl sm:text-5xl font-black text-zinc-900 dark:text-white tracking-tight mb-4">
        Matéria ou Página Não Encontrada
      </h1>

      <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-md mx-auto mb-8 leading-relaxed">
        A notícia que você procurava pode ter sido movida, arquivada ou o link está incorreto. Continue explorando as novidades do portal.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-purple hover:bg-brand-purple/90 text-white font-bold text-sm shadow-neon-purple transition-transform active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para a Página Inicial</span>
        </Link>
      </div>
    </div>
  );
}
