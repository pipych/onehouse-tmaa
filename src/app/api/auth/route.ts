import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
  try {
    const { initData } = await request.json();

    if (!initData) {
      return NextResponse.json({ error: 'Открой приложение внутри Telegram бота' }, { status: 400 });
    }

    const params = new URLSearchParams(initData);
    const userString = params.get('user');

    if (!userString) {
      return NextResponse.json({ error: 'Данные Telegram неполные' }, { status: 400 });
    }

    const tgUser = JSON.parse(userString);
    const tgId = tgUser.id;

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('tg_id', tgId)
      .single();

    if (error || !user) {
      return NextResponse.json({ 
        error: `Пользователь с TG ID ${tgId} не найден в базе. Добавь этот ID в таблицу Supabase.` 
      }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (err: any) {
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}
