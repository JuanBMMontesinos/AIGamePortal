# SEO Técnico, Dados Estruturados & Sitemaps — AIGamePortal

Este documento detalha a arquitetura técnica de SEO, dados estruturados Schema.org, metatags para o **Google Discover** e feeds de sitemap para o **Google News** implementados no **AIGamePortal** (Next.js 15 App Router).

---

## 1. Visão Geral da Estratégia de Indexação Sub-1h

Para portais de notícias de alta frequência, o tempo entre a publicação do conteúdo e sua indexação pelo Google Notícias e Google Discover precisa ser inferior a 1 hora (idealmente sub-15 minutos).

O ecossistema do AIGamePortal utiliza 4 pilares técnicos para garantir esse objetivo:

1. **Revalidação Instantânea ISR (On-demand)**: A rota pública é compilada estaticamente no instante em que a matéria é gravada no banco pelo webhook `/api/revalidate`.
2. **Sitemap Padrão (`/sitemap.xml`)**: Índice abrangente de todas as páginas estáticas, categorias e matérias históricas com frequência de alteração e prioridade.
3. **Google News Sitemap Exclusivo (`/news-sitemap.xml`)**: Feed XML com janela temporal estrita de **48 horas**, atendendo às diretrizes do Google Notícias.
4. **Metadados Discover & Schema.org Rich Results**: Metatag `max-image-preview: large`, imagens de capa com largura mínima de 1200px e dados estruturados em JSON-LD (`NewsArticle` e `BreadcrumbList`).

```mermaid
graph TD
    A[Agente n8n / Ingestão RSS] -->|Gera Matéria no Supabase| B[(PostgreSQL 15)]
    A -->|Dispara Webhook| C[POST /api/revalidate]
    C -->|Revalida ISR| D[Página /noticias/slug]
    
    E[Googlebot-News] -->|Lê a cada 5-15 min| F[/news-sitemap.xml - Janela 48h]
    F -->|Descobre URLs Recentes| D
    
    G[Google Discover Crawler] -->|Inspeciona HTML| D
    D -->|Valida max-image-preview: large| H[Cards Grandes no Discover]
    D -->|Valida Schema.org NewsArticle & Breadcrumbs| I[Rich Results & Google News Carousel]
```

---

## 2. Dados Estruturados Schema.org (JSON-LD)

Em [app/noticias/[slug]/page.tsx](file:///d:/IAProjects/AIGamePortal/app/noticias/[slug]/page.tsx), os dados estruturados são injetados diretamente no HTML via tag `<script type="application/ld+json">` utilizando a notação `@graph` para combinar múltiplos esquemas semânticos em um único nó otimizado.

### 2.1 Schema `NewsArticle`

Atende às exigências de Rich Results do Google para matérias jornalísticas e carrosséis de manchetes:

| Propriedade Schema | Tipo | Origem no AIGamePortal | Regra de Validação / SEO |
| :--- | :---: | :--- | :--- |
| `@type` | `string` | `"NewsArticle"` | Identifica conteúdo noticioso de primeira mão. |
| `headline` | `string` | `post.title` | **Limitado defensivamente a 110 caracteres** (requisito estrito do Google Rich Results). |
| `description` | `string` | `post.excerpt` ou junção do `tldr` | Resumo conciso da matéria para snippets. |
| `image` | `string[]` | `post.cover_image_url` (ou fallback) | **URL absoluta em alta resolução (>= 1200px)** para elegibilidade no Google Discover. |
| `datePublished` | `string` | `post.published_at` | Data de publicação original em formato **ISO 8601 UTC** (`YYYY-MM-DDTHH:mm:ss.sssZ`). |
| `dateModified` | `string` | `post.updated_at` | Data da última atualização em formato **ISO 8601 UTC**. |
| `mainEntityOfPage` | `WebPage` | `{ "@type": "WebPage", "@id": canonicalUrl }` | URL canônica absoluta da página do artigo. |
| `author` | `Organization` | `Redação AIGamePortal` | Aponta para `/transparencia-editorial` atestando autoria institucional auditada. |
| `publisher` | `Organization` | `AIGamePortal` | Logotipo oficial retangular de alta resolução (`/logo.png`, 600x60px). |

#### Exemplo de JSON-LD `NewsArticle`:
```json
{
  "@type": "NewsArticle",
  "headline": "Ghost of Yōtei: Novo gameplay revela sistema de combate com duas espadas e mundo aberto no PS5 Pro",
  "description": "Sucker Punch exibe 18 minutos de combate visceral de Ghost of Yōtei no PS5 Pro.",
  "image": [
    "https://aigameportal.com/images/covers/ghost-of-yotei.jpg"
  ],
  "datePublished": "2026-09-12T11:30:00.000Z",
  "dateModified": "2026-09-12T11:30:00.000Z",
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://aigameportal.com/noticias/ghost-of-yotei-gameplay-ps5-pro-combate"
  },
  "author": {
    "@type": "Organization",
    "name": "Redação AIGamePortal",
    "url": "https://aigameportal.com/transparencia-editorial"
  },
  "publisher": {
    "@type": "Organization",
    "name": "AIGamePortal",
    "url": "https://aigameportal.com",
    "logo": {
      "@type": "ImageObject",
      "url": "https://aigameportal.com/logo.png",
      "width": 600,
      "height": 60
    }
  }
}
```

---

### 2.2 Schema `BreadcrumbList`

Gera a trilha de navegação estruturada reconhecida pela SERP do Google:

```json
{
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Início",
      "item": "https://aigameportal.com"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "PlayStation",
      "item": "https://aigameportal.com/categoria/playstation"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "Ghost of Yōtei: Novo gameplay revela...",
      "item": "https://aigameportal.com/noticias/ghost-of-yotei-gameplay-ps5-pro-combate"
    }
  ]
}
```

---

## 3. Diretivas OpenGraph, Twitter Cards & Google Discover

No arquivo [app/noticias/[slug]/page.tsx](file:///d:/IAProjects/AIGamePortal/app/noticias/[slug]/page.tsx), a função `generateMetadata` define as instruções essenciais para o rastreador de cards do Discover:

```typescript
robots: {
  index: true,
  follow: true,
  "max-image-preview": "large", // OBRIGATÓRIO para Google Discover cards em tela cheia
  "max-snippet": -1,
  "max-video-preview": -1,
  googleBot: {
    index: true,
    follow: true,
    "max-image-preview": "large",
    "max-snippet": -1,
    "max-video-preview": -1,
  },
}
```

### Por que `max-image-preview: large` é indispensável?
Sem esta instrução no cabeçalho `<meta name="robots">`, o Google Discover renderiza apenas thumbnails pequenas ou descarta o artigo de feeds dinâmicos do aplicativo Google no Android/iOS. Com `large`, o card ocupa a largura total da tela do smartphone, aumentando o CTR em mais de 300%.

---

## 4. Sitemaps da Aplicação

O portal expõe dois sitemaps complementares configurados no [app/robots.ts](file:///d:/IAProjects/AIGamePortal/app/robots.ts):

### 4.1 Sitemap Padrão ([app/sitemap.ts](file:///d:/IAProjects/AIGamePortal/app/sitemap.ts))
- **URL pública**: `https://aigameportal.com/sitemap.xml`
- **Revalidação**: Cache a cada 1 hora (`revalidate = 3600`).
- **Conteúdo indexado**:
  - `https://aigameportal.com/` (`priority: 1.0`, `changeFrequency: 'always'`)
  - `https://aigameportal.com/categoria/{slug}` (`priority: 0.8`, `changeFrequency: 'hourly'`)
  - `https://aigameportal.com/transparencia-editorial` (`priority: 0.5`, `changeFrequency: 'monthly'`)
  - Todas as matérias ativas no banco (`priority: 0.9`, `changeFrequency: 'daily'`)

---

### 4.2 Google News Sitemap Exclusivo ([app/news-sitemap.xml/route.ts](file:///d:/IAProjects/AIGamePortal/app/news-sitemap.xml/route.ts))
- **URL pública**: `https://aigameportal.com/news-sitemap.xml`
- **Tipo de Resposta**: `application/xml; charset=utf-8` com `dynamic = "force-dynamic"` e `revalidate = 300`.
- **Janela Temporal**: Apenas matérias com `published_at >= now - 48 horas` (artigos com mais de 2 dias são automaticamente omitidos, em conformidade com as regras estritas do Google Notícias).
- **Namespaces XML**:
  - `xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"`
  - `xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"`
- **Tags Obrigatórias**:
  - `<news:news>`
  - `<news:publication>` com `<news:name>AIGamePortal</news:name>` e `<news:language>pt-br</news:language>`
  - `<news:publication_date>` no formato ISO 8601
  - `<news:title>` com sanitização estrita de caracteres especiais (`&`, `<`, `>`, `"`, `'`)

#### Exemplo de Saída XML do Google News Sitemap:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
  <url>
    <loc>https://aigameportal.com/noticias/ghost-of-yotei-gameplay-ps5-pro-combate</loc>
    <news:news>
      <news:publication>
        <news:name>AIGamePortal</news:name>
        <news:language>pt-br</news:language>
      </news:publication>
      <news:publication_date>2026-09-12T11:30:00.000Z</news:publication_date>
      <news:title>Ghost of Yōtei: Novo gameplay revela sistema de combate com duas espadas e mundo aberto dinâmico no PS5 Pro</news:title>
    </news:news>
  </url>
</urlset>
```

---

## 5. Rastreamento e Robots.txt ([app/robots.ts](file:///d:/IAProjects/AIGamePortal/app/robots.ts))

O arquivo `robots.ts` organiza os agentes de rastreamento:

```typescript
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://aigameportal.com").replace(/\/+$/, "");

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/"],
      },
    ],
    sitemap: [
      `${siteUrl}/sitemap.xml`,
      `${siteUrl}/news-sitemap.xml`,
    ],
  };
}
```

---

## 6. Checklist de Homologação para a Redação e Agentes de IA

Antes de publicar ou alterar a rotina de notícias, valide os seguintes pontos:
1. **Dimensões da Imagem**: A imagem de capa possui pelo menos **1200px de largura** e proporção aproximada de 16:9?
2. **Headline do Artigo**: O título da matéria não ultrapassa 110 caracteres no Schema.org?
3. **Data e Fuso Horário**: O campo `published_at` está no formato UTC ISO 8601 com sufixo `Z`?
4. **Google Rich Results Test**: Validar a URL do artigo no [Teste de Resultados Prontos do Google](https://search.google.com/test/rich-results) para garantir 0 erros em `NewsArticle` e `BreadcrumbList`.
