import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return format(date, "d 'de' MMMM 'de' yyyy", { locale: ptBR });
  } catch {
    return dateString;
  }
}

export function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
  } catch {
    return dateString;
  }
}

export function calculateReadingTime(text: string): number {
  if (!text) return 1;
  const wordsPerMinute = 200;
  const words = text.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  return Math.max(1, minutes);
}

export function getMetacriticColor(score: number | null | undefined): {
  bg: string;
  text: string;
  border: string;
} {
  if (score === null || score === undefined) {
    return {
      bg: "bg-zinc-800",
      text: "text-zinc-400",
      border: "border-zinc-700",
    };
  }
  if (score >= 75) {
    return {
      bg: "bg-emerald-500/10",
      text: "text-emerald-400",
      border: "border-emerald-500/40",
    };
  }
  if (score >= 50) {
    return {
      bg: "bg-amber-500/10",
      text: "text-amber-400",
      border: "border-amber-500/40",
    };
  }
  return {
    bg: "bg-rose-500/10",
    text: "text-rose-400",
    border: "border-rose-500/40",
  };
}

/**
 * Valida se uma string é uma URL válida de imagem de capa HTTP/HTTPS,
 * descartando áudios/vídeos, SVGs de placeholder, pixels de rastreamento e CDNs bloqueados.
 */
export function isValidImageUrl(url?: string | null): boolean {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) return false;

  // Rejeita extensões de áudio e vídeo comumente encontradas em enclosures de podcasts
  if (/\.(mp3|wav|ogg|m4a|aac|flac|mp4|webm|mkv|avi)(\?.*)?$/i.test(trimmed)) {
    return false;
  }

  // Rejeita SVGs (geralmente ícones, logos ou placeholders 1x1, como o placeholder.svg do PlayStation Blog)
  if (/\.svg(\?.*)?$/i.test(trimmed)) {
    return false;
  }

  // Rejeita termos comuns de imagens de placeholder ou rastreadores
  const lower = trimmed.toLowerCase();
  if (
    lower.includes("placeholder") ||
    lower.includes("blank.gif") ||
    lower.includes("pixel.gif") ||
    lower.includes("spacer.gif") ||
    lower.includes("/1x1.")
  ) {
    return false;
  }

  // Rejeita CDNs que utilizam Cloudflare Bot Challenge bloqueando hotlinking (ex: Nintendo Life)
  if (lower.includes("images.nintendolife.com")) {
    return false;
  }

  return true;
}

