-- ============================================================================
-- МИГРАЦИЯ: players + characters + get_active_character RPC
-- Выполнить в Supabase Dashboard → SQL Editor
-- ============================================================================

-- 1. Таблица players (одна запись на Telegram ID, роли здесь — не сбрасываются между сезонами)
CREATE TABLE IF NOT EXISTS players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tg_id BIGINT NOT NULL,
  tg_username TEXT NOT NULL DEFAULT '',
  avatar_url TEXT NOT NULL DEFAULT '',
  roles TEXT[] NOT NULL DEFAULT ARRAY['citizen'],
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tg_id)
);

-- 2. Таблица characters (персонаж на сезон)
CREATE TABLE IF NOT EXISTS characters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  mc_nickname TEXT NOT NULL DEFAULT '',
  rp_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT NOT NULL DEFAULT '',
  party TEXT NOT NULL DEFAULT 'Нет партии',
  season TEXT NOT NULL DEFAULT 'Сезон 2',
  status TEXT NOT NULL DEFAULT 'alive',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. RLS
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on players" ON players FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on characters" ON characters FOR ALL USING (true) WITH CHECK (true);

-- 4. RPC: получить активного персонажа игрока для текущего сезона
CREATE OR REPLACE FUNCTION get_active_character(p_player_id UUID)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_season_number INT;
  v_season_name TEXT;
  v_char_id UUID;
BEGIN
  -- Получаем номер текущего сезона
  SELECT season_number INTO v_season_number
  FROM season_state WHERE id = 1 AND is_active = true;

  IF v_season_number IS NULL THEN
    RETURN NULL;
  END IF;

  v_season_name := 'Сезон ' || v_season_number;

  -- Ищем живого персонажа в текущем сезоне
  SELECT id INTO v_char_id
  FROM characters
  WHERE player_id = p_player_id
    AND season = v_season_name
    AND status = 'alive'
  ORDER BY created_at ASC
  LIMIT 1;

  RETURN v_char_id;
END;
$$;

-- 5. Миграция данных: перенос из users в players + characters
-- (если таблица users существует и в ней есть данные)
DO $$
DECLARE
  u RECORD;
  v_player_id UUID;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
    FOR u IN SELECT * FROM users LOOP
      -- Создаём игрока если ещё нет
      INSERT INTO players (tg_id, tg_username, avatar_url, roles)
      VALUES (u.tg_id, u.tg_username, u.avatar_url, COALESCE(u.roles, ARRAY['citizen']))
      ON CONFLICT (tg_id) DO UPDATE SET
        roles = COALESCE(players.roles, ARRAY['citizen']) || COALESCE(EXCLUDED.roles, ARRAY[]::TEXT[]),
        avatar_url = CASE WHEN EXCLUDED.avatar_url != '' THEN EXCLUDED.avatar_url ELSE players.avatar_url END
      RETURNING id INTO v_player_id;

      -- Если ON CONFLICT не вернул id — получаем его
      IF v_player_id IS NULL THEN
        SELECT id INTO v_player_id FROM players WHERE tg_id = u.tg_id;
      END IF;

      -- Создаём персонажа для текущего сезона (если ещё нет)
      IF NOT EXISTS (
        SELECT 1 FROM characters 
        WHERE player_id = v_player_id 
          AND season = 'Сезон ' || (SELECT season_number FROM season_state WHERE id = 1)
      ) THEN
        INSERT INTO characters (player_id, mc_nickname, rp_name, avatar_url, party, season)
        VALUES (
          v_player_id,
          u.mc_nickname,
          u.rp_name,
          u.avatar_url,
          COALESCE(u.party, 'Нет партии'),
          'Сезон ' || (SELECT season_number FROM season_state WHERE id = 1)
        );
      END IF;
    END LOOP;
  END IF;
END $$;
