-- ==============================================================================
-- PROJETO: AIGamePortal (Fase 4 - Hubs de Jogos Permanentes / SEO de Cauda Longa)
-- DESCRIÇÃO: Criação da tabela game_hubs, associação com posts (game_hub_id),
--            índices B-Tree/GIN, políticas RLS, triggers e seeds idempotentes.
-- DIALETO: PostgreSQL 15+ / Supabase
-- EXECUÇÃO: Cole e execute este script no Supabase SQL Editor.
-- ==============================================================================

-- 1. TABELA DE HUBS DE JOGOS PERMANENTES
CREATE TABLE IF NOT EXISTS public.game_hubs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    aliases TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
    developer TEXT NOT NULL,
    publisher TEXT NOT NULL,
    release_date TEXT NOT NULL,
    platforms TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
    metacritic_score INTEGER CHECK (metacritic_score >= 0 AND metacritic_score <= 100),
    cover_image_url TEXT NOT NULL,
    banner_image_url TEXT NOT NULL,
    synopsis TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.game_hubs IS 'Centrais e hubs permanentes de jogos para indexação perene e SEO de cauda longa';
COMMENT ON COLUMN public.game_hubs.name IS 'Nome oficial do título (ex: Grand Theft Auto VI, Elden Ring)';
COMMENT ON COLUMN public.game_hubs.slug IS 'Identificador textual amigável único para URLs (ex: gta-6, elden-ring)';
COMMENT ON COLUMN public.game_hubs.aliases IS 'Array de termos e grafias alternativas para matching de IA (ex: ["gta vi", "gta 6", "grand theft auto 6"])';
COMMENT ON COLUMN public.game_hubs.developer IS 'Estúdio desenvolvedor principal do jogo (ex: Rockstar Games, FromSoftware)';
COMMENT ON COLUMN public.game_hubs.publisher IS 'Empresa distribuidora/editora do jogo';
COMMENT ON COLUMN public.game_hubs.release_date IS 'Data ou janela de lançamento oficial do jogo (ex: 2025-11-20, 2025-02-28)';
COMMENT ON COLUMN public.game_hubs.platforms IS 'Array de plataformas com suporte anunciado (ex: ["PS5", "Xbox Series X|S", "PC"])';
COMMENT ON COLUMN public.game_hubs.metacritic_score IS 'Nota média no Metacritic (0 a 100) ou NULL se ainda não avaliado';
COMMENT ON COLUMN public.game_hubs.cover_image_url IS 'URL da capa vertical oficial (poster/box art)';
COMMENT ON COLUMN public.game_hubs.banner_image_url IS 'URL do banner horizontal widescreen imersivo para o hero header';
COMMENT ON COLUMN public.game_hubs.synopsis IS 'Sinopse rica e contextualizada do universo e proposta do jogo';

-- 2. TRIGGER DE ATUALIZAÇÃO AUTOMÁTICA DE updated_at
DROP TRIGGER IF EXISTS trigger_game_hubs_updated_at ON public.game_hubs;
CREATE TRIGGER trigger_game_hubs_updated_at
    BEFORE UPDATE ON public.game_hubs
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 3. ATUALIZAÇÃO NA TABELA POSTS (FK PARA GAME_HUBS)
ALTER TABLE public.posts
    ADD COLUMN IF NOT EXISTS game_hub_id UUID REFERENCES public.game_hubs(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.posts.game_hub_id IS 'Referência opcional ao Hub de Jogo permanente para auto-clustering de matérias';

-- 4. ÍNDICES DE ALTA PERFORMANCE
-- 4.1 Índice B-Tree na chave estrangeira de posts para queries rápidas da timeline
CREATE INDEX IF NOT EXISTS idx_posts_game_hub_id 
    ON public.posts(game_hub_id);

-- 4.2 Busca rápida de hubs por slug
CREATE INDEX IF NOT EXISTS idx_game_hubs_slug 
    ON public.game_hubs(slug);

-- 4.3 Índice GIN para matching e busca textual em aliases de jogos
CREATE INDEX IF NOT EXISTS idx_game_hubs_aliases 
    ON public.game_hubs USING gin(aliases);

-- 4.4 Índice composto para listagem da timeline ordenada por data
CREATE INDEX IF NOT EXISTS idx_posts_game_hub_published 
    ON public.posts(game_hub_id, published_at DESC)
    WHERE status = 'published';

-- 5. SEGURANÇA E POLÍTICAS RLS (ROW LEVEL SECURITY)
ALTER TABLE public.game_hubs ENABLE ROW LEVEL SECURITY;

-- 5.1 Leitura pública irrestrita para qualquer usuário (anon e authenticated)
DROP POLICY IF EXISTS "Permitir leitura pública de hubs de jogos" ON public.game_hubs;
CREATE POLICY "Permitir leitura pública de hubs de jogos"
    ON public.game_hubs
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- 5.2 Gerenciamento total para service_role (pipeline de ingestão n8n / script)
DROP POLICY IF EXISTS "Permitir gerenciamento total de hubs de jogos para service_role" ON public.game_hubs;
CREATE POLICY "Permitir gerenciamento total de hubs de jogos para service_role"
    ON public.game_hubs
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ==============================================================================
-- 6. SEEDS INICIAIS (HUBS DE JOGOS EMBLEMÁTICOS)
-- ==============================================================================

INSERT INTO public.game_hubs (
    id,
    name,
    slug,
    aliases,
    developer,
    publisher,
    release_date,
    platforms,
    metacritic_score,
    cover_image_url,
    banner_image_url,
    synopsis
)
VALUES
    (
        'a1b2c3d4-e5f6-4a5b-8c9d-000000000001',
        'Grand Theft Auto VI',
        'gta-6',
        ARRAY['gta vi', 'gta 6', 'grand theft auto 6', 'grand theft auto vi', 'vice city 2', 'leonida', 'lucia e jason'],
        'Rockstar Studios',
        'Rockstar Games',
        '2025-11-20',
        ARRAY['PlayStation 5', 'Xbox Series X|S', 'PC'],
        NULL,
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1514565131-fce0801e5785?q=80&w=1920&auto=format&fit=crop',
        'Grand Theft Auto VI ruma ao estado de Leonida, lar das ruas iluminadas por neon de Vice City e muito além, na maior e mais imersiva evolução da série Grand Theft Auto até hoje. Acompanhe a história de Lucia e Jason em um mundo vivo de crime, ambição e perseguições implacáveis em uma Flórida satírica de última geração.'
    ),
    (
        'a1b2c3d4-e5f6-4a5b-8c9d-000000000002',
        'Monster Hunter Wilds',
        'monster-hunter-wilds',
        ARRAY['monster hunter wilds', 'mh wilds', 'mhw 2', 'monster hunter 6', 'capcom wilds'],
        'Capcom Development Division 1',
        'Capcom',
        '2025-02-28',
        ARRAY['PlayStation 5', 'Xbox Series X|S', 'PC (Steam)'],
        91,
        'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1920&auto=format&fit=crop',
        'Em Monster Hunter Wilds, adentre as inexploradas Terras Proibidas, um ecossistema hostil e dinâmico onde manadas colossais migram e disputam território em tempo real. Com a nova montaria Seikret, transições sem telas de carregamento e crossplay integral entre todas as plataformas, vivencie a caçada cooperativa mais ambiciosa da história da Capcom.'
    ),
    (
        'a1b2c3d4-e5f6-4a5b-8c9d-000000000003',
        'Elden Ring',
        'elden-ring',
        ARRAY['elden ring', 'shadow of the erdtree', 'erdtree', 'fromsoftware elden ring', 'as terras intermediarias', 'hidetaka miyazaki'],
        'FromSoftware',
        'Bandai Namco Entertainment',
        '2022-02-25',
        ARRAY['PlayStation 5', 'PlayStation 4', 'Xbox Series X|S', 'Xbox One', 'PC'],
        96,
        'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?q=80&w=1920&auto=format&fit=crop',
        'Vencedor de centenas de prêmios de Jogo do Ano, Elden Ring é o épico RPG de ação e fantasia sombria concebido por Hidetaka Miyazaki e George R. R. Martin. Erga-se, Maculado, e seja guiado pela graça para brandir o poder do Anel Prístino e se tornar um Lorde Prístino nas misteriosas Terras Intermediárias e no Reino das Sombras.'
    )
ON CONFLICT (slug) DO UPDATE
SET
    name = EXCLUDED.name,
    aliases = EXCLUDED.aliases,
    developer = EXCLUDED.developer,
    publisher = EXCLUDED.publisher,
    release_date = EXCLUDED.release_date,
    platforms = EXCLUDED.platforms,
    metacritic_score = EXCLUDED.metacritic_score,
    cover_image_url = EXCLUDED.cover_image_url,
    banner_image_url = EXCLUDED.banner_image_url,
    synopsis = EXCLUDED.synopsis;

-- 7. VINCULAÇÃO RETROATIVA DE MATÉRIAS EXISTENTES AOS HUBS INICIAIS
UPDATE public.posts
SET game_hub_id = 'a1b2c3d4-e5f6-4a5b-8c9d-000000000001'
WHERE (slug ILIKE '%gta%' OR title ILIKE '%Grand Theft Auto%' OR title ILIKE '%GTA VI%')
  AND game_hub_id IS NULL;

UPDATE public.posts
SET game_hub_id = 'a1b2c3d4-e5f6-4a5b-8c9d-000000000002'
WHERE (slug ILIKE '%monster-hunter-wilds%' OR title ILIKE '%Monster Hunter Wilds%')
  AND game_hub_id IS NULL;

UPDATE public.posts
SET game_hub_id = 'a1b2c3d4-e5f6-4a5b-8c9d-000000000003'
WHERE (slug ILIKE '%elden-ring%' OR title ILIKE '%Elden Ring%')
  AND game_hub_id IS NULL;
