-- ==============================================================================
-- PROJETO: AIGamePortal
-- MIGRAÇÃO: Adiciona fonte oficial GamesIndustry.biz para a categoria Indústria
-- ==============================================================================

INSERT INTO public.sources (name, feed_url, website_url, is_active)
VALUES
    ('GamesIndustry.biz', 'https://www.gamesindustry.biz/feed', 'https://www.gamesindustry.biz', true)
ON CONFLICT (feed_url) DO UPDATE
SET 
    name = EXCLUDED.name,
    website_url = EXCLUDED.website_url,
    is_active = EXCLUDED.is_active;
