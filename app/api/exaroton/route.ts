import { NextRequest, NextResponse } from 'next/server';

function getServerId(req: NextRequest): string {
  // Приоритет: параметр запроса > заголовок > env
  const param = req.nextUrl.searchParams.get('serverId');
  if (param) return param;
  const header = req.headers.get('x-exaroton-server-id');
  if (header) return header;
  return process.env.EXAROTON_SERVER_ID || '';
}

export async function GET(req: NextRequest) {
  const token = process.env.EXAROTON_API_TOKEN;
  const serverId = getServerId(req);

  if (!token || !serverId) {
    return NextResponse.json({ error: 'Не настроен API токен или Server ID' }, { status: 500 });
  }

  try {
    const headers = { Authorization: `Bearer ${token}` };
    
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
    return NextResponse.json({ error: 'Ошибка запроса к Exaroton' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const token = process.env.EXAROTON_API_TOKEN;
  const serverId = getServerId(req);
  
  if (!token || !serverId) {
    return NextResponse.json({ error: 'Не настроен API токен или Server ID' }, { status: 500 });
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
    return NextResponse.json({ error: 'Ошибка выполнения действия' }, { status: 500 });
  }
}
