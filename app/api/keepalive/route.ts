import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function handleKeepAlive(request: NextRequest) {
  const startTime = Date.now();

  try {
    // 1. Делаем реальный запрос к Supabase (REST API PostgREST)
    // Это регистрируется шлюзом Supabase и сбрасывает счетчик 7-дневной неактивности
    const { data, count, error } = await supabase
      .from('players')
      .select('id, mc_nickname', { count: 'exact' })
      .limit(1);

    const latencyMs = Date.now() - startTime;

    if (error) {
      console.error('[Supabase Keepalive Error]:', error);
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          timestamp: new Date().toISOString(),
          latencyMs,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
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
    console.error('[Supabase Keepalive Exception]:', err);
    return NextResponse.json(
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

export async function GET(request: NextRequest) {
  return handleKeepAlive(request);
}

export async function POST(request: NextRequest) {
  return handleKeepAlive(request);
}
