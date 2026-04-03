import { createHash } from 'node:crypto';
import { access, cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { build } from 'vite';

const cwd = process.cwd();
const outDir = path.resolve(cwd, 'release-dist');
const publicDir = path.resolve(cwd, 'public');
const precachePattern = /\.(?:js|css|html|ico|png|svg|woff2|wasm|webmanifest|json)$/i;
const ignoredPrecacheFiles = new Set(['sw.js', '_headers', '_redirects']);

function flattenOutputs(result) {
  const results = Array.isArray(result) ? result : [result];
  return results.flatMap((entry) => entry?.output ?? []);
}

async function pathExists(targetPath) {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function persistBundle(outputs) {
  for (const output of outputs) {
    const filePath = path.resolve(outDir, output.fileName);
    await mkdir(path.dirname(filePath), { recursive: true });

    if (output.type === 'asset') {
      await writeFile(filePath, output.source);
      continue;
    }

    await writeFile(filePath, output.code);

    if (output.map) {
      await writeFile(`${filePath}.map`, output.map.toString());
    }
  }

  await cp(publicDir, outDir, {
    recursive: true,
    force: true,
    errorOnExist: false,
  });
}

async function removeStaleServiceWorkerArtifacts() {
  if (!(await pathExists(outDir))) {
    return;
  }

  const files = await readdir(outDir);
  await Promise.all(
    files
      .filter((name) => name === 'sw.js' || /^workbox-.*\.js(?:\.map)?$/i.test(name))
      .map((name) => rm(path.resolve(outDir, name), { force: true }))
  );
}

async function collectPrecacheEntries(directory = outDir) {
  const entries = [];
  const dirents = await readdir(directory, { withFileTypes: true });

  for (const dirent of dirents) {
    const absolutePath = path.resolve(directory, dirent.name);

    if (dirent.isDirectory()) {
      entries.push(...(await collectPrecacheEntries(absolutePath)));
      continue;
    }

    if (
      ignoredPrecacheFiles.has(dirent.name) ||
      dirent.name.endsWith('.map') ||
      !precachePattern.test(dirent.name)
    ) {
      continue;
    }

    const relativePath = path.relative(outDir, absolutePath).replace(/\\/g, '/');
    const normalizedUrl = `/${relativePath}`;
    const contents = await readFile(absolutePath);
    const revision = createHash('sha1').update(contents).digest('hex').slice(0, 16);

    entries.push({
      url: normalizedUrl === '/index.html' ? '/index.html' : normalizedUrl,
      revision,
    });
  }

  return entries.sort((left, right) => left.url.localeCompare(right.url));
}

function buildServiceWorkerSource(entries) {
  const version = createHash('sha1')
    .update(JSON.stringify(entries))
    .digest('hex')
    .slice(0, 12);

  return `const VERSION = ${JSON.stringify(version)};
const PRECACHE_NAME = \`omnis-apien-precache-\${VERSION}\`;
const RUNTIME_NAME = \`omnis-apien-runtime-\${VERSION}\`;
const PRECACHE_ENTRIES = ${JSON.stringify(entries, null, 2)};
const PRECACHE_URLS = new Set(PRECACHE_ENTRIES.map((entry) => entry.url));

function toCacheKey(requestUrl) {
  const url = new URL(requestUrl);
  return url.pathname === '/' ? '/index.html' : url.pathname;
}

async function precache() {
  const cache = await caches.open(PRECACHE_NAME);
  await Promise.all(
    PRECACHE_ENTRIES.map(async (entry) => {
      const response = await fetch(entry.url, { cache: 'reload' });
      if (!response.ok) {
        throw new Error(\`Failed to precache \${entry.url}: \${response.status}\`);
      }
      await cache.put(entry.url, response);
    }),
  );
}

async function cleanupCaches() {
  const keys = await caches.keys();
  await Promise.all(
    keys
      .filter((key) => key.startsWith('omnis-apien-') && key !== PRECACHE_NAME && key !== RUNTIME_NAME)
      .map((key) => caches.delete(key)),
  );
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const key = cacheName === PRECACHE_NAME ? toCacheKey(request.url) : request;
  const cached = await cache.match(key);
  if (cached) {
    return cached;
  }
  const response = await fetch(request);
  if (response && response.ok) {
    await cache.put(key, response.clone());
  }
  return response;
}

async function networkFirst(request, cacheName, fallbackUrl) {
  const cache = await caches.open(cacheName);
  const key = cacheName === PRECACHE_NAME ? toCacheKey(request.url) : request;
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      await cache.put(key, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await cache.match(key);
    if (cached) {
      return cached;
    }
    if (fallbackUrl) {
      const fallbackCache = await caches.open(PRECACHE_NAME);
      const fallback = await fallbackCache.match(fallbackUrl);
      if (fallback) {
        return fallback;
      }
    }
    throw error;
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const networkPromise = fetch(request)
    .then(async (response) => {
      if (response && response.ok) {
        await cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);

  if (cached) {
    void networkPromise;
    return cached;
  }

  const networkResponse = await networkPromise;
  if (networkResponse) {
    return networkResponse;
  }

  return fetch(request);
}

self.addEventListener('install', (event) => {
  event.waitUntil(precache());
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      await cleanupCaches();
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);
  const cacheKey = toCacheKey(request.url);

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, RUNTIME_NAME, '/index.html'));
    return;
  }

  if (url.origin === self.location.origin && PRECACHE_URLS.has(cacheKey)) {
    event.respondWith(cacheFirst(request, PRECACHE_NAME));
    return;
  }

  if (/^https:\\/\\/fonts\\.googleapis\\.com\\//i.test(url.href) || /^https:\\/\\/fonts\\.gstatic\\.com\\//i.test(url.href)) {
    event.respondWith(cacheFirst(request, RUNTIME_NAME));
    return;
  }

  if (/\\.(?:png|jpg|jpeg|svg|gif|webp)$/i.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request, RUNTIME_NAME));
    return;
  }

  if (/\\/api\\//i.test(url.pathname)) {
    event.respondWith(networkFirst(request, RUNTIME_NAME));
  }
});
`;
}

async function regenerateServiceWorker() {
  await removeStaleServiceWorkerArtifacts();
  const entries = await collectPrecacheEntries();

  if (entries.length < 10) {
    throw new Error(`Unexpectedly small precache manifest: ${entries.length} entries.`);
  }

  await writeFile(path.resolve(outDir, 'sw.js'), buildServiceWorkerSource(entries), 'utf8');
}

async function ensureReleaseArtifacts() {
  const required = [
    path.resolve(outDir, 'index.html'),
    path.resolve(outDir, 'manifest.json'),
    path.resolve(outDir, 'sw.js'),
  ];

  for (const filePath of required) {
    if (!(await pathExists(filePath))) {
      throw new Error(`Missing required release artifact: ${path.relative(cwd, filePath)}`);
    }
  }
}

const result = await build({
  configFile: 'vite.config.js',
  build: {
    write: false,
  },
});

const outputs = flattenOutputs(result);
await persistBundle(outputs);
await regenerateServiceWorker();

await ensureReleaseArtifacts();
