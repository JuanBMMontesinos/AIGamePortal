"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ShoppingBag, ExternalLink, Sparkles, ShieldCheck, Tag } from "lucide-react";
import { AffiliateProduct } from "@/types/database";

interface AffiliateDealCardProps {
  product: AffiliateProduct | null;
  postId?: string | null;
  className?: string;
}

/**
 * Formata valor numérico para o padrão de moeda brasileira (BRL)
 */
function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function AffiliateDealCard({
  product,
  postId,
  className = "",
}: AffiliateDealCardProps) {
  const [imageError, setImageError] = useState(false);

  if (!product || !product.is_active) {
    return null;
  }

  const outUrl = `/api/out/${encodeURIComponent(product.id)}${
    postId ? `?postId=${encodeURIComponent(postId)}` : ""
  }`;

  return (
    <aside
      aria-label="Oferta recomendada de afiliado"
      className={`relative overflow-hidden rounded-2xl border border-brand-purple/30 bg-gradient-to-br from-zinc-900/95 via-zinc-900/80 to-zinc-950 p-5 sm:p-6 shadow-xl shadow-brand-purple/5 backdrop-blur-md transition-all hover:border-brand-purple/60 hover:shadow-neon-purple/20 ${className}`}
    >
      {/* Luz ambiente de fundo neon */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-brand-purple/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-brand-cyan/10 blur-3xl" />

      {/* Cabeçalho do Card com Badges */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-4 border-b border-zinc-800/80">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 px-3 py-1 text-xs font-black uppercase tracking-wider text-amber-400 border border-amber-500/30 shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            Oferta Recomendada
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-brand-purple/10 px-2.5 py-1 text-[11px] font-bold text-brand-purple border border-brand-purple/25">
            <Tag className="h-3 w-3" />
            {product.category}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-zinc-400">
          <span>Parceiro Oficial:</span>
          <strong className="text-zinc-200 font-semibold">{product.store_name}</strong>
        </div>
      </div>

      {/* Corpo Principal: Imagem + Informações + Call to Action */}
      <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-6">
        {/* Imagem do Produto com Fallback Elegante */}
        <div className="relative h-40 w-full sm:h-32 sm:w-36 shrink-0 overflow-hidden rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center group">
          {!imageError && product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.title}
              fill
              sizes="(max-width: 640px) 100vw, 144px"
              className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-zinc-600">
              <ShoppingBag className="h-10 w-10 text-brand-purple/50 mb-1" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                {product.category}
              </span>
            </div>
          )}
        </div>

        {/* Detalhes do Produto */}
        <div className="flex-1 flex flex-col justify-between gap-3 min-w-0">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white leading-snug line-clamp-2 group-hover:text-brand-purple transition-colors">
              {product.title}
            </h3>

            {product.price_estimate && product.price_estimate > 0 && (
              <div className="mt-1.5 flex items-baseline gap-2">
                <span className="text-xs text-zinc-400 font-medium">Preço de referência:</span>
                <span className="text-lg sm:text-xl font-black text-emerald-400 tracking-tight">
                  {formatCurrency(product.price_estimate)}
                </span>
              </div>
            )}
          </div>

          {/* Botão de Redirecionamento e CTA */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <a
              href={outUrl}
              target="_blank"
              rel="sponsored nofollow"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-purple via-purple-600 to-brand-cyan px-5 py-2.5 text-sm font-black text-white shadow-md shadow-brand-purple/20 transition-all hover:brightness-110 hover:shadow-neon-purple active:scale-[0.98]"
            >
              <ShoppingBag className="h-4 w-4" />
              <span>Ver Menor Preço na {product.store_name}</span>
              <ExternalLink className="h-3.5 w-3.5 ml-0.5 opacity-80" />
            </a>
          </div>
        </div>
      </div>

      {/* Aviso de Transparência E-E-A-T (Google Search Compliance) */}
      <footer className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center gap-2 text-[11px] text-zinc-400/90 leading-relaxed">
        <ShieldCheck className="h-3.5 w-3.5 text-brand-cyan shrink-0" />
        <span>
          <strong>Transparência Editorial:</strong> Comprando pelos nossos links, o portal pode receber uma comissão sem custo adicional para você. Preços e disponibilidade sujeitos a alteração pela loja parceira.
        </span>
      </footer>
    </aside>
  );
}

export default AffiliateDealCard;
