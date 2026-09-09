// Cloudflare Pages Function: /api/keepalive
import { supabase } from '../../src/lib/supabase';

async function handleKeepAlive() {
  const startTime = Date.now();

  try {
    const { data, count, error } = await supabase
      .from('players')
      .select('id, mc_nickname', { count: 'exact' })
      .limit(1);

    const latencyMs = Date.now() - startTime;

    if (error) {
      console.error('[Supabase Keepalive Error]:', error);
      return Response.json(
        {
          success: false,
          error: error.message,
          timestamp: new Date().toISOString(),
          latencyMs,
        },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      message: 'Supabase keepalive ping successful. Inactivity timer reset.',
      timestamp: new Date().toISOString(),
      latencyMs,
      supabase: {
        status: 'connected',
        samplePlayer: data && data.length > 0 ? data[0].mc_nickname : null,
        totalPlayers: count ?? 0,
      },
    });
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    return Response.json(
      {
        success: false,
        error: err?.message || 'Unknown error occurred during keepalive ping',
        timestamp: new Date().toISOString(),
        latencyMs,
      },
      { status: 500 }
    );
  }
}

export async function onRequestGet() {
  return handleKeepAlive();
}

export async function onRequestPost() {
  return handleKeepAlive();
}
