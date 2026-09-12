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
| **[environment-variables.md](file:///d:/IAProjects/AIGamePortal/docs/environment-variables.md)** | Dicionário de variáveis de ambiente, escopos (público vs servidor), segredos e boas práticas de segurança. | DevOps & Engenheiros |
| **[database.md](file:///d:/IAProjects/AIGamePortal/docs/database.md)** | Modelagem relacional, dicionário de dados, extensões (`vector`), índices HNSW, RLS e RPCs. | DBAs & Backend |
| **[ai-context.md](file:///d:/IAProjects/AIGamePortal/docs/ai-context.md)** | Guia canônico para agentes de IA: regras de negócio, pipeline n8n + Gemini, diretrizes E-E-A-T e política anti-alucinação. | Agentes de IA & Engenheiros |
| **[gemini-redator-prompt.md](file:///d:/IAProjects/AIGamePortal/docs/gemini-redator-prompt.md)** | Especificação do Agente Redator & Otimizador SEO: System Prompt definitivo, Few-Shot, JSON Schema e parâmetros Gemini 1.5. | Engenheiros de IA & Redação |

---

## 🎯 Visão Executiva do Projeto

O **AIGamePortal** resolve o gargalo de tempo na produção de notícias sobre jogos eletrônicos através de uma abordagem híbrida:
1. **Curadoria em Tempo Real**: Monitora feeds RSS de fontes oficiais de primeira mão (PlayStation Blog, Xbox Wire, Nintendo Life, PC Gamer, Eurogamer).
2. **Deduplicação Semântica Vetorial**: Evita publicar notícias repetidas sobre o mesmo fato utilizando embeddings densos (Google Gemini `text-embedding-004`, 768 dimensões) com distância de cosseno no PostgreSQL (`pgvector` com índice HNSW).
3. **Resumos em 30 Segundos (TL;DR)**: Extrai 3 a 4 bullet points essenciais para leitura rápida.
4. **Metadados Estruturados de Jogos**: Salva plataformas, nota Metacritic, estúdio desenvolvedor e data de lançamento em formato JSONB tipado.
5. **Transparência E-E-A-T**: Atribui autoria ao modelo de IA e exibe link canônico direto e transparente para a matéria original.
6. **Entrega Ultra-Rápida (Core Web Vitals 95+)**: Páginas pré-renderizadas estaticamente no build (SSG) com revalidação sob demanda (ISR) disparada via webhook pelo n8n imediatamente após a gravação no banco.

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
│ Embeddings de IA              │ Google Gemini text-embedding  │
│ Orquestração de Crawlers      │ n8n Workflow Automation       │
└───────────────────────────────┴───────────────────────────────┘
```

---

## 📂 Árvore Estrutural do Repositório

```plaintext
d:/IAProjects/AIGamePortal/
├── app/                                # Next.js App Router (Páginas, layouts e APIs)
│   ├── api/
│   │   └── revalidate/
│   │       └── route.ts                # Endpoint ISR sob demanda (GET/POST)
│   ├── categoria/
│   │   └── [slug]/
│   │       └── page.tsx                # Feed dinâmico por categoria/plataforma
│   ├── noticias/
│   │   └── [slug]/
│   │       └── page.tsx                # Página completa do artigo
│   ├── transparencia-editorial/
│   │   └── page.tsx                    # Manifesto de transparência e IA
│   ├── globals.css                     # Variáveis de tema e tipografia rica
│   ├── layout.tsx                      # RootLayout (Header, Footer, ThemeProvider)
│   ├── loading.tsx                     # Skeleton screens de transição
│   ├── not-found.tsx                   # Página 404 personalizada gamer
│   └── page.tsx                        # Homepage (Hero, Grid e Sidebar)
├── components/                         # Componentes de interface modulares
│   ├── community-sentiment-box.tsx     # Card de repercussão Reddit/X
│   ├── eeat-attribution-box.tsx        # Box de transparência e link da fonte
│   ├── footer.tsx                      # Rodapé institucional
│   ├── game-metadata-card.tsx          # Ficha técnica do jogo (Metacritic, specs)
│   ├── header.tsx                      # Header fixo com navegação e tema
│   ├── hero-featured.tsx               # Banner principal de destaque
│   ├── markdown-content.tsx            # Renderizador leve de markdown semântico
│   ├── news-card.tsx                   # Card de matéria no feed com TL;DR
│   ├── share-buttons.tsx               # Botões de compartilhamento social
│   ├── sidebar.tsx                     # Mais lidas, pulso de sentimento e fontes
│   ├── theme-provider.tsx              # Wrapper next-themes
│   ├── theme-toggle.tsx                # Botão alternador Claro/Escuro
│   └── tldr-box.tsx                    # Resumo em 30 segundos (3-4 bullets)
├── docs/                               # Suíte de Documentação Técnica
│   ├── ai-context.md                   # Diretrizes canônicas para agentes de IA
│   ├── api-reference.md                # Referência de funções e utilitários
│   ├── architecture.md                 # Arquitetura e ciclo de vida
│   ├── components.md                   # Documentação detalhada dos componentes
│   ├── database.md                     # Modelagem relacional e índices
│   ├── environment-variables.md        # Dicionário de variáveis de ambiente
│   ├── index.md                        # Este documento
│   └── routes-and-isr.md               # Rotas, SSG e webhook de revalidação
├── lib/                                # Utilitários e camada de dados
│   ├── data/
│   │   ├── api.ts                      # Funções de busca com fallback gracioso
│   │   └── mock-news.ts                # Dados mockados enriquecidos para preview
│   ├── supabase/
│   │   ├── client.ts                   # Cliente browser Supabase
│   │   └── server.ts                   # Cliente Server Components Supabase
│   └── utils.ts                        # Utilitários de classes, datas e Metacritic
├── supabase/                           # Infraestrutura como código Supabase
│   ├── migrations/
│   │   └── 20260912000001_initial_schema.sql # Schema mestre com pgvector e RLS
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
