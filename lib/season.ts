import { supabase } from './supabase';

export interface SeasonState {
  season_number: number;
  season_start_date: string;
  is_active: boolean;
}

export interface PastSeason {
  id: number;
  season_number: number;
  start_date: string;
  end_date: string;
  days_count: number;
  ended_at: string;
}

export async function getSeasonState(): Promise<SeasonState> {
  const { data, error } = await supabase
    .from('season_state')
    .select('*')
    .eq('id', 1)
    .single();

  if (error || !data) {
    // Fallback: defaults
    return { season_number: 1, season_start_date: '2026-05-17', is_active: true };
  }

  return {
    season_number: data.season_number,
    season_start_date: data.season_start_date,
    is_active: data.is_active,
  };
}

export async function endSeason(): Promise<boolean> {
  // Получаем текущее состояние
  const state = await getSeasonState();
  if (!state.is_active) return false;

  const startMs = new Date(state.season_start_date).getTime();
  const endMs = Date.now();
  const daysCount = Math.floor((endMs - startMs) / (1000 * 60 * 60 * 24));

  // Сохраняем в past_seasons
  const { error: insertError } = await supabase
    .from('past_seasons')
    .insert({
      season_number: state.season_number,
      start_date: state.season_start_date,
      end_date: new Date().toISOString().split('T')[0],
      days_count: daysCount,
    });

  if (insertError) {
    console.error('endSeason insert error:', insertError);
    return false;
  }

  // Помечаем как неактивный
  const { error: updateError } = await supabase
    .from('season_state')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', 1);

  if (updateError) {
    console.error('endSeason update error:', updateError);
    return false;
  }

  return true;
}

export async function undoEndSeason(): Promise<boolean> {
  const state = await getSeasonState();
  if (state.is_active) return false; // Уже активен

  // Находим последний завершённый сезон
  const { data: lastSeason, error: fetchError } = await supabase
    .from('past_seasons')
    .select('*')
    .order('id', { ascending: false })
    .limit(1)
    .single();

  if (fetchError || !lastSeason) {
    console.error('undoEndSeason fetch error:', fetchError);
    return false;
  }

  // Удаляем из past_seasons
  const { error: deleteError } = await supabase
    .from('past_seasons')
    .delete()
    .eq('id', lastSeason.id);

  if (deleteError) {
    console.error('undoEndSeason delete error:', deleteError);
    return false;
  }

  // Восстанавливаем активность
  const { error: updateError } = await supabase
    .from('season_state')
    .update({
      is_active: true,
      season_number: lastSeason.season_number,
      season_start_date: lastSeason.start_date,
      updated_at: new Date().toISOString(),
    })
    .eq('id', 1);

  if (updateError) {
    console.error('undoEndSeason update error:', updateError);
    return false;
  }

  return true;
}

export async function getLastEndedSeason(): Promise<PastSeason | null> {
  const { data, error } = await supabase
    .from('past_seasons')
    .select('*')
    .order('id', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;
  return data;
}
