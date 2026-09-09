import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import AdmZip from 'adm-zip';
import crypto from 'crypto';
import { getR2Client } from '../_shared/r2';

async function uploadToR2(s3: S3Client, bucket: string, key: string, body: Buffer | string, contentType?: string) {
  await s3.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
  }));
}

async function deleteFolder(s3: S3Client, bucket: string, prefix: string): Promise<number> {
  let deleted = 0;
  let continuationToken: string | undefined;
  do {
    const listCmd = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix,
      ...(continuationToken ? { ContinuationToken: continuationToken } : {}),
    });
    const listed = await s3.send(listCmd);
    const objects = listed.Contents || [];
    if (objects.length > 0) {
      await s3.send(new DeleteObjectsCommand({
        Bucket: bucket,
        Delete: { Objects: objects.map(obj => ({ Key: obj.Key! })), Quiet: true },
      }));
      deleted += objects.length;
    }
    continuationToken = listed.NextContinuationToken;
  } while (continuationToken);
  return deleted;
}

async function readManifest(s3: S3Client, bucket: string, prefix: string): Promise<any> {
  const manifestKey = prefix + 'manifest.json';
  try {
    const cmd = new GetObjectCommand({ Bucket: bucket, Key: manifestKey });
    const data = await s3.send(cmd);
    if (data.Body) {
      const body = await data.Body.transformToString();
      return JSON.parse(body);
    }
  } catch {
    return { files: {} };
  }
  return { files: {} };
}

async function writeManifest(s3: S3Client, bucket: string, prefix: string, manifest: any) {
  const manifestKey = prefix + 'manifest.json';
  await uploadToR2(s3, bucket, manifestKey, JSON.stringify(manifest, null, 2), 'application/json');
}

function getFileHash(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex').substring(0, 12);
}

export async function onRequestPost(context: any) {
  const { request, env } = context;
  try {
    const { s3, bucket } = getR2Client(env);
    const { zipKey, prefix, mode } = await request.json();

    if (!zipKey || !prefix) {
      return Response.json({ error: 'zipKey and prefix required' }, { status: 400 });
    }

    const normalizedPrefix = prefix.endsWith('/') ? prefix : prefix + '/';

    // Download ZIP from R2
    const getCmd = new GetObjectCommand({ Bucket: bucket, Key: zipKey });
    const zipData = await s3.send(getCmd);
    if (!zipData.Body) {
      return Response.json({ error: 'ZIP not found' }, { status: 404 });
    }

    const buffer = Buffer.from(await zipData.Body.transformToByteArray());
    const zip = new AdmZip(buffer);
    const entries = zip.getEntries();

    let deletedCount = 0;
    let uploadedCount = 0;
    const newManifestFiles: Record<string, { name: string; size: number; hash: string }> = {};

    // Full replace: delete everything first
    if (mode === 'replace') {
      deletedCount = await deleteFolder(s3, bucket, normalizedPrefix);
    }

    // Read existing manifest for merge
    let existingManifest: any = { files: {} };
    if (mode === 'merge') {
      existingManifest = await readManifest(s3, bucket, normalizedPrefix);
    }

    for (const entry of entries) {
      if (entry.isDirectory) continue;
      const entryName = entry.entryName;
      const entryBuffer = entry.getData();
      const targetKey = normalizedPrefix + entryName;
      await uploadToR2(s3, bucket, targetKey, entryBuffer);
      const hash = getFileHash(entryBuffer);
      newManifestFiles[entryName] = {
        name: entryName,
        size: entryBuffer.length,
        hash,
      };
      uploadedCount++;
    }

    // Merge manifests
    const finalManifest = mode === 'merge'
      ? { files: { ...existingManifest.files, ...newManifestFiles } }
      : { files: newManifestFiles };

    await writeManifest(s3, bucket, normalizedPrefix, finalManifest);

    // Delete the uploaded ZIP from R2
    try {
      await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: zipKey }));
    } catch {}

    return Response.json({
      success: true,
      uploadedCount,
      deletedCount,
      prefix: normalizedPrefix,
    });
  } catch (error: any) {
    console.error('R2 extract error:', error);
    return Response.json(
      { error: error.message || 'Ошибка обработки' },
      { status: 500 }
    );
  }
}
