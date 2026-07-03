import { supabase } from './supabase';

export interface TreasuryTransaction {
  id: string;
  created_at: string;
  amount: number;
  type: 'deposit' | 'withdrawal';
  description: string;
  author_name: string;
  author_tg_id: number | null;
}

const TABLE = 'treasury_transactions';

export async function getBalance(): Promise<number> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('amount, type');

  if (error) {
    console.error('getBalance error:', error);
    return 0;
  }

  return (data || []).reduce((sum, t) => {
    return sum + (t.type === 'deposit' ? t.amount : -t.amount);
  }, 0);
}

export async function getTransactions(limit = 20): Promise<TreasuryTransaction[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('getTransactions error:', error);
    return [];
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
  const { data, error } = await supabase
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

  if (error) {
    console.error('addTransaction error:', error);
    return null;
  }

  return data;
}
