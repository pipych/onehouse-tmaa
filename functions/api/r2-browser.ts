import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getR2Client } from '../_shared/r2';

interface R2Item {
  key: string;
  name: string;
  type: 'folder' | 'file';
  size?: number;
  lastModified?: string;
  url?: string;
}

export async function onRequestGet(context: any) {
  const { request, env } = context;
  const { searchParams } = new URL(request.url);
  const prefix = searchParams.get('prefix') || '';
  const download = searchParams.get('download');

  try {
    const { s3, bucket } = getR2Client(env);

    if (download) {
      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: download,
      });
      const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
      return Response.redirect(signedUrl);
    }

    const command = new ListObjectsV2Command({
      Bucket: bucket,
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

    return Response.json({ items, prefix });
  } catch (error: any) {
    console.error('R2 browser error:', error);
    return Response.json(
      { error: error.message || 'Failed to list objects' },
      { status: 500 }
    );
  }
}

// Create folder
export async function onRequestPost(context: any) {
  const { request, env } = context;
  try {
    const { s3, bucket } = getR2Client(env);
    const { folderName, prefix } = await request.json();
    if (!folderName) {
      return Response.json({ error: 'folderName is required' }, { status: 400 });
    }
    const basePrefix = (prefix || '').replace(/\/$/, '');
    const key = basePrefix ? `${basePrefix}/${folderName}/` : `${folderName}/`;

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: '',
    });
    await s3.send(command);
    return Response.json({ success: true, key });
  } catch (error: any) {
    console.error('R2 create folder error:', error);
    return Response.json(
      { error: error.message || 'Failed to create folder' },
      { status: 500 }
    );
  }
}

// Delete file or folder
export async function onRequestDelete(context: any) {
  const { request, env } = context;
  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key');
  const type = searchParams.get('type'); // 'file' or 'folder'

  if (!key) {
    return Response.json({ error: 'key is required' }, { status: 400 });
  }

  try {
    const { s3, bucket } = getR2Client(env);
    let deletedKeys: string[] = [];

    if (type === 'folder') {
      const prefix = key.endsWith('/') ? key : `${key}/`;
      const listCommand = new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
      });
      const listed = await s3.send(listCommand);
      const objects = listed.Contents || [];

      if (objects.length === 0) {
        await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: prefix }));
        deletedKeys = [prefix];
      } else {
        deletedKeys = objects.map(obj => obj.Key!);
        await s3.send(new DeleteObjectsCommand({
          Bucket: bucket,
          Delete: { Objects: objects.map(obj => ({ Key: obj.Key! })), Quiet: true },
        }));
      }
    } else {
      deletedKeys = [key];
      await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    }

    // Update manifest if deleting from modpack folder
    await syncManifestAfterDelete(s3, bucket, deletedKeys);

    return Response.json({ success: true, deleted: deletedKeys.length });
  } catch (error: any) {
    console.error('R2 delete error:', error);
    return Response.json(
      { error: error.message || 'Failed to delete' },
      { status: 500 }
    );
  }
}

async function syncManifestAfterDelete(s3: S3Client, bucket: string, deletedKeys: string[]) {
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
      const cmd = new GetObjectCommand({ Bucket: bucket, Key: manifestKey });
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
              Bucket: bucket,
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

