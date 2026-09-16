-- ==============================================================================
-- PROJETO: AIGamePortal (Fase 3/4 - Painel Administrativo da Newsletter)
-- DESCRIÇÃO: Tabela de controle, parâmetros e bloqueio de envio da newsletter
-- DIALETO: PostgreSQL 15+ / Supabase
-- EXECUÇÃO: Cole e execute este script no Supabase SQL Editor.
-- ==============================================================================

-- 1. TABELA DE CONFIGURAÇÕES E ESTADO DA NEWSLETTER
CREATE TABLE IF NOT EXISTS public.newsletter_settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    is_enabled BOOLEAN NOT NULL DEFAULT false,
    disabled_reason TEXT DEFAULT 'Aguardando configuração e homologação do serviço Resend',
    sender_name TEXT NOT NULL DEFAULT 'AIGamePortal',
    sender_email TEXT NOT NULL DEFAULT 'newsletter@aigameportal.com',
    test_recipient_email TEXT,
    last_dispatched_at TIMESTAMPTZ,
    last_dispatch_status TEXT NOT NULL DEFAULT 'idle' CHECK (last_dispatch_status IN ('idle', 'success', 'failed', 'skipped')),
    last_dispatch_log TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.newsletter_settings IS 'Parâmetros globais de disparo e controle da newsletter semanal do AIGamePortal';
COMMENT ON COLUMN public.newsletter_settings.is_enabled IS 'Chave mestre de envio (false = envios pausados com segurança, true = disparos liberados)';
COMMENT ON COLUMN public.newsletter_settings.disabled_reason IS 'Justificativa administrativa para os disparos estarem pausados';
COMMENT ON COLUMN public.newsletter_settings.last_dispatch_status IS 'Status da última execução: idle, success, failed ou skipped';

-- Trigger de updated_at
DROP TRIGGER IF EXISTS trigger_newsletter_settings_updated_at ON public.newsletter_settings;
CREATE TRIGGER trigger_newsletter_settings_updated_at
    BEFORE UPDATE ON public.newsletter_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 2. REGISTRO INICIAL PADRÃO (DESABILITADO POR PADRÃO)
INSERT INTO public.newsletter_settings (id, is_enabled, disabled_reason)
VALUES (
    'default',
    false,
    'Aguardando configuração e homologação do serviço Resend'
)
ON CONFLICT (id) DO NOTHING;

-- 3. POLÍTICAS DE SEGURANÇA RLS
ALTER TABLE public.newsletter_settings ENABLE ROW LEVEL SECURITY;

-- 3.1 Permitir leitura pública apenas para conferência de status
DROP POLICY IF EXISTS "Permitir leitura de settings da newsletter" ON public.newsletter_settings;
CREATE POLICY "Permitir leitura de settings da newsletter"
    ON public.newsletter_settings
    FOR SELECT
    TO anon, authenticated, service_role
    USING (true);

-- 3.2 Modificação restrita exclusivamente para o service_role
DROP POLICY IF EXISTS "Permitir alteracao de settings apenas para service_role" ON public.newsletter_settings;
CREATE POLICY "Permitir alteracao de settings apenas para service_role"
    ON public.newsletter_settings
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
