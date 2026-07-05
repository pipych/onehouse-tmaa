-- Миграция: привязка контента к сезонам
-- Добавляет season_number во все контентные таблицы

-- Посты (медиа)
ALTER TABLE posts ADD COLUMN IF NOT EXISTS season_number INT NOT NULL DEFAULT 2;

-- Конституция (законы)
ALTER TABLE constitution ADD COLUMN IF NOT EXISTS season_number INT NOT NULL DEFAULT 2;

-- События таймлайна
ALTER TABLE timeline_events ADD COLUMN IF NOT EXISTS season_number INT NOT NULL DEFAULT 2;

-- Транзакции казны
ALTER TABLE treasury_transactions ADD COLUMN IF NOT EXISTS season_number INT NOT NULL DEFAULT 2;
