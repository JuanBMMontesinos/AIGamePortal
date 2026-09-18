-- ==============================================================================
-- PROJETO: Made By AI Games
-- SEED DATA (supabase/seed.sql)
-- ==============================================================================

-- Categorias padrão
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

-- Feeds RSS iniciais
INSERT INTO public.sources (name, feed_url, website_url, is_active)
VALUES
    ('PlayStation Blog', 'https://blog.playstation.com/feed/', 'https://blog.playstation.com', true),
    ('Xbox Wire', 'https://news.xbox.com/en-us/feed/', 'https://news.xbox.com', true),
    ('Nintendo Life', 'https://www.nintendolife.com/feeds/news', 'https://www.nintendolife.com', true),
    ('PC Gamer', 'https://www.pcgamer.com/rss/', 'https://www.pcgamer.com', true),
    ('Eurogamer', 'https://www.eurogamer.net/feed/news', 'https://www.eurogamer.net', true),
    ('GamesIndustry.biz', 'https://www.gamesindustry.biz/feed', 'https://www.gamesindustry.biz', true)
ON CONFLICT (feed_url) DO UPDATE
SET 
    name = EXCLUDED.name,
    website_url = EXCLUDED.website_url,
    is_active = EXCLUDED.is_active;
