export interface SocialLink {
  id: "x" | "discord" | "youtube" | "telegram" | "instagram";
  name: string;
  handle: string;
  url: string;
  description: string;
  badge?: string;
  brandColor: string;
  hoverColorClass: string;
}

export const SOCIAL_LINKS: Record<SocialLink["id"], SocialLink> = {
  x: {
    id: "x",
    name: "X (Twitter)",
    handle: "@MadeByAiGames",
    url: process.env.NEXT_PUBLIC_X_URL || "https://x.com/MadeByAiGames",
    description: "Cobertura em tempo real e breaking news",
    brandColor: "#000000",
    hoverColorClass: "hover:text-zinc-900 dark:hover:text-white hover:border-zinc-500",
  },
  discord: {
    id: "discord",
    name: "Discord",
    handle: "Comunidade VIP",
    url: process.env.NEXT_PUBLIC_DISCORD_URL || "https://discord.gg/C6tYRUBPd",
    description: "Alertas de jogos grátis e chat gamer",
    badge: "Jogos Grátis",
    brandColor: "#5865F2",
    hoverColorClass: "hover:text-[#5865F2] hover:border-[#5865F2]/50",
  },
  youtube: {
    id: "youtube",
    name: "YouTube",
    handle: "@madebyaigames",
    url: process.env.NEXT_PUBLIC_YOUTUBE_URL || "https://www.youtube.com/@madebyaigames",
    description: "Trailers, gameplays e resumos em vídeo",
    brandColor: "#FF0000",
    hoverColorClass: "hover:text-[#FF0000] hover:border-[#FF0000]/50",
  },
  telegram: {
    id: "telegram",
    name: "Telegram Bot",
    handle: "@MadeByAiGamesBot",
    url: process.env.NEXT_PUBLIC_TELEGRAM_URL || "https://t.me/MadeByAiGamesBot",
    description: "Alertas instantâneos no celular",
    badge: "Bot Oficial",
    brandColor: "#229ED9",
    hoverColorClass: "hover:text-[#229ED9] hover:border-[#229ED9]/50",
  },
  instagram: {
    id: "instagram",
    name: "Instagram",
    handle: "@madebyaigames",
    url: process.env.NEXT_PUBLIC_INSTAGRAM_URL || "https://www.instagram.com/madebyaigames/",
    description: "Destaques visuais e bastidores gamer",
    brandColor: "#E1306C",
    hoverColorClass: "hover:text-[#E1306C] hover:border-[#E1306C]/50",
  },
};

export const SOCIAL_LINKS_ARRAY: SocialLink[] = Object.values(SOCIAL_LINKS);
