# Variáveis de Ambiente — AIGamePortal

Este documento detalha todas as variáveis de ambiente necessárias para o funcionamento do **AIGamePortal**, seus escopos de segurança, valores de exemplo e recomendações operacionais.

---

## 1. Dicionário de Variáveis

| Variável | Escopo | Obrigatória em Produção? | Descrição | Exemplo |
| :--- | :---: | :---: | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Público (Browser & Server) | Sim | URL raiz da API REST/GraphQL do seu projeto no Supabase. | `https://sfqleufmlacmuilanpni.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`| Público (Browser & Server) | Sim | Chave de API pública com permissões restritas controladas por Row Level Security (RLS). | `eyJhbGciOiJIUzI1NiIsIn...` |
| `REVALIDATION_SECRET` | **Privado** (Apenas Servidor) | Sim | Token secreto utilizado pelo pipeline do n8n para autenticar requisições ao endpoint `/api/revalidate`. | `aigameportal_super_secret_token_2026` |
| `NEXT_PUBLIC_SITE_URL` | Público (Browser & Server) | Sim | Domínio canônico do site, utilizado para resolução de metatags OpenGraph, Twitter Cards e schema JSON-LD. | `http://localhost:3000` ou `https://aigameportal.com` |

---

## 2. Detalhamento Técnico das Variáveis

### 2.1 `NEXT_PUBLIC_SUPABASE_URL`
- **Utilizada em**: [lib/supabase/client.ts](file:///d:/IAProjects/AIGamePortal/lib/supabase/client.ts) e [lib/supabase/server.ts](file:///d:/IAProjects/AIGamePortal/lib/supabase/server.ts).
- **Validação no Código**: Se estiver vazia ou mantiver o valor de placeholder `https://your-project.supabase.co`, o sistema ativa automaticamente o modo de contingência, servindo dados mockados de alta fidelidade sem quebrar a aplicação.

---

### 2.2 `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Utilizada em**: Conexão com o banco via `@supabase/supabase-js`.
- **Regra Crítica de Segurança**:
  - No frontend, deve ser utilizada **estritamente a chave `anon`**.
  - A chave `service_role` **NUNCA** deve ser exposta com o prefixo `NEXT_PUBLIC_`, pois ela ignora completamente as políticas de RLS e concederia privilégios administrativos a qualquer usuário do navegador.
  - A chave `service_role` deve residir unicamente no ambiente do **n8n** para inserção de posts e atualização de views.

---

### 2.3 `REVALIDATION_SECRET`
- **Utilizada em**: [app/api/revalidate/route.ts](file:///d:/IAProjects/AIGamePortal/app/api/revalidate/route.ts).
- **Segurança**: Nunca possui o prefixo `NEXT_PUBLIC_`, garantindo que não seja incluída no bundle JavaScript baixado pelo cliente.
- **Boas Práticas de Rotação**:
  - Recomenda-se gerar uma string aleatória com no mínimo 32 caracteres (ex: `openssl rand -hex 24`) em ambientes produtivos e configurá-la simultaneamente nas credenciais de webhook do n8n.

---

### 2.4 `NEXT_PUBLIC_SITE_URL`
- **Utilizada em**: [app/layout.tsx](file:///d:/IAProjects/AIGamePortal/app/layout.tsx) e [app/noticias/[slug]/page.tsx](file:///d:/IAProjects/AIGamePortal/app/noticias/[slug]/page.tsx).
- **Impacto em SEO**: Alimenta o campo `metadataBase` do Next.js e o `@id` das tags estruturadas `NewsArticle` do Schema.org, garantindo indexação canônica impecável no Googlebot e prévias corretas em redes sociais (Discord, WhatsApp, Twitter).

---

## 3. Arquivos de Ambiente no Repositório

1. **[.env.example](file:///d:/IAProjects/AIGamePortal/.env.example)**: Modelo público versionado no Git contendo apenas os nomes das variáveis e valores fictícios seguros.
2. **[.env.local](file:///d:/IAProjects/AIGamePortal/.env.local)**: Arquivo local privado contendo suas chaves ativas de desenvolvimento. **Nunca é enviado ao repositório** graças à regra de exclusão configurada no [.gitignore](file:///d:/IAProjects/AIGamePortal/.gitignore).
