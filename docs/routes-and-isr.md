# Mapeamento de Rotas & Revalidação ISR — AIGamePortal

Este documento detalha o sistema de roteamento baseado no **Next.js App Router**, a pré-renderização estática via `generateStaticParams()` e o contrato do endpoint de revalidação incremental sob demanda (`/api/revalidate`).

---

## 1. Mapeamento de Rotas da Aplicação

| Rota HTTP | Arquivo no Projeto | Tipo de Renderização | Cache / Revalidação | Descrição |
| :--- | :--- | :---: | :---: | :--- |
| `GET /` | [app/page.tsx](file:///d:/IAProjects/AIGamePortal/app/page.tsx) | Estático (SSG + ISR) | `120s` ou via webhook | Homepage com Hero em destaque, Grid de Notícias e Sidebar lateral. |
| `GET /noticias/[slug]` | [app/noticias/[slug]/page.tsx](file:///d:/IAProjects/AIGamePortal/app/noticias/[slug]/page.tsx) | Estático (SSG + ISR) | `1800s` (30m Edge Cache) | Matéria completa com TL;DR, Ficha Técnica, Sentimento, E-E-A-T e JSON-LD. |
| `GET /categoria/[slug]` | [app/categoria/[slug]/page.tsx](file:///d:/IAProjects/AIGamePortal/app/categoria/[slug]/page.tsx) | Estático (SSG + ISR) | `1800s` (30m Edge Cache) | Feed de notícias filtrado pela plataforma/categoria. |
| `GET /jogos` | [app/jogos/page.tsx](file:///d:/IAProjects/AIGamePortal/app/jogos/page.tsx) | Estático (SSG + ISR) | `3600s` (1h) ou webhook | Diretório geral de Centrais de Jogos Permanentes (SEO Long-Tail). |
| `GET /jogos/[slug]` | [app/jogos/[slug]/page.tsx](file:///d:/IAProjects/AIGamePortal/app/jogos/[slug]/page.tsx) | Estático (SSG + ISR) | `1800s` (30m Edge Cache) | Central do jogo com Hero, Ficha Técnica, Linha do Tempo, Onde Comprar e Schema VideoGame. |
| `GET /admin/metricas` | [app/admin/metricas/page.tsx](file:///d:/IAProjects/AIGamePortal/app/admin/metricas/page.tsx) | Dinâmico Protegido | Privado (Sem Cache) | Painel Executivo B2B com KPIs de patrocínio, CAC de conteúdo e gerador de Pitch Deck. |
| `GET /api/metrics/summary` | [app/api/metrics/summary/route.ts](file:///d:/IAProjects/AIGamePortal/app/api/metrics/summary/route.ts) | Route Handler JSON | `300s` (5m Edge/Memória) | Endpoint leve de telemetria interna consolidando dados do Supabase. |
| `GET /transparencia-editorial`| [app/transparencia-editorial/page.tsx](file:///d:/IAProjects/AIGamePortal/app/transparencia-editorial/page.tsx) | Estático Puro | Permanente | Manifesto de IA, diretrizes anti-alucinação e lista de feeds oficiais. |
| `POST /api/revalidate` | [app/api/revalidate/route.ts](file:///d:/IAProjects/AIGamePortal/app/api/revalidate/route.ts) | Dynamic Route Handler | Não aplicável | Endpoint de revalidação instantânea sob demanda para automações n8n. |
| `GET /sitemap.xml` | [app/sitemap.ts](file:///d:/IAProjects/AIGamePortal/app/sitemap.ts) | Dynamic / ISR | `3600s` (1h) | Sitemap padrão com todas as URLs do portal, frequências e prioridades. |
| `GET /news-sitemap.xml` | [app/news-sitemap.xml/route.ts](file:///d:/IAProjects/AIGamePortal/app/news-sitemap.xml/route.ts) | Route Handler XML | `300s` (5m) | Google News Sitemap exclusivo contendo apenas notícias publicadas nas últimas 48h. |
| `GET /robots.txt` | [app/robots.ts](file:///d:/IAProjects/AIGamePortal/app/robots.ts) | Estático / Dynamic | Permanente | Instruções aos crawlers e declaração dos dois sitemaps do portal. |
| Rota Inexistente (404) | [app/not-found.tsx](file:///d:/IAProjects/AIGamePortal/app/not-found.tsx) | Estático Puro | Permanente | Página de erro 404 personalizada gamer. |

---

## 2. Pré-Renderização Estática com `generateStaticParams()`

As rotas dinâmicas utilizam a função nativa `generateStaticParams()` para gerar os arquivos HTML durante a execução do `npm run build`:

### 2.1 Em `app/noticias/[slug]/page.tsx`:
```typescript
export async function generateStaticParams() {
  const slugs = await getAllPostSlugs();
  return slugs.map((item) => ({
    slug: item.slug,
  }));
}
```
- **Comportamento em Build**: Todas as matérias presentes no banco (ou na base mock) são convertidas em arquivos `.html` estáticos e colocados na pasta `.next/server/app/noticias/`.
- **Novas Matérias após o Build**: Quando um usuário acessa um slug que ainda não existia durante o build, o Next.js renderiza a página sob demanda na primeira requisição e, em seguida, armazena em cache o HTML gerado para todas as requisições subsequentes.

### 2.2 Em `app/categoria/[slug]/page.tsx`:
```typescript
export async function generateStaticParams() {
  const slugs = await getAllCategorySlugs();
  return slugs.map((item) => ({
    slug: item.slug,
  }));
}
```
- Gera estaticamente as páginas para: `playstation`, `xbox`, `nintendo`, `pc-gaming`, `hardware`, `industria` e `geral`.

---

## 3. Contrato da API de Revalidação (`/api/revalidate`)

O Route Handler [app/api/revalidate/route.ts](file:///d:/IAProjects/AIGamePortal/app/api/revalidate/route.ts) aceita requisições `POST` ou `GET` autenticadas por segredo.

### 3.1 Métodos de Autenticação Suportados

Para evitar o vazamento de segredos em logs de acesso HTTP, proxies intermediários e histórico de navegadores, recomenda-se autenticar prioritariamente via **cabeçalhos HTTP**:

| Método | Cabeçalho / Parâmetro | Formato | Recomendação |
| :--- | :--- | :--- | :--- |
| **Cabeçalho Dedicado** | `x-revalidate-secret` | `<token>` | **Recomendado** (seguro, não expõe em URLs) |
| **Bearer Token** | `Authorization` | `Bearer <token>` | **Recomendado** (padrão RFC 6750) |
| **Query String** | `secret` | `?secret=<token>` | Legado (mantido para compatibilidade retroativa) |

> [!TIP]
> A comparação do segredo no servidor é executada via `safeConstantTimeCompare()`, mitigando ataques de temporização (*timing attacks*).

### 3.2 Parâmetros Suportados (Query String)

| Parâmetro | Tipo | Obrigatório | Descrição | Exemplo |
| :--- | :---: | :---: | :--- | :--- |
| `slug` | `string` | Opcional | Slug da notícia recém-adicionada. Revalida `/noticias/{slug}` e a Homepage `/`. | `ghost-of-yotei-gameplay-ps5-pro-combate` |
| `path` | `string` | Opcional | Caminho arbitrário que deve ter seu cache expurgado. | `/categoria/playstation` |
| `tag` | `string` | Opcional | Tag de cache para revalidação atômica via `revalidateTag()`. | `news-feed` |
| `secret` | `string` | Apenas se sem cabeçalho | Token de segurança (necessário caso `x-revalidate-secret` ou `Authorization` não sejam enviados). | `aigameportal_super_secret_token_2026` |

---

### 3.3 Exemplos de Chamada

#### Exemplo A: Revalidação via Cabeçalho `x-revalidate-secret` (Recomendado)
```bash
curl -X POST "http://localhost:3000/api/revalidate?slug=ghost-of-yotei-gameplay-ps5-pro-combate" \
  -H "x-revalidate-secret: aigameportal_super_secret_token_2026"
```

#### Exemplo B: Revalidação via Cabeçalho `Authorization: Bearer`
```bash
curl -X POST "http://localhost:3000/api/revalidate?path=/" \
  -H "Authorization: Bearer aigameportal_super_secret_token_2026"
```

#### Exemplo C: Revalidação Legada via Query Param (n8n retrocompatível)
```bash
curl -X POST "http://localhost:3000/api/revalidate?secret=aigameportal_super_secret_token_2026&slug=ghost-of-yotei-gameplay-ps5-pro-combate"
```

---

### 3.4 Respostas da API

#### Sucesso (200 OK)
```json
{
  "revalidated": true,
  "paths": [
    "/noticias/ghost-of-yotei-gameplay-ps5-pro-combate",
    "/"
  ],
  "tag": null,
  "timestamp": "2026-09-12T17:16:05.080Z",
  "message": "Cache ISR atualizado com sucesso."
}
```

#### Erro de Autenticação (401 Unauthorized)
```json
{
  "revalidated": false,
  "message": "Token secreto de revalidação inválido ou ausente."
}
```

#### Erro Interno (500 Internal Server Error)
```json
{
  "revalidated": false,
  "message": "Erro interno durante a revalidação de cache.",
  "error": "Descrição detalhada da falha"
}
```

---

## 4. Integração no Pipeline do n8n

No workflow do n8n, após o nó **Supabase: Insert Post**, adicione um nó do tipo **HTTP Request**:

```plaintext
[ Supabase: Insert Post ]
           │
           ▼
[ HTTP Request: Revalidate Cache ]
  ├── Method: POST
  ├── URL: =https://seu-dominio.com/api/revalidate?slug={{ $json.slug }}
  ├── Headers:
  │     └── x-revalidate-secret: aigameportal_super_secret_token_2026
  └── Options:
        └── Retry on Fail: 3 vezes
```
Isso garante que, no mesmo segundo em que a inteligência artificial finaliza a gravação da notícia no PostgreSQL, a página pública é regenerada e colocada no ar para todos os usuários.
