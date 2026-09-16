-- ==============================================================================
-- PROJETO: AIGamePortal (Fase 4 - Painel Administrativo do Discord)
-- DESCRIÇÃO: Tabela de controle, parâmetros e bloqueio de envio de alertas Discord
-- DIALETO: PostgreSQL 15+ / Supabase
-- EXECUÇÃO: Cole e execute este script no Supabase SQL Editor.
-- ==============================================================================

-- 1. TABELA DE CONFIGURAÇÕES E ESTADO DO DISCORD BOT
CREATE TABLE IF NOT EXISTS public.discord_settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    is_deals_enabled BOOLEAN NOT NULL DEFAULT false,
    is_news_enabled BOOLEAN NOT NULL DEFAULT false,
    deals_disabled_reason TEXT DEFAULT 'Envio de jogos grátis pausado pelo administrador',
    news_disabled_reason TEXT DEFAULT 'Envio de breaking news pausado pelo administrador',
    deals_webhook_url TEXT,
    news_webhook_url TEXT,
    last_deals_dispatched_at TIMESTAMPTZ,
    last_deals_dispatch_status TEXT NOT NULL DEFAULT 'idle' CHECK (last_deals_dispatch_status IN ('idle', 'success', 'failed', 'skipped')),
    last_deals_dispatch_log TEXT,
    last_news_dispatched_at TIMESTAMPTZ,
    last_news_dispatch_status TEXT NOT NULL DEFAULT 'idle' CHECK (last_news_dispatch_status IN ('idle', 'success', 'failed', 'skipped')),
    last_news_dispatch_log TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.discord_settings IS 'Parâmetros globais de controle e habilitação de alertas no Discord do AIGamePortal';
COMMENT ON COLUMN public.discord_settings.is_deals_enabled IS 'Chave mestre de envio de jogos grátis (false = envios pausados, true = liberados)';
COMMENT ON COLUMN public.discord_settings.is_news_enabled IS 'Chave mestre de envio de breaking news 5/5 (false = envios pausados, true = liberados)';
COMMENT ON COLUMN public.discord_settings.deals_disabled_reason IS 'Motivo registrado para a pausa dos envios de jogos grátis';
COMMENT ON COLUMN public.discord_settings.news_disabled_reason IS 'Motivo registrado para a pausa dos envios de breaking news';
COMMENT ON COLUMN public.discord_settings.last_deals_dispatch_status IS 'Status da última execução do cron de deals: idle, success, failed ou skipped';
COMMENT ON COLUMN public.discord_settings.last_news_dispatch_status IS 'Status do último envio de breaking news';

-- Trigger de updated_at
DROP TRIGGER IF EXISTS trigger_discord_settings_updated_at ON public.discord_settings;
CREATE TRIGGER trigger_discord_settings_updated_at
    BEFORE UPDATE ON public.discord_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 2. REGISTRO INICIAL PADRÃO (AMBOS DESABILITADOS POR PADRÃO DE SEGURANÇA)
INSERT INTO public.discord_settings (
    id,
    is_deals_enabled,
    is_news_enabled,
    deals_disabled_reason,
    news_disabled_reason
)
VALUES (
    'default',
    false,
    false,
    'Envio de jogos grátis pausado pelo administrador',
    'Envio de breaking news pausado pelo administrador'
)
ON CONFLICT (id) DO NOTHING;

-- 3. POLÍTICAS DE SEGURANÇA RLS
ALTER TABLE public.discord_settings ENABLE ROW LEVEL SECURITY;

-- 3.1 Permitir leitura pública/autenticada para conferência de status
DROP POLICY IF EXISTS "Permitir leitura de settings do discord" ON public.discord_settings;
CREATE POLICY "Permitir leitura de settings do discord"
    ON public.discord_settings
    FOR SELECT
    TO anon, authenticated, service_role
    USING (true);

-- 3.2 Modificação restrita exclusivamente para o service_role (rotas admin protegidas)
DROP POLICY IF EXISTS "Permitir alteracao de settings discord apenas para service_role" ON public.discord_settings;
CREATE POLICY "Permitir alteracao de settings discord apenas para service_role"
    ON public.discord_settings
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
