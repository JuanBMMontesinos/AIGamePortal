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

## 3. Arquivos de Ambiente no Repositório

1. **[.env.example](file:///d:/IAProjects/AIGamePortal/.env.example)**: Modelo público versionado no Git contendo apenas os nomes das variáveis e valores fictícios seguros.
2. **[.env.local](file:///d:/IAProjects/AIGamePortal/.env.local)**: Arquivo local privado contendo suas chaves ativas de desenvolvimento. **Nunca é enviado ao repositório** graças à regra de exclusão configurada no [.gitignore](file:///d:/IAProjects/AIGamePortal/.gitignore).
3. **GitHub Secrets**: Em produção, configure em `Settings > Secrets and variables > Actions`:
   - `GEMINI_API_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `REVALIDATE_SECRET`
   - `NEXT_PUBLIC_SITE_URL`
