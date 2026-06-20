import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Если переменных нет (например, при сборке), используем валидный URL-заглушку, чтобы сборщик не падал
export const supabase = createClient(
  supabaseUrl && supabaseUrl.startsWith('http') ? supabaseUrl : 'https://placeholder-project.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);
