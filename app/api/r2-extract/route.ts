import { NextRequest, NextResponse } from 'next/server';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import AdmZip from 'adm-zip';

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

async function uploadToR2(key: string, body: Buffer | string, contentType?: string) {
  await s3.send(new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    Body: body,
    ContentType: contentType,
  }));
}

async function deleteFolder(prefix: string): Promise<number> {
  let deleted = 0;
  let continuationToken: string | undefined;
  do {
    const listCmd = new ListObjectsV2Command({
      Bucket: R2_BUCKET,
      Prefix: prefix,
      ...(continuationToken ? { ContinuationToken: continuationToken } : {}),
    });
    const listed = await s3.send(listCmd);
    const objects = listed.Contents || [];
    if (objects.length > 0) {
      await s3.send(new DeleteObjectsCommand({
        Bucket: R2_BUCKET,
        Delete: { Objects: objects.map(obj => ({ Key: obj.Key! })), Quiet: true },
      }));
      deleted += objects.length;
    }
    continuationToken = listed.NextContinuationToken;
  } while (continuationToken);
  return deleted;
}

async function readManifest(prefix: string): Promise<any> {
  const manifestKey = prefix + 'manifest.json';
  try {
    const cmd = new GetObjectCommand({ Bucket: R2_BUCKET, Key: manifestKey });
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

async function writeManifest(prefix: string, manifest: any) {
  const manifestKey = prefix + 'manifest.json';
  await uploadToR2(manifestKey, JSON.stringify(manifest, null, 2), 'application/json');
}

function getFileHash(buffer: Buffer): string {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(buffer).digest('hex').substring(0, 12);
}

export async function POST(request: NextRequest) {
  try {
    const { zipKey, prefix, mode } = await request.json();

    if (!zipKey || !prefix) {
      return NextResponse.json({ error: 'zipKey and prefix required' }, { status: 400 });
    }

    const normalizedPrefix = prefix.endsWith('/') ? prefix : prefix + '/';

    // Download ZIP from R2
    const getCmd = new GetObjectCommand({ Bucket: R2_BUCKET, Key: zipKey });
    const zipData = await s3.send(getCmd);
    if (!zipData.Body) {
      return NextResponse.json({ error: 'ZIP not found' }, { status: 404 });
    }

    const buffer = Buffer.from(await zipData.Body.transformToByteArray());
    const zip = new AdmZip(buffer);
    const entries = zip.getEntries();

    let deletedCount = 0;
    let uploadedCount = 0;
    const newManifestFiles: Record<string, { name: string; size: number; hash: string }> = {};

    // Full replace: delete everything first
    if (mode === 'replace') {
      deletedCount = await deleteFolder(normalizedPrefix);
    }

    // Read existing manifest for merge
    let existingManifest: any = { files: {} };
    if (mode === 'merge') {
      existingManifest = await readManifest(normalizedPrefix);
    }

    for (const entry of entries) {
      if (entry.isDirectory) continue;
      const entryName = entry.entryName;
      const entryBuffer = entry.getData();
      const targetKey = normalizedPrefix + entryName;
      await uploadToR2(targetKey, entryBuffer);
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

    await writeManifest(normalizedPrefix, finalManifest);

    // Delete the uploaded ZIP from R2
    try {
      await s3.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: zipKey }));
    } catch {}

    return NextResponse.json({
      success: true,
      uploadedCount,
      deletedCount,
      prefix: normalizedPrefix,
    });
  } catch (error: any) {
    console.error('R2 extract error:', error);
    return NextResponse.json(
      { error: error.message || 'Ошибка обработки' },
      { status: 500 }
    );
  }
}
