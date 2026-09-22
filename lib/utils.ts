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
 * Lista canônica de domínios e padrões curinga autorizados para Next.js Image Optimization
 * e ingestão de feeds RSS de notícias e produtos de lojas parceiras.
 */
export const ALLOWED_IMAGE_HOST_PATTERNS: readonly string[] = [
  // Feeds Oficiais de Notícias e Comunicação de Games
  "blog.playstation.com",
  "*.playstation.com",
  "news.xbox.com",
  "*.xbox.com",
  "store-images.s-microsoft.com",
  "*.s-microsoft.com",
  "xboxwire.thesourcemediaassets.com",
  "*.thesourcemediaassets.com",
  "images.nintendolife.com",
  "*.nintendolife.com",
  "*.nintendo.com",
  "nintendoeverything.com",
  "*.nintendoeverything.com",
  "cdn.mos.cms.futurecdn.net",
  "*.futurecdn.net",
  "*.pcgamer.com",
  "pcgamer.com",
  "assets.reedpopservices.com",
  "*.reedpopservices.com",
  "assetsio.gnwcdn.com",
  "*.gnwcdn.com",
  "*.eurogamer.net",
  "eurogamer.net",
  "*.gamesindustry.biz",
  "gamesindustry.biz",

  // Mídia Editorial Geral e Banco de Imagens
  "images.unsplash.com",
  "*.ign.com",
  "ign.com",
  "assets-prd.ignimgs.com",
  "*.ignimgs.com",
  "*.gamespot.com",
  "gamespot.com",
  "*.polygon.com",
  "polygon.com",
  "www.videogameschronicle.com",
  "*.videogameschronicle.com",
  "videogameschronicle.com",
  "gematsu.com",
  "*.gematsu.com",
  "www.gematsu.com",
  "rockpapershotgun.com",
  "*.rockpapershotgun.com",
  "www.rockpapershotgun.com",
  "destructoid.com",
  "*.destructoid.com",
  "www.destructoid.com",
  "preview.redd.it",
  "i.redd.it",
  "external-preview.redd.it",
  "*.redd.it",
  "gamespress.com",
  "*.gamespress.com",
  "www.gamespress.com",

  // CDNs de Jogos e Plataformas
  "shared.fastly.steamstatic.com",
  "cdn.cloudflare.steamstatic.com",
  "cdn.akamai.steamstatic.com",
  "store.fastly.steamstatic.com",
  "*.steamstatic.com",
  "*.steampowered.com",
  "steampowered.com",
  "*.epicgames.com",
  "epicgames.com",
  "media.rawg.io",
  "images.igdb.com",

  // Lojas e Parceiros de Afiliados
  "m.media-amazon.com",
  "images-na.ssl-images-amazon.com",
  "*.media-amazon.com",
  "media-amazon.com",
  "images.kabum.com.br",
  "*.kabum.com.br",
  "static.kabum.com.br",
  "assets.nuuvem.com",
  "*.nuuvem.com",
] as const;

/**
 * Valida se um host ou URL de imagem pertence à lista explícita de domínios permitidos,
 * prevenindo ataques de Server-Side Request Forgery (SSRF) contra redes internas e serviços de metadados.
 */
export function isAllowedImageHost(urlOrHost: string): boolean {
  if (!urlOrHost || typeof urlOrHost !== "string") return false;

  let hostname = "";
  const trimmed = urlOrHost.trim().toLowerCase();

  try {
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      const parsed = new URL(trimmed);
      hostname = parsed.hostname.toLowerCase();
    } else if (!trimmed.includes("/") && !trimmed.includes(":") && !trimmed.includes("?")) {
      hostname = trimmed;
    } else {
      return false;
    }
  } catch {
    return false;
  }

  if (!hostname) return false;

  // 1. Bloqueio estrito de alvos SSRF e endereços não roteáveis/privados
  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal") ||
    hostname === "127.0.0.1" ||
    hostname.startsWith("127.") ||
    hostname === "0.0.0.0" ||
    hostname === "::1" ||
    hostname === "[::1]" ||
    hostname === "169.254.169.254" || // AWS / GCP / Azure IMDS
    hostname.startsWith("169.254.") || // Link-local
    hostname.startsWith("10.") || // RFC 1918 Class A
    hostname.startsWith("192.168.") || // RFC 1918 Class C
    hostname === "metadata.google.internal" ||
    hostname === "metadata.internal"
  ) {
    return false;
  }

  // RFC 1918 Class B: 172.16.0.0 - 172.31.255.255
  const matchClassB = hostname.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./);
  if (matchClassB) return false;

  // RFC 6598 Carrier-Grade NAT: 100.64.0.0 - 100.127.255.255
  const matchCgnat = hostname.match(/^100\.(6[4-9]|[7-9][0-9]|1[0-1][0-9]|12[0-7])\./);
  if (matchCgnat) return false;

  // 2. Validação contra lista explícita de padrões autorizados
  for (const pattern of ALLOWED_IMAGE_HOST_PATTERNS) {
    if (pattern.startsWith("*.")) {
      const domainRoot = pattern.slice(2).toLowerCase();
      if (hostname === domainRoot || hostname.endsWith("." + domainRoot)) {
        return true;
      }
    } else {
      if (hostname === pattern.toLowerCase()) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Valida se uma string é uma URL válida de imagem de capa HTTP/HTTPS,
 * descartando áudios/vídeos, SVGs de placeholder, pixels de rastreamento e CDNs bloqueados.
 * Aplica também verificação de domínios autorizados para prevenção de SSRF.
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

  // Defesa em profundidade contra SSRF: validação de host autorizado
  return isAllowedImageHost(trimmed);
}


