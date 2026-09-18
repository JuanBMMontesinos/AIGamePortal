import React from "react";
import Link from "next/link";
import { SOCIAL_LINKS_ARRAY, SocialLink } from "@/lib/constants/socials";
import { Users, Bell, Sparkles } from "lucide-react";

export function SocialIcon({
  id,
  className = "w-4 h-4",
}: {
  id: SocialLink["id"];
  className?: string;
}) {
  switch (id) {
    case "x":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className={className}
          aria-hidden="true"
        >
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    case "discord":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className={className}
          aria-hidden="true"
        >
          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
        </svg>
      );
    case "youtube":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className={className}
          aria-hidden="true"
        >
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      );
    case "telegram":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className={className}
          aria-hidden="true"
        >
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18.894-1.077 4.887-1.528 7.301-.19.989-.556 1.32-1.025 1.362-.977.09-1.72-.646-2.668-1.267-1.484-.972-2.322-1.577-3.766-2.528-1.668-1.099-.587-1.703.364-2.691.249-.258 4.57-4.188 4.654-4.545.01-.044.02-.211-.079-.299-.098-.088-.244-.058-.35-.034-.149.034-2.522 1.603-7.119 4.707-.673.462-1.283.687-1.83.676-.603-.013-1.761-.34-2.624-.621-1.057-.344-1.897-.526-1.824-1.11.038-.304.457-.615 1.258-.933 4.922-2.144 8.207-3.559 9.855-4.244 4.693-1.954 5.668-2.294 6.304-2.305.14 0 .452.033.655.197.171.139.219.327.241.458.022.132.05.43.028.665z" />
        </svg>
      );
    case "instagram":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
          aria-hidden="true"
        >
          <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
        </svg>
      );
    default:
      return null;
  }
}

interface SocialLinksProps {
  variant?: "header" | "footer" | "footer-bottom" | "sidebar" | "mobile" | "article";
  className?: string;
}

export function SocialLinks({ variant = "footer", className = "" }: SocialLinksProps) {
  // 1. Header Variant: Ultra-compact, clean and discrete for micro-ticker
  if (variant === "header") {
    return (
      <div className={`flex items-center gap-2.5 ${className}`}>
        {SOCIAL_LINKS_ARRAY.map((social) => (
          <a
            key={social.id}
            href={social.url}
            target="_blank"
            rel="noopener noreferrer"
            title={`${social.name}: ${social.description}`}
            aria-label={`${social.name} oficial do Made By AI Games`}
            className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all duration-200 hover:scale-110 p-0.5"
          >
            <SocialIcon id={social.id} className="w-3.5 h-3.5" />
          </a>
        ))}
      </div>
    );
  }

  // 2. Footer Variant: Rounded discrete button pills for Column 1
  if (variant === "footer") {
    return (
      <div className={`space-y-2.5 ${className}`}>
        <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block">
          Nossas Comunidades
        </span>
        <div className="flex items-center flex-wrap gap-2">
          {SOCIAL_LINKS_ARRAY.map((social) => (
            <a
              key={social.id}
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              title={`${social.name} (${social.handle})`}
              aria-label={`${social.name} oficial do Made By AI Games`}
              className={`p-2 rounded-xl bg-zinc-200/60 dark:bg-gamer-900 border border-zinc-300/50 dark:border-gamer-800 text-zinc-600 dark:text-zinc-400 hover:scale-105 active:scale-95 transition-all duration-200 shadow-sm ${social.hoverColorClass}`}
            >
              <SocialIcon id={social.id} className="w-4 h-4" />
            </a>
          ))}
        </div>
      </div>
    );
  }

  // 3. Footer-Bottom Variant: Minimalist inline links next to terms
  if (variant === "footer-bottom") {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        {SOCIAL_LINKS_ARRAY.map((social) => (
          <a
            key={social.id}
            href={social.url}
            target="_blank"
            rel="noopener noreferrer"
            title={social.name}
            aria-label={social.name}
            className="text-zinc-400 hover:text-brand-purple dark:hover:text-white transition-colors"
          >
            <SocialIcon id={social.id} className="w-3.5 h-3.5" />
          </a>
        ))}
      </div>
    );
  }

  // 4. Sidebar Variant: Dedicated high-conversion gamer community card
  if (variant === "sidebar") {
    return (
      <div
        className={`rounded-2xl border border-zinc-200 dark:border-gamer-800 bg-white dark:bg-gamer-900 p-5 shadow-sm space-y-4 ${className}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-brand-purple/10 text-brand-purple">
              <Users className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-zinc-900 dark:text-white">
              Canais Oficiais
            </h3>
          </div>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Ao Vivo
          </span>
        </div>

        <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
          Receba alertas de jogos grátis, breaking news em tempo real e discussões exclusivas da comunidade.
        </p>

        <div className="space-y-2">
          {SOCIAL_LINKS_ARRAY.map((social) => (
            <a
              key={social.id}
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center justify-between p-2.5 rounded-xl border border-zinc-200/80 dark:border-gamer-800 bg-zinc-50/70 dark:bg-gamer-950/60 hover:bg-zinc-100 dark:hover:bg-gamer-850 transition-all group ${social.hoverColorClass}`}
            >
              <div className="flex items-center gap-2.5">
                <div className="text-zinc-600 dark:text-zinc-400 group-hover:scale-110 transition-transform">
                  <SocialIcon id={social.id} className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-zinc-900 dark:text-white group-hover:text-brand-purple transition-colors">
                    {social.name}
                  </div>
                  <div className="text-[10px] text-zinc-400 truncate max-w-[140px]">
                    {social.handle}
                  </div>
                </div>
              </div>

              {social.badge ? (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-brand-purple/15 text-brand-purple border border-brand-purple/30 uppercase">
                  {social.badge}
                </span>
              ) : (
                <span className="text-[10px] text-zinc-400 group-hover:translate-x-0.5 transition-transform">
                  →
                </span>
              )}
            </a>
          ))}
        </div>
      </div>
    );
  }

  // 5. Mobile Drawer Variant: Full-width list for smartphones
  if (variant === "mobile") {
    return (
      <div className={`space-y-2 pt-2 ${className}`}>
        <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400 px-1">
          Comunidades & Redes Sociais
        </div>
        <div className="grid grid-cols-2 gap-2">
          {SOCIAL_LINKS_ARRAY.map((social) => (
            <a
              key={social.id}
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100/80 dark:bg-gamer-900/80 border border-zinc-200/60 dark:border-gamer-800 hover:border-brand-purple/40 hover:text-brand-purple transition-colors"
            >
              <SocialIcon id={social.id} className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{social.name}</span>
            </a>
          ))}
        </div>
      </div>
    );
  }

  // 6. Article Variant: Subtle follow bar under news post
  if (variant === "article") {
    return (
      <div
        className={`p-4 rounded-2xl border border-zinc-200 dark:border-gamer-800 bg-gradient-to-r from-brand-purple/5 via-transparent to-brand-cyan/5 flex flex-col sm:flex-row items-center justify-between gap-3 ${className}`}
      >
        <div className="flex items-center gap-2 text-center sm:text-left">
          <Sparkles className="w-4 h-4 text-brand-purple shrink-0" />
          <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
            Fique por dentro das novidades! Siga nossos canais oficiais:
          </span>
        </div>
        <div className="flex items-center gap-2">
          {SOCIAL_LINKS_ARRAY.map((social) => (
            <a
              key={social.id}
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              title={`${social.name} (${social.handle})`}
              aria-label={`${social.name} oficial do Made By AI Games`}
              className={`p-1.5 rounded-lg border border-zinc-200 dark:border-gamer-700 bg-white dark:bg-gamer-850 text-zinc-700 dark:text-zinc-300 hover:scale-105 transition-all shadow-xs ${social.hoverColorClass}`}
            >
              <SocialIcon id={social.id} className="w-3.5 h-3.5" />
            </a>
          ))}
        </div>
      </div>
    );
  }

  return null;
}
