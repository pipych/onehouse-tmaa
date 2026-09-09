import { supabase } from './supabase';
import { getCurrentSeasonName } from './season';

export interface TreasuryTransaction {
  id: string;
  created_at: string;
  amount: number;
  type: 'deposit' | 'withdrawal';
  description: string;
  author_name: string;
  author_tg_id: number | null;
  season?: string;
}

const TABLE = 'treasury_transactions';

export async function getBalance(season?: string): Promise<number> {
  let query = supabase.from(TABLE).select('amount, type');
  const seasonName = season || await getCurrentSeasonName();
  query = query.eq('season', seasonName);

  const { data, error } = await query;

  if (error) {
    // Если колонки season нет — фолбэк без фильтра
    const { data: fallback } = await supabase.from(TABLE).select('amount, type');
    return (fallback || []).reduce((sum, t) => sum + (t.type === 'deposit' ? t.amount : -t.amount), 0);
  }

  return (data || []).reduce((sum, t) => {
    return sum + (t.type === 'deposit' ? t.amount : -t.amount);
  }, 0);
}

export async function getTransactions(limit = 20, season?: string): Promise<TreasuryTransaction[]> {
  let query = supabase.from(TABLE).select('*').order('created_at', { ascending: false }).limit(limit);
  const seasonName = season || await getCurrentSeasonName();
  query = query.eq('season', seasonName);

  const { data, error } = await query;

  if (error) {
    // Фолбэк без фильтра по сезону
    const { data: fallback } = await supabase.from(TABLE).select('*').order('created_at', { ascending: false }).limit(limit);
    return fallback || [];
  }

  return data || [];
}

export async function addTransaction(tx: {
  amount: number;
  type: 'deposit' | 'withdrawal';
  description: string;
  author_name: string;
  author_tg_id?: number;
}): Promise<TreasuryTransaction | null> {
  const season = await getCurrentSeasonName();

  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      amount: tx.amount,
      type: tx.type,
      description: tx.description,
      author_name: tx.author_name,
      author_tg_id: tx.author_tg_id ?? null,
      season,
    })
    .select()
    .single();

  if (error) {
    // Фолбэк без season колонки
    if (error.message?.includes('season')) {
      const { data: fallback } = await supabase
        .from(TABLE)
        .insert({
          amount: tx.amount,
          type: tx.type,
          description: tx.description,
          author_name: tx.author_name,
          author_tg_id: tx.author_tg_id ?? null,
        })
        .select()
        .single();

      if (fallback) return fallback;
    }
    console.error('addTransaction error:', error);
    return null;
  }

  return data;
}

export async function deleteTransaction(id: string): Promise<boolean> {
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq('id', id);

  if (error) {
    console.error('deleteTransaction error:', error);
    return false;
  }

  return true;
}
