-- ==============================================================================
-- PROJETO: AIGamePortal (Fase 1 - MVP)
-- DESCRIÇÃO: Schema inicial completo com pgvector, RLS, índices HNSW, RPC e seeds.
-- DIALETO: PostgreSQL 15+ / Supabase
-- EXECUÇÃO: Cole e execute este script completo no Supabase SQL Editor.
-- ==============================================================================

-- 1. EXTENSÕES OBRIGATÓRIAS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- ==============================================================================
-- 2. TABELAS PRINCIPAIS
-- ==============================================================================

-- 2.1 Tabela de Categorias
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.categories IS 'Categorias e plataformas de jogos do AIGamePortal';
COMMENT ON COLUMN public.categories.slug IS 'Identificador textual único amigável para URLs e rotas';

-- 2.2 Tabela de Fontes RSS / Crawlers
CREATE TABLE IF NOT EXISTS public.sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    feed_url TEXT NOT NULL UNIQUE,
    website_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.sources IS 'Fontes e feeds RSS oficiais monitorados pelo pipeline n8n';
COMMENT ON COLUMN public.sources.feed_url IS 'URL do endpoint RSS/Atom monitorado';

-- 2.3 Tabela de Notícias (Posts)
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    tldr TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
    content TEXT NOT NULL,
    excerpt TEXT,
    cover_image_url TEXT,
    cover_image_alt TEXT,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    source_id UUID REFERENCES public.sources(id) ON DELETE SET NULL,
    source_original_url TEXT NOT NULL,
    source_original_title TEXT,
    game_metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
    community_sentiment TEXT,
    embedding vector(768),
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
    views_count INTEGER NOT NULL DEFAULT 0,
    published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.posts IS 'Artigos e notícias curadas e redigidas por IA para o AIGamePortal';
COMMENT ON COLUMN public.posts.tldr IS 'Array contendo 3 a 4 bullet points resumindo os fatos principais';
COMMENT ON COLUMN public.posts.content IS 'Conteúdo principal em formato Markdown rico';
COMMENT ON COLUMN public.posts.excerpt IS 'Meta description curta (150-160 caracteres) para SEO e OpenGraph';
COMMENT ON COLUMN public.posts.source_original_url IS 'Link canônico original da notícia para conformidade E-E-A-T e atribuição';
COMMENT ON COLUMN public.posts.game_metadata IS 'Metadados estruturados: nome_jogo, plataformas, nota_metacritic, data_lancamento, desenvolvedora';
COMMENT ON COLUMN public.posts.community_sentiment IS 'Resumo sintético da repercussão no Reddit, X/Twitter e fóruns da comunidade';
COMMENT ON COLUMN public.posts.embedding IS 'Vetor denso de 768 dimensões gerado pelo Google Gemini text-embedding-004 para deduplicação semântica';

-- ==============================================================================
-- 3. TRIGGERS & FUNÇÕES UTILITÁRIAS
-- ==============================================================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_posts_updated_at ON public.posts;
CREATE TRIGGER trigger_posts_updated_at
    BEFORE UPDATE ON public.posts
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 4. ÍNDICES DE ALTA PERFORMANCE
-- ==============================================================================

-- Busca rápida de rotas por slug
CREATE INDEX IF NOT EXISTS idx_posts_slug 
    ON public.posts(slug);

-- Ordenação de feed cronológico principal
CREATE INDEX IF NOT EXISTS idx_posts_published_at_desc 
    ON public.posts(published_at DESC);

-- Filtragem por categoria
CREATE INDEX IF NOT EXISTS idx_posts_category_id 
    ON public.posts(category_id);

-- Relacionamento com fonte
CREATE INDEX IF NOT EXISTS idx_posts_source_id 
    ON public.posts(source_id);

-- Otimização de listagem pública (Status + Data de Publicação)
CREATE INDEX IF NOT EXISTS idx_posts_status_published_at 
    ON public.posts(status, published_at DESC);

-- Deduplicação rápida determinística por URL original
CREATE INDEX IF NOT EXISTS idx_posts_source_original_url 
    ON public.posts(source_original_url);

-- Índice HNSW de alta precisão para busca vetorial de cosseno
-- Observação: HNSW suporta consultas imediatas sem necessidade de retreino (diferente de ivfflat)
CREATE INDEX IF NOT EXISTS idx_posts_embedding_hnsw 
    ON public.posts USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- ==============================================================================
-- 5. FUNÇÃO RPC DE DEDUPLICAÇÃO SEMÂNTICA
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.match_recent_articles(
    query_embedding vector(768),
    match_threshold float DEFAULT 0.82,
    hours_limit int DEFAULT 48
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    slug TEXT,
    similarity FLOAT,
    published_at TIMESTAMPTZ,
    source_original_url TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.title,
        p.slug,
        (1 - (p.embedding <=> query_embedding))::FLOAT AS similarity,
        p.published_at,
        p.source_original_url
    FROM public.posts p
    WHERE p.published_at >= (now() - (hours_limit || ' hours')::INTERVAL)
      AND p.embedding IS NOT NULL
      AND (1 - (p.embedding <=> query_embedding)) >= match_threshold
    ORDER BY similarity DESC;
END;
$$;

COMMENT ON FUNCTION public.match_recent_articles IS 
'Busca semântica de artigos publicados nas últimas X horas com similaridade de cosseno acima do limiar para evitar duplicação por IA.';

-- ==============================================================================
-- 6. SEGURANÇA E POLÍTICAS RLS (ROW LEVEL SECURITY)
-- ==============================================================================

-- Habilitação do RLS em todas as tabelas
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- 6.1 Políticas para public.categories
DROP POLICY IF EXISTS "Permitir leitura pública de categorias" ON public.categories;
CREATE POLICY "Permitir leitura pública de categorias"
    ON public.categories
    FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Permitir gerenciamento total de categorias para service_role" ON public.categories;
CREATE POLICY "Permitir gerenciamento total de categorias para service_role"
    ON public.categories
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- 6.2 Políticas para public.sources
DROP POLICY IF EXISTS "Permitir leitura pública de fontes ativas" ON public.sources;
CREATE POLICY "Permitir leitura pública de fontes ativas"
    ON public.sources
    FOR SELECT
    TO anon, authenticated
    USING (is_active = true);

DROP POLICY IF EXISTS "Permitir gerenciamento total de fontes para service_role" ON public.sources;
CREATE POLICY "Permitir gerenciamento total de fontes para service_role"
    ON public.sources
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- 6.3 Políticas para public.posts
DROP POLICY IF EXISTS "Permitir leitura pública apenas de posts publicados" ON public.posts;
CREATE POLICY "Permitir leitura pública apenas de posts publicados"
    ON public.posts
    FOR SELECT
    TO anon, authenticated
    USING (status = 'published');

DROP POLICY IF EXISTS "Permitir gerenciamento total de posts para service_role" ON public.posts;
CREATE POLICY "Permitir gerenciamento total de posts para service_role"
    ON public.posts
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ==============================================================================
-- 7. SEEDS INICIAIS (IDEMPOTENTES)
-- ==============================================================================

-- 7.1 Inserção de Categorias Padrão
INSERT INTO public.categories (name, slug)
VALUES
    ('PlayStation', 'playstation'),
    ('Xbox', 'xbox'),
    ('Nintendo', 'nintendo'),
    ('PC Gaming', 'pc-gaming'),
    ('Hardware', 'hardware'),
    ('Indústria', 'industria'),
    ('Geral', 'geral')
ON CONFLICT (slug) DO UPDATE
SET name = EXCLUDED.name;

-- 7.2 Inserção de 5 Feeds RSS Oficiais Iniciais
INSERT INTO public.sources (name, feed_url, website_url, is_active)
VALUES
    ('PlayStation Blog', 'https://blog.playstation.com/feed/', 'https://blog.playstation.com', true),
    ('Xbox Wire', 'https://news.xbox.com/en-us/feed/', 'https://news.xbox.com', true),
    ('Nintendo Life', 'https://www.nintendolife.com/feeds/news', 'https://www.nintendolife.com', true),
    ('PC Gamer', 'https://www.pcgamer.com/rss/', 'https://www.pcgamer.com', true),
    ('Eurogamer', 'https://www.eurogamer.net/feed/news', 'https://www.eurogamer.net', true)
ON CONFLICT (feed_url) DO UPDATE
SET 
    name = EXCLUDED.name,
    website_url = EXCLUDED.website_url,
    is_active = EXCLUDED.is_active;
