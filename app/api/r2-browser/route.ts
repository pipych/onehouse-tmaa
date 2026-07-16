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

const R2_ACCOUNT_ID = '89476ea08498adb1813b3607c5079df7';
const R2_ACCESS_KEY_ID = '3513b185f8a785a30fb5e77c78203215';
const R2_SECRET_ACCESS_KEY = '4a03f9f253413aaabb3bcfbc4579de7bca4ae60a0cb30c944e2e84e59912500d';
const R2_BUCKET = 'onelaunch-mods';

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
    if (type === 'folder') {
      // Delete all objects with this prefix
      const prefix = key.endsWith('/') ? key : `${key}/`;
      const listCommand = new ListObjectsV2Command({
        Bucket: R2_BUCKET,
        Prefix: prefix,
      });
      const listed = await s3.send(listCommand);
      const objects = listed.Contents || [];

      if (objects.length === 0) {
        // Empty folder marker — try deleting it directly
        await s3.send(new DeleteObjectCommand({
          Bucket: R2_BUCKET,
          Key: prefix,
        }));
        return NextResponse.json({ success: true, deleted: 0 });
      }

      const deleteCommand = new DeleteObjectsCommand({
        Bucket: R2_BUCKET,
        Delete: {
          Objects: objects.map(obj => ({ Key: obj.Key! })),
          Quiet: false,
        },
      });
      const result = await s3.send(deleteCommand);
      return NextResponse.json({
        success: true,
        deleted: result.Deleted?.length || 0,
      });
    } else {
      // Single file
      await s3.send(new DeleteObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
      }));
      return NextResponse.json({ success: true, deleted: 1 });
    }
  } catch (error: any) {
    console.error('R2 delete error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete' },
      { status: 500 }
    );
  }
}
