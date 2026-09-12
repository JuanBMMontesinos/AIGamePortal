"use client";

import * as React from "react";
import { Share2, Check, Copy, MessageCircle } from "lucide-react";

interface ShareButtonsProps {
  title: string;
  url?: string;
}

export function ShareButtons({ title, url }: ShareButtonsProps) {
  const [copied, setCopied] = React.useState(false);

  const currentUrl = typeof window !== "undefined" ? window.location.href : url || "";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
    }
  };

  const twitterShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    title
  )}&url=${encodeURIComponent(currentUrl)}`;

  const whatsappShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
    `${title} - ${currentUrl}`
  )}`;

  const redditShareUrl = `https://reddit.com/submit?url=${encodeURIComponent(
    currentUrl
  )}&title=${encodeURIComponent(title)}`;

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleCopy}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
          copied
            ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-500"
            : "bg-zinc-100 dark:bg-gamer-850 border-zinc-200 dark:border-gamer-700 text-zinc-700 dark:text-zinc-300 hover:border-brand-purple/50 hover:text-brand-purple"
        }`}
        title="Copiar link da notícia"
      >
        {copied ? (
          <>
            <Check className="w-3.5 h-3.5" />
            <span>Copiado!</span>
          </>
        ) : (
          <>
            <Copy className="w-3.5 h-3.5" />
            <span>Copiar Link</span>
          </>
        )}
      </button>

      <a
        href={twitterShareUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Compartilhar no X (Twitter)"
        className="p-1.5 rounded-lg border border-zinc-200 dark:border-gamer-700 bg-zinc-100 dark:bg-gamer-850 text-zinc-700 dark:text-zinc-300 hover:text-brand-purple hover:border-brand-purple/50 transition-colors"
        title="Compartilhar no X"
      >
        <span className="font-bold text-xs px-1">𝕏</span>
      </a>

      <a
        href={whatsappShareUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Compartilhar no WhatsApp"
        className="p-1.5 rounded-lg border border-zinc-200 dark:border-gamer-700 bg-zinc-100 dark:bg-gamer-850 text-zinc-700 dark:text-zinc-300 hover:text-emerald-500 hover:border-emerald-500/50 transition-colors"
        title="Compartilhar no WhatsApp"
      >
        <MessageCircle className="w-4 h-4" />
      </a>

      <a
        href={redditShareUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Compartilhar no Reddit"
        className="p-1.5 rounded-lg border border-zinc-200 dark:border-gamer-700 bg-zinc-100 dark:bg-gamer-850 text-zinc-700 dark:text-zinc-300 hover:text-orange-500 hover:border-orange-500/50 transition-colors"
        title="Compartilhar no Reddit"
      >
        <span className="font-bold text-xs px-0.5 text-orange-500">r/</span>
      </a>
    </div>
  );
}
