import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@supabase/supabase-js"],
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400, // 24 horas de cache para imagens otimizadas
    remotePatterns: [
      // Fontes Oficiais de Notícias e Comunicação de Games
      { protocol: "https", hostname: "blog.playstation.com" },
      { protocol: "https", hostname: "*.playstation.com" },
      { protocol: "https", hostname: "news.xbox.com" },
      { protocol: "https", hostname: "*.xbox.com" },
      { protocol: "https", hostname: "images.nintendolife.com" },
      { protocol: "https", hostname: "*.nintendolife.com" },
      { protocol: "https", hostname: "*.nintendo.com" },
      { protocol: "https", hostname: "cdn.mos.cms.futurecdn.net" }, // PC Gamer
      { protocol: "https", hostname: "*.pcgamer.com" },
      { protocol: "https", hostname: "assets.reedpopservices.com" }, // Eurogamer & GamesIndustry
      { protocol: "https", hostname: "*.eurogamer.net" },
      { protocol: "https", hostname: "*.gamesindustry.biz" },

      // CDNs de Jogos e Plataformas
      { protocol: "https", hostname: "shared.fastly.steamstatic.com" },
      { protocol: "https", hostname: "cdn.cloudflare.steamstatic.com" },
      { protocol: "https", hostname: "cdn.akamai.steamstatic.com" },
      { protocol: "https", hostname: "*.steamstatic.com" },
      { protocol: "https", hostname: "*.steampowered.com" },
      { protocol: "https", hostname: "*.epicgames.com" },
      { protocol: "https", hostname: "media.rawg.io" },
      { protocol: "https", hostname: "images.igdb.com" },

      // Lojas e Parceiros de Afiliados
      { protocol: "https", hostname: "m.media-amazon.com" },
      { protocol: "https", hostname: "images-na.ssl-images-amazon.com" },

      // Mídia Editorial Geral e Banco de Imagens
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "*.ign.com" },
      { protocol: "https", hostname: "*.gamespot.com" },
      { protocol: "https", hostname: "*.polygon.com" },
      { protocol: "https", hostname: "www.videogameschronicle.com" },
      { protocol: "https", hostname: "*.videogameschronicle.com" },
      { protocol: "https", hostname: "gematsu.com" },
      { protocol: "https", hostname: "*.gematsu.com" },
      { protocol: "https", hostname: "rockpapershotgun.com" },
      { protocol: "https", hostname: "*.rockpapershotgun.com" },
      { protocol: "https", hostname: "destructoid.com" },
      { protocol: "https", hostname: "*.destructoid.com" },
      { protocol: "https", hostname: "preview.redd.it" },
      { protocol: "https", hostname: "i.redd.it" },
      { protocol: "https", hostname: "external-preview.redd.it" },
      { protocol: "https", hostname: "gamespress.com" },
      { protocol: "https", hostname: "*.gamespress.com" },

      // Fallback permissivo para novos feeds RSS configurados
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
  async headers() {
    return [
      // Cabeçalhos de Segurança Padrão
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      // Edge Caching Otimizado para Notícias (Sustenta picos de +100k views com zero custo)
      {
        source: "/noticias/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=1800, stale-while-revalidate=86400",
          },
          {
            key: "CDN-Cache-Control",
            value: "public, s-maxage=1800, stale-while-revalidate=86400",
          },
          {
            key: "Cloudflare-CDN-Cache-Control",
            value: "public, s-maxage=1800, stale-while-revalidate=86400",
          },
        ],
      },
      // Edge Caching para Feeds por Categoria
      {
        source: "/categoria/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=1800, stale-while-revalidate=86400",
          },
          {
            key: "CDN-Cache-Control",
            value: "public, s-maxage=1800, stale-while-revalidate=86400",
          },
          {
            key: "Cloudflare-CDN-Cache-Control",
            value: "public, s-maxage=1800, stale-while-revalidate=86400",
          },
        ],
      },
      // Edge Caching para Hubs de Jogos
      {
        source: "/jogos/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=1800, stale-while-revalidate=86400",
          },
          {
            key: "CDN-Cache-Control",
            value: "public, s-maxage=1800, stale-while-revalidate=86400",
          },
          {
            key: "Cloudflare-CDN-Cache-Control",
            value: "public, s-maxage=1800, stale-while-revalidate=86400",
          },
        ],
      },
      // Telemetria Interna com Cache de 5 minutos (evita sobrecarga no banco)
      {
        source: "/api/metrics/summary",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=300, stale-while-revalidate=600",
          },
          {
            key: "CDN-Cache-Control",
            value: "public, s-maxage=300, stale-while-revalidate=600",
          },
        ],
      },
    ];
  },
};

export default nextConfig;

