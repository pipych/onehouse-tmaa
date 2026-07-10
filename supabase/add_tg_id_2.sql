-- Добавляем второе поле Telegram ID в players
ALTER TABLE players ADD COLUMN IF NOT EXISTS tg_id_2 BIGINT;
