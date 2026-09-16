# Documentação Técnica — AIGamePortal

Bem-vindo à documentação técnica oficial e canônica do **AIGamePortal**, um portal moderno de jornalismo de videogame de alta performance construído com **Next.js 15 (App Router)**, **React 19**, **Tailwind CSS**, **TypeScript** e **Supabase (PostgreSQL 15+ com pgvector)**, gerenciado por pipelines autônomos de IA.

---

## 🧭 Guia de Navegação da Documentação

Esta documentação foi estruturada para servir tanto a engenheiros humanos de software quanto a agentes autônomos de IA que precisem auditar, estender ou refatorar qualquer módulo da aplicação.

| Documento | Descrição | Público Principal |
| :--- | :--- | :--- |
| **[index.md](file:///d:/IAProjects/AIGamePortal/docs/index.md)** | Sumário executivo, visão geral do sistema e índice de leitura. | Todos |
| **[architecture.md](file:///d:/IAProjects/AIGamePortal/docs/architecture.md)** | Arquitetura geral, estratégia SSG + ISR, ciclo de vida de requisição e diagramas de fluxo. | Engenheiros & Arquitetos |
| **[api-reference.md](file:///d:/IAProjects/AIGamePortal/docs/api-reference.md)** | Referência exaustiva de todas as funções, módulos (`lib/data/api.ts`, `lib/utils.ts`, `lib/supabase/*`), parâmetros e retornos. | Desenvolvedores & LLMs |
| **[components.md](file:///d:/IAProjects/AIGamePortal/docs/components.md)** | Catálogo e documentação de todos os componentes de UI, tipagem de props e design tokens. | Frontend Engineers |
| **[routes-and-isr.md](file:///d:/IAProjects/AIGamePortal/docs/routes-and-isr.md)** | Mapeamento de rotas do App Router, pré-renderização estática (`generateStaticParams`) e contrato do webhook `/api/revalidate`. | Fullstack & Automações n8n |
| **[seo-and-indexing.md](file:///d:/IAProjects/AIGamePortal/docs/seo-and-indexing.md)** | Infraestrutura técnica de SEO, Schema.org (JSON-LD NewsArticle & Breadcrumbs), Google Discover e Google News Sitemap (48h). | Especialistas de SEO, Engenheiros & IA |
| **[environment-variables.md](file:///d:/IAProjects/AIGamePortal/docs/environment-variables.md)** | Dicionário de variáveis de ambiente, escopos (público vs servidor), segredos e boas práticas de segurança. | DevOps & Engenheiros |
| **[database.md](file:///d:/IAProjects/AIGamePortal/docs/database.md)** | Modelagem relacional, dicionário de dados, extensões (`vector`), índices HNSW, RLS e RPCs. | DBAs & Backend |
| **[ai-context.md](file:///d:/IAProjects/AIGamePortal/docs/ai-context.md)** | Guia canônico para agentes de IA: regras de negócio, pipeline n8n + Gemini, diretrizes E-E-A-T e política anti-alucinação. | Agentes de IA & Engenheiros |
| **[gemini-redator-prompt.md](file:///d:/IAProjects/AIGamePortal/docs/gemini-redator-prompt.md)** | Especificação do Agente Redator & Otimizador SEO: System Prompt definitivo, Few-Shot, JSON Schema e parâmetros Gemini 1.5. | Engenheiros de IA & Redação |
| **[social-automation.md](file:///d:/IAProjects/AIGamePortal/docs/social-automation.md)** | Módulo de Distribuição Multi-canal: Telegram Bot API, X/Twitter API v2, copywriter gamer e resiliência non-blocking. | Social Media & Engenheiros |
| **[affiliate-system.md](file:///d:/IAProjects/AIGamePortal/docs/affiliate-system.md)** | Módulo de Afiliados Inteligentes (Fase 3): Modelagem, conformidade E-E-A-T (rel="sponsored nofollow"), tracking /api/out/[id] e AffiliateDealCard. | Monetização, Engenheiros & E-commerce |
| **[discord-bot.md](file:///d:/IAProjects/AIGamePortal/docs/discord-bot.md)** | Bot de Alertas de Jogos Grátis & Breaking News no Discord (Fase 4): Webhook serverless, GamerPower API, Rich Embeds e cron. | Comunidade, DevOps & IA |

---

## 🎯 Visão Executiva do Projeto

O **AIGamePortal** resolve o gargalo de tempo na produção de notícias sobre jogos eletrônicos através de uma abordagem híbrida:
1. **Curadoria em Tempo Real**: Monitora feeds RSS de fontes oficiais de primeira mão (PlayStation Blog, Xbox Wire, Nintendo Life, PC Gamer, IGN Games).
2. **Pipeline de Imagens Resiliente (7 Etapas)**: Extração robusta com suporte a Media RSS (`media:content`, `media:thumbnail`), OpenGraph fallback, descarte de arquivos de áudio de podcasts (`.mp3`), filtragem de CDNs com Cloudflare anti-hotlink e fallbacks temáticos em alta resolução por plataforma.
3. **Deduplicação Semântica Vetorial**: Evita publicar notícias repetidas sobre o mesmo fato utilizando embeddings densos (Google Gemini `gemini-embedding-001` / `text-embedding-004`, 768 dimensões) com distância de cosseno no PostgreSQL (`pgvector` com índice HNSW).
4. **Resumos em 30 Segundos (TL;DR)**: Extrai 3 a 4 bullet points essenciais para leitura rápida.
5. **Metadados Estruturados de Jogos**: Salva plataformas, nota Metacritic, estúdio desenvolvedor e data de lançamento em formato JSONB tipado.
6. **Transparência E-E-A-T**: Atribui autoria ao modelo de IA e exibe link canônico direto e transparente para a matéria original.
7. **Entrega Ultra-Rápida (Core Web Vitals 95+)**: Páginas pré-renderizadas estaticamente no build (SSG) com revalidação sob demanda (ISR) disparada instantaneamente após a gravação no banco.
8. **Monetização Híbrida de Alto Desempenho (Fase 3)**:
   - **Blocos de Anúncios Responsivos (`AdBanner`)**: Suporte a Google AdSense e mídia programática nos formatos `in-article-top` (728x90/300x250), `in-article-mid` (300x250 após o 3º parágrafo via `content-parser.tsx`) e `sidebar-sticky` (300x600 skyscraper) com altura reservada e isolamento contra **Cumulative Layout Shift (CLS = 0)**.
   - **Fallback Inteligente**: Ativação automática de banners promocionais internos ("Destaques Gamer" da Amazon e convite ao canal VIP do Telegram) em caso de AdBlock ou ausência do AdSense.
   - **Afiliados Inteligentes & E-E-A-T**: Injeção contextual com `rel="sponsored nofollow"`, card de recomendação (`AffiliateDealCard`) e redirecionador com telemetria (`/api/out/[id]`).
9. **Engajamento Proprietário & Discord Automation (Fase 4)**:
   - **Rastreador de Jogos Grátis**: Bot serverless agendado a cada 2 horas via GitHub Actions que consome a GamerPower API e notifica promoções 100% gratuitas da Epic Games Store, Steam, GOG e Prime com Rich Embeds e botões de resgate direto.
   - **Plantão Breaking News (Impacto 5/5)**: Alertas imediatos no Discord para acontecimentos de repercussão global (novos consoles, trailers mundiais e terremotos da indústria) sem sobrecarga de sockets 24/7.

---

## 🛠️ Stack Tecnológica Consolidada

```plaintext
┌───────────────────────────────────────────────────────────────┐
│                      AIGamePortal Stack                       │
├───────────────────────────────┬───────────────────────────────┤
│ Frontend Web Framework        │ Next.js 15.2+ (App Router)    │
│ Interface Library             │ React 19                      │
│ Linguagem                     │ TypeScript 5.7+ (Strict Mode) │
│ Estilização e Design System   │ Tailwind CSS 3.4+             │
│ Gerenciador de Tema           │ next-themes (Dark Mode gamer) │
│ Biblioteca de Ícones          │ Lucide React                  │
│ Manipulação de Datas          │ date-fns 4.1+ (pt-BR)         │
│ Camada de Banco de Dados      │ Supabase Client 2.49+         │
│ Banco Relacional & Vetorial   │ PostgreSQL 15+ com pgvector   │
│ Embeddings de IA              │ Gemini gemini-embedding-001   │
│ Redação & SEO                 │ Gemini 1.5 Flash (Temp 0.2)   │
│ Ingestão Autônoma & Cron      │ TypeScript + GitHub Actions   │
└───────────────────────────────┴───────────────────────────────┘
```

---

## 📂 Árvore Estrutural do Repositório

```plaintext
d:/IAProjects/AIGamePortal/
├── app/                                # Next.js App Router (Páginas, layouts e APIs)
│   ├── api/
│   │   ├── admin/
│   │   │   ├── affiliates/route.ts     # CRUD de produtos e KPIs de afiliados
│   │   │   └── auth/route.ts           # Autenticação administrativa com cookie HttpOnly
│   │   ├── out/
│   │   │   ├── [id]/route.ts           # Tracking e redirecionamento de afiliados (HTTP 307)
│   │   │   └── search/route.ts         # Fallback de busca inteligente na Amazon Brasil
│   │   └── revalidate/
│   │       └── route.ts                # Endpoint ISR sob demanda (GET/POST)
│   ├── admin/
│   │   └── afiliados/                  # Painel de controle restrito de afiliados
│   │       ├── admin-view.tsx          # Dashboard interativo com métricas e toggles
│   │       ├── login-form.tsx          # Formulário de login com chave mestra
│   │       └── page.tsx                # Server Component protegido contra crawlers
│   ├── categoria/
│   │   └── [slug]/
│   │       └── page.tsx                # Feed dinâmico por categoria/plataforma
│   ├── news-sitemap.xml/
│   │   └── route.ts                    # Google News Sitemap exclusivo (janela 48h)
│   ├── noticias/
│   │   └── [slug]/
│   │       └── page.tsx                # Página completa do artigo + JSON-LD
│   ├── transparencia-editorial/
│   │   └── page.tsx                    # Manifesto de transparência e IA
│   ├── globals.css                     # Variáveis de tema e tipografia rica
│   ├── layout.tsx                      # RootLayout (Header, Footer, ThemeProvider)
│   ├── loading.tsx                     # Skeleton screens de transição
│   ├── not-found.tsx                   # Página 404 personalizada gamer
│   ├── page.tsx                        # Homepage (Hero, Grid e Sidebar)
│   ├── robots.ts                       # Diretivas crawler com apontamento de sitemaps
│   └── sitemap.ts                      # Sitemap padrão completo do portal
├── components/                         # Componentes de interface modulares
│   ├── AffiliateDealCard.tsx           # Card gamer de oferta recomendada
│   ├── community-sentiment-box.tsx     # Card de repercussão Reddit/X
│   ├── eeat-attribution-box.tsx        # Box de transparência e link da fonte
│   ├── footer.tsx                      # Rodapé institucional
│   ├── game-metadata-card.tsx          # Ficha técnica do jogo (Metacritic, specs)
│   ├── header.tsx                      # Header fixo com navegação e tema
│   ├── hero-featured.tsx               # Banner principal de destaque
│   ├── markdown-content.tsx            # Renderizador de markdown com injeção de afiliados
│   ├── news-card.tsx                   # Card de matéria no feed com TL;DR
│   ├── share-buttons.tsx               # Botões de compartilhamento social
│   ├── sidebar.tsx                     # Mais lidas, pulso de sentimento e fontes
│   ├── theme-provider.tsx              # Wrapper next-themes
│   ├── theme-toggle.tsx                # Botão alternador Claro/Escuro
│   └── tldr-box.tsx                    # Resumo em 30 segundos (3-4 bullets)
├── docs/                               # Suíte de Documentação Técnica
│   ├── affiliate-system.md             # Módulo de Afiliados, automações 100% e /admin/afiliados
│   ├── ai-context.md                   # Diretrizes canônicas para agentes de IA
│   ├── api-reference.md                # Referência de funções e utilitários
│   ├── architecture.md                 # Arquitetura e ciclo de vida
│   ├── components.md                   # Documentação detalhada dos componentes
│   ├── database.md                     # Modelagem relacional e índices
│   ├── environment-variables.md        # Dicionário de variáveis de ambiente
│   ├── gemini-redator-prompt.md        # Especificação do Agente Redator & Otimizador SEO
│   ├── index.md                        # Este documento
│   ├── routes-and-isr.md               # Rotas, SSG e webhook de revalidação
│   ├── seo-and-indexing.md             # SEO Técnico, Schema.org e Google News/Discover
│   └── social-automation.md            # Módulo de Distribuição Multi-canal
├── public/                             # Ativos estáticos públicos
│   ├── logo.png                        # Logotipo retangular oficial (600x60)
│   └── og-image.png                    # Fallback OpenGraph em alta resolução (1200x630)
├── lib/                                # Utilitários e camada de dados
│   ├── data/
│   │   ├── affiliates.ts               # Camada de dados e consultas de afiliados
│   │   ├── api.ts                      # Funções de busca com fallback gracioso
│   │   └── mock-news.ts                # Dados mockados enriquecidos para preview
│   ├── services/
│   │   ├── affiliate-matcher.ts        # Injetor contextual E-E-A-T de links
│   │   └── social-publisher.ts         # Publicador multi-canal (Telegram, X)
│   ├── supabase/
│   │   ├── client.ts                   # Cliente browser Supabase
│   │   └── server.ts                   # Cliente Server Components Supabase
│   └── utils.ts                        # Utilitários de classes, datas e Metacritic
├── scripts/                            # Automações autônomas
│   ├── sync-affiliates.ts              # Auditoria de links e integridade de afiliados
│   └── sync-news.ts                    # Pipeline de ingestão, IA e auto-cadastro
├── supabase/                           # Infraestrutura como código Supabase
│   ├── migrations/
│   │   ├── 20260912000001_initial_schema.sql  # Schema mestre com pgvector e RLS
│   │   └── 20260914000002_affiliate_system.sql # Tabelas affiliate_products e clicks
│   └── seed.sql                        # Categorias e fontes iniciais

├── types/
│   └── database.ts                     # Interfaces TypeScript estritas do banco
├── .env.example                        # Template de variáveis públicas
├── .env.local                          # Variáveis locais (ignorado no Git)
├── .gitignore                          # Regras de exclusão do repositório
├── next.config.ts                      # Configurações do Next.js
├── package.json                        # Dependências e scripts npm
├── postcss.config.mjs                  # Configuração do PostCSS
├── README.md                           # Guia rápido de início e instalação
├── tailwind.config.ts                  # Design system e paleta gamer Tailwind
└── tsconfig.json                       # Configurações do compilador TypeScript
```
