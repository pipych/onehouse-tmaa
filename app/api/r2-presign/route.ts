import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const R2_ACCOUNT_ID = '89476ea08498adb1813b3607c5079df7';
const R2_ACCESS_KEY_ID = '3513b185f8a785a30fb5e77c78203215';
const R2_SECRET_ACCESS_KEY = '4a03f95cb2cfe9be657977c0b58f3dc712bedba0d236c17e545a97a538c0500d';
const R2_BUCKET = 'onelaunch-mods';

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

export async function POST(request: NextRequest) {
  try {
    const { key, contentType } = await request.json();
    if (!key) {
      return NextResponse.json({ error: 'key is required' }, { status: 400 });
    }

    const url = await getSignedUrl(s3, new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      ContentType: contentType || 'application/octet-stream',
    }), { expiresIn: 600 }); // 10 min

    return NextResponse.json({ url, key });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
