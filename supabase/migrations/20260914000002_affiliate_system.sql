-- ==============================================================================
-- PROJETO: AIGamePortal (Fase 3 - Módulo de Afiliados Inteligentes)
-- DESCRIÇÃO: Estrutura de monetização automatizada, catálogo de produtos,
--            rastreamento de cliques (analytics) e conformidade Google E-E-A-T.
-- DIALETO: PostgreSQL 15+ / Supabase
-- EXECUÇÃO: Cole e execute este script no Supabase SQL Editor.
-- ==============================================================================

-- 1. TABELA DE PRODUTOS AFILIADOS
CREATE TABLE IF NOT EXISTS public.affiliate_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Hardware', 'Console', 'PC', 'Jogo', 'Acessórios')),
    keywords TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
    store_name TEXT NOT NULL,
    affiliate_url TEXT NOT NULL,
    image_url TEXT NOT NULL,
    price_estimate NUMERIC(10, 2),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.affiliate_products IS 'Catálogo de produtos afiliados gamer para injeção contextual e cards de recomendação';
COMMENT ON COLUMN public.affiliate_products.keywords IS 'Array de palavras-chave para matching no conteúdo das notícias (ex: ["ps5", "playstation 5", "dualsense"])';
COMMENT ON COLUMN public.affiliate_products.store_name IS 'Nome da loja parceira anunciante (ex: Amazon Brasil, KaBuM!, Nuuvem, Mercado Livre)';
COMMENT ON COLUMN public.affiliate_products.affiliate_url IS 'Link direto com parâmetros de tag de associado/parceiro do portal';
COMMENT ON COLUMN public.affiliate_products.price_estimate IS 'Preço de referência aproximado em Reais (BRL)';

-- Trigger de updated_at
DROP TRIGGER IF EXISTS trigger_affiliate_products_updated_at ON public.affiliate_products;
CREATE TRIGGER trigger_affiliate_products_updated_at
    BEFORE UPDATE ON public.affiliate_products
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 2. TABELA DE CLIQUES E TRACKING DE AFILIADOS
CREATE TABLE IF NOT EXISTS public.affiliate_clicks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.affiliate_products(id) ON DELETE CASCADE,
    post_id UUID REFERENCES public.posts(id) ON DELETE SET NULL,
    referrer TEXT,
    user_agent TEXT,
    clicked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.affiliate_clicks IS 'Registro analítico de cliques e redirecionamentos para auditoria e conversão';
COMMENT ON COLUMN public.affiliate_clicks.post_id IS 'ID do post de onde partiu o clique (se originado de um artigo)';
COMMENT ON COLUMN public.affiliate_clicks.referrer IS 'HTTP Referer ou página de origem do clique';

-- 3. ÍNDICES DE ALTA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_affiliate_products_is_active 
    ON public.affiliate_products(is_active);

CREATE INDEX IF NOT EXISTS idx_affiliate_products_keywords 
    ON public.affiliate_products USING gin(keywords);

CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_product_id 
    ON public.affiliate_clicks(product_id);

CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_post_id 
    ON public.affiliate_clicks(post_id);

CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_clicked_at 
    ON public.affiliate_clicks(clicked_at DESC);

-- 4. SEGURANÇA E POLÍTICAS RLS (ROW LEVEL SECURITY)
ALTER TABLE public.affiliate_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;

-- 4.1 Políticas para public.affiliate_products
DROP POLICY IF EXISTS "Permitir leitura pública de produtos afiliados ativos" ON public.affiliate_products;
CREATE POLICY "Permitir leitura pública de produtos afiliados ativos"
    ON public.affiliate_products
    FOR SELECT
    TO anon, authenticated
    USING (is_active = true);

DROP POLICY IF EXISTS "Permitir gerenciamento total de produtos para service_role" ON public.affiliate_products;
CREATE POLICY "Permitir gerenciamento total de produtos para service_role"
    ON public.affiliate_products
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- 4.2 Políticas para public.affiliate_clicks
DROP POLICY IF EXISTS "Permitir registro de clique anônimo e autenticado" ON public.affiliate_clicks;
CREATE POLICY "Permitir registro de clique anônimo e autenticado"
    ON public.affiliate_clicks
    FOR INSERT
    TO anon, authenticated, service_role
    WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir leitura de métricas de cliques apenas para service_role" ON public.affiliate_clicks;
CREATE POLICY "Permitir leitura de métricas de cliques apenas para service_role"
    ON public.affiliate_clicks
    FOR SELECT
    TO service_role
    USING (true);

-- 5. SEEDS INICIAIS DE PRODUTOS GAMER POPULARES (Fase 3)
INSERT INTO public.affiliate_products (title, category, keywords, store_name, affiliate_url, image_url, price_estimate, is_active)
VALUES
    (
        'Console PlayStation 5 Slim 1TB Edição Digital',
        'Console',
        ARRAY['playstation 5', 'ps5', 'ps5 slim', 'playstation 5 slim', 'ps5 pro', 'playstation 5 pro'],
        'Amazon Brasil',
        'https://www.amazon.com.br/dp/B0CL5KNB9M?tag=aigameportal-20',
        'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?q=80&w=800&auto=format&fit=crop',
        3799.00,
        true
    ),
    (
        'Controle Sem Fio DualSense Branco para PS5 e PC',
        'Acessórios',
        ARRAY['dualsense', 'controle dualsense', 'controle ps5', 'gatilhos adaptáveis'],
        'Amazon Brasil',
        'https://www.amazon.com.br/dp/B088GH7D67?tag=aigameportal-20',
        'https://images.unsplash.com/photo-1592840496694-26d035b52b48?q=80&w=800&auto=format&fit=crop',
        429.00,
        true
    ),
    (
        'Placa de Vídeo ASUS Dual GeForce RTX 4060 EVO OC 8GB GDDR6',
        'Hardware',
        ARRAY['rtx 4060', 'geforce rtx 4060', 'placa rtx 4060', 'nvidia rtx 4060', 'rtx 4070'],
        'KaBuM!',
        'https://www.kabum.com.br/produto/525642/placa-de-video-rtx-4060-asus?partner=aigameportal',
        'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?q=80&w=800&auto=format&fit=crop',
        2199.90,
        true
    ),
    (
        'Console Xbox Series X 1TB Preto',
        'Console',
        ARRAY['xbox series x', 'series x', 'xbox', 'game pass ultimate'],
        'Amazon Brasil',
        'https://www.amazon.com.br/dp/B08H75RTZ8?tag=aigameportal-20',
        'https://images.unsplash.com/photo-1621259182978-fbf93132d53d?q=80&w=800&auto=format&fit=crop',
        4499.00,
        true
    ),
    (
        'Console Nintendo Switch OLED 64GB com Joy-Con Branco',
        'Console',
        ARRAY['nintendo switch', 'switch oled', 'nintendo switch oled', 'joy-con', 'switch 2'],
        'Amazon Brasil',
        'https://www.amazon.com.br/dp/B098RKWHHZ?tag=aigameportal-20',
        'https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?q=80&w=800&auto=format&fit=crop',
        2299.00,
        true
    ),
    (
        'Elden Ring: Shadow of the Erdtree Edition (PC Steam)',
        'Jogo',
        ARRAY['elden ring', 'shadow of the erdtree', 'fromsoftware', 'hidetaka miyazaki'],
        'Nuuvem',
        'https://www.nuuvem.com/item/elden-ring-shadow-of-the-erdtree?partner=aigameportal',
        'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=800&auto=format&fit=crop',
        199.90,
        true
    ),
    (
        'Placa de Vídeo Galax GeForce RTX 4070 Super 1-Click OC 12GB',
        'Hardware',
        ARRAY['rtx 4070 super', 'geforce rtx 4070 super', 'rtx 4080', 'dlss 3'],
        'KaBuM!',
        'https://www.kabum.com.br/produto/519532/placa-de-video-rtx-4070-super-galax?partner=aigameportal',
        'https://images.unsplash.com/photo-1591488320449-011701bb6704?q=80&w=800&auto=format&fit=crop',
        4399.00,
        true
    ),
    (
        'Headset Gamer Sem Fio Sony Pulse Elite para PS5 e PC',
        'Acessórios',
        ARRAY['pulse elite', 'headset pulse', 'audio 3d tempest', 'pulse 3d'],
        'Amazon Brasil',
        'https://www.amazon.com.br/dp/B0CP9M84P4?tag=aigameportal-20',
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop',
        999.00,
        true
    )
ON CONFLICT DO NOTHING;
