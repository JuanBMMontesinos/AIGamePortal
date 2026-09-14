# Referência de APIs e Funções — AIGamePortal

Este documento é a referência completa de todas as funções, módulos utilitários, clientes de banco e contratos TypeScript do **AIGamePortal**.

---

## 1. Módulo `lib/data/api.ts`

Camada central de consulta de dados. Possui tratamento integrado de erros e fallback transparente para `lib/data/mock-news.ts` quando o Supabase não está configurado ou não contém registros.

---

### `getCategories()`
Retorna a lista de todas as categorias ativas no portal.

- **Assinatura**:
  ```typescript
  export async function getCategories(): Promise<Category[]>
  ```
- **Parâmetros**: Nenhum.
- **Retorno**:
  - `Promise<Category[]>`: Array de objetos `Category` ordenados alfabeticamente por `name`.
- **Comportamento**:
  - Se `isSupabaseConfigured === true`, executa `supabase.from('categories').select('*').order('name', { ascending: true })`.
  - Se a consulta falhar ou retornar vazia, retorna `MOCK_CATEGORIES`.

---

### `getCategoryBySlug(slug)`
Busca uma categoria específica pelo seu identificador amigável (slug).

- **Assinatura**:
  ```typescript
  export async function getCategoryBySlug(slug: string): Promise<Category | null>
  ```
- **Parâmetros**:
  - `slug` (`string`): Slug da categoria (ex: `'playstation'`, `'pc-gaming'`).
- **Retorno**:
  - `Category`: Objeto da categoria encontrada.
  - `null`: Caso o slug não exista.

---

### `getLatestPosts(limit)`
Obtém as notícias mais recentes publicadas no portal, incluindo os relacionamentos com `categories` e `sources`.

- **Assinatura**:
  ```typescript
  export async function getLatestPosts(limit: number = 12): Promise<Post[]>
  ```
- **Parâmetros**:
  - `limit` (`number`, opcional, padrão: `12`): Quantidade máxima de registros retornados.
- **Retorno**:
  - `Promise<Post[]>`: Array de posts ordenados por `published_at DESC`.
- **Query Supabase**:
  ```sql
  SELECT *, categories (*), sources (*)
  FROM posts
  WHERE status = 'published'
  ORDER BY published_at DESC
  LIMIT :limit;
  ```

---

### `getTrendingPosts(limit)`
Obtém as notícias mais populares do portal com base no volume de visualizações (`views_count`).

- **Assinatura**:
  ```typescript
  export async function getTrendingPosts(limit: number = 5): Promise<Post[]>
  ```
- **Parâmetros**:
  - `limit` (`number`, opcional, padrão: `5`): Quantidade máxima de itens no ranking.
- **Retorno**:
  - `Promise<Post[]>`: Array de posts ordenados por `views_count DESC`.

---

### `getPostBySlug(slug)`
Busca uma notícia completa pelo slug, incluindo o conteúdo em Markdown rico, TL;DR, metadados de jogo e sentimentos.

- **Assinatura**:
  ```typescript
  export async function getPostBySlug(slug: string): Promise<Post | null>
  ```
- **Parâmetros**:
  - `slug` (`string`): Slug único da matéria (ex: `'ghost-of-yotei-gameplay-ps5-pro-combate'`).
- **Retorno**:
  - `Post`: Objeto completo com dados estruturados e relacionamentos.
  - `null`: Caso a matéria não exista ou seu status não seja `'published'`.

---

### `getPostsByCategory(categorySlug, limit)`
Filtra as matérias publicadas de uma determinada categoria/plataforma.

- **Assinatura**:
  ```typescript
  export async function getPostsByCategory(
    categorySlug: string,
    limit: number = 20
  ): Promise<{ category: Category | null; posts: Post[] }>
  ```
- **Parâmetros**:
  - `categorySlug` (`string`): Slug da categoria a filtrar.
  - `limit` (`number`, opcional, padrão: `20`): Limite de matérias retornadas.
- **Retorno**:
  - Objeto contendo:
    - `category`: Metadados da categoria correspondente.
    - `posts`: Array de posts pertencentes a essa categoria.

---

### `getAllPostSlugs()`
Gera a lista de slugs de todas as notícias publicadas para alimentação do `generateStaticParams()` do Next.js.

- **Assinatura**:
  ```typescript
  export async function getAllPostSlugs(): Promise<{ slug: string }[]>
  ```
- **Retorno**:
  - `Promise<{ slug: string }[]>`: Array de objetos `{ slug: string }`.

---

### `getAllCategorySlugs()`
Gera a lista de slugs de todas as categorias cadastradas para o `generateStaticParams()` de categorias.

- **Assinatura**:
  ```typescript
  export async function getAllCategorySlugs(): Promise<{ slug: string }[]>
  ```
- **Retorno**:
  - `Promise<{ slug: string }[]>`: Array de objetos `{ slug: string }`.

---

## 2. Módulo `lib/utils.ts`

Funções puras e utilitários auxiliares de formatação e cálculo.

---

### `cn(...inputs)`
Combina condicionalmente classes CSS utilizando `clsx` e mescla regras conflitantes do Tailwind com `tailwind-merge`.

- **Assinatura**:
  ```typescript
  export function cn(...inputs: ClassValue[]): string
  ```

---

### `formatDate(dateString)`
Converte uma string ISO-8601 em data formatada legível em português brasileiro.

- **Assinatura**:
  ```typescript
  export function formatDate(dateString: string): string
  ```
- **Exemplo**:
  - Entrada: `'2026-09-12T11:30:00Z'`
  - Saída: `'12 de setembro de 2026'`

---

### `formatRelativeTime(dateString)`
Calcula o tempo decorrido desde a publicação com sufixo relativo amigável.

- **Assinatura**:
  ```typescript
  export function formatRelativeTime(dateString: string): string
  ```
- **Exemplo**:
  - Saída: `'há 2 horas'`, `'há 3 dias'`.

---

### `calculateReadingTime(text)`
Calcula a estimativa de tempo de leitura em minutos considerando uma velocidade média de 200 palavras por minuto.

- **Assinatura**:
  ```typescript
  export function calculateReadingTime(text: string): number
  ```
- **Retorno**: Inteiro mínimo de `1`.

---

### `getMetacriticColor(score)`
Determina o conjunto de cores semânticas (fundo, texto, borda) para o badge de nota do Metacritic.

- **Assinatura**:
  ```typescript
  export function getMetacriticColor(score: number | null | undefined): {
    bg: string;
    text: string;
    border: string;
  }
  ```
- **Tabela de Escala**:
  | Faixa de Nota | Classificação | Cor | Classes Tailwind |
  | :--- | :--- | :--- | :--- |
  | $\ge 75$ | Aclamação Geral | Verde | `bg-emerald-500/10 text-emerald-400 border-emerald-500/40` |
  | $50 \text{ a } 74$ | Misto / Médio | Amarelo | `bg-amber-500/10 text-amber-400 border-amber-500/40` |
  | $< 50$ | Desfavorável | Vermelho | `bg-rose-500/10 text-rose-400 border-rose-500/40` |
  | `null`/`undefined` | Sem Nota Oficial | Cinza | `bg-zinc-800 text-zinc-400 border-zinc-700` |

---

### `isValidImageUrl(url)`
Valida se uma string é uma URL de imagem válida (HTTP/HTTPS) e segura para renderização no front-end, descartando arquivos de áudio/podcast (`.mp3`, `.wav`, `.m4a`) ou CDNs com bloqueio anti-hotlink via Cloudflare (`images.nintendolife.com`).

- **Assinatura**:
  ```typescript
  export function isValidImageUrl(url?: string | null): boolean
  ```
- **Retorno**: `boolean`.

---

## 3. Clientes Supabase

### `lib/supabase/client.ts` (Client-side)
Instância segura do Supabase Client para execução no navegador.
- `isSupabaseConfigured` (`boolean`): Avalia se `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` estão preenchidas e válidas.
- `supabase`: Instância tipada do cliente `@supabase/supabase-js`.

### `lib/supabase/server.ts` (Server-side)
Fábrica de clientes para Server Components e Route Handlers.
- `createServerClient()`: Cria uma instância com `auth.persistSession: false` para evitar poluição de sessão entre requisições concorrentes.

---

## 4. Tipagem TypeScript (`types/database.ts`)

```typescript
export interface GameMetadata {
  game_name?: string;
  platforms?: string[];
  metacritic_score?: number | null;
  release_date?: string | null;
  developer?: string | null;
  publisher?: string | null;
  genre?: string | null;
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  tldr: string[];
  content: string;
  excerpt: string | null;
  cover_image_url: string | null;
  cover_image_alt: string | null;
  category_id: string | null;
  source_id: string | null;
  source_original_url: string;
  source_original_title: string | null;
  game_metadata: GameMetadata;
  community_sentiment: string | null;
  embedding?: number[] | null;
  status: "draft" | "published" | "archived";
  views_count: number;
  published_at: string;
  created_at: string;
  updated_at: string;
  categories?: Category | null;
  sources?: Source | null;
}
```

---

## 5. Pipeline Autônomo de Ingestão (`scripts/sync-news.ts`)

Módulo autônomo executado via CLI (`npm run sync:news`) ou via GitHub Actions (`cron-sync-news.yml`).

### `runNewsSync()`
Função orquestradora principal. Executa o ciclo completo de leitura dos 5 feeds RSS oficiais, deduplicação em duas etapas, geração jornalística por IA, persistência relacional e disparo de revalidação ISR.

### `isValidImageUrl(url)`
Validador de integridade e segurança de imagens.
- **Assinatura**:
  ```typescript
  export function isValidImageUrl(url?: string | null): boolean
  ```
- **Regras**:
  - Rejeita URLs que não comecem com `http://` ou `https://`.
  - Rejeita arquivos de áudio/vídeo (`.mp3`, `.wav`, `.ogg`, `.m4a`, `.mp4`, etc.).
  - Rejeita CDNs com proteção Cloudflare Managed Challenge (como `images.nintendolife.com`).
- **Retorno**: `boolean` (`true` se a imagem puder ser carregada com segurança).

### `scrapeArticle(item, feedConfig)`
Extrai o texto higienizado e a capa da matéria através do pipeline defensivo de 7 etapas.
- **Assinatura**:
  ```typescript
  async function scrapeArticle(item: Parser.Item, feedConfig: FeedConfig): Promise<ScrapedContent>
  ```
- **Retorno**: Objeto `{ title, cleanText, imageUrl, canonicalUrl }`.

### `generateEmbedding(ai, text)`
Gera o vetor denso de 768 dimensões com chaveamento resiliente de modelos (`gemini-embedding-001`, `text-embedding-004`, `gemini-embedding-2`).
- **Assinatura**:
  ```typescript
  async function generateEmbedding(ai: GoogleGenAI, text: string): Promise<number[] | null>
  ```

### `rewriteArticleWithGemini(ai, scraped, feedName)`
Submete o texto original raspado ao **Gemini 1.5 Flash** (temperatura 0.2) sob o System Prompt jornalístico e schema estruturado JSON com política anti-alucinação.

### `triggerISRRevalidation(siteUrl, secret, slug)`
Dispara chamada HTTP ao endpoint `/api/revalidate` para invalidar instantaneamente o cache da notícia e da homepage.

---

## 6. Módulo de Distribuição Social (`lib/services/social-publisher.ts`)

Módulo responsável pelo envio automatizado de notícias para redes sociais com formatação e regras adaptadas por canal.

### `publishToSocialNetworks(payload)`
Orquestrador central de publicação multi-canal. Executa disparos em paralelo via `Promise.allSettled`, garantindo execução 100% não-bloqueante e tolerante a falhas.
- **Assinatura**:
  ```typescript
  export async function publishToSocialNetworks(
    payload: SocialArticlePayload
  ): Promise<SocialPublishResult>
  ```
- **Parâmetros**: `SocialArticlePayload` contendo `title`, `slug`, `url`, `tldr`, `category`, `coverImageUrl`, `isRumor`, `platforms`.
- **Retorno**: `Promise<SocialPublishResult>` com status de envio ou erro por rede social.

### `generateSocialCopy(payload)`
Gera as copies otimizadas para Telegram (HTML rica com botão inline) e X/Twitter (<= 280 caracteres).
- **Assinatura**:
  ```typescript
  export function generateSocialCopy(payload: SocialArticlePayload): SocialCopy
  ```
- **Regras**:
  - Ganchos gamer com emojis (`🎮`, `🚨 [RUMOR]`).
  - 2 bullet points condensados a partir do `tldr`.
  - Link canônico do artigo no portal.
  - 3 a 4 hashtags estratégicas por categoria e plataforma.

### `sendToTelegram(payload, copy)`
Envia publicação com capa (`sendPhoto`) ou texto (`sendMessage`) via Telegram Bot API com botão inline *"Ler Matéria Completa 🎮"*.

### `sendToTwitter(payload, copy)`
Envia tweet via `twitter-api-v2` utilizando OAuth 1.0a User Context, respeitando rigorosamente o limite de 280 caracteres.

---

## 7. Módulo de Afiliados e Monetização (`lib/data/affiliates.ts`)

Gerenciamento de produtos ativos, consulta com fallback mock offline e registro analítico de conversão.

### `getActiveAffiliateProducts()`
Obtém a lista de produtos afiliados ativos no banco de dados Supabase com fallback transparente para o catálogo mock.
- **Assinatura**:
  ```typescript
  export async function getActiveAffiliateProducts(): Promise<AffiliateProduct[]>
  ```
- **Retorno**: `Promise<AffiliateProduct[]>` contendo produtos habilitados ordenados por data de criação.

### `getAffiliateProductById(id)`
Busca um produto afiliado pelo seu identificador primário.
- **Assinatura**:
  ```typescript
  export async function getAffiliateProductById(id: string): Promise<AffiliateProduct | null>
  ```
- **Parâmetros**: `id` (`string`): UUID do produto ou identificador mock.
- **Retorno**: Objeto `AffiliateProduct` ou `null`.

### `recordAffiliateClick(payload)`
Registra assincronamente a ocorrência de clique para geração de relatórios de conversão e métricas de engajamento por matéria.
- **Assinatura**:
  ```typescript
  export async function recordAffiliateClick(payload: {
    productId: string;
    postId?: string | null;
    referrer?: string | null;
    userAgent?: string | null;
  }): Promise<{ success: boolean; id?: string }>
  ```

### `findBestAffiliateDeal(post, products)`
Algoritmo de pontuação e relevância que cruza título, conteúdo, plataformas (`game_metadata`) e categorias para identificar o produto gamer mais aderente à matéria.
- **Assinatura**:
  ```typescript
  export function findBestAffiliateDeal(
    post: Partial<Post>,
    products: AffiliateProduct[]
  ): AffiliateProduct | null
  ```

---

## 8. Injetor Inteligente de Links Contextuais (`lib/services/affiliate-matcher.ts`)

Analisa o texto Markdown original de uma notícia e insere hiperlinks contextuais seguros com conformidade Google E-E-A-T.

### `injectAffiliateLinks(content, products, options)`
- **Assinatura**:
  ```typescript
  export function injectAffiliateLinks(
    content: string,
    products: AffiliateProduct[],
    options?: AffiliateMatchOptions
  ): AffiliateMatchResult
  ```
- **Parâmetros**:
  - `content` (`string`): Texto Markdown da matéria.
  - `products` (`AffiliateProduct[]`): Lista de produtos cadastrados.
  - `options` (`AffiliateMatchOptions`): `{ maxLinks?: number; postId?: string | null }`. Padrão de `maxLinks` é `3`.
- **Regras Operacionais**:
  - Não injeta em títulos (`#`, `##`, `###`), blocos de código ou links pré-existentes.
  - Transforma apenas a 1ª ocorrência de cada produto.
  - Adiciona estritamente `rel="sponsored nofollow"` e `target="_blank"`.
  - Retorna `{ processedContent, matchedProducts, linksCount }`.

---

## 9. Rota de Redirecionamento & Tracking (`GET /api/out/[id]`)

Endpoint dinâmico Next.js para rastreamento de links patrocinados e encaminhamento transparente de leitores.

- **Método**: `GET`
- **URL**: `/api/out/[id]?postId=...&ref=...`
- **Fluxo de Processamento**:
  1. Extrai `id` do produto e metadados de requisição (`postId`, `Referer`, `User-Agent`).
  2. Valida se o produto existe e está com `is_active: true`.
  3. Caso inválido: Redireciona com HTTP 307 para a Home do portal (`/`).
  4. Caso válido:
     - Grava evento assíncrono em `affiliate_clicks`.
     - Retorna **HTTP 307 (Temporary Redirect)** para a `affiliate_url` com cabeçalhos anti-cache (`Cache-Control: no-store, no-cache, must-revalidate`).
