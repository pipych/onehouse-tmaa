import { NextRequest, NextResponse } from 'next/server';
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import crypto from 'crypto';

// --- R2 config ---
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!;
const R2_BUCKET = process.env.R2_BUCKET_NAME || 'onelaunch-mods';

if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
  console.warn('[modrinth] R2 env vars missing: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY');
}

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

// --- Modrinth config ---
const MODRINTH_API = 'https://api.modrinth.com/v2';
const GAME_VERSION = '1.20.1';
const LOADERS = ['forge', 'neoforge'];
const MODPACK_PREFIX = 'onehouse-pack-v1/';
const MODS_PATH = MODPACK_PREFIX + 'mods/';
const MANIFEST_KEY = MODPACK_PREFIX + 'manifest.json';

const MODRINTH_HEADERS = {
  'User-Agent': 'OneHouse/1.0 (admin@onehouse.pp.ua)',
};

// --- Types ---
interface ModrinthSearchHit {
  project_id: string;
  project_type: string;
  slug: string;
  author: string;
  title: string;
  description: string;
  categories: string[];
  display_categories: string[];
  versions: string[];
  downloads: number;
  follows: number;
  icon_url: string;
  date_created: string;
  date_modified: string;
  latest_version: string;
  license: string;
  client_side: string;
  server_side: string;
  gallery: string[];
  featured_gallery: string | null;
  color: number | null;
}

interface ModrinthSearchResponse {
  hits: ModrinthSearchHit[];
  offset: number;
  limit: number;
  total_hits: number;
}

interface ModrinthVersion {
  id: string;
  project_id: string;
  author_id: string;
  featured: boolean;
  name: string;
  version_number: string;
  changelog: string;
  changelog_url: string | null;
  date_published: string;
  downloads: number;
  version_type: string;
  status: string;
  requested_status: string | null;
  files: {
    hashes: { sha1: string; sha512: string };
    url: string;
    filename: string;
    primary: boolean;
    size: number;
    file_type: string | null;
  }[];
  dependencies: {
    version_id: string | null;
    project_id: string | null;
    file_name: string | null;
    dependency_type: 'required' | 'optional' | 'incompatible' | 'embedded';
  }[];
  game_versions: string[];
  loaders: string[];
}

// --- Helpers ---
async function readManifest(): Promise<any> {
  try {
    const cmd = new GetObjectCommand({ Bucket: R2_BUCKET, Key: MANIFEST_KEY });
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

async function writeManifest(manifest: any) {
  await s3.send(new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: MANIFEST_KEY,
    Body: JSON.stringify(manifest, null, 2),
    ContentType: 'application/json',
  }));
}

function getFileHash(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex').substring(0, 12);
}

async function fetchModrinth(path: string, init?: RequestInit): Promise<any> {
  const url = MODRINTH_API + path;
  const res = await fetch(url, { ...init, headers: { ...MODRINTH_HEADERS, ...(init?.headers as Record<string, string> || {}) } });
  if (!res.ok) throw new Error(`Modrinth API error: ${res.status} ${res.statusText}`);
  return res.json();
}

async function findCompatibleVersion(projectId: string): Promise<ModrinthVersion | null> {
  // Get versions filtered by game version and loaders
  const loadersParam = JSON.stringify(LOADERS);
  const gameVersionsParam = JSON.stringify([GAME_VERSION]);
  const versions: ModrinthVersion[] = await fetchModrinth(
    `/project/${projectId}/version?loaders=${encodeURIComponent(loadersParam)}&game_versions=${encodeURIComponent(gameVersionsParam)}`
  );
  if (!versions || versions.length === 0) return null;
  // Return the first (latest compatible)
  return versions[0];
}

async function downloadAndUploadMod(
  version: ModrinthVersion,
  manifest: any,
  visited: Set<string>
): Promise<{ fileName: string; size: number; hash: string }[]> {
  const results: { fileName: string; size: number; hash: string }[] = [];
  const projectId = version.project_id;

  if (visited.has(projectId)) return results;
  visited.add(projectId);

  // Process required dependencies first (depth-first)
  for (const dep of version.dependencies) {
    if (dep.dependency_type === 'required' && dep.project_id) {
      try {
        const depVersion = await findCompatibleVersion(dep.project_id);
        if (depVersion) {
          const depResults = await downloadAndUploadMod(depVersion, manifest, visited);
          results.push(...depResults);
        }
      } catch (e) {
        console.error(`Failed to resolve dependency ${dep.project_id}:`, e);
      }
    }
  }

  // Upload the primary file
  const primaryFile = version.files.find(f => f.primary) || version.files[0];
  if (!primaryFile) return results;

  const r2Key = MODS_PATH + primaryFile.filename;

  // Download from Modrinth
  const fileRes = await fetch(primaryFile.url, { headers: MODRINTH_HEADERS });
  if (!fileRes.ok) throw new Error(`Failed to download ${primaryFile.filename}: ${fileRes.status}`);
  const fileBuffer = Buffer.from(await fileRes.arrayBuffer());

  // Upload to R2
  await s3.send(new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: r2Key,
    Body: fileBuffer,
  }));

  const hash = getFileHash(fileBuffer);
  const manifestKey = 'mods/' + primaryFile.filename;

  // Update manifest
  manifest.files[manifestKey] = {
    name: primaryFile.filename,
    size: fileBuffer.length,
    hash,
  };

  results.push({
    fileName: primaryFile.filename,
    size: fileBuffer.length,
    hash,
  });

  return results;
}

// ===================================================================
// GET — Search mods on Modrinth
// ===================================================================
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query') || '';
  const offset = searchParams.get('offset') || '0';
  const limit = searchParams.get('limit') || '20';

  if (!query.trim()) {
    return NextResponse.json({ error: 'query is required' }, { status: 400 });
  }

  try {
    const facets = JSON.stringify([
      [`versions:${GAME_VERSION}`],
      LOADERS.map(l => `categories:${l}`),
    ]);

    const data: ModrinthSearchResponse = await fetchModrinth(
      `/search?query=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}&facets=${encodeURIComponent(facets)}`
    );

    // Return simplified results for the UI
    const results = data.hits.map(hit => ({
      project_id: hit.project_id,
      slug: hit.slug,
      title: hit.title,
      description: hit.description,
      author: hit.author,
      icon_url: hit.icon_url,
      downloads: hit.downloads,
      categories: hit.display_categories || hit.categories || [],
      latest_version: hit.latest_version,
      client_side: hit.client_side,
      server_side: hit.server_side,
    }));

    return NextResponse.json({
      hits: results,
      total: data.total_hits,
      offset: data.offset,
      limit: data.limit,
    });
  } catch (error: any) {
    console.error('Modrinth search error:', error);
    return NextResponse.json(
      { error: error.message || 'Search failed' },
      { status: 500 }
    );
  }
}

// ===================================================================
// POST — Install mod + dependencies to R2
// ===================================================================
export async function POST(request: NextRequest) {
  try {
    const { slug, projectId: pid } = await request.json();
    const projectId = pid || slug;
    if (!projectId) {
      return NextResponse.json({ error: 'slug or projectId required' }, { status: 400 });
    }

    let actualProjectId = projectId;

    // If slug provided, get actual project ID
    if (!pid && slug) {
      try {
        const project = await fetchModrinth(`/project/${slug}`);
        actualProjectId = project.id;
      } catch {
        // If slug doesn't work as project ID, try searching
        const searchResult = await fetchModrinth(
          `/search?query=${encodeURIComponent(slug)}&limit=1&facets=${encodeURIComponent(JSON.stringify([[`versions:${GAME_VERSION}`], LOADERS.map(l => `categories:${l}`)]))}`
        );
        if (searchResult.hits && searchResult.hits.length > 0) {
          actualProjectId = searchResult.hits[0].project_id;
        } else {
          return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }
      }
    }

    // Find compatible version
    const version = await findCompatibleVersion(actualProjectId);
    if (!version) {
      return NextResponse.json({ error: `No compatible version found for ${GAME_VERSION} + ${LOADERS.join('/')}` }, { status: 404 });
    }

    // Read existing manifest
    const manifest = await readManifest();

    // Download and upload mod + dependencies
    const visited = new Set<string>();
    const results = await downloadAndUploadMod(version, manifest, visited);

    // Write updated manifest
    await writeManifest(manifest);

    return NextResponse.json({
      success: true,
      installed: results,
      totalFiles: results.length,
      message: `Установлено ${results.length} файлов`,
    });
  } catch (error: any) {
    console.error('Modrinth install error:', error);
    return NextResponse.json(
      { error: error.message || 'Install failed' },
      { status: 500 }
    );
  }
}
