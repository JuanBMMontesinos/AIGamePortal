-- ==============================================================================
-- PROJETO: Made By AI Games
-- MIGRAÇÃO: 20260920000002_multi_tier_sources.sql
-- DESCRIÇÃO: Sincronização e homologação de fontes de dados Multi-Tier
--            (Fontes Primárias/Lojas, Jornalismo Internacional e Comunidades Moderadas)
--            com suporte a INSERT idempotente e UPDATE em caso de alteração cadastral.
-- ==============================================================================

-- 1. Assegurar categorias canônicas do portal (idempotente)
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

-- 2. Inserção / Atualização das 15 Fontes Oficiais Homologadas (Multi-Tier)
-- Utiliza ON CONFLICT (feed_url) para atualizar nome, website e status sem duplicar registros.
INSERT INTO public.sources (name, feed_url, website_url, is_active)
VALUES
    -- -------------------------------------------------------------------------
    -- TIER 1: FONTES PRIMÁRIAS & PLATAFORMAS OFICIAIS (Fatos Consolidados 5/5)
    -- -------------------------------------------------------------------------
    ('PlayStation Blog', 'https://blog.playstation.com/feed/', 'https://blog.playstation.com', true),
    ('Xbox Wire', 'https://news.xbox.com/en-us/feed/', 'https://news.xbox.com', true),
    ('Nintendo Everything', 'https://nintendoeverything.com/feed/', 'https://nintendoeverything.com', true),
    ('Nintendo Life', 'https://www.nintendolife.com/feeds/news', 'https://www.nintendolife.com', true),
    ('Steam News', 'https://store.steampowered.com/feeds/news.xml', 'https://store.steampowered.com', true),
    ('Games Press', 'https://www.gamespress.com/feed', 'https://www.gamespress.com', true),

    -- -------------------------------------------------------------------------
    -- TIER 2: JORNALISMO ESPECIALIZADO INTERNACIONAL (Verificado 4-5/5)
    -- -------------------------------------------------------------------------
    ('VGC (Video Games Chronicle)', 'https://www.videogameschronicle.com/feed/', 'https://www.videogameschronicle.com', true),
    ('Eurogamer', 'https://www.eurogamer.net/feed', 'https://www.eurogamer.net', true),
    ('Gematsu', 'https://www.gematsu.com/feed', 'https://www.gematsu.com', true),
    ('PC Gamer', 'https://www.pcgamer.com/rss/', 'https://www.pcgamer.com', true),
    ('Rock Paper Shotgun', 'https://www.rockpapershotgun.com/feed', 'https://www.rockpapershotgun.com', true),
    ('Destructoid', 'https://www.destructoid.com/feed/', 'https://www.destructoid.com', true),
    ('IGN Games', 'https://feeds.feedburner.com/ign/all', 'https://www.ign.com', true),
    ('GamesIndustry.biz', 'https://www.gamesindustry.biz/feed', 'https://www.gamesindustry.biz', true),

    -- -------------------------------------------------------------------------
    -- TIER 3: COMUNIDADES AUDITADAS & VAZAMENTOS (Com Aviso de Rumor Obrigatório)
    -- -------------------------------------------------------------------------
    ('r/Games', 'https://www.reddit.com/r/Games/.rss', 'https://www.reddit.com/r/Games', true),
    ('r/GamingLeaksAndRumours', 'https://www.reddit.com/r/GamingLeaksAndRumours/.rss', 'https://www.reddit.com/r/GamingLeaksAndRumours', true)

ON CONFLICT (feed_url) DO UPDATE
SET 
    name = EXCLUDED.name,
    website_url = EXCLUDED.website_url,
    is_active = EXCLUDED.is_active;

-- 3. Comentários explicativos da governança de dados
COMMENT ON TABLE public.sources IS 'Catálogo de fontes homologadas e categorizadas no sistema Multi-Tier do portal';
COMMENT ON COLUMN public.sources.feed_url IS 'Identificador canônico único do feed RSS ou Atom';
