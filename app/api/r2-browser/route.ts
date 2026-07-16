import { NextRequest, NextResponse } from 'next/server';
import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
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
    // If download requested, generate a signed URL
    if (download) {
      const command = new GetObjectCommand({
        Bucket: R2_BUCKET,
        Key: download,
      });
      const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
      return NextResponse.redirect(signedUrl);
    }

    // List objects
    const command = new ListObjectsV2Command({
      Bucket: R2_BUCKET,
      Prefix: prefix,
      Delimiter: '/',
    });

    const data = await s3.send(command);

    const items: R2Item[] = [];

    // Folders (CommonPrefixes)
    if (data.CommonPrefixes) {
      for (const cp of data.CommonPrefixes) {
        if (cp.Prefix) {
          const name = cp.Prefix.replace(prefix, '').replace(/\/$/, '');
          if (name) {
            items.push({
              key: cp.Prefix,
              name,
              type: 'folder',
            });
          }
        }
      }
    }

    // Files (Contents)
    if (data.Contents) {
      for (const obj of data.Contents) {
        if (obj.Key === prefix) continue; // skip the prefix itself
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

    // Sort: folders first, then files, both alphabetically
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
