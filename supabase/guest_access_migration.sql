-- Создание таблицы гостевого доступа
CREATE TABLE IF NOT EXISTS guest_access (
  tg_id BIGINT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  added_by TEXT NOT NULL DEFAULT ''
);

ALTER TABLE guest_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all" ON guest_access
  FOR ALL USING (true) WITH CHECK (true);
