-- ==============================================================================
-- PROJETO: AIGamePortal (Fase 4 - Bot de Alertas de Jogos Grátis para Discord)
-- DESCRIÇÃO: Tabela de histórico de ofertas gratuitas postadas para evitar duplicidade
-- DIALETO: PostgreSQL 15+ / Supabase
-- EXECUÇÃO: Cole e execute este script no Supabase SQL Editor.
-- ==============================================================================

-- 1. TABELA DE HISTÓRICO DE JOGOS GRÁTIS
CREATE TABLE IF NOT EXISTS public.free_games_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    platform TEXT,
    worth TEXT,
    giveaway_url TEXT,
    image_url TEXT,
    expires_at TIMESTAMPTZ,
    posted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.free_games_history IS 'Registro de jogos gratuitos já anunciados no Discord para prevenção de alertas duplicados';
COMMENT ON COLUMN public.free_games_history.id IS 'Identificador único interno do registro';
COMMENT ON COLUMN public.free_games_history.deal_id IS 'Identificador único da promoção fornecido pela API externa (GamerPower/Epic)';
COMMENT ON COLUMN public.free_games_history.title IS 'Título do jogo gratuito';
COMMENT ON COLUMN public.free_games_history.platform IS 'Plataformas elegíveis (ex: PC, Steam, Epic Games, GOG, Prime)';
COMMENT ON COLUMN public.free_games_history.worth IS 'Valor comercial original antes da gratuidade (ex: $19.99, R$ 99,00)';
COMMENT ON COLUMN public.free_games_history.giveaway_url IS 'Link direto para resgate da oferta na loja';
COMMENT ON COLUMN public.free_games_history.image_url IS 'URL da imagem ou banner promocional do jogo';
COMMENT ON COLUMN public.free_games_history.expires_at IS 'Data/hora estimada de encerramento da gratuidade';
COMMENT ON COLUMN public.free_games_history.posted_at IS 'Data/hora em que o alerta foi disparado com sucesso no Discord';

-- 2. ÍNDICES DE ALTA PERFORMANCE
-- Índice exclusivo para busca instantânea por deal_id durante as varreduras de rotina
CREATE UNIQUE INDEX IF NOT EXISTS idx_free_games_history_deal_id
    ON public.free_games_history (deal_id);

-- Índice por data de postagem para ordenação e relatórios
CREATE INDEX IF NOT EXISTS idx_free_games_history_posted_at
    ON public.free_games_history (posted_at DESC);

-- 3. SEGURANÇA E POLÍTICAS RLS (ROW LEVEL SECURITY)
ALTER TABLE public.free_games_history ENABLE ROW LEVEL SECURITY;

-- 3.1 Permitir leitura pública (para dashboards da comunidade ou componentes front-end futuros)
DROP POLICY IF EXISTS "Permitir leitura publica de jogos gratis" ON public.free_games_history;
CREATE POLICY "Permitir leitura publica de jogos gratis"
    ON public.free_games_history
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- 3.2 Permitir inserção, atualização e exclusão apenas para service_role (bots e automações)
DROP POLICY IF EXISTS "Permitir gravacao apenas para service_role" ON public.free_games_history;
CREATE POLICY "Permitir gravacao apenas para service_role"
    ON public.free_games_history
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
