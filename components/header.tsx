"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./theme-toggle";
import {
  Gamepad2,
  Sparkles,
  Menu,
  X,
  ShieldCheck,
  Flame,
  Radio,
} from "lucide-react";
import { Category } from "@/types/database";

interface HeaderProps {
  categories: Category[];
}

export function Header({ categories }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const pathname = usePathname();

  // Close mobile menu on route change
  React.useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200/80 dark:border-gamer-800/80 bg-white/80 dark:bg-gamer-950/85 backdrop-blur-xl transition-colors">
      {/* Top micro-bar: AI Status ticker */}
      <div className="hidden md:flex items-center justify-between px-4 lg:px-8 py-1 text-xs border-b border-zinc-200/50 dark:border-gamer-800/50 text-zinc-500 dark:text-zinc-400 bg-zinc-50/60 dark:bg-gamer-900/60">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-emerald-500 dark:text-emerald-400 font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Pipeline de IA Ativo
          </span>
          <span className="text-zinc-300 dark:text-zinc-700">•</span>
          <span className="flex items-center gap-1">
            <Radio className="w-3 h-3 text-brand-cyan" /> 6 Feeds Oficiais Monitorados em Tempo Real
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/transparencia-editorial"
            className="flex items-center gap-1 text-zinc-600 dark:text-zinc-300 hover:text-brand-purple dark:hover:text-brand-purple transition-colors font-medium"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-brand-purple" />
            Transparência & Diretrizes E-E-A-T
          </Link>
        </div>
      </div>

      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        {/* Logo */}
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-brand-purple to-brand-cyan p-0.5 shadow-neon-purple transition-transform group-hover:scale-105">
              <div className="w-full h-full bg-zinc-950 rounded-[10px] flex items-center justify-center">
                <Gamepad2 className="w-5 h-5 text-white group-hover:rotate-12 transition-transform duration-300" />
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl tracking-tight text-zinc-900 dark:text-white group-hover:text-brand-purple transition-colors">
                  AI<span className="text-brand-purple">GAME</span>PORTAL
                </span>
                <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-brand-purple/10 text-brand-purple border border-brand-purple/30">
                  MVP
                </span>
              </div>
              <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 tracking-wider">
                CURADORIA GAMER POR IA
              </span>
            </div>
          </Link>
        </div>

        {/* Desktop Categories Navigation */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
          <Link
            href="/"
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              pathname === "/"
                ? "bg-brand-purple/10 text-brand-purple dark:bg-brand-purple/20 dark:text-white shadow-sm"
                : "text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-gamer-800"
            }`}
          >
            Início
          </Link>
          {categories.map((cat) => {
            const isActive = pathname === `/categoria/${cat.slug}`;
            return (
              <Link
                key={cat.id}
                href={`/categoria/${cat.slug}`}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-brand-purple/15 text-brand-purple dark:bg-brand-purple/25 dark:text-white border border-brand-purple/40"
                    : "text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-gamer-800"
                }`}
              >
                {cat.name}
              </Link>
            );
          })}
        </nav>

        {/* Right actions: Theme Toggle + Transparência link on mobile + Menu button */}
        <div className="flex items-center gap-3">
          <Link
            href="/transparencia-editorial"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-gamer-850 hover:bg-zinc-200 dark:hover:bg-gamer-700 text-zinc-700 dark:text-zinc-200 border border-zinc-300/60 dark:border-gamer-700 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-brand-purple" />
            <span>Como a IA Funciona</span>
          </Link>

          <ThemeToggle />

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-gamer-800 transition-colors"
            aria-label="Abrir menu de navegação"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-zinc-200 dark:border-gamer-800 bg-white dark:bg-gamer-950 px-4 pt-3 pb-6 space-y-2 animate-in slide-in-from-top-2 duration-200">
          <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400 px-3 py-1">
            Categorias & Plataformas
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <Link
              href="/"
              className={`px-3 py-2 rounded-lg text-sm font-medium ${
                pathname === "/"
                  ? "bg-brand-purple/20 text-brand-purple"
                  : "text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-gamer-850"
              }`}
            >
              Início
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/categoria/${cat.slug}`}
                className={`px-3 py-2 rounded-lg text-sm font-medium ${
                  pathname === `/categoria/${cat.slug}`
                    ? "bg-brand-purple/20 text-brand-purple"
                    : "text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-gamer-850"
                }`}
              >
                {cat.name}
              </Link>
            ))}
          </div>

          <div className="pt-3 border-t border-zinc-200 dark:border-gamer-800 space-y-2">
            <Link
              href="/transparencia-editorial"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-brand-purple bg-brand-purple/10 border border-brand-purple/20"
            >
              <ShieldCheck className="w-4 h-4" />
              Diretrizes de IA e Transparência
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
