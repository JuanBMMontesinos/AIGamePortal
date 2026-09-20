"use client";

import * as React from "react";
import { Share2, Check, Copy, X as CloseIcon } from "lucide-react";

export interface ShareButtonsProps {
  title: string;
  url?: string;
  excerpt?: string | null;
  tldr?: string[] | null;
  categoryName?: string | null;
  isRumor?: boolean;
  variant?: "article-top" | "article-bottom" | "thumb" | "compact";
  align?: "left" | "right" | "center";
  className?: string;
}

// Ícones SVG oficiais otimizados para cada rede social gamer
function XLogo({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function FacebookLogo({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function WhatsAppLogo({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.472 14.382c-.301-.15-1.78-.879-2.056-.98-.276-.1-.477-.15-.678.15-.2.301-.778.98-.954 1.18-.175.201-.351.226-.652.075-.301-.15-1.272-.469-2.423-1.496-.896-.799-1.501-1.786-1.677-2.087-.175-.301-.019-.464.132-.614.136-.135.301-.351.452-.527.15-.175.2-.301.301-.502.101-.2.05-.376-.025-.526-.075-.15-.678-1.634-.929-2.238-.244-.588-.493-.509-.678-.519l-.578-.01c-.2 0-.527.075-.803.376s-1.055 1.03-1.055 2.511 1.08 2.912 1.231 3.113c.15.201 2.126 3.246 5.15 4.553.719.311 1.28.497 1.718.636.723.23 1.381.197 1.901.12.579-.087 1.78-.728 2.031-1.431.251-.703.251-1.305.176-1.431-.076-.126-.277-.201-.578-.352zm2.148-10.404C17.409 1.764 14.778.608 11.989.608 5.727.608.633 5.702.633 11.964c0 2.001.522 3.955 1.517 5.679L.608 23.392l5.922-1.553c1.66.905 3.526 1.382 5.454 1.382h.005c6.259 0 11.353-5.095 11.353-11.358 0-3.033-1.182-5.884-3.322-8.026z" />
    </svg>
  );
}

function RedditLogo({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 0C5.373 0 0 5.373 0 12c0 3.314 1.343 6.314 3.515 8.485l-1.69 3.38a.625.625 0 0 0 .835.835l3.38-1.69A11.94 11.94 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm5.674 13.883c-.027.604-.26 1.183-.674 1.637-1.17 1.283-3.003 1.698-4.999 1.698s-3.829-.415-4.999-1.698a2.38 2.38 0 0 1-.674-1.637c-.382-.361-.626-.872-.626-1.442a2.03 2.03 0 0 1 2.031-2.031c.365 0 .698.1.989.269 1.054-.738 2.457-1.196 3.993-1.246l.78-3.666a.417.417 0 0 1 .494-.32l2.67.568a1.458 1.458 0 1 1 2.766.529l-2.428-.517-.674 3.175c1.517.054 2.903.513 3.948 1.246.291-.17.624-.269.989-.269a2.03 2.03 0 0 1 2.031 2.031c0 .57-.244 1.081-.626 1.442z" />
    </svg>
  );
}

function TelegramLogo({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18.894-1.077 4.887-1.528 7.301-.19.989-.556 1.32-1.025 1.362-.977.09-1.72-.646-2.668-1.267-1.484-.972-2.322-1.577-3.766-2.528-1.668-1.099-.587-1.703.364-2.691.249-.258 4.57-4.188 4.654-4.545.01-.044.02-.211-.079-.299-.098-.088-.244-.058-.35-.034-.149.034-2.522 1.603-7.119 4.707-.673.462-1.283.687-1.83.676-.603-.013-1.761-.34-2.624-.621-1.057-.344-1.897-.526-1.824-1.11.038-.304.457-.615 1.258-.933 4.922-2.144 8.207-3.559 9.855-4.244 4.693-1.954 5.668-2.294 6.304-2.305.14 0 .452.033.655.197.171.139.219.327.241.458.022.132.05.43.028.665z" />
    </svg>
  );
}

// Helpers para extração de resumo e resolução de URL canônica absoluta
function cleanText(text?: string | null): string {
  return (text || "").replace(/\s+/g, " ").trim();
}

function getBestSummary(excerpt?: string | null, tldr?: string[] | null): string {
  if (excerpt && excerpt.trim()) return cleanText(excerpt);
  if (tldr && tldr.length > 0 && tldr[0]?.trim()) return cleanText(tldr[0]);
  return "";
}

function getPublicShareUrl(urlProp?: string): string {
  const publicDomain = (process.env.NEXT_PUBLIC_SITE_URL || "https://aigameportal.vercel.app").replace(/\/+$/, "");

  if (urlProp) {
    // Se a URL informada for localhost, substitui pelo domínio público real para que o crawler do Twitter/WhatsApp possa raspar a thumb
    if (urlProp.includes("localhost:") || urlProp.includes("127.0.0.1:")) {
      try {
        const parsed = new URL(urlProp);
        return `${publicDomain}${parsed.pathname}${parsed.search}`;
      } catch {
        return publicDomain;
      }
    }
    if (urlProp.startsWith("http")) return urlProp;
    if (urlProp.startsWith("/")) return `${publicDomain}${urlProp}`;
  }

  if (typeof window !== "undefined") {
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      return `${publicDomain}${window.location.pathname}${window.location.search}`;
    }
    return window.location.href;
  }

  return publicDomain;
}

export function ShareButtons({
  title,
  url,
  excerpt,
  tldr,
  categoryName,
  isRumor = false,
  variant = "article-top",
  align = "left",
  className = "",
}: ShareButtonsProps) {
  const [copied, setCopied] = React.useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);
  const [canNativeShare, setCanNativeShare] = React.useState(false);
  const popoverRef = React.useRef<HTMLDivElement>(null);

  // Detecta suporte a Web Share API após montagem no cliente
  React.useEffect(() => {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      setCanNativeShare(true);
    }
  }, []);

  // Fechar popover com clique fora e tecla ESC
  React.useEffect(() => {
    if (!isPopoverOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsPopoverOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsPopoverOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isPopoverOpen]);

  const targetUrl = getPublicShareUrl(url);
  const summary = getBestSummary(excerpt, tldr);

  // 1. WhatsApp: Emojis, *negrito*, resumo formatado e CTA amigável antes do link
  const whatsAppEmoji = isRumor ? "👀 [RUMOR]" : "🎮";
  const whatsAppBody = [
    `${whatsAppEmoji} *${title}*`,
    summary ? `\n${summary}` : "",
    `\n👉 Leia a matéria completa no Made By AI Games:`,
    targetUrl,
  ]
    .filter(Boolean)
    .join("\n");
  const whatsappShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsAppBody)}`;

  // 2. X (Twitter) - Limite estrito de 280 caracteres para contas Free
  // - No X/Twitter, qualquer URL é convertida para t.co e ocupa exatamente 23 caracteres + 1 espaço = 24 caracteres.
  // - Cada hashtag ocupa o tamanho da palavra + 2 caracteres (" #" + tag).
  // - Emojis ocupam 2 caracteres na contagem do Twitter.
  const xEmoji = isRumor ? "👀" : "🎮";
  const cleanTitle = cleanText(title);

  // Hashtags essenciais e concisas para economizar caracteres
  let xTags = ["Games", "AIGamePortal"];
  if (categoryName) {
    const cleanCat = categoryName.replace(/[^a-zA-Z0-9]/g, "");
    if (cleanCat && cleanCat.length <= 12 && cleanCat.toLowerCase() !== "geral") {
      xTags = [cleanCat, "Games"];
    }
  }
  const xHashtagsParam = xTags.join(",");
  const xHashtagsFormattedLen = xTags.reduce((acc, t) => acc + t.length + 2, 0);

  // Orçamento máximo para o texto do tweet:
  // 280 (teto free) - 24 (URL t.co + espaço) - xHashtagsFormattedLen - 10 (margem de segurança)
  const maxXTextBudget = 280 - 24 - xHashtagsFormattedLen - 10;

  let xText = `${xEmoji} ${cleanTitle}`;

  // Se o título sozinho já atingir o teto, trunca o título
  if (xText.length > maxXTextBudget) {
    xText = `${xEmoji} ${cleanTitle.slice(0, maxXTextBudget - 3).trim()}...`;
  } else {
    // Se sobrar espaço suficiente (ao menos 45 caracteres livres), anexa o resumo/gancho editorial
    const remainingBudget = maxXTextBudget - xText.length;
    if (summary && remainingBudget >= 45) {
      const maxSummaryLen = remainingBudget - 5; // espaço para \n\n e ...
      const shortSummary =
        summary.length > maxSummaryLen
          ? `${summary.slice(0, maxSummaryLen).trim()}...`
          : summary;
      xText = `${xText}\n\n${shortSummary}`;
    }
  }

  const twitterShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    xText
  )}&url=${encodeURIComponent(targetUrl)}&hashtags=${encodeURIComponent(xHashtagsParam)}`;

  // 3. Telegram: Título destacado, resumo, hashtags e link com visualização rica
  const tgEmoji = isRumor ? "⚡ [RUMOR]" : "🕹️";
  const tgTags = categoryName
    ? `#Games #${categoryName.replace(/[^a-zA-Z0-9]/g, "")} #MadeByAiGames`
    : "#Games #NoticiasGamer #MadeByAiGames";
  const telegramBody = [
    `${tgEmoji} *${title}*`,
    summary ? `\n${summary}` : "",
    `\n${tgTags}`,
  ]
    .filter(Boolean)
    .join("\n");
  const telegramShareUrl = `https://t.me/share/url?url=${encodeURIComponent(
    targetUrl
  )}&text=${encodeURIComponent(telegramBody)}`;

  // 4. Facebook: Parâmetro quote com gancho enriquecido para reforçar o OpenGraph
  const facebookQuote = `🎮 ${title}${summary ? ` — ${summary}` : ""}`;
  const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
    targetUrl
  )}&quote=${encodeURIComponent(facebookQuote)}`;

  // 5. Reddit: Tag formatada e título oficial
  const redditTitle = `[Notícia Gamer] ${title} | Made By AI Games`;
  const redditShareUrl = `https://reddit.com/submit?url=${encodeURIComponent(
    targetUrl
  )}&title=${encodeURIComponent(redditTitle)}`;

  // Ação de copiar URL
  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(targetUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback silencioso
    }
  };

  // Web Share API nativa em dispositivos móveis
  const handleNativeShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `🎮 ${title}`,
          text: summary || `Confira esta notícia no Made By AI Games: ${title}`,
          url: targetUrl,
        });
      } catch {
        // Usuário cancelou ou descartou a folha
      }
    }
  };

  // ==========================================
  // VARIANTE: THUMB (Para Miniaturas de Notícias)
  // ==========================================
  if (variant === "thumb") {
    return (
      <div className={`relative inline-block ${className}`} ref={popoverRef}>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsPopoverOpen((prev) => !prev);
          }}
          className={`flex items-center justify-center p-2 rounded-xl backdrop-blur-md transition-all duration-200 shadow-md ${
            isPopoverOpen
              ? "bg-brand-purple text-white shadow-neon-purple scale-105"
              : "bg-black/60 hover:bg-black/80 text-white/90 hover:text-white border border-white/10 hover:border-brand-purple/50"
          }`}
          title="Compartilhar notícia"
          aria-label="Compartilhar notícia"
          aria-expanded={isPopoverOpen}
        >
          <Share2 className="w-4 h-4" />
        </button>

        {isPopoverOpen && (
          <div
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className="absolute right-0 top-full mt-2 w-64 p-3.5 rounded-2xl bg-zinc-950/95 backdrop-blur-xl border border-zinc-800 shadow-2xl z-50 text-left animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-zinc-800/80">
              <span className="text-[11px] font-bold uppercase tracking-wider text-brand-purple flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5" />
                Compartilhar
              </span>
              <button
                type="button"
                onClick={() => setIsPopoverOpen(false)}
                className="text-zinc-400 hover:text-white p-0.5 rounded-md hover:bg-zinc-800 transition-colors"
                aria-label="Fechar menu"
              >
                <CloseIcon className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-[11px] text-zinc-400 line-clamp-1 mb-3 font-medium">
              {title}
            </p>

            <div className="grid grid-cols-5 gap-1.5 mb-3">
              {/* WhatsApp */}
              <a
                href={whatsappShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center justify-center p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-[#25D366] hover:border-[#25D366]/40 hover:bg-[#25D366]/10 transition-colors"
                title="WhatsApp"
                aria-label="Compartilhar no WhatsApp"
              >
                <WhatsAppLogo className="w-4 h-4" />
              </a>

              {/* X / Twitter */}
              <a
                href={twitterShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center justify-center p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-500 hover:bg-zinc-800 transition-colors"
                title="X (Twitter)"
                aria-label="Compartilhar no X (Twitter)"
              >
                <XLogo className="w-4 h-4" />
              </a>

              {/* Telegram */}
              <a
                href={telegramShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center justify-center p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-[#24A1DE] hover:border-[#24A1DE]/40 hover:bg-[#24A1DE]/10 transition-colors"
                title="Telegram"
                aria-label="Compartilhar no Telegram"
              >
                <TelegramLogo className="w-4 h-4" />
              </a>

              {/* Facebook */}
              <a
                href={facebookShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center justify-center p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-[#1877F2] hover:border-[#1877F2]/40 hover:bg-[#1877F2]/10 transition-colors"
                title="Facebook"
                aria-label="Compartilhar no Facebook"
              >
                <FacebookLogo className="w-4 h-4" />
              </a>

              {/* Reddit */}
              <a
                href={redditShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center justify-center p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-[#FF4500] hover:border-[#FF4500]/40 hover:bg-[#FF4500]/10 transition-colors"
                title="Reddit"
                aria-label="Compartilhar no Reddit"
              >
                <RedditLogo className="w-4 h-4" />
              </a>
            </div>

            {/* Ações Inferiores: Copiar Link ou Share Nativo Mobile */}
            <div className="space-y-1.5 pt-1">
              <button
                type="button"
                onClick={handleCopy}
                className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                  copied
                    ? "bg-emerald-500/15 border-emerald-500/50 text-emerald-400"
                    : "bg-zinc-900 hover:bg-zinc-800/90 border-zinc-800 text-zinc-200 hover:border-zinc-700"
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Link Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Copiar Link da Notícia</span>
                  </>
                )}
              </button>

              {canNativeShare && (
                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold bg-brand-purple/20 border border-brand-purple/40 text-brand-purple hover:bg-brand-purple hover:text-white transition-all"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Outros Apps (Nativo)</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // VARIANTE: COMPACT (Para Herói e Barras Enxutas)
  // ==========================================
  if (variant === "compact") {
    return (
      <div className={`flex items-center gap-1.5 ${className}`}>
        {/* WhatsApp */}
        <a
          href={whatsappShareUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Compartilhar no WhatsApp"
          className="p-2 rounded-xl bg-zinc-900/80 hover:bg-[#25D366] text-zinc-300 hover:text-white border border-zinc-800 transition-colors shadow-sm"
          title="WhatsApp"
        >
          <WhatsAppLogo className="w-3.5 h-3.5" />
        </a>

        {/* X */}
        <a
          href={twitterShareUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Compartilhar no X (Twitter)"
          className="p-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition-colors shadow-sm"
          title="X (Twitter)"
        >
          <XLogo className="w-3.5 h-3.5" />
        </a>

        {/* Telegram */}
        <a
          href={telegramShareUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Compartilhar no Telegram"
          className="p-2 rounded-xl bg-zinc-900/80 hover:bg-[#24A1DE] text-zinc-300 hover:text-white border border-zinc-800 transition-colors shadow-sm"
          title="Telegram"
        >
          <TelegramLogo className="w-3.5 h-3.5" />
        </a>

        {/* Facebook */}
        <a
          href={facebookShareUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Compartilhar no Facebook"
          className="p-2 rounded-xl bg-zinc-900/80 hover:bg-[#1877F2] text-zinc-300 hover:text-white border border-zinc-800 transition-colors shadow-sm"
          title="Facebook"
        >
          <FacebookLogo className="w-3.5 h-3.5" />
        </a>

        {/* Reddit */}
        <a
          href={redditShareUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Compartilhar no Reddit"
          className="p-2 rounded-xl bg-zinc-900/80 hover:bg-[#FF4500] text-zinc-300 hover:text-white border border-zinc-800 transition-colors shadow-sm"
          title="Reddit"
        >
          <RedditLogo className="w-3.5 h-3.5" />
        </a>

        {/* Copiar Link */}
        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copiar Link"
          className={`p-2 rounded-xl border transition-colors shadow-sm ${
            copied
              ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
              : "bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border-zinc-800"
          }`}
          title={copied ? "Copiado!" : "Copiar link"}
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
        </button>

        {/* Web Share Nativo Móvel */}
        {canNativeShare && (
          <button
            type="button"
            onClick={handleNativeShare}
            className="sm:hidden p-2 rounded-xl bg-brand-purple/20 text-brand-purple border border-brand-purple/40 hover:bg-brand-purple hover:text-white transition-colors"
            title="Mais opções"
            aria-label="Mais opções de envio"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  }

  // ==========================================
  // VARIANTE: ARTICLE-BOTTOM (Rodapé do Artigo - Destaque & Comunidade)
  // ==========================================
  if (variant === "article-bottom") {
    return (
      <div className={`flex flex-wrap items-center gap-2 sm:gap-2.5 ${className}`}>
        {/* WhatsApp Button */}
        <a
          href={whatsappShareUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#25D366]/10 hover:bg-[#25D366] text-[#25D366] hover:text-white border border-[#25D366]/30 hover:border-[#25D366] transition-all shadow-sm active:scale-95"
          title="Compartilhar no WhatsApp"
        >
          <WhatsAppLogo className="w-4 h-4" />
          <span>WhatsApp</span>
        </a>

        {/* X (Twitter) Button */}
        <a
          href={twitterShareUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-zinc-100 dark:bg-gamer-850 hover:bg-black dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:text-white border border-zinc-300 dark:border-gamer-700 transition-all shadow-sm active:scale-95"
          title="Compartilhar no X"
        >
          <XLogo className="w-3.5 h-3.5" />
          <span>Postar</span>
        </a>

        {/* Telegram Button */}
        <a
          href={telegramShareUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#24A1DE]/10 hover:bg-[#24A1DE] text-[#24A1DE] hover:text-white border border-[#24A1DE]/30 hover:border-[#24A1DE] transition-all shadow-sm active:scale-95"
          title="Compartilhar no Telegram"
        >
          <TelegramLogo className="w-4 h-4" />
          <span>Telegram</span>
        </a>

        {/* Facebook Button */}
        <a
          href={facebookShareUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#1877F2]/10 hover:bg-[#1877F2] text-[#1877F2] hover:text-white border border-[#1877F2]/30 hover:border-[#1877F2] transition-all shadow-sm active:scale-95"
          title="Compartilhar no Facebook"
        >
          <FacebookLogo className="w-4 h-4" />
          <span>Facebook</span>
        </a>

        {/* Reddit Button */}
        <a
          href={redditShareUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#FF4500]/10 hover:bg-[#FF4500] text-[#FF4500] hover:text-white border border-[#FF4500]/30 hover:border-[#FF4500] transition-all shadow-sm active:scale-95"
          title="Compartilhar no Reddit"
        >
          <RedditLogo className="w-4 h-4" />
          <span>Reddit</span>
        </a>

        {/* Copiar Link Button */}
        <button
          type="button"
          onClick={handleCopy}
          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
            copied
              ? "bg-emerald-500/15 border-emerald-500/50 text-emerald-500"
              : "bg-zinc-100 dark:bg-gamer-850 border-zinc-200 dark:border-gamer-700 text-zinc-700 dark:text-zinc-300 hover:border-brand-purple/50 hover:text-brand-purple"
          }`}
          title="Copiar link da notícia"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-500" />
              <span>Copiado!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>Copiar Link</span>
            </>
          )}
        </button>

        {/* Mobile Native Share Button */}
        {canNativeShare && (
          <button
            type="button"
            onClick={handleNativeShare}
            className="sm:hidden inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-brand-purple/15 text-brand-purple border border-brand-purple/40 hover:bg-brand-purple hover:text-white transition-all"
            title="Mais opções de envio"
          >
            <Share2 className="w-4 h-4" />
            <span>Mais</span>
          </button>
        )}
      </div>
    );
  }

  // ==========================================
  // VARIANTE: ARTICLE-TOP (Barra de Topo Editorial)
  // ==========================================
  return (
    <div className={`flex items-center gap-1.5 sm:gap-2 ${className}`}>
      {/* Botão de Copiar Link */}
      <button
        type="button"
        onClick={handleCopy}
        className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
          copied
            ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-500"
            : "bg-zinc-100 dark:bg-gamer-850 border-zinc-200 dark:border-gamer-700 text-zinc-700 dark:text-zinc-300 hover:border-brand-purple/50 hover:text-brand-purple"
        }`}
        title="Copiar link da notícia"
      >
        {copied ? (
          <>
            <Check className="w-3.5 h-3.5 text-emerald-500" />
            <span className="hidden xs:inline">Copiado!</span>
          </>
        ) : (
          <>
            <Copy className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Copiar Link</span>
          </>
        )}
      </button>

      {/* WhatsApp */}
      <a
        href={whatsappShareUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Compartilhar no WhatsApp"
        className="p-1.5 sm:p-2 rounded-lg border border-zinc-200 dark:border-gamer-700 bg-zinc-100 dark:bg-gamer-850 text-zinc-700 dark:text-zinc-300 hover:text-[#25D366] hover:border-[#25D366]/50 hover:bg-[#25D366]/10 transition-colors"
        title="Compartilhar no WhatsApp"
      >
        <WhatsAppLogo className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      </a>

      {/* X (Twitter) */}
      <a
        href={twitterShareUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Compartilhar no X (Twitter)"
        className="p-1.5 sm:p-2 rounded-lg border border-zinc-200 dark:border-gamer-700 bg-zinc-100 dark:bg-gamer-850 text-zinc-700 dark:text-zinc-300 hover:text-white hover:bg-zinc-900 hover:border-zinc-600 transition-colors"
        title="Compartilhar no X"
      >
        <XLogo className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      </a>

      {/* Telegram */}
      <a
        href={telegramShareUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Compartilhar no Telegram"
        className="p-1.5 sm:p-2 rounded-lg border border-zinc-200 dark:border-gamer-700 bg-zinc-100 dark:bg-gamer-850 text-zinc-700 dark:text-zinc-300 hover:text-[#24A1DE] hover:border-[#24A1DE]/50 hover:bg-[#24A1DE]/10 transition-colors"
        title="Compartilhar no Telegram"
      >
        <TelegramLogo className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      </a>

      {/* Facebook */}
      <a
        href={facebookShareUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Compartilhar no Facebook"
        className="p-1.5 sm:p-2 rounded-lg border border-zinc-200 dark:border-gamer-700 bg-zinc-100 dark:bg-gamer-850 text-zinc-700 dark:text-zinc-300 hover:text-[#1877F2] hover:border-[#1877F2]/50 hover:bg-[#1877F2]/10 transition-colors"
        title="Compartilhar no Facebook"
      >
        <FacebookLogo className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      </a>

      {/* Reddit */}
      <a
        href={redditShareUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Compartilhar no Reddit"
        className="p-1.5 sm:p-2 rounded-lg border border-zinc-200 dark:border-gamer-700 bg-zinc-100 dark:bg-gamer-850 text-zinc-700 dark:text-zinc-300 hover:text-[#FF4500] hover:border-[#FF4500]/50 hover:bg-[#FF4500]/10 transition-colors"
        title="Compartilhar no Reddit"
      >
        <RedditLogo className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      </a>

      {/* Web Share API móvel */}
      {canNativeShare && (
        <button
          type="button"
          onClick={handleNativeShare}
          className="sm:hidden p-1.5 rounded-lg border border-brand-purple/40 bg-brand-purple/10 text-brand-purple hover:bg-brand-purple hover:text-white transition-colors"
          title="Outros aplicativos"
          aria-label="Mais opções de envio"
        >
          <Share2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

