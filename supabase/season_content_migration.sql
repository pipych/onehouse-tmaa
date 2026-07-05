-- Миграция: привязка контента к сезонам + exaroton_server_id
-- Добавляет season во все контентные таблицы и server_id в season_state

-- Посты (медиа)
ALTER TABLE posts ADD COLUMN IF NOT EXISTS season TEXT NOT NULL DEFAULT 'Сезон 2';

-- Конституция (законы)
ALTER TABLE constitution ADD COLUMN IF NOT EXISTS season TEXT NOT NULL DEFAULT 'Сезон 2';

-- События таймлайна
ALTER TABLE timeline_events ADD COLUMN IF NOT EXISTS season TEXT NOT NULL DEFAULT 'Сезон 2';

-- Транзакции казны
ALTER TABLE treasury_transactions ADD COLUMN IF NOT EXISTS season TEXT NOT NULL DEFAULT 'Сезон 2';

-- ID сервера Exaroton для сезона
ALTER TABLE season_state ADD COLUMN IF NOT EXISTS exaroton_server_id TEXT;
