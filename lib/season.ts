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
    return { season_number: 2, season_start_date: '2026-05-17', is_active: true };
  }

  return {
    season_number: data.season_number,
    season_start_date: data.season_start_date,
    is_active: data.is_active,
  };
}

/** Все завершённые сезоны (от новых к старым) */
export async function getAllPastSeasons(): Promise<PastSeason[]> {
  const { data, error } = await supabase
    .from('past_seasons')
    .select('*')
    .order('id', { ascending: false });

  if (error || !data) return [];
  return data;
}

/** Завершить текущий сезон */
export async function endSeason(): Promise<boolean> {
  const state = await getSeasonState();
  if (!state.is_active) return false;

  const startMs = new Date(state.season_start_date).getTime();
  const endMs = Date.now();
  const daysCount = Math.floor((endMs - startMs) / (1000 * 60 * 60 * 24));

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

/** Восстановить завершённый сезон как активный */
export async function restorePastSeason(pastSeasonId: number): Promise<boolean> {
  const state = await getSeasonState();

  // Если есть активный сезон — завершаем его сначала
  if (state.is_active) {
    const ended = await endSeason();
    if (!ended) return false;
  }

  // Находим сезон для восстановления
  const { data: past, error: fetchError } = await supabase
    .from('past_seasons')
    .select('*')
    .eq('id', pastSeasonId)
    .single();

  if (fetchError || !past) {
    console.error('restorePastSeason fetch error:', fetchError);
    return false;
  }

  // Удаляем из архива
  const { error: deleteError } = await supabase
    .from('past_seasons')
    .delete()
    .eq('id', past.id);

  if (deleteError) {
    console.error('restorePastSeason delete error:', deleteError);
    return false;
  }

  // Делаем активным
  const { error: updateError } = await supabase
    .from('season_state')
    .update({
      is_active: true,
      season_number: past.season_number,
      season_start_date: past.start_date,
      updated_at: new Date().toISOString(),
    })
    .eq('id', 1);

  if (updateError) {
    console.error('restorePastSeason update error:', updateError);
    return false;
  }

  return true;
}

/** Удалить сезон из архива навсегда */
export async function deletePastSeason(pastSeasonId: number): Promise<boolean> {
  const { error } = await supabase
    .from('past_seasons')
    .delete()
    .eq('id', pastSeasonId);

  if (error) {
    console.error('deletePastSeason error:', error);
    return false;
  }

  return true;
}

/** Начать новый сезон (завершает текущий если активен) */
export async function startNewSeason(): Promise<boolean> {
  const state = await getSeasonState();

  // Если сезон активен — завершаем
  if (state.is_active) {
    const ended = await endSeason();
    if (!ended) return false;
  }

  // Определяем номер нового сезона
  const { data: lastPast } = await supabase
    .from('past_seasons')
    .select('season_number')
    .order('season_number', { ascending: false })
    .limit(1)
    .single();

  const newNumber = (lastPast?.season_number ?? state.season_number) + 1;

  // Активируем новый сезон
  const { error } = await supabase
    .from('season_state')
    .update({
      is_active: true,
      season_number: newNumber,
      season_start_date: new Date().toISOString().split('T')[0],
      updated_at: new Date().toISOString(),
    })
    .eq('id', 1);

  if (error) {
    console.error('startNewSeason error:', error);
    return false;
  }

  return true;
}

/** Отменить завершение (быстрое восстановление последнего) */
export async function undoEndSeason(): Promise<boolean> {
  const state = await getSeasonState();
  if (state.is_active) return false;

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

  const { error: deleteError } = await supabase
    .from('past_seasons')
    .delete()
    .eq('id', lastSeason.id);

  if (deleteError) {
    console.error('undoEndSeason delete error:', deleteError);
    return false;
  }

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
