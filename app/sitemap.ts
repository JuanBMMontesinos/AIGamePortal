import type { MetadataRoute } from "next";
import { getAllPostsForSitemap, getCategories, getGameHubs } from "@/lib/data/api";

export const revalidate = 3600; // Revalida o sitemap geral a cada 1 hora (3600s)

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://aigameportal.com").replace(/\/+$/, "");

  // 1. Rotas estáticas principais
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "always",
      priority: 1.0,
    },
    {
      url: `${siteUrl}/jogos`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/transparencia-editorial`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  // 2. Rotas de categorias (PlayStation, Xbox, Nintendo, PC Gaming, Hardware, etc.)
  const categories = await getCategories();
  const categoryRoutes: MetadataRoute.Sitemap = categories.map((cat) => ({
    url: `${siteUrl}/categoria/${cat.slug}`,
    lastModified: new Date(),
    changeFrequency: "hourly",
    priority: 0.8,
  }));

  // 3. Rotas de Hubs de Jogos Permanentes (SEO de Cauda Longa - Fase 4)
  const gameHubs = await getGameHubs();
  const gameHubRoutes: MetadataRoute.Sitemap = gameHubs.map((hub) => ({
    url: `${siteUrl}/jogos/${hub.slug}`,
    lastModified: new Date(hub.updated_at || hub.created_at || new Date()),
    changeFrequency: "daily",
    priority: 0.85,
  }));

  // 4. Todas as matérias publicadas no portal
  const posts = await getAllPostsForSitemap();
  const postRoutes: MetadataRoute.Sitemap = posts.map((post) => {
    let lastModified: Date;
    try {
      lastModified = new Date(post.updated_at || post.published_at);
      if (isNaN(lastModified.getTime())) {
        lastModified = new Date();
      }
    } catch {
      lastModified = new Date();
    }

    return {
      url: `${siteUrl}/noticias/${post.slug}`,
      lastModified,
      changeFrequency: "daily",
      priority: 0.9,
    };
  });

  return [...staticRoutes, ...categoryRoutes, ...gameHubRoutes, ...postRoutes];
}
