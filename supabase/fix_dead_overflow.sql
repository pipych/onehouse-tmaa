-- ============================================================================
-- ФИКС: Убираем "мёртв" с персонажей НЕ текущего сезона
-- Блок 6 миграции ошибочно добавил "мёртв" всем персонажам игрока
-- Выполнить в Supabase Dashboard → SQL Editor
-- ============================================================================

DO $$
DECLARE
    v_season_name TEXT;
BEGIN
    SELECT 'Сезон ' || season_number INTO v_season_name
    FROM season_state WHERE id = 1 AND is_active = true;

    UPDATE characters
    SET professions = array_remove(COALESCE(professions, ARRAY[]::TEXT[]), 'мёртв'),
        status = 'alive'
    WHERE 'мёртв' = ANY(COALESCE(professions, ARRAY[]::TEXT[]))
    AND season != v_season_name;
END $$;
