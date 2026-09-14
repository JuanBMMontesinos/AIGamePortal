# Variáveis de Ambiente — AIGamePortal

Este documento detalha todas as variáveis de ambiente necessárias para o funcionamento do **AIGamePortal**, seus escopos de segurança, valores de exemplo e recomendações operacionais para o portal Next.js e o pipeline de ingestão autônomo (TypeScript + GitHub Actions).

---

## 1. Dicionário de Variáveis

| Variável | Escopo | Obrigatória em Produção? | Descrição | Exemplo |
| :--- | :---: | :---: | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Público (Browser & Server) | Sim | URL raiz da API REST/GraphQL do seu projeto no Supabase. | `https://sfqleufmlacmuilanpni.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`| Público (Browser & Server) | Sim | Chave de API pública com permissões restritas controladas por Row Level Security (RLS). | `eyJhbGciOiJIUzI1NiIsIn...` |
| `SUPABASE_URL` | Privado (GitHub Actions / Script) | Sim | URL do Supabase para execução do script `sync:news`. | `https://sfqleufmlacmuilanpni.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | **Privado** (GitHub Actions / Script) | Sim | Chave de serviço com permissão administrativa para inserção de posts e fontes (ignora RLS). | `eyJhbGciOiJIUzI1NiIsIn...` |
| `GEMINI_API_KEY` | **Privado** (GitHub Actions / Script) | Sim | Chave de API do Google AI Studio para geração de embeddings (`text-embedding-004`) e redação (`gemini-1.5-flash`). | `AIzaSyD...` |
| `REVALIDATE_SECRET` | **Privado** (Servidor & GitHub Actions) | Sim | Token secreto utilizado pelo pipeline para autenticar requisições de revalidação instantânea ao `/api/revalidate`. | `aigameportal_super_secret_token_2026` |
| `NEXT_PUBLIC_SITE_URL` | Público (Browser & Server) | Sim | Domínio canônico do site, utilizado para resolução de metatags OpenGraph, Twitter Cards e chamadas de revalidação ISR. | `http://localhost:3000` ou `https://aigameportal.com` |
| `TELEGRAM_BOT_TOKEN` | **Privado** (Pipeline / Script) | Opcional (Fase 2) | Token de autenticação HTTP da Telegram Bot API gerado pelo @BotFather. | `123456789:ABCdefGhIJKlm...` |
| `TELEGRAM_CHAT_ID` | **Privado** (Pipeline / Script) | Opcional (Fase 2) | Identificador numérico ou username do canal/grupo do Telegram de destino. | `@aigameportal_noticias` ou `-1001234567890` |
| `TWITTER_API_KEY` | **Privado** (Pipeline / Script) | Opcional (Fase 2) | Consumer API Key gerada no Developer Portal do X (Twitter). | `eXamPleApiKey123...` |
| `TWITTER_API_SECRET` | **Privado** (Pipeline / Script) | Opcional (Fase 2) | Consumer API Secret Key correspondente no Developer Portal do X. | `eXamPleApiSecret456...` |
| `TWITTER_ACCESS_TOKEN` | **Privado** (Pipeline / Script) | Opcional (Fase 2) | User Access Token gerado com permissões de 'Read and Write' na API v2. | `12345678-eXamPleToken...` |
| `TWITTER_ACCESS_SECRET`| **Privado** (Pipeline / Script) | Opcional (Fase 2) | User Access Token Secret associado para assinatura OAuth 1.0a. | `eXamPleAccessSecret789...` |
| `NEXT_PUBLIC_AMAZON_AFFILIATE_TAG` | Público (Browser & Server) | Sim (Fase 3) | Tag oficial de parceiro associado da Amazon Brasil para links de afiliados e auto-cadastro. | `aigameportal-20` |
| `ADMIN_SECRET_KEY` | **Privado** (Servidor / Admin) | Sim (Fase 3) | Senha/chave mestra exigida para login no painel `/admin/afiliados` e endpoints administrativos. | `aigameportal_admin_2026` |

---

## 2. Detalhamento Técnico das Variáveis

### 2.1 `NEXT_PUBLIC_SUPABASE_URL` & `SUPABASE_URL`
- **Utilizada em**: [lib/supabase/client.ts](file:///d:/IAProjects/AIGamePortal/lib/supabase/client.ts), [lib/supabase/server.ts](file:///d:/IAProjects/AIGamePortal/lib/supabase/server.ts) e [scripts/sync-news.ts](file:///d:/IAProjects/AIGamePortal/scripts/sync-news.ts).
- **Validação no Código**: Se estiver vazia ou mantiver o valor de placeholder `https://your-project.supabase.co`, o frontend ativa automaticamente o modo de contingência, servindo dados mockados de alta fidelidade sem quebrar a aplicação.

---

### 2.2 `NEXT_PUBLIC_SUPABASE_ANON_KEY` & `SUPABASE_SERVICE_ROLE_KEY`
- **Regra Crítica de Segurança**:
  - No frontend, deve ser utilizada **estritamente a chave `anon`** (`NEXT_PUBLIC_SUPABASE_ANON_KEY`).
  - A chave `service_role` (`SUPABASE_SERVICE_ROLE_KEY`) **NUNCA** deve ser exposta com o prefixo `NEXT_PUBLIC_`, pois ela ignora completamente as políticas de RLS e concederia privilégios administrativos a qualquer usuário do navegador.
  - A chave `service_role` deve residir unicamente nos **Secrets do GitHub Actions** e no `.env.local` para execução do script `sync:news`.

---

### 2.3 `GEMINI_API_KEY`
- **Utilizada em**: [scripts/sync-news.ts](file:///d:/IAProjects/AIGamePortal/scripts/sync-news.ts).
- **Provedor**: Google AI Studio / Gemini API.
- **Funções**:
  - Deduplicação Semântica: Geração de vetores de 768 dimensões com o modelo `text-embedding-004`.
  - Redação e SEO: Inferência com `gemini-1.5-flash` sob temperatura 0.2 e retorno JSON estruturado.

---

### 2.4 `REVALIDATE_SECRET` (ou `REVALIDATION_SECRET`)
- **Utilizada em**: [app/api/revalidate/route.ts](file:///d:/IAProjects/AIGamePortal/app/api/revalidate/route.ts) e [scripts/sync-news.ts](file:///d:/IAProjects/AIGamePortal/scripts/sync-news.ts).
- **Segurança**: Nunca possui o prefixo `NEXT_PUBLIC_`, garantindo que não seja incluída no bundle JavaScript baixado pelo cliente.
- **Boas Práticas de Rotação**:
  - Recomenda-se gerar uma string aleatória com no mínimo 32 caracteres em ambientes produtivos e configurá-la simultaneamente nos Secrets do GitHub Actions.

---

### 2.5 `NEXT_PUBLIC_SITE_URL`
- **Utilizada em**: [app/layout.tsx](file:///d:/IAProjects/AIGamePortal/app/layout.tsx), [app/noticias/[slug]/page.tsx](file:///d:/IAProjects/AIGamePortal/app/noticias/[slug]/page.tsx) e [scripts/sync-news.ts](file:///d:/IAProjects/AIGamePortal/scripts/sync-news.ts).
- **Impacto em SEO e ISR**: Alimenta o campo `metadataBase` do Next.js, as metatags estruturadas `NewsArticle` do Schema.org e a URL de destino da revalidação instantânea do cache.

---

### 2.6 `TELEGRAM_BOT_TOKEN` & `TELEGRAM_CHAT_ID` (Fase 2)
- **Utilizadas em**: [lib/services/social-publisher.ts](file:///d:/IAProjects/AIGamePortal/lib/services/social-publisher.ts).
- **Finalidade**: Envio automatizado de posts com imagem de capa (`sendPhoto`), legenda em HTML formatada e botão inline interativo *"Ler Matéria Completa 🎮"* para canais ou grupos de games.
- **Como Obter**:
  1. No Telegram, converse com o [@BotFather](https://t.me/BotFather) e envie `/newbot` para obter o `TELEGRAM_BOT_TOKEN`.
  2. Adicione o bot como Administrador do seu canal ou grupo (com permissão de publicar mensagens).
  3. O `TELEGRAM_CHAT_ID` pode ser o username público do canal (ex: `@aigameportal_noticias`) ou o ID numérico obtido via `@userinfobot` / `@getidsbot` (ex: `-1001234567890`).

---

### 2.7 `TWITTER_API_KEY`, `TWITTER_API_SECRET`, `TWITTER_ACCESS_TOKEN`, `TWITTER_ACCESS_SECRET` (Fase 2)
- **Utilizadas em**: [lib/services/social-publisher.ts](file:///d:/IAProjects/AIGamePortal/lib/services/social-publisher.ts).
- **Finalidade**: Postagem de tweets automatizados de até 280 caracteres na conta oficial do portal via `twitter-api-v2` (plano gratuito API v2).
- **Como Obter**:
  1. Acesse o [Developer Portal do X](https://developer.x.com/en/portal/dashboard) e crie um App dentro de um Project.
  2. Em *User authentication settings*, habilite OAuth 1.0a com permissões **Read and Write**.
  3. Em *Keys and tokens*, gere e copie os pares de chaves:
     - **Consumer Keys**: `TWITTER_API_KEY` (API Key) e `TWITTER_API_SECRET` (API Secret Key).
     - **Authentication Tokens**: `TWITTER_ACCESS_TOKEN` (Access Token) e `TWITTER_ACCESS_SECRET` (Access Token Secret).

---

### 2.8 `NEXT_PUBLIC_AMAZON_AFFILIATE_TAG` (Fase 3)
- **Utilizada em**: [lib/data/affiliates.ts](file:///d:/IAProjects/AIGamePortal/lib/data/affiliates.ts), [scripts/sync-news.ts](file:///d:/IAProjects/AIGamePortal/scripts/sync-news.ts) e [scripts/sync-affiliates.ts](file:///d:/IAProjects/AIGamePortal/scripts/sync-affiliates.ts).
- **Finalidade**: Define a tag oficial de parceiro associado da Amazon Brasil inserida em todos os links contextuais, no auto-cadastro de produtos por IA e no Smart Search Fallback (`https://www.amazon.com.br/s?k=...&tag=...`).
- **Valor padrão**: `aigameportal-20`.

---

### 2.9 `ADMIN_SECRET_KEY` (Fase 3)
- **Utilizada em**: [app/api/admin/auth/route.ts](file:///d:/IAProjects/AIGamePortal/app/api/admin/auth/route.ts) e [app/api/admin/affiliates/route.ts](file:///d:/IAProjects/AIGamePortal/app/api/admin/affiliates/route.ts).
- **Segurança**: Senha administrativa que **nunca** deve conter o prefixo `NEXT_PUBLIC_`. Protege o acesso exclusivo do administrador ao painel `/admin/afiliados`.
- **Valor padrão local**: `aigameportal_admin_2026`.
- **Recomendação para Produção**: Definir uma senha forte de pelo menos 24 caracteres e mantê-la apenas no `.env.local` e nas variáveis de ambiente da plataforma de hospedagem (Vercel, Railway, etc.).

---

## 3. Arquivos de Ambiente no Repositório

1. **[.env.example](file:///d:/IAProjects/AIGamePortal/.env.example)**: Modelo público versionado no Git contendo apenas os nomes das variáveis e valores fictícios seguros.
2. **[.env.local](file:///d:/IAProjects/AIGamePortal/.env.local)**: Arquivo local privado contendo suas chaves ativas de desenvolvimento. **Nunca é enviado ao repositório** graças à regra de exclusão configurada no [.gitignore](file:///d:/IAProjects/AIGamePortal/.gitignore).
3. **Variáveis e Secrets de Produção**:
   - `GEMINI_API_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `REVALIDATE_SECRET`
   - `NEXT_PUBLIC_SITE_URL`
   - `NEXT_PUBLIC_AMAZON_AFFILIATE_TAG`
   - `ADMIN_SECRET_KEY`
   - *(Opcional - Fase 2)* `TELEGRAM_BOT_TOKEN`
   - *(Opcional - Fase 2)* `TELEGRAM_CHAT_ID`
   - *(Opcional - Fase 2)* `TWITTER_API_KEY`
   - *(Opcional - Fase 2)* `TWITTER_API_SECRET`
   - *(Opcional - Fase 2)* `TWITTER_ACCESS_TOKEN`
   - *(Opcional - Fase 2)* `TWITTER_ACCESS_SECRET`

