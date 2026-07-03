import { supabase } from './supabase';

const TABLE = 'guest_access';

export async function isGuest(tgId: number): Promise<boolean> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('tg_id')
    .eq('tg_id', tgId)
    .single();

  if (error) return false;
  return !!data;
}

export async function addGuest(tgId: number, addedBy: string): Promise<boolean> {
  const { error } = await supabase
    .from(TABLE)
    .upsert({ tg_id: tgId, added_by: addedBy }, { onConflict: 'tg_id' });

  return !error;
}

export async function removeGuest(tgId: number): Promise<boolean> {
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq('tg_id', tgId);

  return !error;
}

export async function getGuests(): Promise<{ tg_id: number; created_at: string; added_by: string }[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return [];
  return data || [];
}
