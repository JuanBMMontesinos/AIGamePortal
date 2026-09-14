"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Clock, Calendar, ArrowRight, Zap, Sparkles } from "lucide-react";
import { Post } from "@/types/database";
import { calculateReadingTime, formatRelativeTime, isValidImageUrl } from "@/lib/utils";

interface HeroFeaturedProps {
  post: Post;
}

export function HeroFeatured({ post }: HeroFeaturedProps) {
  const [imgError, setImgError] = useState(false);
  const readingTime = calculateReadingTime(post.content);
  const relativeDate = formatRelativeTime(post.published_at);
  const categoryName = post.categories?.name || "Geral";
  const platforms = post.game_metadata?.platforms || [];
  const hasValidImage = isValidImageUrl(post.cover_image_url);
  const showImage = hasValidImage && !imgError;

  return (
    <section className="relative w-full rounded-2xl md:rounded-3xl overflow-hidden border border-zinc-200 dark:border-gamer-800 bg-zinc-900 group shadow-lg hover:shadow-neon-purple/20 transition-all duration-500">
      {/* Background Image with Dark Gamer Gradient Overlays */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {showImage ? (
          <Image
            src={post.cover_image_url!}
            alt={post.cover_image_alt || post.title}
            fill
            priority
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 1200px"
            className="object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out brightness-75 dark:brightness-50"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gamer-900 via-gamer-850 to-brand-purple/20" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/90 via-zinc-950/40 to-transparent" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 p-6 sm:p-8 md:p-12 lg:p-14 flex flex-col justify-end min-h-[480px] md:min-h-[540px]">
        {/* Top Badges */}
        <div className="flex flex-wrap items-center gap-2.5 mb-4">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-brand-purple text-white shadow-neon-purple">
            <Zap className="w-3 h-3 fill-current" />
            Destaque Principal
          </span>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-md text-white border border-white/20">
            {categoryName}
          </span>
          {post.is_rumor && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500 text-zinc-950 shadow-md border border-amber-300">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-950 animate-pulse" />
              Rumor
            </span>
          )}
          {platforms.slice(0, 2).map((p) => (
            <span
              key={p}
              className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-black/40 text-zinc-300 border border-zinc-700/60"
            >
              {p}
            </span>
          ))}
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-white line-clamp-3 leading-tight max-w-4xl group-hover:text-zinc-100 transition-colors">
          <Link href={`/noticias/${post.slug}`} className="hover:underline decoration-brand-purple decoration-2 underline-offset-4">
            {post.title}
          </Link>
        </h1>

        {/* Excerpt */}
        {post.excerpt && (
          <p className="mt-4 text-sm sm:text-base md:text-lg text-zinc-300 max-w-3xl line-clamp-2 sm:line-clamp-3 font-normal leading-relaxed">
            {post.excerpt}
          </p>
        )}

        {/* Meta Info & CTA Button */}
        <div className="mt-6 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-xs sm:text-sm text-zinc-300">
            <span className="flex items-center gap-1.5 font-medium">
              <Calendar className="w-4 h-4 text-brand-cyan" />
              {relativeDate}
            </span>
            <span className="text-zinc-500">•</span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-brand-purple" />
              {readingTime} min de leitura
            </span>
            <span className="text-zinc-500 hidden sm:inline">•</span>
            <span className="hidden sm:flex items-center gap-1 text-emerald-400 font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              Curadoria IA
            </span>
          </div>

          <Link
            href={`/noticias/${post.slug}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-zinc-950 hover:bg-zinc-100 dark:bg-white dark:text-zinc-950 font-bold text-sm transition-transform active:scale-95 shadow-md group/btn"
          >
            <span>Ler Notícia Completa</span>
            <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
}
