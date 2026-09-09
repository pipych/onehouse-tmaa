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

import { getR2Client } from '../_shared/r2';

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
async function readManifest(s3: S3Client, bucket: string): Promise<ModpackManifest> {
  try {
    const cmd = new GetObjectCommand({ Bucket: bucket, Key: MANIFEST_KEY });
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

async function writeManifest(s3: S3Client, bucket: string, manifest: ModpackManifest) {
  manifest.version = (manifest.version || 0) + 1;
  await s3.send(new PutObjectCommand({
    Bucket: bucket,
    Key: MANIFEST_KEY,
    Body: JSON.stringify(manifest, null, 2),
    ContentType: 'application/json',
  }));
}

function getFileHash(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
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

// ===================================================================
// GET — List modpack files from manifest
// ===================================================================
export async function onRequestGet(context: any) {
  const { env } = context;
  try {
    const { s3, bucket } = getR2Client(env);
    const manifest = await readManifest(s3, bucket);
    return Response.json({
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
    return Response.json(
      { error: error.message || 'Failed to read manifest' },
      { status: 500 }
    );
  }
}

// ===================================================================
// POST — Upload modpack files (ZIP extraction or single file)
// ===================================================================
export async function onRequestPost(context: any) {
  const { request, env } = context;
  try {
    const { s3, bucket } = getR2Client(env);
    const contentType = request.headers.get('content-type') || '';

    // --- FormData upload (ZIP or single file) ---
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      const mode = (formData.get('mode') as string) || 'merge'; // 'merge' | 'replace'

      if (!file) {
        return Response.json({ error: 'Файл не выбран' }, { status: 400 });
      }

      const manifest = await readManifest(s3, bucket);
      const buffer = Buffer.from(await file.arrayBuffer());
      const fileName = file.name;
      const isZip = fileName.toLowerCase().endsWith('.zip');
      const resultFiles: ModpackFile[] = [];

      // Full replace: wipe existing modpack files
      if (mode === 'replace') {
        await deleteFolder(s3, bucket, MODPACK_PATH);
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
            Bucket: bucket,
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
          Bucket: bucket,
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

      await writeManifest(s3, bucket, manifest);

      return Response.json({
        success: true,
        uploaded: resultFiles,
        totalFiles: manifest.files.length,
        message: `Загружено ${resultFiles.length} файлов`,
      });
    }

    return Response.json({ error: 'Используй multipart/form-data с полем file' }, { status: 400 });
  } catch (error: any) {
    console.error('Modpack POST error:', error);
    return Response.json(
      { error: error.message || 'Upload failed' },
      { status: 500 }
    );
  }
}

// ===================================================================
// DELETE — Remove files from modpack + R2
// ===================================================================
export async function onRequestDelete(context: any) {
  const { request, env } = context;
  try {
    const { s3, bucket } = getR2Client(env);
    const { paths, all } = await request.json().catch(() => ({}));

    const manifest = await readManifest(s3, bucket);

    if (all) {
      // Delete all modpack files
      await deleteFolder(s3, bucket, MODPACK_PATH);
      manifest.files = [];
      await writeManifest(s3, bucket, manifest);

      return Response.json({
        success: true,
        deleted: 'all',
        message: 'Все файлы модпака удалены',
      });
    }

    if (!Array.isArray(paths) || paths.length === 0) {
      return Response.json({ error: 'paths (массив путей) или all: true обязателен' }, { status: 400 });
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
        Bucket: bucket,
        Delete: { Objects: toDelete.map(key => ({ Key: key })), Quiet: true },
      }));
    }

    // Update manifest
    manifest.files = manifest.files.filter(f => !paths.includes(f.path));
    await writeManifest(s3, bucket, manifest);

    return Response.json({
      success: true,
      deletedCount,
      totalFiles: manifest.files.length,
      message: `Удалено ${deletedCount} файлов`,
    });
  } catch (error: any) {
    console.error('Modpack DELETE error:', error);
    return Response.json(
      { error: error.message || 'Delete failed' },
      { status: 500 }
    );
  }
}
