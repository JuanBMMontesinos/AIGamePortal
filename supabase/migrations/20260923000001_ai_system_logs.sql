-- ==============================================================================
-- PROJETO: Made By AI Games (Fase 1 - Sistema Centralizado de Logs & Auditoria IA)
-- MIGRATION: 20260923000001_ai_system_logs.sql
-- DESCRIÇÃO: Tabela centralizada para telemetria de IA, redes sociais e pipelines,
--            com RLS estrito, índices parciais e RPC de retenção automática.
-- DIALETO: PostgreSQL 15+ / Supabase
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. TABELA CENTRALIZADA DE LOGS & AUDITORIA DE IA
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_system_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    service TEXT NOT NULL,
    action TEXT NOT NULL,
    level TEXT NOT NULL CHECK (level IN ('info', 'warn', 'error', 'critical')),
    status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'skipped', 'aborted', 'retry_exhausted')),
    task_completed BOOLEAN NOT NULL DEFAULT false,
    failure_reason_code TEXT,
    message TEXT NOT NULL,
    error_details TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_retryable BOOLEAN NOT NULL DEFAULT false,
    repeat_count INTEGER NOT NULL DEFAULT 1,
    resolved_at TIMESTAMPTZ,
    resolved_by TEXT,
    CONSTRAINT chk_ai_logs_error_details_length CHECK (error_details IS NULL OR char_length(error_details) <= 4000)
);

COMMENT ON TABLE public.ai_system_logs IS
    'Tabela centralizada de telemetria, erros e auditoria dos motores de IA e automações do portal.';

COMMENT ON COLUMN public.ai_system_logs.service IS
    'Identificador do serviço ou agente de IA (ex: ai_writer, ai_embedding, social_telegram, rss_scraper).';

COMMENT ON COLUMN public.ai_system_logs.action IS
    'Ação executada no pipeline (ex: article_rewrite, embedding_generation, publish_post).';

COMMENT ON COLUMN public.ai_system_logs.level IS
    'Nível de severidade do registro: info, warn, error ou critical.';

COMMENT ON COLUMN public.ai_system_logs.status IS
    'Status de conclusão da operação: success, failed, skipped, aborted, retry_exhausted.';

COMMENT ON COLUMN public.ai_system_logs.task_completed IS
    'Flag booleana principal para rastrear tarefas que a IA não conseguiu concluir.';

COMMENT ON COLUMN public.ai_system_logs.failure_reason_code IS
    'Código unificado do motivo de falha (ex: GEMINI_QUOTA_EXCEEDED, CONTENT_TOO_SHORT).';

COMMENT ON COLUMN public.ai_system_logs.message IS
    'Mensagem legível higienizada livre de segredos e caracteres de log injection.';

COMMENT ON COLUMN public.ai_system_logs.error_details IS
    'Detalhes técnicos ou stack trace sanitizado, defensivamente truncado em até 4000 caracteres.';

COMMENT ON COLUMN public.ai_system_logs.metadata IS
    'Metadados contextuais em JSONB (URLs, durações, modelos utilizados, tentativas).';

COMMENT ON COLUMN public.ai_system_logs.repeat_count IS
    'Contador para de-duplicação de erros repetidos no mesmo minuto.';

-- ------------------------------------------------------------------------------
-- 2. ÍNDICES DE ALTA PERFORMANCE
-- ------------------------------------------------------------------------------

-- Ordenação cronológica para painéis e auditoria
CREATE INDEX IF NOT EXISTS idx_ai_logs_created_at
    ON public.ai_system_logs (created_at DESC);

-- Filtro composto rápido por serviço, severidade e status
CREATE INDEX IF NOT EXISTS idx_ai_logs_service_status
    ON public.ai_system_logs (service, level, status);

-- Índice parcial crucial para identificar rapidamente tarefas não concluídas pela IA
CREATE INDEX IF NOT EXISTS idx_ai_logs_incomplete_tasks
    ON public.ai_system_logs (created_at DESC)
    WHERE task_completed = false;

-- Índice para agrupamentos analíticos de causas-raiz de falhas
CREATE INDEX IF NOT EXISTS idx_ai_logs_failure_reason
    ON public.ai_system_logs (failure_reason_code)
    WHERE failure_reason_code IS NOT NULL;

-- ------------------------------------------------------------------------------
-- 3. HARDENING DE ROW LEVEL SECURITY (RLS)
-- ------------------------------------------------------------------------------

ALTER TABLE public.ai_system_logs ENABLE ROW LEVEL SECURITY;

-- Revoga explicitamente permissões públicas e autenticadas para evitar vazamento de telemetria
REVOKE ALL ON public.ai_system_logs FROM anon, authenticated;

-- Garante privilégios exclusivamente para a role service_role
GRANT ALL ON public.ai_system_logs TO service_role;

DROP POLICY IF EXISTS "Permitir acesso completo a ai_system_logs apenas para service_role" ON public.ai_system_logs;
CREATE POLICY "Permitir acesso completo a ai_system_logs apenas para service_role"
    ON public.ai_system_logs
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 4. FUNÇÃO RPC DE FAXINA / RETENÇÃO DE LOGS (ANTI-INCHAÇO)
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.purge_old_system_logs(days_to_keep INT DEFAULT 30)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    deleted_count INT;
BEGIN
    IF days_to_keep < 1 THEN
        RAISE EXCEPTION 'days_to_keep deve ser maior ou igual a 1';
    END IF;

    DELETE FROM public.ai_system_logs
    WHERE created_at < (now() - (days_to_keep || ' days')::INTERVAL);

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;

COMMENT ON FUNCTION public.purge_old_system_logs(INT) IS
    'Expurga logs de sistema e IA mais antigos que o limite de dias estipulado (padrão 30 dias).';

-- Blindagem de acesso à função de retenção
REVOKE ALL ON FUNCTION public.purge_old_system_logs(INT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.purge_old_system_logs(INT) TO service_role;
