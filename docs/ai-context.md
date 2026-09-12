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

Ao instruir LLMs (como o Google Gemini 1.5) a redigirem notícias para o AIGamePortal, as regras a seguir são **leis canônicas e inegociáveis**:

1. **Integridade Factual Estrita (Zero Fake News)**:
   - O modelo **NUNCA** deve inventar datas de lançamento de jogos, preços, especificações técnicas ou plataformas que não estejam presentes de forma explícita e confirmada no texto de entrada raspado.
   - **Regra da Frase Padronizada**: Se uma informação (como data de lançamento, preço ou specs) não estiver confirmada e explícita no texto original raspado, o modelo deve declarar obrigatoriamente no corpo do texto:
     > *"Informação ainda não confirmada oficialmente pelo estúdio/distribuidora."*
   - No schema `game_metadata`, o campo `release_date` deve ser preenchido como `"Não divulgada oficialmente"` e `platforms` com as plataformas confirmadas (ou `["Não confirmadas"]`).
2. **Protocolo de Fact-Checking & Classificação de Confiabilidade (Fase 2)**:
   - **Identificação de Rumores (`is_rumor`)**: Se a fonte ou o fato derivar de vazamentos, datamines, insiders, patentes ou postagens em fóruns, marcar obrigatoriamente `is_rumor: true`.
   - **Escala de Confiabilidade (`reliability_score`)**:
     * `5`: Canais oficiais (PlayStation Blog, Xbox Wire, Nintendo Direct, pronunciamento oficial de estúdio).
     * `4`: Apurações jornalísticas consolidadas com múltiplas fontes (Bloomberg, Eurogamer, The Verge).
     * `3`: Patentes, registros em órgãos governamentais de classificação indicativa ou vagas de emprego.
     * `2`: Datamines preliminares ou leakers com histórico misto.
     * `1`: Postagens anônimas em fóruns (Reddit, 4chan) sem evidências comprobatórias.
   - **Diretriz de Ouro**: NUNCA tratar rumores ou vazamentos como fatos consumados no título ou no corpo do texto (uso estrito de "suposto", "segundo rumor", "aponta vazamento").
   - **Aviso Explicativo (`rumor_warning`)**: Gerar contextualização clara da incerteza dos dados para exibição destacada no `<RumorBanner />`.

3. **Proteção contra Penalizações de SEO (Google Helpful Content / Scaled Content)**:
   - **Proibição de tradução literal**: O artigo deve ser reescrito na íntegra com a voz editorial do AIGamePortal (entusiasta, informativo, preciso e fluido), agregando contexto histórico e relevância de mercado.
   - **Estruturação Semântica**: Dividido em seções com subtítulos H2 e H3 atraentes, sem clichês automatizados (ex: proibir "No vibrante mundo dos games").
   - **Ficha Técnica Rápida**: Todo artigo deve conter no corpo Markdown uma tabela estruturada com specs (Jogo, Desenvolvedora, Distribuidora, Plataformas e Previsão de Lançamento).
   - **Repercussão da Comunidade**: Deve sintetizar debates e reações de jogadores (Reddit, X/Twitter, fóruns) no campo `community_sentiment` e nos parágrafos finais.

4. **Atribuição Canônica Inegociável (E-E-A-T)**:
   - O campo `source_original_url` e o fechamento do texto Markdown devem citar e apontar diretamente para a matéria de origem, preservando a autoria original de apuração.

5. **Especificação Completa do Agente Redator**:
   - A especificação detalhada de System Prompt, parâmetros de amostragem (temperatura 0.20, top-p 0.85), JSON Schema formal e Few-Shot examples encontra-se documentada em:
     👉 **[docs/gemini-redator-prompt.md](file:///d:/IAProjects/AIGamePortal/docs/gemini-redator-prompt.md)**.
