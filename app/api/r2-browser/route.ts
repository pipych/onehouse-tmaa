import { NextRequest, NextResponse } from 'next/server';
import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

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

interface R2Item {
  key: string;
  name: string;
  type: 'folder' | 'file';
  size?: number;
  lastModified?: string;
  url?: string;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const prefix = searchParams.get('prefix') || '';
  const download = searchParams.get('download');

  try {
    if (download) {
      const command = new GetObjectCommand({
        Bucket: R2_BUCKET,
        Key: download,
      });
      const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
      return NextResponse.redirect(signedUrl);
    }

    const command = new ListObjectsV2Command({
      Bucket: R2_BUCKET,
      Prefix: prefix,
      Delimiter: '/',
    });

    const data = await s3.send(command);

    const items: R2Item[] = [];

    if (data.CommonPrefixes) {
      for (const cp of data.CommonPrefixes) {
        if (cp.Prefix) {
          const name = cp.Prefix.replace(prefix, '').replace(/\/$/, '');
          if (name) {
            items.push({ key: cp.Prefix, name, type: 'folder' });
          }
        }
      }
    }

    if (data.Contents) {
      for (const obj of data.Contents) {
        if (obj.Key === prefix) continue;
        const name = obj.Key!.replace(prefix, '');
        if (!name) continue;
        items.push({
          key: obj.Key!,
          name,
          type: 'file',
          size: obj.Size,
          lastModified: obj.LastModified?.toISOString(),
        });
      }
    }

    items.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    return NextResponse.json({ items, prefix });
  } catch (error: any) {
    console.error('R2 browser error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list objects' },
      { status: 500 }
    );
  }
}

// Create folder
export async function POST(request: NextRequest) {
  try {
    const { folderName, prefix } = await request.json();
    if (!folderName) {
      return NextResponse.json({ error: 'folderName is required' }, { status: 400 });
    }
    const basePrefix = (prefix || '').replace(/\/$/, '');
    const key = basePrefix ? `${basePrefix}/${folderName}/` : `${folderName}/`;

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: '',
    });
    await s3.send(command);
    return NextResponse.json({ success: true, key });
  } catch (error: any) {
    console.error('R2 create folder error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create folder' },
      { status: 500 }
    );
  }
}

// Delete file or folder
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key');
  const type = searchParams.get('type'); // 'file' or 'folder'

  if (!key) {
    return NextResponse.json({ error: 'key is required' }, { status: 400 });
  }

  try {
    let deletedKeys: string[] = [];

    if (type === 'folder') {
      const prefix = key.endsWith('/') ? key : `${key}/`;
      const listCommand = new ListObjectsV2Command({
        Bucket: R2_BUCKET,
        Prefix: prefix,
      });
      const listed = await s3.send(listCommand);
      const objects = listed.Contents || [];

      if (objects.length === 0) {
        await s3.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: prefix }));
        deletedKeys = [prefix];
      } else {
        deletedKeys = objects.map(obj => obj.Key!);
        await s3.send(new DeleteObjectsCommand({
          Bucket: R2_BUCKET,
          Delete: { Objects: objects.map(obj => ({ Key: obj.Key! })), Quiet: true },
        }));
      }
    } else {
      deletedKeys = [key];
      await s3.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key }));
    }

    // Update manifest if deleting from modpack folder
    await syncManifestAfterDelete(deletedKeys);

    return NextResponse.json({ success: true, deleted: deletedKeys.length });
  } catch (error: any) {
    console.error('R2 delete error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete' },
      { status: 500 }
    );
  }
}

async function syncManifestAfterDelete(deletedKeys: string[]) {
  // Find which prefixes have a manifest.json
  const affectedPrefixes = new Set<string>();
  for (const k of deletedKeys) {
    const parts = k.split('/');
    parts.pop(); // remove filename
    if (parts.length > 0) {
      affectedPrefixes.add(parts.join('/') + '/');
    }
  }

  for (const prefix of Array.from(affectedPrefixes)) {
    try {
      const manifestKey = prefix + 'manifest.json';
      const cmd = new GetObjectCommand({ Bucket: R2_BUCKET, Key: manifestKey });
      const data = await s3.send(cmd);
      if (data.Body) {
        const body = await data.Body.transformToString();
        const manifest = JSON.parse(body);
        if (manifest.files) {
          let changed = false;
          for (const dk of deletedKeys) {
            const fileName = dk.replace(prefix, '');
            if (manifest.files[fileName]) {
              delete manifest.files[fileName];
              changed = true;
            }
          }
          if (changed) {
            await s3.send(new PutObjectCommand({
              Bucket: R2_BUCKET,
              Key: manifestKey,
              Body: JSON.stringify(manifest, null, 2),
              ContentType: 'application/json',
            }));
          }
        }
      }
    } catch {
      // No manifest, skip
    }
  }
}
