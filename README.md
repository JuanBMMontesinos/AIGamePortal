# Made By AI Games 🎮🤖

Portal moderno de notícias gamer gerenciado por agentes de IA com curadoria, sumarização em 30 segundos (TL;DR), análise de repercussão pública e conformidade E-E-A-T.

---

## 🌐 Comunidade & Redes Sociais Oficiais

- **X (Twitter)**: [@MadeByAiGames](https://x.com/MadeByAiGames) — Breaking news e cobertura em tempo real.
- **Discord**: [Comunidade VIP & Jogos Grátis](https://discord.gg/C6tYRUBPd) — Alertas de ofertas 100% free e bate-papo.
- **YouTube**: [@madebyaigames](https://www.youtube.com/@madebyaigames) — Vídeos, trailers e análises sintetizadas.
- **Telegram Bot**: [@MadeByAiGamesBot](https://t.me/MadeByAiGamesBot) — Notificações urgentes no smartphone.
- **Instagram**: [@madebyaigames](https://www.instagram.com/madebyaigames/) — Reels e destaques visuais.

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
- `/admin/metricas` (`app/admin/metricas/page.tsx`): **Painel de Métricas B2B & Patrocínio**, visualização de KPIs comerciais (Página 5 do plano), CAC de IA, distribuição por plataforma e gerador de Pitch Deck para marcas.
- `/admin/afiliados` (`app/admin/afiliados/page.tsx`): **Painel de Afiliados**, gestão de produtos parceiros e métricas de cliques.
- `/admin/newsletter` (`app/admin/newsletter/page.tsx`): **Painel da Newsletter**, controle de ativação/pausa de envios, diagnóstico Resend e gestão de inscritos.
- `/admin/discord` (`app/admin/discord/page.tsx`): **Painel do Discord**, controle de ativação/pausa de envios (jogos grátis e breaking news), diagnóstico de webhooks e histórico de alertas.
- `/admin/redes` (`app/admin/redes/page.tsx`): **Painel de Redes Sociais**, controle de disparo para X/Twitter e Telegram com status de faturamento e testes manuais.
- `/admin/logs` (`app/admin/logs/page.tsx`): **Central de Logs & Auditoria de IA**, telemetria de agentes, triagem de tarefas não concluídas pela IA (`task_completed = false`), análise de causas-raiz e expurgo de retenção.
- `/api/metrics/summary` (`app/api/metrics/summary/route.ts`): **Rota de Telemetria Interna Protegida** (Fase 7), acesso restrito a administradores (HMAC/Cookie/x-admin-key), rate limiting contra DoS e dados confidenciais consolidados.
- `/api/metrics/public` (`app/api/metrics/public/route.ts`): **Endpoint de Métricas Públicas Sanitizadas** (Fase 7), com cache no Edge/CDN para contadores gerais (posts e plataformas).
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

1. **Leitura Multi-Tier de 15 Feeds RSS/Atom**:
   - **Tier 1 (Oficiais & Lojas)**: PlayStation Blog, Xbox Wire, Nintendo Everything, Nintendo Life, Steam News (Valve) e Games Press.
   - **Tier 2 (Jornalismo Internacional)**: VGC, Eurogamer, Gematsu, PC Gamer, Rock Paper Shotgun, Destructoid e GamesIndustry.biz.
   - **Tier 3 (Comunidades Moderadas)**: r/Games e r/GamingLeaksAndRumours (com resolução de links externos e marcação obrigatória de rumor).
   *(Nota: Veículos de mídia brasileira foram expressamente desconsiderados por critérios de confiabilidade).*
2. **Pipeline de Imagens Resiliente (7 Etapas)**: Extração com suporte a Media RSS (`media:content`, `media:thumbnail`), OpenGraph fallback, descarte de arquivos de áudio de podcasts (`.mp3`), filtragem de CDNs com Cloudflare anti-hotlink e fallbacks temáticos em alta resolução por plataforma.
3. **Deduplicação Semântica com pgvector**: Embeddings `gemini-embedding-001` / `text-embedding-004` (768d) e RPC `match_recent_articles` (similaridade >= 0.82 em 48h).
4. **Redação & SEO (Gemini 1.5 Flash)**: Temperatura 0.2, tom gamer-nativo, TL;DR, tabela de especificações, diretriz anti-alucinação rígida e schema JSON estruturado.
5. **Enriquecimento Estruturado via APIs (`lib/services/game-enricher.ts`)**: Validação de estúdio desenvolvedor, publicadora, datas de lançamento e notas consolidadas do Metacritic/OpenCritic via RAWG Video Games Database e OpenCritic.
6. **Persistência no Supabase**: Gravação na tabela `posts` com status `published` e auto-associação com Game Hubs.
7. **Revalidação ISR On-Demand**: Chamada imediata ao endpoint `/api/revalidate`.

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
- **Painel Administrativo (`/admin/newsletter`)**: Chave mestre de envio para habilitar ou desabilitar disparos (inicia desabilitado por segurança até liberação do Resend).
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

## 🤖 Bot de Alertas de Jogos Grátis & Breaking News no Discord (Fase 4)

Automação comunitária proprietária baseada em **Discord Webhooks Serverless**:

- **Rastreador de Jogos Grátis (`scripts/discord-bot.ts`)**: Consome a GamerPower API a cada 2 horas via GitHub Actions (`.github/workflows/cron-discord-deals.yml`) e posta Rich Embeds com capa HD, plataformas, preço original riscado (`De ~~$XX~~ por GRÁTIS!`), data limite e botões interativos de resgate na Epic Games Store, Steam, GOG e Prime.
- **Deduplicação Inteligente**: Armazena as promoções já postadas em `public.free_games_history` (com fallback local em `scratch/free_games_history.json`).
- **Plantão Breaking News (Impacto 5/5)**: Disparo instantâneo integrado ao pipeline jornalístico para revelações globais, trailers mundiais ou anúncios de novos consoles.

```bash
# Simulação local do bot de ofertas (sem disparar mensagens reais)
npx tsx scripts/discord-bot.ts --dry-run

# Disparo real das novas ofertas via CLI
npm run deals:discord
```

---

## 🗄️ Banco de Dados e Migrações

Consulte a pasta [supabase/](file:///d:/IAProjects/AIGamePortal/supabase):
- [20260912000001_initial_schema.sql](file:///d:/IAProjects/AIGamePortal/supabase/migrations/20260912000001_initial_schema.sql): Migração mestre idempotente com pgvector HNSW, RLS e RPC `match_recent_articles`.
- [20260914000002_affiliate_system.sql](file:///d:/IAProjects/AIGamePortal/supabase/migrations/20260914000002_affiliate_system.sql): Sistema de produtos afiliados, cliques e monetização.
- [20260916000001_newsletter_subscribers.sql](file:///d:/IAProjects/AIGamePortal/supabase/migrations/20260916000001_newsletter_subscribers.sql): Tabela `newsletter_subscribers` com RLS e índices.
- [20260916000002_game_hubs.sql](file:///d:/IAProjects/AIGamePortal/supabase/migrations/20260916000002_game_hubs.sql): Tabela `game_hubs`, relacionamento com `posts.game_hub_id`, índices e seeds de GTA VI, Elden Ring e Monster Hunter Wilds.
- [20260916000003_newsletter_settings.sql](file:///d:/IAProjects/AIGamePortal/supabase/migrations/20260916000003_newsletter_settings.sql): Tabela de controle e habilitação de envio da newsletter.
- [20260916000004_free_games_history.sql](file:///d:/IAProjects/AIGamePortal/supabase/migrations/20260916000004_free_games_history.sql): Tabela `free_games_history` para prevenção de alertas duplicados no Discord.
- [20260916000005_discord_settings.sql](file:///d:/IAProjects/AIGamePortal/supabase/migrations/20260916000005_discord_settings.sql): Tabela `discord_settings` com chaves mestras e padrão desabilitado de segurança.
- [20260920000001_social_settings.sql](file:///d:/IAProjects/AIGamePortal/supabase/migrations/20260920000001_social_settings.sql): Tabela `social_settings` com controle de disparo para o X (Twitter) e Telegram com padrão desabilitado de segurança.
- [20260920000002_multi_tier_sources.sql](file:///d:/IAProjects/AIGamePortal/supabase/migrations/20260920000002_multi_tier_sources.sql): Inserção e atualização idempotente (`UPSERT`) das 15 fontes homologadas Multi-Tier e categorias padrão.
- [20260923000001_ai_system_logs.sql](file:///d:/IAProjects/AIGamePortal/supabase/migrations/20260923000001_ai_system_logs.sql): Tabela centralizada `ai_system_logs`, índices parciais para tarefas incompletas, RLS restrito a `service_role` e RPC `purge_old_system_logs`.
- [seed.sql](file:///d:/IAProjects/AIGamePortal/supabase/seed.sql): Categorias e feeds RSS iniciais.

## 📊 Métricas B2B, Edge Caching & MediaTech (Fase 4)

Para transformar o portal em uma **MediaTech atrativa para marcas e patrocinadores B2B** (fabricantes de periféricos, estúdios indie e servidores de jogos) e sustentar picos de mais de **100.000 visualizações com zero custo de servidor**:

- **Edge Caching Otimizado (Cloudflare/Vercel)**: Cabeçalhos HTTP `Cache-Control: public, s-maxage=1800, stale-while-revalidate=86400` em matérias e categorias, servindo 98%+ do tráfego diretamente da borda RAM da CDN com latência < 30ms.
- **Formatos Modernos de Imagem**: Ativação nativa de `image/avif` e `image/webp` com 24h de TTL e autorização estrita de domínios oficiais de games.
- **Painel Executivo B2B (`/admin/metricas`)**:
  - Acesso protegido por chave secreta (`?key=...`) ou cookie de sessão seguro (`admin_session`).
  - **KPIs Comerciais**: Volume de notícias (24h e 7d), distribuição por plataforma (PlayStation, Xbox, PC Gaming, Nintendo), cliques de afiliados e GMV estimado.
  - **CAC de Conteúdo**: Prova de margem operacional de 99.9% (IA Gemini Flash a R$ 0,0015/artigo vs R$ 45,00 de redator freelancer).
  - **Gerador de Pitch Deck de Mídia**: Modal executivo com resumo comercial pronto para envio a marcas, cópia em Markdown, download JSON e impressão A4/PDF.
- **Rota de Telemetria Interna (`/api/metrics/summary`)**: Acesso estritamente restrito a administradores (cookie assinado HMAC / `x-admin-key`), proteção com rate limiting duplo contra DoS de cache-buster e endpoint público sanitizado (`/api/metrics/public`).

---

## 📚 Documentação Técnica Completa
Consulte a pasta [docs/](file:///d:/IAProjects/AIGamePortal/docs):
- [docs/security/hardening-phase8-logging.md](file:///d:/IAProjects/AIGamePortal/docs/security/hardening-phase8-logging.md): Hardening de Segurança (Fase 8) — Telemetria Segura, Mitigação de Log Injection (CWE-117), Sanitização Universal de Segredos (CWE-532) e RLS.
- [docs/admin-logs.md](file:///d:/IAProjects/AIGamePortal/docs/admin-logs.md): Manual Operacional da Central de Logs & Auditoria de IA (/admin/logs), Triagem de Erros e Dicionário de 28 Códigos.
- [docs/security/hardening-phase7.md](file:///d:/IAProjects/AIGamePortal/docs/security/hardening-phase7.md): Hardening Final da Telemetria B2B, Autenticação de Métricas e Mitigação de DoS.
- [docs/index.md](file:///d:/IAProjects/AIGamePortal/docs/index.md): Sumário executivo e guia geral do projeto.
- [docs/b2b-metrics-and-sponsorship.md](file:///d:/IAProjects/AIGamePortal/docs/b2b-metrics-and-sponsorship.md): Guia de Métricas B2B, Metodologia de CAC e Pacotes de Patrocínio.
- [docs/cloudflare-edge-caching.md](file:///d:/IAProjects/AIGamePortal/docs/cloudflare-edge-caching.md): Guia passo a passo de Edge Caching na Cloudflare (Cache Rules, Tiered Cache e Zero Trust).
- [docs/admin-redes.md](file:///d:/IAProjects/AIGamePortal/docs/admin-redes.md): Guia operacional do Painel Administrativo de Redes Sociais (/admin/redes) para controle do X e Telegram.
- [docs/social-automation.md](file:///d:/IAProjects/AIGamePortal/docs/social-automation.md): Guia completo da automação multi-canal de redes sociais.
- [docs/admin-discord.md](file:///d:/IAProjects/AIGamePortal/docs/admin-discord.md): Guia operacional do Painel Administrativo do Discord (/admin/discord).
- [docs/discord-bot.md](file:///d:/IAProjects/AIGamePortal/docs/discord-bot.md): Guia completo do Bot de Alertas de Jogos Grátis e Breaking News para o Discord.
- [docs/admin-newsletter.md](file:///d:/IAProjects/AIGamePortal/docs/admin-newsletter.md): Guia operacional do Painel Administrativo da Newsletter.
- [docs/game-hubs.md](file:///d:/IAProjects/AIGamePortal/docs/game-hubs.md): Arquitetura dos Hubs de Jogos Permanentes, SEO de Cauda Longa e Schema.org VideoGame.
- [docs/NEWSLETTER_AUTOMATION.md](file:///d:/IAProjects/AIGamePortal/docs/NEWSLETTER_AUTOMATION.md): Guia completo da Newsletter Semanal Gamer, Resend e GitHub Actions.
- [docs/architecture.md](file:///d:/IAProjects/AIGamePortal/docs/architecture.md): Arquitetura, Edge Caching, pipeline de imagens resiliente (7 etapas) e SSG + ISR.
- [docs/api-reference.md](file:///d:/IAProjects/AIGamePortal/docs/api-reference.md): Referência completa de APIs, funções utilitárias e pipeline autônomo.
- [docs/components.md](file:///d:/IAProjects/AIGamePortal/docs/components.md): Catálogo de componentes UI e guardas defensivas.
- [docs/database.md](file:///d:/IAProjects/AIGamePortal/docs/database.md): Modelagem relacional, índices HNSW e RPCs do pgvector.
- [docs/environment-variables.md](file:///d:/IAProjects/AIGamePortal/docs/environment-variables.md): Variáveis de ambiente e GitHub Secrets.
- [docs/security/hardening-phase1.md](file:///d:/IAProjects/AIGamePortal/docs/security/hardening-phase1.md): Hardening de Segurança (Fase 1) — Cabeçalhos HTTP (HSTS, CSP, Permissions-Policy), mitigação de Timing Attacks e sanitização Markdown.
- [docs/ai-context.md](file:///d:/IAProjects/AIGamePortal/docs/ai-context.md): Diretrizes para agentes de IA e conformidade E-E-A-T.
- [docs/gemini-redator-prompt.md](file:///d:/IAProjects/AIGamePortal/docs/gemini-redator-prompt.md): System Prompt oficial do Agente Redator Gemini.


