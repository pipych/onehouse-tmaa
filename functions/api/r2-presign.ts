import { S3Client } from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';

function getS3Client(env: any) {
  const accountId = env.R2_ACCOUNT_ID || (typeof process !== 'undefined' ? process.env?.R2_ACCOUNT_ID : '') || '';
  const accessKeyId = env.R2_ACCESS_KEY_ID || (typeof process !== 'undefined' ? process.env?.R2_ACCESS_KEY_ID : '') || '';
  const secretAccessKey = env.R2_SECRET_ACCESS_KEY || (typeof process !== 'undefined' ? process.env?.R2_SECRET_ACCESS_KEY : '') || '';

  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

export async function onRequestPost(context: any) {
  try {
    const { request, env } = context;
    const body = (await request.json()) as { key?: string };
    const key = body.key;
    if (!key) {
      return Response.json({ error: 'key is required' }, { status: 400 });
    }

    const bucket = env.R2_BUCKET_NAME || (typeof process !== 'undefined' ? process.env?.R2_BUCKET_NAME : '') || 'onelaunch-mods';
    const s3 = getS3Client(env);

    const { url, fields } = await createPresignedPost(s3, {
      Bucket: bucket,
      Key: key,
      Expires: 600,
      Conditions: [
        ['content-length-range', 0, 500 * 1024 * 1024], // 500 MB max
      ],
    });

    return Response.json({ url, fields, key });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
