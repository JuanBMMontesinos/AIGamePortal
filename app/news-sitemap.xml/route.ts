import { NextResponse } from "next/server";
import { getRecentPostsForNewsSitemap } from "@/lib/data/api";

export const dynamic = "force-dynamic";
export const revalidate = 300; // Cache de 5 minutos para indexação rápida no Google News

function escapeXml(unsafe: string): string {
  if (!unsafe) return "";
  return unsafe.replace(/[<>&'"]/g, (char) => {
    switch (char) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case "'":
        return "&apos;";
      case '"':
        return "&quot;";
      default:
        return char;
    }
  });
}

function formatIsoDate(dateString: string): string {
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) {
      return new Date().toISOString();
    }
    return d.toISOString();
  } catch {
    return new Date().toISOString();
  }
}

export async function GET() {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://aigameportal.com").replace(/\/+$/, "");

  // Busca apenas matérias publicadas nas últimas 48 horas conforme especificação do Google Notícias
  const recentPosts = await getRecentPostsForNewsSitemap(48);

  const xmlEntries = recentPosts
    .map((post) => {
      const loc = `${siteUrl}/noticias/${post.slug}`;
      const pubDate = formatIsoDate(post.published_at);
      const title = escapeXml(post.title?.trim() || "Notícia Gamer");

      return `  <url>
    <loc>${escapeXml(loc)}</loc>
    <news:news>
      <news:publication>
        <news:name>Made By AI Games</news:name>
        <news:language>pt-br</news:language>
      </news:publication>
      <news:publication_date>${pubDate}</news:publication_date>
      <news:title>${title}</news:title>
    </news:news>
  </url>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${xmlEntries}
</urlset>`;

  return new NextResponse(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      "X-Robots-Tag": "noindex", // Boas práticas: o sitemap em si não deve ser indexado como página de busca
    },
  });
}
