-- Таблица состояния текущего сезона (синглтон)
CREATE TABLE IF NOT EXISTS season_state (
  id INT PRIMARY KEY DEFAULT 1,
  season_number INT NOT NULL DEFAULT 1,
  season_start_date DATE NOT NULL DEFAULT '2026-05-17',
  is_active BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Таблица завершённых сезонов
CREATE TABLE IF NOT EXISTS past_seasons (
  id SERIAL PRIMARY KEY,
  season_number INT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days_count INT NOT NULL,
  ended_at TIMESTAMPTZ DEFAULT now()
);

-- Начальное состояние: сезон 2, старт 17 мая 2026, активен
INSERT INTO season_state (id, season_number, season_start_date, is_active)
VALUES (1, 2, '2026-05-17', true)
ON CONFLICT (id) DO NOTHING;
