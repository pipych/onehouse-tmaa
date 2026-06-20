import { createClient } from '@supabase/supabase-js';

// Вставь сюда свои данные прямо текстом в кавычках:
const supabaseUrl = "https://supabase.com/dashboard/project/sxdswqgoqgvkmdknqzir"; 
const supabaseAnonKey = "sb_publishable_7_PN5q0F5n9wdnnSm4xiLQ_vHEftQL9";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
