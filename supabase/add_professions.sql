-- ============================================================================
-- МИГРАЦИЯ: Приводим схему к актуальному состоянию
-- roles → players, professions → characters, таблица professions
-- Выполнить в Supabase Dashboard → SQL Editor
-- ============================================================================

-- 1. Добавляем roles в players (если нет — после auth_rework_migration)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'players' AND column_name = 'roles'
  ) THEN
    ALTER TABLE players ADD COLUMN roles TEXT[] NOT NULL DEFAULT ARRAY['citizen'];
  END IF;
END $$;

-- 2. Убираем roles из characters (если есть — после auth_rework_migration)
--    и переносим не-мёртв роли в профессии
DO $$
DECLARE
  c RECORD;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'characters' AND column_name = 'roles'
  ) THEN
    -- Переносим роли в профессии (кроме citizen и мёртв)
    FOR c IN SELECT id, roles FROM characters WHERE roles IS NOT NULL LOOP
      UPDATE characters 
      SET professions = array_cat(
        COALESCE(professions, ARRAY[]::TEXT[]),
        ARRAY(SELECT unnest(c.roles) WHERE unnest NOT IN ('citizen'))
      )
      WHERE id = c.id;
    END LOOP;
    -- Дропаем колонку roles на characters
    ALTER TABLE characters DROP COLUMN roles;
  END IF;
END $$;

-- 3. Добавляем professions в characters (если ещё нет)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'characters' AND column_name = 'professions'
  ) THEN
    ALTER TABLE characters ADD COLUMN professions TEXT[] DEFAULT ARRAY[]::TEXT[];
  END IF;
END $$;

-- 4. Создаём таблицу professions (список доступных профессий)
CREATE TABLE IF NOT EXISTS professions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT '#c0ff00',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. RLS для professions
ALTER TABLE professions ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Allow all on professions" ON professions FOR ALL USING (true) WITH CHECK (true);

-- 6. Переносим роль "мёртв" в professions (если была в players.roles)
UPDATE characters
SET professions = array_append(COALESCE(professions, ARRAY[]::TEXT[]), 'мёртв'),
    status = 'dead'
WHERE id IN (
  SELECT c.id FROM characters c
  JOIN players p ON c.player_id = p.id
  WHERE 'мёртв' = ANY(p.roles)
)
AND NOT ('мёртв' = ANY(COALESCE(professions, ARRAY[]::TEXT[])));

-- 7. Убираем "мёртв" из players.roles
UPDATE players
SET roles = array_remove(roles, 'мёртв')
WHERE 'мёртв' = ANY(roles);

-- 8. Добавляем дефолтную профессию "мёртв" в таблицу professions
INSERT INTO professions (name, color)
VALUES ('мёртв', '#ef4444')
ON CONFLICT (name) DO NOTHING;
