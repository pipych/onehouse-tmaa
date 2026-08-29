-- ============================================================================
-- SUPABASE KEEPALIVE & INACTIVITY PREVENTION SETUP
-- ============================================================================
-- Supabase Free Tier автоматически приостанавливает проекты после 7 дней неактивности.
-- В этом проекте активность поддерживается автоматически через 2 независимых механизма:
--
-- 1. Vercel Cron (/api/keepalive каждые 3 дня по расписанию "0 8 */3 * *")
-- 2. GitHub Actions (.github/workflows/supabase-keepalive.yml каждые 3 дня по расписанию "0 6 */3 * *")
--
-- Запросы обращаются к REST API / PostgREST, что регистрируется шлюзом Supabase
-- и сбрасывает счетчик неактивности.
-- ============================================================================

-- Опционально: таблица для логирования пингов активности (если потребуется в будущем)
CREATE TABLE IF NOT EXISTS keepalive_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source TEXT NOT NULL DEFAULT 'cron',
    pinged_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    details JSONB DEFAULT '{}'::jsonb
);

ALTER TABLE keepalive_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on keepalive_logs" ON keepalive_logs
    FOR ALL USING (true) WITH CHECK (true);
