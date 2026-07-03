-- Выполни этот SQL в Supabase Dashboard → SQL Editor
-- https://sxdswqgoqgvkmdknqzir.supabase.co → SQL Editor

CREATE TABLE IF NOT EXISTS treasury_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  amount INTEGER NOT NULL CHECK (amount > 0),
  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal')),
  description TEXT NOT NULL DEFAULT '',
  author_name TEXT NOT NULL DEFAULT '',
  author_tg_id BIGINT
);

-- RLS: разрешаем всё (приложение с anon key, ты доверяешь своим пользователям)
ALTER TABLE treasury_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all" ON treasury_transactions
  FOR ALL USING (true) WITH CHECK (true);
