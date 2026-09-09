import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { getR2Client } from '../_shared/r2';

export async function onRequestPost(context: any) {
  try {
    const { request, env } = context;
    const body = (await request.json()) as { key?: string };
    const key = body.key;
    if (!key) {
      return Response.json({ error: 'key is required' }, { status: 400 });
    }

    const { s3, bucket } = getR2Client(env);

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
