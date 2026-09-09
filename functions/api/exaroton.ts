// Cloudflare Pages Function: /api/exaroton

interface Env {
  EXAROTON_API_TOKEN?: string;
  EXAROTON_SERVER_ID?: string;
}

function getServerId(request: Request, env: Env): string {
  const url = new URL(request.url);
  const param = url.searchParams.get('serverId');
  if (param) return param;
  const header = request.headers.get('x-exaroton-server-id');
  if (header) return header;
  return env.EXAROTON_SERVER_ID || (typeof process !== 'undefined' ? process.env?.EXAROTON_SERVER_ID : '') || '';
}

function getToken(env: Env): string {
  return env.EXAROTON_API_TOKEN || (typeof process !== 'undefined' ? process.env?.EXAROTON_API_TOKEN : '') || '';
}

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const token = getToken(env);
  const serverId = getServerId(request, env);

  if (!token || !serverId) {
    return Response.json({ error: 'Не настроен API токен или Server ID' }, { status: 500 });
  }

  try {
    const headers = { Authorization: `Bearer ${token}` };

    const [serverRes, accountRes] = await Promise.all([
      fetch(`https://api.exaroton.com/v1/servers/${serverId}`, { headers }),
      fetch(`https://api.exaroton.com/v1/account`, { headers }),
    ]);

    const serverData = await serverRes.json();
    const accountData = await accountRes.json();

    return Response.json({
      success: true,
      data: {
        server: (serverData as any).data,
        credits: (accountData as any).data?.credits || 0,
      },
    });
  } catch (error: any) {
    return Response.json({ error: 'Ошибка запроса к Exaroton: ' + error.message }, { status: 500 });
  }
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const token = getToken(env);
  const serverId = getServerId(request, env);

  if (!token || !serverId) {
    return Response.json({ error: 'Не настроен API токен или Server ID' }, { status: 500 });
  }

  try {
    const body = await request.json() as { action?: string };
    const action = body.action;

    if (!action) {
      return Response.json({ error: 'Действие не указано' }, { status: 400 });
    }

    const res = await fetch(`https://api.exaroton.com/v1/servers/${serverId}/${action}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    return Response.json(data);
  } catch (error: any) {
    return Response.json({ error: 'Ошибка выполнения действия: ' + error.message }, { status: 500 });
  }
}
