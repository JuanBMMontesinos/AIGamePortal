# Contexto do Projeto para IA (AI Context) — AIGamePortal

Este documento é a referência canônica do projeto **AIGamePortal**. Qualquer agente de IA ou desenvolvedor deve consultar este arquivo antes de implementar novos recursos, endpoints, scripts ou nós de automação.

---

## 1. Visão Geral do Projeto

- **Nome**: AIGamePortal
- **Propósito**: Portal de notícias e cobertura de games com curadoria, sumarização e redação 100% automatizadas por IA.
- **Diferenciais Técnicos**:
  - Deduplicação semântica vetorial (Google Gemini `text-embedding-004` + PostgreSQL `pgvector`).
  - Atribuição E-E-A-T com link canônico e transparência editorial.
  - Resumos dinâmicos em bullet points (`tldr`) para rápida leitura mobile.
  - Análise de repercussão pública (`community_sentiment`).
  - Metadados de jogos estruturados em JSONB (`game_metadata`).

---

## 2. Stack Tecnológica

| Componente | Tecnologia | Observações |
| :--- | :--- | :--- |
| **Banco de Dados** | Supabase (PostgreSQL 15+) | Extensões `vector` (HNSW) e `uuid-ossp` ativas |
| **Embeddings & LLM**| Google Gemini API | `text-embedding-004` (dimensão 768) |
| **Pipeline de Ingestão** | n8n | RSS scraping, deduplicação vetorial e gravação via `service_role` |
| **Frontend** | Next.js / React (SSR & ISR) | Consumo via Supabase Client (`anon_key`) |

---

## 3. Estrutura de Diretórios

```plaintext
d:/IAProjects/AIGamePortal/
├── docs/
│   ├── ai-context.md       # Este documento (regras de negócio e contexto de IA)
│   └── database.md         # Documentação de modelagem, índices e RLS
├── supabase/
│   ├── migrations/
│   │   └── 20260912000001_initial_schema.sql  # Migração mestre executável no Supabase
│   └── seed.sql            # Dados iniciais para ambiente local
└── README.md
```

---

## 4. Pipeline de Ingestão e Deduplicação (n8n Workflow)

1. **Gatilho de Agendamento**: Executa a cada 15-30 minutos.
2. **Leitura de Fontes**: Consulta `sources` onde `is_active = true`.
3. **Parse de RSS**: Extrai novos itens dos feeds oficiais.
4. **Deduplicação Nível 1 (Determinística)**:
   - Query em `posts` comparando `source_original_url`.
   - Se já existe, pula o processamento imediatamente para economizar tokens de LLM.
5. **Geração de Embedding**:
   - Gera vetor de 768 dimensões para o título + conteúdo original via Gemini `text-embedding-004`.
6. **Deduplicação Nível 2 (Semântica)**:
   - Invoca a RPC `match_recent_articles(query_embedding, 0.82, 48)`.
   - Se `similarity >= 0.82`, a notícia é descartada ou agrupada (mesmo fato coberto por veículos diferentes).
7. **Redação & Enriquecimento por IA**:
   - Criação de título cativante, slug único, TL;DR (3-4 bullets), artigo em Markdown rico, sentimento da comunidade e metadados estruturados.
8. **Gravação**:
   - Insert em `posts` com a chave `service_role` (bypass RLS de escrita).

---

## 5. Regras de Segurança e Acesso (RLS)

- **Leitura Pública (`anon`)**:
  - `posts`: Apenas registros com `status = 'published'`.
  - `categories`: Leitura total.
  - `sources`: Apenas onde `is_active = true`.
- **Escrita/Edição (`service_role`)**:
  - Uso restrito aos fluxos de backend e automações seguras (n8n). **Nunca exponha a `service_role` key no frontend.**
