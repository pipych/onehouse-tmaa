import { NextRequest, NextResponse } from 'next/server';
import { S3Client } from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!;
const R2_BUCKET = process.env.R2_BUCKET_NAME || 'onelaunch-mods';

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
