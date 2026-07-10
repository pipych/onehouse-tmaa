const R2_URL = 'https://pub-f6e5d69d8dfd4ec194b0ebc7b4c3de96.r2.dev/OneLaunch_Setup.exe';

export async function GET() {
  try {
    const res = await fetch(R2_URL);
    if (!res.ok) {
      return new Response('File not found', { status: 404 });
    }
    return new Response(res.body, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': 'attachment; filename="OneLaunch_Setup.exe"',
        'Cache-Control': 'no-cache',
      },
    });
  } catch {
    return new Response('Download failed', { status: 500 });
  }
}
