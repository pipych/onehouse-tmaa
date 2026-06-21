import { NextResponse } from 'next/server';

export async function GET() {
  const token = process.env.EXAROTON_API_TOKEN;
  const serverId = process.env.EXAROTON_SERVER_ID;

  if (!token || !serverId) {
    return NextResponse.json({ error: 'Не настроены ключи API в Vercel' }, { status: 500 });
  }

  try {
    const headers = { Authorization: `Bearer ${token}` };
    
    // Запрашиваем параллельно статус сервера и информацию об аккаунте (где лежат кредиты)
    const [serverRes, accountRes] = await Promise.all([
      fetch(`https://api.exaroton.com/v1/servers/${serverId}`, { headers, cache: 'no-store' }),
      fetch(`https://api.exaroton.com/v1/account`, { headers, cache: 'no-store' })
    ]);
    
    const serverData = await serverRes.json();
    const accountData = await accountRes.json();
    
    return NextResponse.json({
      success: true,
      data: {
        server: serverData.data,
        credits: accountData.data?.credits || 0
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка связи с Exaroton' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const token = process.env.EXAROTON_API_TOKEN;
  const serverId = process.env.EXAROTON_SERVER_ID;
  
  if (!token || !serverId) {
    return NextResponse.json({ error: 'Не настроены ключи API в Vercel' }, { status: 500 });
  }

  try {
    const body = await req.json();
    const action = body.action;

    const res = await fetch(`https://api.exaroton.com/v1/servers/${serverId}/${action}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка выполнения команды' }, { status: 500 });
  }
}
