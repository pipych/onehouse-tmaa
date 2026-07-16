import { NextRequest, NextResponse } from 'next/server';
import { S3Client } from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';

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
    const { key } = await request.json();
    if (!key) {
      return NextResponse.json({ error: 'key is required' }, { status: 400 });
    }

    // Presigned POST — multipart/form-data upload avoids CORS preflight
    const { url, fields } = await createPresignedPost(s3, {
      Bucket: R2_BUCKET,
      Key: key,
      Expires: 600,
      Conditions: [
        ['content-length-range', 0, 500 * 1024 * 1024], // 500 MB max
      ],
    });

    return NextResponse.json({ url, fields, key });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
