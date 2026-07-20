import { supabase } from './supabase';

/**
 * Authenticate user by Minecraft nickname.
 * Returns Player object from players table, or null.
 * Used by OneLaunch desktop launcher (non-Telegram flow).
 */
export async function findPlayerByNickname(mcNickname: string) {
  const { data: playerData } = await supabase
    .from('players')
    .select('*')
    .ilike('mc_nickname', mcNickname)
    .limit(1);

  return playerData && playerData.length > 0 ? playerData[0] : null;
}
