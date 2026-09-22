import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@supabase/supabase-js"],
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400, // 24 horas de cache para imagens otimizadas
    remotePatterns: [
      // Fontes Oficiais de Notícias e Comunicação de Games
      { protocol: "https", hostname: "*.playstation.com" },
      { protocol: "https", hostname: "*.xbox.com" },
      { protocol: "https", hostname: "*.s-microsoft.com" },
      { protocol: "https", hostname: "*.thesourcemediaassets.com" },
      { protocol: "https", hostname: "*.nintendolife.com" },
      { protocol: "https", hostname: "*.nintendo.com" },
      { protocol: "https", hostname: "nintendoeverything.com" },
      { protocol: "https", hostname: "*.nintendoeverything.com" },
      { protocol: "https", hostname: "cdn.mos.cms.futurecdn.net" }, // PC Gamer / Future
      { protocol: "https", hostname: "*.futurecdn.net" },
      { protocol: "https", hostname: "*.pcgamer.com" },
      { protocol: "https", hostname: "pcgamer.com" },
      { protocol: "https", hostname: "assets.reedpopservices.com" }, // Eurogamer & GamesIndustry
      { protocol: "https", hostname: "*.reedpopservices.com" },
      { protocol: "https", hostname: "*.gnwcdn.com" }, // Gamer Network CDN (Eurogamer, etc.)
      { protocol: "https", hostname: "*.eurogamer.net" },
      { protocol: "https", hostname: "*.gamesindustry.biz" },

      // CDNs de Jogos e Plataformas
      { protocol: "https", hostname: "shared.fastly.steamstatic.com" },
      { protocol: "https", hostname: "cdn.cloudflare.steamstatic.com" },
      { protocol: "https", hostname: "cdn.akamai.steamstatic.com" },
      { protocol: "https", hostname: "store.fastly.steamstatic.com" },
      { protocol: "https", hostname: "*.steamstatic.com" },
      { protocol: "https", hostname: "*.steampowered.com" },
      { protocol: "https", hostname: "*.epicgames.com" },
      { protocol: "https", hostname: "media.rawg.io" },
      { protocol: "https", hostname: "images.igdb.com" },

      // Lojas e Parceiros de Afiliados (Amazon, KaBuM!, Nuuvem)
      { protocol: "https", hostname: "images-na.ssl-images-amazon.com" },
      { protocol: "https", hostname: "*.media-amazon.com" },
      { protocol: "https", hostname: "*.kabum.com.br" },
      { protocol: "https", hostname: "*.nuuvem.com" },

      // Mídia Editorial Geral e Banco de Imagens
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "*.ign.com" },
      { protocol: "https", hostname: "*.ignimgs.com" },
      { protocol: "https", hostname: "*.gamespot.com" },
      { protocol: "https", hostname: "*.polygon.com" },
      { protocol: "https", hostname: "videogameschronicle.com" },
      { protocol: "https", hostname: "*.videogameschronicle.com" },
      { protocol: "https", hostname: "gematsu.com" },
      { protocol: "https", hostname: "*.gematsu.com" },
      { protocol: "https", hostname: "rockpapershotgun.com" },
      { protocol: "https", hostname: "*.rockpapershotgun.com" },
      { protocol: "https", hostname: "destructoid.com" },
      { protocol: "https", hostname: "*.destructoid.com" },
      { protocol: "https", hostname: "*.redd.it" },
      { protocol: "https", hostname: "gamespress.com" },
      { protocol: "https", hostname: "*.gamespress.com" },
    ],
  },
  async headers() {
    // Content Security Policy (CSP) estruturado para Next.js 15, Google AdSense, Supabase, Google Fonts e CDNs parceiras
    const contentSecurityPolicy = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://pagead2.googlesyndication.com https://adservice.google.com https://www.googletagservices.com https://tpc.googlesyndication.com https://ep1.adtrafficquality.google",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob: https://images.unsplash.com https://*.steamstatic.com https://*.steampowered.com https://*.playstation.com https://*.xbox.com https://*.s-microsoft.com https://*.thesourcemediaassets.com https://*.nintendo.com https://*.nintendolife.com https://*.nintendoeverything.com https://m.media-amazon.com https://images-na.ssl-images-amazon.com https://*.media-amazon.com https://*.kabum.com.br https://*.nuuvem.com https://*.epicgames.com https://media.rawg.io https://images.igdb.com https://*.pcgamer.com https://*.futurecdn.net https://*.eurogamer.net https://*.gamesindustry.biz https://*.reedpopservices.com https://*.gnwcdn.com https://*.ign.com https://*.ignimgs.com https://*.gamespot.com https://*.polygon.com https://*.videogameschronicle.com https://gematsu.com https://*.gematsu.com https://*.rockpapershotgun.com https://*.destructoid.com https://preview.redd.it https://i.redd.it https://external-preview.redd.it https://*.redd.it https://*.gamespress.com https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net https://tpc.googlesyndication.com",
      "connect-src 'self' https://*.supabase.co https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net https://ep1.adtrafficquality.google https://rawg.io https://api.rawg.io",
      "frame-src 'self' https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://www.google.com https://pagead2.googlesyndication.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'self'",
      "upgrade-insecure-requests",
    ].join("; ");

    return [
      // Cabeçalhos de Segurança HTTP Completos (Fase 1 Hardening)
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          {
            key: "Content-Security-Policy",
            value: contentSecurityPolicy,
          },
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
      // Métricas Públicas Sanitizadas com Cache de 5 minutos (CDN e Browser)
      {
        source: "/api/metrics/public",
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

