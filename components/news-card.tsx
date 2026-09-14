"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Clock, Calendar, Zap, Sparkles } from "lucide-react";
import { Post } from "@/types/database";
import { calculateReadingTime, formatRelativeTime, isValidImageUrl } from "@/lib/utils";

interface NewsCardProps {
  post: Post;
  priority?: boolean;
}

export function NewsCard({ post, priority = false }: NewsCardProps) {
  const [imgError, setImgError] = useState(false);
  const readingTime = calculateReadingTime(post.content);
  const relativeDate = formatRelativeTime(post.published_at);
  const categoryName = post.categories?.name || "Geral";
  const categorySlug = post.categories?.slug || "geral";
  const platforms = post.game_metadata?.platforms || [];
  const quickTldr = post.tldr && post.tldr.length > 0 ? post.tldr[0] : null;
  const hasValidImage = isValidImageUrl(post.cover_image_url);
  const showImage = hasValidImage && !imgError;

  return (
    <article className="group relative flex flex-col rounded-2xl overflow-hidden border border-zinc-200 dark:border-gamer-800/80 bg-white dark:bg-gamer-900 hover:border-brand-purple/50 dark:hover:border-brand-purple/50 hover:shadow-neon-purple/15 transition-all duration-300">
      {/* Cover Image Container */}
      <Link href={`/noticias/${post.slug}`} className="relative aspect-[16/9] w-full overflow-hidden bg-zinc-900 block">
        {showImage ? (
          <Image
            src={post.cover_image_url!}
            alt={post.cover_image_alt || post.title}
            fill
            priority={priority}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-gamer-850 text-zinc-500">
            <Zap className="w-8 h-8 opacity-40 text-brand-purple" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

        {/* Category Badge overlay on image */}
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5">
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide uppercase bg-black/60 backdrop-blur-md text-white border border-white/10 group-hover:border-brand-purple/40 transition-colors">
            {categoryName}
          </span>
          {post.is_rumor && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold tracking-wide uppercase bg-amber-500 text-zinc-950 shadow-sm border border-amber-300">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-950 animate-pulse" />
              Rumor
            </span>
          )}
        </div>

        {/* Platforms Badges overlay */}
        {platforms.length > 0 && (
          <div className="absolute bottom-2.5 right-2.5 z-10 flex gap-1">
            {platforms.slice(0, 2).map((p) => (
              <span
                key={p}
                className="px-2 py-0.5 rounded text-[10px] font-semibold bg-black/70 backdrop-blur-md text-zinc-200 border border-white/10"
              >
                {p}
              </span>
            ))}
          </div>
        )}
      </Link>

      {/* Card Body */}
      <div className="flex flex-col flex-1 p-5">
        {/* Meta Header */}
        <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400 mb-2.5">
          <span className="flex items-center gap-1 font-medium">
            <Calendar className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
            {relativeDate}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-brand-purple" />
            {readingTime} min
          </span>
        </div>

        {/* Title */}
        <h3 className="font-bold text-lg sm:text-xl text-zinc-900 dark:text-white leading-snug group-hover:text-brand-purple dark:group-hover:text-brand-purple transition-colors line-clamp-2">
          <Link href={`/noticias/${post.slug}`}>
            {post.title}
          </Link>
        </h3>

        {/* Quick TL;DR Bullet */}
        {quickTldr && (
          <div className="mt-3 p-3 rounded-xl bg-zinc-50 dark:bg-gamer-850/80 border border-zinc-200/60 dark:border-gamer-700/60">
            <div className="flex items-start gap-2">
              <span className="p-1 rounded-md bg-brand-purple/10 text-brand-purple shrink-0 mt-0.5">
                <Zap className="w-3 h-3 fill-current" />
              </span>
              <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed line-clamp-2 font-medium">
                <strong className="text-brand-purple font-semibold">TL;DR: </strong>
                {quickTldr}
              </p>
            </div>
          </div>
        )}

        {/* Footer info: Source / AI tag */}
        <div className="mt-auto pt-4 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 border-t border-zinc-100 dark:border-gamer-800/60">
          <span className="font-medium text-zinc-600 dark:text-zinc-400 truncate max-w-[150px]">
            {post.sources?.name || "Fonte Oficial"}
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-500 dark:text-emerald-400 font-semibold">
            <Sparkles className="w-3 h-3" />
            IA Curada
          </span>
        </div>
      </div>
    </article>
  );
}
