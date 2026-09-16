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
- `/jogos` (`app/jogos/page.tsx`): **Diretório de Hubs de Jogos**, vitrine com filtros, notas Metacritic e total de matérias publicadas por franquia.
- `/jogos/[slug]` (`app/jogos/[slug]/page.tsx`): **Central do Jogo Permanente (SEO Long-Tail)** com Hero widescreen, Ficha Técnica oficial, Linha do Tempo de matérias, box de Afiliados Onde Comprar e Schema.org `VideoGame`.
- `/noticias/[slug]` (`app/noticias/[slug]/page.tsx`): **Página da Matéria** com cabeçalho editorial, Box TL;DR (30s), Ficha Técnica do jogo com nota Metacritic colorida, conteúdo em prosa rica, box de sentimento Reddit/X, Atribuição E-E-A-T com link canônico e metatags JSON-LD `NewsArticle`.
- `/categoria/[slug]` (`app/categoria/[slug]/page.tsx`): **Feed por Categoria** (PlayStation, Xbox, Nintendo, PC Gaming, Hardware, Indústria, Geral).
- `/transparencia-editorial` (`app/transparencia-editorial/page.tsx`): **Transparência e Governança de IA**, detalhando o pipeline, política anti-alucinação, deduplicação vetorial e contato de retificação.
- `/api/revalidate` (`app/api/revalidate/route.ts`): **Endpoint de Revalidação Incremental sob Demanda (ISR)** acionado pelo pipeline autônomo para atualizar o cache instantaneamente após a gravação no Supabase.

---

## 🎮 Hubs de Jogos Permanentes & SEO de Cauda Longa (Fase 4)

Para capturar tráfego orgânico perene de jogadores buscando pelas suas franquias favoritas (ex: *GTA VI*, *Monster Hunter Wilds*, *Elden Ring*):

- **Auto-Clustering de Tópicos (`lib/services/hub-matcher.ts`)**: Analisa títulos e conteúdo contra listas de aliases de jogos cadastrados com suporte a word boundaries e normalização fonética.
- **Sugestão Inteligente com Gemini**: Se uma notícia abordar um lançamento de grande porte ainda sem Hub, o agente Gemini Flash sugere a ficha técnica estruturada e pode auto-criar a central no Supabase.
- **Schema.org VideoGame & BreadcrumbList**: Emissão de metadados ricos para indexação no Google com nota Metacritic, desenvolvedor, plataformas e janela de lançamento.
- **Monetização Onde Comprar**: Vitrine contextual de produtos afiliados (jogos base, DLCs, consoles) com tags oficiais de parceiros.

---

## 🤖 Automação de Ingestão de Notícias Gamer (Cron)

O portal utiliza um pipeline TypeScript autônomo executado a cada 15 minutos via **GitHub Actions** (`.github/workflows/cron-sync-news.yml`):

1. **Leitura de 5 Feeds RSS**: PlayStation Blog, Xbox Wire, Nintendo Life, PC Gamer e IGN Games.
2. **Pipeline de Imagens Resiliente (7 Etapas)**: Extração com suporte a Media RSS (`media:content`, `media:thumbnail`), OpenGraph fallback, descarte de arquivos de áudio de podcasts (`.mp3`), filtragem de CDNs com Cloudflare anti-hotlink e fallbacks temáticos em alta resolução por plataforma.
3. **Deduplicação Semântica com pgvector**: Embeddings `gemini-embedding-001` / `text-embedding-004` (768d) e RPC `match_recent_articles` (similaridade >= 0.82 em 48h).
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
- `path`: Caminho arbitrário a ser revalidado (ex: `/categoria/playstation` ou `/jogos/gta-6`)

---

## 📬 Newsletter Semanal Gamer (Fase 3 - Resend)

O portal compila automaticamente todo domingo às 10:00 BRT os **5 artigos mais lidos** da semana e as **melhores ofertas de afiliados**, disparando um e-mail responsivo moderno para os assinantes ativos via **Resend**:

- **Captura Gamer**: Componente `NewsletterBox.tsx` integrado na Home e nas barras laterais de leitura com validação em tempo real.
- **Workflow GitHub Actions**: `.github/workflows/cron-weekly-newsletter.yml` agendado para `cron: '0 13 * * 0'` (domingos às 13h UTC = 10h BRT).
- **Conformidade CAN-SPAM & LGPD**: Link de descadastro (unsubscribe) exclusivo no rodapé com reativação fácil em 1 clique em `/newsletter/unsubscribe`.

### Como rodar o disparo manualmente ou em teste:
```bash
# Simulação local com geração de prévia HTML em scratch/newsletter-preview.html (sem gastar créditos)
npm run newsletter:send -- --dry-run

# Teste direcionado para um e-mail específico
npm run newsletter:send -- --test-email=seu-email@dominio.com

# Disparo oficial para toda a base ativa
npm run newsletter:send
```

---

## 🗄️ Banco de Dados e Migrações

Consulte a pasta [supabase/](file:///d:/IAProjects/AIGamePortal/supabase):
- [20260912000001_initial_schema.sql](file:///d:/IAProjects/AIGamePortal/supabase/migrations/20260912000001_initial_schema.sql): Migração mestre idempotente com pgvector HNSW, RLS e RPC `match_recent_articles`.
- [20260914000002_affiliate_system.sql](file:///d:/IAProjects/AIGamePortal/supabase/migrations/20260914000002_affiliate_system.sql): Sistema de produtos afiliados, cliques e monetização.
- [20260916000001_newsletter_subscribers.sql](file:///d:/IAProjects/AIGamePortal/supabase/migrations/20260916000001_newsletter_subscribers.sql): Tabela `newsletter_subscribers` com RLS e índices.
- [20260916000002_game_hubs.sql](file:///d:/IAProjects/AIGamePortal/supabase/migrations/20260916000002_game_hubs.sql): Tabela `game_hubs`, relacionamento com `posts.game_hub_id`, índices e seeds de GTA VI, Elden Ring e Monster Hunter Wilds.
- [seed.sql](file:///d:/IAProjects/AIGamePortal/supabase/seed.sql): Categorias e feeds RSS iniciais.

## 📚 Documentação Técnica Completa
Consulte a pasta [docs/](file:///d:/IAProjects/AIGamePortal/docs):
- [docs/index.md](file:///d:/IAProjects/AIGamePortal/docs/index.md): Sumário executivo e guia geral do projeto.
- [docs/game-hubs.md](file:///d:/IAProjects/AIGamePortal/docs/game-hubs.md): Arquitetura dos Hubs de Jogos Permanentes, SEO de Cauda Longa e Schema.org VideoGame.
- [docs/NEWSLETTER_AUTOMATION.md](file:///d:/IAProjects/AIGamePortal/docs/NEWSLETTER_AUTOMATION.md): Guia completo da Newsletter Semanal Gamer, Resend e GitHub Actions.
- [docs/architecture.md](file:///d:/IAProjects/AIGamePortal/docs/architecture.md): Arquitetura, pipeline de imagens resiliente (7 etapas) e SSG + ISR.
- [docs/api-reference.md](file:///d:/IAProjects/AIGamePortal/docs/api-reference.md): Referência completa de APIs, funções utilitárias e pipeline autônomo.
- [docs/components.md](file:///d:/IAProjects/AIGamePortal/docs/components.md): Catálogo de componentes UI e guardas defensivas.
- [docs/database.md](file:///d:/IAProjects/AIGamePortal/docs/database.md): Modelagem relacional, índices HNSW e RPCs do pgvector.
- [docs/environment-variables.md](file:///d:/IAProjects/AIGamePortal/docs/environment-variables.md): Variáveis de ambiente e GitHub Secrets.
- [docs/routes-and-isr.md](file:///d:/IAProjects/AIGamePortal/docs/routes-and-isr.md): Mapeamento de rotas e contrato da API de revalidação.
- [docs/ai-context.md](file:///d:/IAProjects/AIGamePortal/docs/ai-context.md): Diretrizes para agentes de IA e conformidade E-E-A-T.
- [docs/gemini-redator-prompt.md](file:///d:/IAProjects/AIGamePortal/docs/gemini-redator-prompt.md): System Prompt oficial do Agente Redator Gemini.
