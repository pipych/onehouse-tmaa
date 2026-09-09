import { S3Client } from '@aws-sdk/client-s3';

export interface R2Config {
  s3: S3Client;
  bucket: string;
}

export function getR2Client(env: any): R2Config {
  const accountId =
    env?.R2_ACCOUNT_ID ||
    env?.CLOUDFLARE_ACCOUNT_ID ||
    env?.ACCOUNT_ID ||
    (typeof process !== 'undefined' ? (process.env?.R2_ACCOUNT_ID || process.env?.CLOUDFLARE_ACCOUNT_ID || process.env?.ACCOUNT_ID) : '') ||
    '';

  const accessKeyId =
    env?.R2_ACCESS_KEY_ID ||
    env?.AWS_ACCESS_KEY_ID ||
    env?.ACCESS_KEY_ID ||
    (typeof process !== 'undefined' ? (process.env?.R2_ACCESS_KEY_ID || process.env?.AWS_ACCESS_KEY_ID || process.env?.ACCESS_KEY_ID) : '') ||
    '';

  const secretAccessKey =
    env?.R2_SECRET_ACCESS_KEY ||
    env?.AWS_SECRET_ACCESS_KEY ||
    env?.SECRET_ACCESS_KEY ||
    (typeof process !== 'undefined' ? (process.env?.R2_SECRET_ACCESS_KEY || process.env?.AWS_SECRET_ACCESS_KEY || process.env?.SECRET_ACCESS_KEY) : '') ||
    '';

  const bucket =
    env?.R2_BUCKET_NAME ||
    env?.R2_BUCKET ||
    env?.BUCKET_NAME ||
    (typeof process !== 'undefined' ? (process.env?.R2_BUCKET_NAME || process.env?.R2_BUCKET || process.env?.BUCKET_NAME) : '') ||
    'onelaunch-mods';

  if (!accountId || !accessKeyId || !secretAccessKey) {
    const missing: string[] = [];
    if (!accountId) missing.push('R2_ACCOUNT_ID');
    if (!accessKeyId) missing.push('R2_ACCESS_KEY_ID');
    if (!secretAccessKey) missing.push('R2_SECRET_ACCESS_KEY');
    throw new Error('В Cloudflare Pages не настроены переменные: ' + missing.join(', '));
  }

  const s3 = new S3Client({
    region: 'auto',
    endpoint: 'https://' + accountId + '.r2.cloudflarestorage.com',
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  return { s3, bucket };
}
