# AIGamePortal 🎮🤖

Portal moderno de notícias gamer gerenciado por agentes de IA com curadoria, sumarização em 30 segundos (TL;DR), análise de repercussão pública e conformidade E-E-A-T.

---

## ⚡ Stack Tecnológica

- **Framework**: [Next.js 15+](https://nextjs.org/) (App Router, React 19, TypeScript estrito)
- **Estilização**: [Tailwind CSS](https://tailwindcss.com/) com paleta gamer escura profunda e acentos em roxo neon (`#8b5cf6`) e ciano (`#06b6d4`)
- **Tema**: [next-themes](https://github.com/pacocoursey/next-themes) (Dark Mode gamer padrão com alternância fluida)
- **Ícones**: [Lucide React](https://lucide.dev/)
- **Datas**: [date-fns](https://date-fns.org/) com formatação amigável em português (`pt-BR`)
- **Banco de Dados**: [Supabase](https://supabase.com/) (PostgreSQL 15+ com extensões `vector` HNSW e RLS)
- **Automação & IA**: TypeScript Autônomo + GitHub Actions (Cron 15min) + Google Gemini (`text-embedding-004` & `gemini-1.5-flash`)

---

## 🚀 Como Executar o Projeto Localmente

### 1. Instalação das Dependências

Certifique-se de ter o Node.js v18+ (recomendado v20+) instalado:

```bash
npm install
```

### 2. Configuração das Variáveis de Ambiente

Copie o arquivo `.env.example` para `.env.local`:

```bash
cp .env.example .env.local
```

Preencha com suas credenciais do Supabase (opcional para testes locais — a aplicação conta com dados demonstrativos de alta fidelidade integrados):

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-publica
REVALIDATION_SECRET=aigameportal_super_secret_token_2026
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. Executando o Servidor de Desenvolvimento

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no seu navegador para visualizar o portal.

### 4. Build de Produção

Para validar a compilação estática (SSG) e verificar a performance:

```bash
npm run build
npm run start
```

---

## 🏛️ Estrutura de Rotas e Páginas

- `/` (`app/page.tsx`): **Homepage** com seção Hero em destaque, Grid de Últimas Notícias com badges de categoria e TL;DR rápido, além de Sidebar com ranking de Mais Lidas e radar de sentimento da comunidade.
- `/noticias/[slug]` (`app/noticias/[slug]/page.tsx`): **Página da Matéria** com cabeçalho editorial, Box TL;DR (30s), Ficha Técnica do jogo com nota Metacritic colorida, conteúdo em prosa rica, box de sentimento Reddit/X, Atribuição E-E-A-T com link canônico e metatags JSON-LD `NewsArticle`.
- `/categoria/[slug]` (`app/categoria/[slug]/page.tsx`): **Feed por Categoria** (PlayStation, Xbox, Nintendo, PC Gaming, Hardware, Indústria, Geral).
- `/transparencia-editorial` (`app/transparencia-editorial/page.tsx`): **Transparência e Governança de IA**, detalhando o pipeline, política anti-alucinação, deduplicação vetorial e contato de retificação.
- `/api/revalidate` (`app/api/revalidate/route.ts`): **Endpoint de Revalidação Incremental sob Demanda (ISR)** acionado via webhook do n8n para atualizar o cache instantaneamente após a gravação no Supabase.

---

## 🤖 Automação de Ingestão de Notícias Gamer (Cron)

O portal utiliza um pipeline TypeScript autônomo executado a cada 15 minutos via **GitHub Actions** (`.github/workflows/cron-sync-news.yml`):

1. **Leitura de 5 Feeds RSS**: PlayStation Blog, Xbox Wire, Nintendo Life, PC Gamer e IGN Games.
2. **Extração Limpa**: Extração de texto higienizado e imagens sem scripts ou anúncios.
3. **Deduplicação Semântica com pgvector**: Embeddings `text-embedding-004` e RPC `match_recent_articles` (similaridade >= 0.82 em 48h).
4. **Redação & SEO (Gemini 1.5 Flash)**: Temperatura 0.2, tom gamer-nativo, TL;DR, tabela de especificações, diretriz anti-alucinação rígida e schema JSON estruturado.
5. **Persistência no Supabase**: Gravação na tabela `posts` com status `published`.
6. **Revalidação ISR On-Demand**: Chamada imediata ao endpoint `/api/revalidate`.

### Como rodar a sincronização manualmente:

```bash
npm run sync:news
```

---

## 🔄 Revalidação Sob Demanda (ISR Endpoint)

Quando uma nova notícia for inserida no Supabase, o pipeline dispara automaticamente a revalidação imediata:

```http
POST /api/revalidate?secret=aigameportal_super_secret_token_2026&slug=diablo-5-anuncio-blizzcon-2026
```

Parâmetros suportados:
- `secret`: Chave de autenticação (`REVALIDATE_SECRET` ou `REVALIDATION_SECRET`)
- `slug`: Slug da notícia a ser atualizada (revalida a página da notícia e a homepage automaticamente)
- `path`: Caminho arbitrário a ser revalidado (ex: `/categoria/playstation`)

---

## 🗄️ Banco de Dados e Migrações

Consulte a pasta [supabase/](file:///d:/IAProjects/AIGamePortal/supabase):
- [20260912000001_initial_schema.sql](file:///d:/IAProjects/AIGamePortal/supabase/migrations/20260912000001_initial_schema.sql): Migração mestre idempotente com pgvector HNSW, RLS e RPC `match_recent_articles`.
- [seed.sql](file:///d:/IAProjects/AIGamePortal/supabase/seed.sql): Categorias e feeds RSS iniciais.

## 📚 Documentação Técnica

- [Documentação de Banco de Dados](file:///d:/IAProjects/AIGamePortal/docs/database.md)
- [Contexto de Arquitetura e IA](file:///d:/IAProjects/AIGamePortal/docs/ai-context.md)
