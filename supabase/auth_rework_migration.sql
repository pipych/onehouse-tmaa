-- ============================================================================
-- МИГРАЦИЯ: Полная переделка авторизации
-- Профиль = Minecraft никнейм, персонажи = по сезонам со своими ролями
-- Выполнить в Supabase Dashboard → SQL Editor
-- ВНИМАНИЕ: эта миграция удаляет старые таблицы и создаёт новые.
-- Если нужно сохранить старые данные — сделай бэкап перед выполнением.
-- ============================================================================

-- 1. Удаляем старые таблицы (осторожно!)
DROP TABLE IF EXISTS characters CASCADE;
DROP TABLE IF EXISTS players CASCADE;

-- 2. Таблица players — основной профиль по Minecraft никнейму
-- Один игрок = один Minecraft аккаунт. tg_id связывает с Telegram.
CREATE TABLE players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mc_nickname TEXT NOT NULL UNIQUE,       -- Minecraft ник — уникальный идентификатор
  tg_id BIGINT UNIQUE,                    -- Telegram ID для авторизации (может быть NULL пока не привязан)
  tg_username TEXT DEFAULT '',            -- Telegram username для отображения
  avatar_url TEXT DEFAULT '',             -- Аватар профиля
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Таблица characters — персонажи игрока по сезонам
-- У каждого персонажа свои роли, имя, партия, статус
CREATE TABLE characters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  rp_name TEXT NOT NULL DEFAULT '',       -- RP-имя персонажа в этом сезоне
  mc_nickname TEXT NOT NULL DEFAULT '',   -- Дублируем для удобства запросов
  avatar_url TEXT DEFAULT '',             -- Аватар персонажа (может отличаться от профиля)
  party TEXT DEFAULT 'Нет партии',        -- Партия в этом сезоне
  roles TEXT[] DEFAULT ARRAY['citizen'],  -- Роли персонажа (свои на каждый сезон!)
  season TEXT NOT NULL,                   -- К какому сезону относится
  status TEXT DEFAULT 'alive',            -- alive / dead
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Индексы для быстрых запросов
CREATE INDEX IF NOT EXISTS idx_characters_player_id ON characters(player_id);
CREATE INDEX IF NOT EXISTS idx_characters_season ON characters(season);
CREATE INDEX IF NOT EXISTS idx_players_tg_id ON players(tg_id);
CREATE INDEX IF NOT EXISTS idx_players_mc_nickname ON players(mc_nickname);

-- 5. RLS
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on players" ON players FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on characters" ON characters FOR ALL USING (true) WITH CHECK (true);

-- 6. RPC: получить активного персонажа игрока для текущего сезона
CREATE OR REPLACE FUNCTION get_active_character(p_player_id UUID)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_season_number INT;
  v_season_name TEXT;
  v_char_id UUID;
BEGIN
  SELECT season_number INTO v_season_number
  FROM season_state WHERE id = 1 AND is_active = true;

  IF v_season_number IS NULL THEN
    RETURN NULL;
  END IF;

  v_season_name := 'Сезон ' || v_season_number;

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

-- 7. RPC: получить всех персонажей игрока (для админки и профиля)
CREATE OR REPLACE FUNCTION get_player_characters(p_mc_nickname TEXT)
RETURNS TABLE(
  id UUID,
  rp_name TEXT,
  season TEXT,
  roles TEXT[],
  party TEXT,
  status TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT c.id, c.rp_name, c.season, c.roles, c.party, c.status, c.avatar_url, c.created_at
  FROM characters c
  JOIN players p ON c.player_id = p.id
  WHERE p.mc_nickname = p_mc_nickname
  ORDER BY c.created_at DESC;
END;
$$;

-- 8. RPC: создать персонажа для игрока (админская функция)
CREATE OR REPLACE FUNCTION admin_create_character(
  p_mc_nickname TEXT,
  p_rp_name TEXT,
  p_season TEXT,
  p_roles TEXT[] DEFAULT ARRAY['citizen'],
  p_party TEXT DEFAULT 'Нет партии',
  p_avatar_url TEXT DEFAULT ''
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_player_id UUID;
  v_char_id UUID;
BEGIN
  SELECT id INTO v_player_id FROM players WHERE mc_nickname = p_mc_nickname;
  
  IF v_player_id IS NULL THEN
    RAISE EXCEPTION 'Игрок с ником % не найден', p_mc_nickname;
  END IF;

  INSERT INTO characters (player_id, rp_name, mc_nickname, season, roles, party, avatar_url)
  VALUES (v_player_id, p_rp_name, p_mc_nickname, p_season, p_roles, p_party, p_avatar_url)
  RETURNING id INTO v_char_id;

  RETURN v_char_id;
END;
$$;
