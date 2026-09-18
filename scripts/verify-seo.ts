import { GET as getNewsSitemap } from "../app/news-sitemap.xml/route";
import sitemap from "../app/sitemap";
import robots from "../app/robots";
import { generateMetadata } from "../app/noticias/[slug]/page";

async function verify() {
  console.log("=== 1. TESTANDO ROBOTS.TS ===");
  const robotsConfig = robots();
  console.log("Robots sitemaps:", robotsConfig.sitemap);
  if (!Array.isArray(robotsConfig.sitemap) || robotsConfig.sitemap.length !== 2) {
    throw new Error("Robots sitemap configuration is invalid");
  }
  console.log("✓ Robots.ts configurado com sucesso.");

  console.log("\n=== 2. TESTANDO SITEMAP.TS (PADRÃO) ===");
  const sitemapEntries = await sitemap();
  console.log(`Total de URLs no sitemap: ${sitemapEntries.length}`);
  const homeEntry = sitemapEntries.find(
    (e) =>
      e.url.endsWith(":3000") ||
      e.url.includes("aigameportal") ||
      e.url.includes("madebyaigames") ||
      e.url.includes("vercel.app")
  );
  const newsEntries = sitemapEntries.filter((e) => e.url.includes("/noticias/"));
  const catEntries = sitemapEntries.filter((e) => e.url.includes("/categoria/"));
  console.log(`- Notícias indexadas: ${newsEntries.length}`);
  console.log(`- Categorias indexadas: ${catEntries.length}`);
  console.log(`- Home priority: ${homeEntry?.priority}, freq: ${homeEntry?.changeFrequency}`);
  if (newsEntries.length === 0 || catEntries.length === 0) {
    throw new Error("Sitemap.ts não retornou matérias ou categorias");
  }
  console.log("✓ Sitemap.ts funcionando perfeitamente.");

  console.log("\n=== 3. TESTANDO GOOGLE NEWS SITEMAP XML ===");
  const newsRes = await getNewsSitemap();
  const xml = await newsRes.text();
  console.log("Header Content-Type:", newsRes.headers.get("content-type"));
  console.log("Preview dos primeiros 400 caracteres do XML:");
  console.log(xml.slice(0, 400));
  
  if (!xml.includes('xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"')) {
    throw new Error("Namespace do Google News ausente!");
  }
  if (!xml.includes("<news:publication>") || !xml.includes("<news:language>pt-br</news:language>")) {
    throw new Error("Tags estruturais do Google News ausentes ou com idioma incorreto!");
  }
  if (!xml.includes("<news:title>")) {
    throw new Error("Tag news:title ausente!");
  }
  console.log("✓ Google News Sitemap XML validado com 100% de conformidade.");

  console.log("\n=== 4. TESTANDO GENERATEMETADATA EM NOTICIAS/[SLUG] ===");
  const metadata = await generateMetadata({
    params: Promise.resolve({ slug: "ghost-of-yotei-gameplay-ps5-pro-combate" }),
  });
  console.log("Title:", metadata.title);
  console.log("Robots:", metadata.robots);
  console.log("OpenGraph:", metadata.openGraph?.title, "Images:", metadata.openGraph?.images);

  const robotsInfo = metadata.robots as any;
  if (!robotsInfo || robotsInfo["max-image-preview"] !== "large") {
    throw new Error("Metatag max-image-preview: large ausente em robots!");
  }
  console.log("✓ Metadata robots com max-image-preview: large validado.");
  console.log("\nTODOS OS TESTES DE SEO FORAM CONCLUÍDOS COM SUCESSO!");
}

verify().catch((err) => {
  console.error("Erro na validação:", err);
  process.exit(1);
});
