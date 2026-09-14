"use client";

import { useState } from "react";
import Image from "next/image";
import { isValidImageUrl } from "@/lib/utils";

interface ArticleCoverImageProps {
  src: string | null;
  alt: string;
}

export function ArticleCoverImage({ src, alt }: ArticleCoverImageProps) {
  const [error, setError] = useState(false);

  if (!isValidImageUrl(src) || error) {
    return null;
  }

  return (
    <div className="my-8 rounded-2xl md:rounded-3xl overflow-hidden border border-zinc-200 dark:border-gamer-800 shadow-lg relative aspect-[16/9] w-full bg-zinc-900">
      <Image
        src={src!}
        alt={alt}
        fill
        priority
        sizes="(max-width: 1024px) 100vw, 896px"
        className="object-cover object-center"
        onError={() => setError(true)}
      />
    </div>
  );
}
