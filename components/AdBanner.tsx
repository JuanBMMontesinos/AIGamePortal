"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Sparkles, ShoppingBag, Send, ExternalLink, ShieldCheck } from "lucide-react";
import { AffiliateProduct } from "@/types/database";

declare global {
  interface Window {
    adsbygoogle?: any[];
  }
}

export type AdFormat = "in-article-top" | "in-article-mid" | "sidebar-sticky";

export interface AdBannerProps {
  format: AdFormat;
  slotId?: string;
  fallbackProduct?: AffiliateProduct | null;
  className?: string;
  showTelegramFallback?: boolean;
}

// Produto padrão para fallback caso nenhum produto específico seja injetado via prop
const DEFAULT_FALLBACK_PRODUCT: AffiliateProduct = {
  id: "aff-prod-ps5-slim",
  title: "Console PlayStation 5 Slim 1TB Edição Digital",
  category: "Console",
  keywords: ["playstation 5", "ps5", "ps5 slim"],
  store_name: "Amazon Brasil",
  affiliate_url: "https://www.amazon.com.br/dp/B0CL5KNB9M?tag=aigameportal-20",
  image_url: "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?q=80&w=800&auto=format&fit=crop",
  price_estimate: 3799.0,
  is_active: true,
  created_at: "2026-09-14T00:00:00Z",
  updated_at: "2026-09-14T00:00:00Z",
};

/**
 * AdBanner — Componente de Monetização Programática Otimizado para Core Web Vitals (CLS = 0)
 *
 * Formatos Suportados:
 * - `in-article-top`: Horizontal 728x90 (Desktop) / 300x250 (Mobile)
 * - `in-article-mid`: Retangular 300x250 / 336x280 (Corpo do artigo)
 * - `sidebar-sticky`: Vertical 300x600 (Half-Page) ou 300x250 fixo na rolagem
 */
export function AdBanner({
  format,
  slotId,
  fallbackProduct,
  className = "",
  showTelegramFallback = false,
}: AdBannerProps) {
  const [adState, setAdState] = React.useState<"idle" | "loading" | "loaded" | "fallback">("idle");
  const adRef = React.useRef<HTMLModElement | null>(null);
  const rawClientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID?.trim();
  const adsenseClientId = rawClientId
    ? rawClientId.startsWith("ca-pub-")
      ? rawClientId
      : rawClientId.startsWith("pub-")
      ? `ca-${rawClientId}`
      : `ca-pub-${rawClientId}`
    : undefined;

  // Mapeamento de Slot ID por formato a partir de variáveis de ambiente se não fornecido
  const resolvedSlotId =
    slotId ||
    (format === "in-article-top"
      ? process.env.NEXT_PUBLIC_ADSENSE_SLOT_TOP
      : format === "in-article-mid"
      ? process.env.NEXT_PUBLIC_ADSENSE_SLOT_MID
      : process.env.NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR) ||
    "1234567890";

  const product = fallbackProduct || DEFAULT_FALLBACK_PRODUCT;

  React.useEffect(() => {
    // Se a chave do AdSense não estiver configurada, ativa fallback imediatamente
    if (!adsenseClientId) {
      setAdState("fallback");
      return;
    }

    setAdState("loading");

    try {
      if (typeof window !== "undefined") {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch {
      setAdState("fallback");
      return;
    }

    const currentAdEl = adRef.current;
    let observer: MutationObserver | null = null;

    // Observa mutações no atributo data-ad-status atribuído dinamicamente pelo Google AdSense
    if (currentAdEl && typeof MutationObserver !== "undefined") {
      observer = new MutationObserver(() => {
        const status = currentAdEl.getAttribute("data-ad-status");
        if (status === "filled") {
          setAdState("loaded");
        } else if (status === "unfilled") {
          setAdState("fallback");
        }
      });

      observer.observe(currentAdEl, {
        attributes: true,
        attributeFilter: ["data-ad-status", "style", "class"],
      });
    }

    // Timeout de tolerância: se em 1200ms o AdSense não tiver preenchido (ex: localhost, conta em aprovação, AdBlock)
    // ativa o Fallback Inteligente garantindo que NENHUM espaço vazio seja exibido ao usuário
    const timeoutTimer = setTimeout(() => {
      if (currentAdEl) {
        const status = currentAdEl.getAttribute("data-ad-status");
        if (status === "filled") {
          setAdState("loaded");
          return;
        }
      }
      setAdState("fallback");
    }, 1200);

    return () => {
      clearTimeout(timeoutTimer);
      if (observer) {
        observer.disconnect();
      }
    };
  }, [adsenseClientId, format, resolvedSlotId]);

  // Dimensionamento defensivo para garantia de CLS = 0 (Cumulative Layout Shift)
  const containerClassesByFormat = {
    "in-article-top": "w-full max-w-[728px] mx-auto min-h-[280px] md:min-h-[114px]",
    "in-article-mid": "w-full max-w-[336px] sm:max-w-[468px] mx-auto min-h-[290px]",
    "sidebar-sticky": "w-full max-w-[300px] mx-auto min-h-[630px]",
  };

  const adSlotClassesByFormat = {
    "in-article-top": "w-full min-h-[250px] md:min-h-[90px] flex items-center justify-center",
    "in-article-mid": "w-full min-h-[250px] flex items-center justify-center",
    "sidebar-sticky": "w-full min-h-[600px] flex items-center justify-center",
  };

  const marginClass = format === "sidebar-sticky" ? "my-0" : "my-6";

  return (
    <aside
      aria-label="Publicidade e Destaques"
      className={`relative select-none ${marginClass} ${containerClassesByFormat[format]} ${className}`}
    >
      {/* Contêiner de isolamento com fundo sutil para evitar CLS */}
      <div className="w-full h-full flex flex-col justify-between rounded-2xl border border-dashed border-zinc-300/80 dark:border-gamer-800/80 bg-zinc-100/80 dark:bg-gamer-900/60 p-3 sm:p-4 backdrop-blur-sm transition-all duration-300 relative overflow-hidden">
        
        {/* Label regulatória discreta acima do bloco (Conformidade AdSense & E-E-A-T) */}
        <div className="flex items-center justify-between border-b border-zinc-200/60 dark:border-gamer-800/60 pb-1.5 mb-2 relative z-10">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
            Publicidade
          </span>
          <div className="flex items-center gap-1 text-[10px] text-zinc-600 dark:text-zinc-300">
            <ShieldCheck className="w-3 h-3 text-emerald-500" />
            <span>Portal Seguro</span>
          </div>
        </div>

        {/* 1. SLOT DO GOOGLE ADSENSE (Ativo no DOM para medição do Google, visível apenas quando 'filled') */}
        {adsenseClientId && adState !== "fallback" && (
          <div
            className={`${adSlotClassesByFormat[format]} ${
              adState === "loaded"
                ? "relative z-10 opacity-100 block"
                : "absolute inset-0 opacity-0 pointer-events-none -z-10"
            } overflow-hidden transition-opacity duration-300`}
          >
            <ins
              ref={adRef}
              className="adsbygoogle"
              style={{ display: "block", textAlign: "center", width: "100%", height: "100%" }}
              data-ad-client={adsenseClientId}
              data-ad-slot={resolvedSlotId}
              data-ad-format={format === "sidebar-sticky" ? "vertical" : "auto"}
              data-full-width-responsive="true"
            />
          </div>
        )}

        {/* 2. FALLBACK INTELIGENTE (Sempre ativo e visível a menos que o AdSense tenha preenchido o anúncio) */}
        {adState !== "loaded" && (
          <div className="flex-1 flex flex-col justify-center relative z-10 animate-fade-in">
            {showTelegramFallback ? (
              <TelegramPromoFallback format={format} />
            ) : (
              <AffiliatePromoFallback format={format} product={product} />
            )}
          </div>
        )}

        {/* Rodapé discreto com link de transparência */}
        <div className="mt-2 pt-1 text-center border-t border-zinc-200/40 dark:border-gamer-800/40 relative z-10">
          <span className="text-[9px] text-zinc-600 dark:text-zinc-300">
            {adState === "loaded"
              ? "Anúncios selecionados por mídia programática"
              : "Recomendação do AIGamePortal • Links comissionados oficiais"}
          </span>
        </div>
      </div>
    </aside>
  );
}

/**
 * Subcomponente de Fallback: Produto de Afiliado em Destaque ("Destaques Gamer")
 */
function AffiliatePromoFallback({
  format,
  product,
}: {
  format: AdFormat;
  product: AffiliateProduct;
}) {
  const outUrl = `/api/out/${encodeURIComponent(product.id)}`;
  const formattedPrice =
    typeof product.price_estimate === "number"
      ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
          product.price_estimate
        )
      : null;

  // Formato Horizontal (in-article-top no desktop 728x90)
  if (format === "in-article-top") {
    return (
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-left">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {product.image_url && (
            <div className="relative w-16 h-16 md:w-14 md:h-14 rounded-xl overflow-hidden bg-zinc-200 dark:bg-gamer-800 shrink-0 border border-zinc-200 dark:border-gamer-700">
              <Image
                src={product.image_url}
                alt={product.title}
                fill
                sizes="64px"
                className="object-cover group-hover:scale-105 transition-transform"
              />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-brand-purple tracking-wider mb-0.5">
              <Sparkles className="w-3 h-3 text-brand-cyan" />
              Destaque Gamer • {product.store_name}
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white truncate leading-snug">
              {product.title}
            </h4>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
              {formattedPrice ? (
                <span>
                  A partir de <strong className="text-emerald-500 font-bold">{formattedPrice}</strong>
                </span>
              ) : (
                "Verifique a melhor oferta atualizada"
              )}
            </p>
          </div>
        </div>

        <Link
          href={outUrl}
          target="_blank"
          rel="sponsored nofollow"
          className="w-full md:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-brand-purple to-brand-cyan text-white text-xs font-bold hover:brightness-110 active:scale-95 transition-all shadow-neon-purple shrink-0"
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Ver na Amazon</span>
          <ExternalLink className="w-3 h-3 opacity-70" />
        </Link>
      </div>
    );
  }

  // Formato Retangular (in-article-mid 300x250)
  if (format === "in-article-mid") {
    return (
      <div className="flex flex-col items-center text-center p-1 space-y-2.5">
        <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-brand-purple/10 text-brand-purple border border-brand-purple/20">
          <Sparkles className="w-3 h-3 text-brand-cyan" />
          Oferta Recomendada
        </div>

        {product.image_url && (
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-zinc-200 dark:bg-gamer-800 border border-zinc-200 dark:border-gamer-700/60 shadow-sm">
            <Image
              src={product.image_url}
              alt={product.title}
              fill
              sizes="112px"
              className="object-cover"
            />
          </div>
        )}

        <div className="space-y-1 max-w-[280px]">
          <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white line-clamp-2 leading-snug">
            {product.title}
          </h4>
          {formattedPrice && (
            <div className="text-base font-black text-emerald-500">
              {formattedPrice}
            </div>
          )}
        </div>

        <Link
          href={outUrl}
          target="_blank"
          rel="sponsored nofollow"
          className="w-full max-w-[240px] inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-brand-purple to-brand-cyan text-white text-xs font-bold hover:brightness-110 active:scale-95 transition-all shadow-neon-purple"
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Conferir Oferta</span>
          <ExternalLink className="w-3 h-3 opacity-70" />
        </Link>
      </div>
    );
  }

  // Formato Vertical Skyscraper (sidebar-sticky 300x600)
  return (
    <div className="flex flex-col items-center text-center p-2 space-y-4">
      <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-brand-purple/10 text-brand-purple border border-brand-purple/30">
        <Sparkles className="w-3.5 h-3.5 text-brand-cyan" />
        Destaques Gamer do Portal
      </div>

      {product.image_url && (
        <div className="relative w-44 h-44 rounded-2xl overflow-hidden bg-zinc-200 dark:bg-gamer-800 border border-zinc-200 dark:border-gamer-700 shadow-md">
          <Image
            src={product.image_url}
            alt={product.title}
            fill
            sizes="176px"
            className="object-cover"
          />
        </div>
      )}

      <div className="space-y-1.5 px-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-brand-purple">
          {product.category} • {product.store_name}
        </span>
        <h4 className="text-sm font-bold text-zinc-900 dark:text-white leading-snug line-clamp-3">
          {product.title}
        </h4>
        {formattedPrice && (
          <div className="text-xl font-black text-emerald-500 pt-1">
            {formattedPrice}
          </div>
        )}
      </div>

      <Link
        href={outUrl}
        target="_blank"
        rel="sponsored nofollow"
        className="w-full max-w-[220px] inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-purple to-brand-cyan text-white text-xs font-bold hover:brightness-110 active:scale-95 transition-all shadow-neon-purple"
      >
        <ShoppingBag className="w-4 h-4" />
        <span>Comprar na Amazon</span>
        <ExternalLink className="w-3.5 h-3.5 opacity-80" />
      </Link>

      {/* Mini Bloco Adicional de Canal no Telegram no Rodapé do Skyscraper */}
      <div className="w-full pt-4 border-t border-zinc-200/60 dark:border-gamer-800/60 space-y-2">
        <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
          <Send className="w-3.5 h-3.5 text-sky-400" />
          <span>Alertas no Telegram</span>
        </div>
        <p className="text-[11px] text-zinc-500 leading-tight px-1">
          Receba bugs de preço e jogos grátis no seu celular.
        </p>
        <Link
          href={process.env.NEXT_PUBLIC_TELEGRAM_URL || "https://t.me/aigameportal_noticias"}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-400 hover:underline"
        >
          Entrar no Canal Grátis →
        </Link>
      </div>
    </div>
  );
}

/**
 * Subcomponente de Fallback: Chamada para o Canal Oficial no Telegram / Comunidade
 */
function TelegramPromoFallback({ format }: { format: AdFormat }) {
  const telegramUrl =
    process.env.NEXT_PUBLIC_TELEGRAM_URL || "https://t.me/aigameportal_noticias";

  if (format === "in-article-top") {
    return (
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-left">
        <div className="flex items-center gap-3 flex-1">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 shrink-0">
            <Send className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-sky-400">
              Comunidade VIP Gamer
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white leading-tight">
              Canal de Ofertas & Alertas de Jogos Grátis
            </h4>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Não perca giveaways da Epic Games, Steam e cupons de consoles.
            </p>
          </div>
        </div>

        <Link
          href={telegramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold transition-colors shrink-0 shadow-md"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Entrar no Telegram</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center text-center p-3 space-y-3">
      <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
        <Send className="w-7 h-7" />
      </div>

      <div className="space-y-1 max-w-[260px]">
        <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400">
          Comunidade VIP
        </span>
        <h4 className="text-sm font-bold text-zinc-900 dark:text-white leading-snug">
          Alertas de Jogos Grátis & Promoções
        </h4>
        <p className="text-xs text-zinc-500 leading-relaxed">
          Notificações em tempo real sobre quedas de preço e lançamentos antes de todo mundo.
        </p>
      </div>

      <Link
        href={telegramUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full max-w-[220px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold transition-colors shadow-md"
      >
        <Send className="w-3.5 h-3.5" />
        <span>Entrar no Canal Grátis</span>
      </Link>
    </div>
  );
}
