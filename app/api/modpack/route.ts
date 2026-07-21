import { NextRequest, NextResponse } from 'next/server';
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import AdmZip from 'adm-zip';
import crypto from 'crypto';

// --- R2 config ---
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

// --- Modpack config ---
const MODPACK_PREFIX = 'onehouse-pack-v1/';
const MODPACK_PATH = MODPACK_PREFIX + 'modpack/';
const MANIFEST_KEY = MODPACK_PREFIX + 'modpack-manifest.json';
const PUBLIC_BASE = 'https://modpack.onelaunch.pp.ua/';

// --- Types ---
interface ModpackFile {
  path: string;
  url: string;
  sha256: string;
  size: number;
}

interface ModpackManifest {
  minecraft: string;
  id: string;
  version: number;
  loader: string;
  description: string;
  files: ModpackFile[];
}

// --- Helpers ---
async function readManifest(): Promise<ModpackManifest> {
  try {
    const cmd = new GetObjectCommand({ Bucket: R2_BUCKET, Key: MANIFEST_KEY });
    const data = await s3.send(cmd);
    if (data.Body) {
      const body = await data.Body.transformToString();
      const parsed = JSON.parse(body);
      if (!Array.isArray(parsed.files)) parsed.files = [];
      return parsed;
    }
  } catch {
    // Manifest doesn't exist yet
  }
  return {
    minecraft: '1.20.1',
    id: 'onehouse-pack-v1-modpack',
    version: 0,
    loader: 'forge',
    description: 'Модпак OneHouse (Forge 1.20.1)',
    files: [],
  };
}

async function writeManifest(manifest: ModpackManifest) {
  manifest.version = (manifest.version || 0) + 1;
  await s3.send(new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: MANIFEST_KEY,
    Body: JSON.stringify(manifest, null, 2),
    ContentType: 'application/json',
  }));
}

function getFileHash(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
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

// ===================================================================
// GET — List modpack files from manifest
// ===================================================================
export async function GET(request: NextRequest) {
  try {
    const manifest = await readManifest();
    return NextResponse.json({
      success: true,
      manifest: {
        minecraft: manifest.minecraft,
        id: manifest.id,
        version: manifest.version,
        loader: manifest.loader,
        description: manifest.description,
      },
      files: manifest.files,
      totalFiles: manifest.files.length,
      totalSize: manifest.files.reduce((sum, f) => sum + f.size, 0),
    });
  } catch (error: any) {
    console.error('Modpack GET error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to read manifest' },
      { status: 500 }
    );
  }
}

// ===================================================================
// POST — Upload modpack files (ZIP extraction or single file)
// ===================================================================
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';

    // --- FormData upload (ZIP or single file) ---
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      const mode = (formData.get('mode') as string) || 'merge'; // 'merge' | 'replace'

      if (!file) {
        return NextResponse.json({ error: 'Файл не выбран' }, { status: 400 });
      }

      const manifest = await readManifest();
      const buffer = Buffer.from(await file.arrayBuffer());
      const fileName = file.name;
      const isZip = fileName.toLowerCase().endsWith('.zip');
      const resultFiles: ModpackFile[] = [];

      // Full replace: wipe existing modpack files
      if (mode === 'replace') {
        await deleteFolder(MODPACK_PATH);
        manifest.files = [];
      }

      if (isZip) {
        // Extract ZIP and upload each file
        const zip = new AdmZip(buffer);
        const entries = zip.getEntries();

        for (const entry of entries) {
          if (entry.isDirectory) continue;
          const entryName = entry.entryName;
          const entryBuffer = entry.getData();
          const r2Key = MODPACK_PATH + entryName;
          const publicUrl = PUBLIC_BASE + MODPACK_PATH + entryName;
          const sha256 = getFileHash(entryBuffer);

          await s3.send(new PutObjectCommand({
            Bucket: R2_BUCKET,
            Key: r2Key,
            Body: entryBuffer,
          }));

          const newFile: ModpackFile = {
            path: 'modpack/' + entryName,
            url: publicUrl,
            sha256,
            size: entryBuffer.length,
          };

          // Update or add to manifest
          const existingIdx = manifest.files.findIndex(f => f.path === newFile.path);
          if (existingIdx >= 0) {
            manifest.files[existingIdx] = newFile;
          } else {
            manifest.files.push(newFile);
          }
          resultFiles.push(newFile);
        }
      } else {
        // Single file upload
        const r2Key = MODPACK_PATH + fileName;
        const publicUrl = PUBLIC_BASE + MODPACK_PATH + fileName;
        const sha256 = getFileHash(buffer);

        await s3.send(new PutObjectCommand({
          Bucket: R2_BUCKET,
          Key: r2Key,
          Body: buffer,
        }));

        const newFile: ModpackFile = {
          path: 'modpack/' + fileName,
          url: publicUrl,
          sha256,
          size: buffer.length,
        };

        const existingIdx = manifest.files.findIndex(f => f.path === newFile.path);
        if (existingIdx >= 0) {
          manifest.files[existingIdx] = newFile;
        } else {
          manifest.files.push(newFile);
        }
        resultFiles.push(newFile);
      }

      await writeManifest(manifest);

      return NextResponse.json({
        success: true,
        uploaded: resultFiles,
        totalFiles: manifest.files.length,
        message: `Загружено ${resultFiles.length} файлов`,
      });
    }

    return NextResponse.json({ error: 'Используй multipart/form-data с полем file' }, { status: 400 });
  } catch (error: any) {
    console.error('Modpack POST error:', error);
    return NextResponse.json(
      { error: error.message || 'Upload failed' },
      { status: 500 }
    );
  }
}

// ===================================================================
// DELETE — Remove files from modpack + R2
// ===================================================================
export async function DELETE(request: NextRequest) {
  try {
    const { paths, all } = await request.json().catch(() => ({}));

    const manifest = await readManifest();

    if (all) {
      // Delete all modpack files
      await deleteFolder(MODPACK_PATH);
      manifest.files = [];
      await writeManifest(manifest);

      return NextResponse.json({
        success: true,
        deleted: 'all',
        message: 'Все файлы модпака удалены',
      });
    }

    if (!Array.isArray(paths) || paths.length === 0) {
      return NextResponse.json({ error: 'paths (массив путей) или all: true обязателен' }, { status: 400 });
    }

    let deletedCount = 0;
    const toDelete: string[] = [];

    for (const path of paths) {
      // Remove from R2
      const r2Key = MODPACK_PATH + path.replace('modpack/', '');
      toDelete.push(r2Key);
      deletedCount++;
    }

    if (toDelete.length > 0) {
      await s3.send(new DeleteObjectsCommand({
        Bucket: R2_BUCKET,
        Delete: { Objects: toDelete.map(key => ({ Key: key })), Quiet: true },
      }));
    }

    // Update manifest
    manifest.files = manifest.files.filter(f => !paths.includes(f.path));
    await writeManifest(manifest);

    return NextResponse.json({
      success: true,
      deletedCount,
      totalFiles: manifest.files.length,
      message: `Удалено ${deletedCount} файлов`,
    });
  } catch (error: any) {
    console.error('Modpack DELETE error:', error);
    return NextResponse.json(
      { error: error.message || 'Delete failed' },
      { status: 500 }
    );
  }
}
