import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env && import.meta.env.VITE_SUPABASE_URL) || "https://sxdswqgoqgvkmdknqzir.supabase.co";
const supabaseAnonKey = (import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY) || "sb_publishable_7_PN5q0F5n9wdnnSm4xiLQ_vHEftQL9";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
