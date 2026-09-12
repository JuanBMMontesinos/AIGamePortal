# Contexto Canônico para IA (AI Context) — AIGamePortal

Este documento é a referência canônica do projeto **AIGamePortal** para **agentes autônomos de IA e desenvolvedores**. Qualquer modelo de linguagem (LLM) que for executar tarefas de escrita de código, migração, testes ou geração de conteúdo deve ler e obedecer estritamente às regras contidas aqui.

---

## 1. Identidade e Missão do Projeto

- **Nome Oficial**: AIGamePortal
- **Propósito**: Portal de notícias gamer de alta performance com curadoria, sumarização e redação automatizadas por agentes de inteligência artificial.
- **Diferenciais Técnicos Fundamentais**:
  1. **Deduplicação Semântica Vetorial**: Google Gemini `text-embedding-004` (dimensão 768) + PostgreSQL `pgvector` com índice HNSW.
  2. **Atribuição E-E-A-T**: Todo artigo possui um box transparente com link canônico e nome do veículo original de primeira mão.
  3. **Resumos em 30 Segundos (`tldr`)**: Três a quatro fatos essenciais para leitura ágil em dispositivos móveis.
  4. **Metadados de Jogos Estruturados (`game_metadata`)**: Plataformas, desenvolvedora, publicadora, gênero e nota Metacritic em JSONB tipado.
  5. **Análise de Repercussão Pública (`community_sentiment`)**: Síntese de reações do Reddit e X/Twitter.
  6. **Performance de Carregamento**: Arquitetura híbrida SSG + ISR no Next.js App Router (nota 95+ em Core Web Vitals).

---

## 2. Invariantes de Banco de Dados e Esquema

Qualquer alteração de banco ou inserção de dados deve respeitar estas regras estruturais:

| Campo / Invariante | Regra Estrita | Justificativa |
| :--- | :--- | :--- |
| `posts.status` | Deve ser `'draft'`, `'published'` ou `'archived'`. | O RLS público de leitura só expõe `'published'`. |
| `posts.tldr` | Deve ser sempre um array `TEXT[]` com 3 a 4 itens. | Utilizado pelos componentes de UI (`<TldrBox />` e `<NewsCard />`). |
| `posts.content` | Formato Markdown rico sem HTML cru inseguro. | Renderizado via `<MarkdownContent />`. |
| `posts.source_original_url` | Campo `NOT NULL` e com índice B-Tree. | Utilizado para deduplicação determinística nível 1 e E-E-A-T. |
| `posts.game_metadata` | Objeto `JSONB` com campos opcionais tipados. | `{ game_name, platforms, metacritic_score, release_date, developer, publisher, genre }`. |
| `posts.embedding` | Vetor `vector(768)`. | Compatível exclusivamente com o modelo Gemini `text-embedding-004`. |

---

## 3. Diretrizes de Codificação para Agentes de IA

Ao criar ou modificar código neste repositório, o agente deve seguir:

1. **Server Components por Padrão**:
   - Mantenha todos os componentes como Server Components, a menos que precisem de hooks de estado do React (`useState`, `useEffect`, `usePathname`), APIs de browser (`navigator.clipboard`) ou manipuladores de eventos diretos.
2. **TypeScript Estrito**:
   - Nunca utilize `any` solto. Importe as interfaces canônicas de `@/types/database`.
   - Utilize o alias de importação canônico `@/*` apontando para a raiz.
3. **Design Gamer Premium & Tailwind CSS**:
   - Paleta escura profunda (`gamer-950` = `#060608`, `gamer-900` = `#0a0a0e`, `gamer-850` = `#101017`).
   - Acentos neon: Roxo (`brand-purple` = `#8b5cf6`), Ciano (`brand-cyan` = `#06b6d4`), Esmeralda (`brand-emerald` = `#10b981`).
   - Dark Mode como padrão, garantindo alto contraste e legibilidade impecável no modo claro.
4. **Prevenção de Hydration Mismatch**:
   - Qualquer componente que leia o tema (`next-themes`) ou dados exclusivos do cliente deve esperar a montagem no DOM através de um estado `mounted` com `useEffect`.
5. **Resiliência da Camada de Dados**:
   - Nunca force a quebra de renderização caso o Supabase falhe ou esteja vazio. Mantenha o fallback para `lib/data/mock-news.ts`.

---

## 4. Pipeline de Ingestão e Deduplicação (n8n Workflow)

```mermaid
sequenceDiagram
    autonumber
    participant RSS as Feed RSS Oficial
    participant n8n as n8n Ingestion Workflow
    participant Gemini as Google Gemini API
    participant DB as Supabase PostgreSQL
    participant Next as Next.js ISR Webhook

    n8n->>RSS: 1. Coleta itens novos do feed
    n8n->>DB: 2. Consulta source_original_url (Deduplicação Determinística)
    alt URL já existe no banco
        n8n-->>n8n: Pula processamento (0 tokens consumidos)
    else URL inédita
        n8n->>Gemini: 3. Gera embedding de 768d (text-embedding-004)
        n8n->>DB: 4. Executa RPC match_recent_articles(query_embedding, 0.82, 48)
        alt Similaridade >= 0.82 (Deduplicação Semântica)
            n8n-->>n8n: Pula item (mesmo fato coberto por outro veículo)
        else Notícia original e relevante
            n8n->>Gemini: 5. Redige título, TL;DR, markdown, sentimentos e extrai metadata
            n8n->>DB: 6. Grava com chave service_role em public.posts
            n8n->>Next: 7. Dispara POST /api/revalidate?secret=...&slug=...
            Next-->>Next: 8. Cache das rotas / e /noticias/:slug revalidado instantaneamente
        end
    end
```

---

## 5. Política Anti-Alucinação e Diretrizes E-E-A-T

Ao instruir LLMs a redigirem notícias para o AIGamePortal:

1. **Apenas Fatos do Artigo Original**:
   - O modelo **NUNCA** deve inventar datas de lançamento de jogos, preços ou especificações que não estejam presentes explicitamente no texto de entrada.
   - Se o preço ou a data forem desconhecidos, os campos em `game_metadata` devem ser gravados como `null`.
2. **Tom de Voz Editorial**:
   - Informativo, ágil, entusiasta de tecnologia e games, mas sóbrio e imparcial quanto a rumores.
   - Sempre diferenciar fatos confirmados de boatos da indústria.
3. **Atribuição Canônica Inegociável**:
   - O campo `source_original_url` e `source_original_title` devem apontar diretamente para a matéria de origem, garantindo respeito à propriedade intelectual das redações.
