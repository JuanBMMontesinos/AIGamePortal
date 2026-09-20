-- ==============================================================================
-- PROJETO: AIGamePortal (Fase 4 - Painel Administrativo de Redes Sociais)
-- DESCRIÇÃO: Tabela de controle, parâmetros e bloqueio de disparos no X e Telegram
-- DIALETO: PostgreSQL 15+ / Supabase
-- EXECUÇÃO: Cole e execute este script no Supabase SQL Editor.
-- ==============================================================================

-- 1. TABELA DE CONFIGURAÇÕES E ESTADO DAS REDES SOCIAIS
CREATE TABLE IF NOT EXISTS public.social_settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    is_twitter_enabled BOOLEAN NOT NULL DEFAULT false,
    is_telegram_enabled BOOLEAN NOT NULL DEFAULT true,
    twitter_disabled_reason TEXT DEFAULT 'Aguardando recarga de créditos no X Developer Portal',
    telegram_disabled_reason TEXT,
    last_twitter_dispatched_at TIMESTAMPTZ,
    last_twitter_dispatch_status TEXT NOT NULL DEFAULT 'idle' CHECK (last_twitter_dispatch_status IN ('idle', 'success', 'failed', 'skipped')),
    last_twitter_dispatch_log TEXT,
    last_telegram_dispatched_at TIMESTAMPTZ,
    last_telegram_dispatch_status TEXT NOT NULL DEFAULT 'idle' CHECK (last_telegram_dispatch_status IN ('idle', 'success', 'failed', 'skipped')),
    last_telegram_dispatch_log TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.social_settings IS 'Parâmetros globais de controle e habilitação de postagens em redes sociais (X/Twitter e Telegram) do AIGamePortal';
COMMENT ON COLUMN public.social_settings.is_twitter_enabled IS 'Chave mestre de envio para o X/Twitter (false = envios pausados/sem créditos, true = liberados)';
COMMENT ON COLUMN public.social_settings.is_telegram_enabled IS 'Chave mestre de envio para o canal do Telegram (false = pausado, true = liberado)';
COMMENT ON COLUMN public.social_settings.twitter_disabled_reason IS 'Motivo registrado para a pausa dos envios para o X/Twitter';
COMMENT ON COLUMN public.social_settings.telegram_disabled_reason IS 'Motivo registrado para a pausa dos envios para o Telegram';
COMMENT ON COLUMN public.social_settings.last_twitter_dispatch_status IS 'Status do último disparo no X: idle, success, failed ou skipped';
COMMENT ON COLUMN public.social_settings.last_telegram_dispatch_status IS 'Status do último disparo no Telegram: idle, success, failed ou skipped';

-- Trigger de updated_at
DROP TRIGGER IF EXISTS trigger_social_settings_updated_at ON public.social_settings;
CREATE TRIGGER trigger_social_settings_updated_at
    BEFORE UPDATE ON public.social_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 2. REGISTRO INICIAL PADRÃO (TWITTER DESABILITADO POR PADRÃO DE SEGURANÇA)
INSERT INTO public.social_settings (
    id,
    is_twitter_enabled,
    is_telegram_enabled,
    twitter_disabled_reason
)
VALUES (
    'default',
    false,
    true,
    'Aguardando recarga de créditos no X Developer Portal'
)
ON CONFLICT (id) DO NOTHING;

-- 3. POLÍTICAS DE SEGURANÇA RLS
ALTER TABLE public.social_settings ENABLE ROW LEVEL SECURITY;

-- 3.1 Permitir leitura pública/autenticada para conferência de status
DROP POLICY IF EXISTS "Permitir leitura de settings de redes sociais" ON public.social_settings;
CREATE POLICY "Permitir leitura de settings de redes sociais"
    ON public.social_settings
    FOR SELECT
    TO anon, authenticated, service_role
    USING (true);

-- 3.2 Modificação restrita exclusivamente para o service_role (rotas admin protegidas)
DROP POLICY IF EXISTS "Permitir alteracao de settings de redes sociais apenas para service_role" ON public.social_settings;
CREATE POLICY "Permitir alteracao de settings de redes sociais apenas para service_role"
    ON public.social_settings
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
