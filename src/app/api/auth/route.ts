import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
  try {
    const { initData } = await request.json();
    if (!initData) {
      return NextResponse.json({ error: 'Нет данных авторизации' }, { status: 400 });
    }

    // 1. Валидация хэша Telegram данных
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    urlParams.delete('hash');

    const dataCheckArr: string[] = [];
    urlParams.forEach((value, key) => dataCheckArr.push(`${key}=${value}`));
    dataCheckArr.sort();
    const dataCheckString = dataCheckArr.join('\n');

    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(process.env.TELEGRAM_BOT_TOKEN || '')
      .digest();
    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    if (calculatedHash !== hash) {
      return NextResponse.json({ error: 'Ошибка безопасности: данные подделаны' }, { status: 401 });
    }

    // 2. Парсинг данных пользователя
    const userRaw = urlParams.get('user');
    if (!userRaw) {
      return NextResponse.json({ error: 'Нет данных пользователя' }, { status: 400 });
    }
    const tgUser = JSON.parse(userRaw);

    // 3. Проверка игрока в белом списке Supabase
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('tg_id', tgUser.id)
      .single();

    if (error || !user) {
      return NextResponse.json({ error: 'Тебя нет в белом списке сервера OneHouse' }, { status: 403 });
    }

    // Если всё ок — возвращаем данные игрока с его ролями
    return NextResponse.json({ user });
  } catch (err) {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
