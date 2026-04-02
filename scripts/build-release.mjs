import { access, cp, mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { build } from 'vite';

const cwd = process.cwd();
const outDir = path.resolve(cwd, 'release-dist');
const publicDir = path.resolve(cwd, 'public');
const assetGlobPatterns = ['**/*.{js,css,html,ico,png,svg,woff2,wasm,webmanifest,json}'];
const runtimeCaching = [
  {
    urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
    handler: 'CacheFirst',
    options: {
      cacheName: 'google-fonts-cache',
      expiration: {
        maxEntries: 10,
        maxAgeSeconds: 60 * 60 * 24 * 365,
      },
      cacheableResponse: { statuses: [0, 200] },
    },
  },
  {
    urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
    handler: 'CacheFirst',
    options: {
      cacheName: 'gstatic-fonts-cache',
      expiration: {
        maxEntries: 10,
        maxAgeSeconds: 60 * 60 * 24 * 365,
      },
      cacheableResponse: { statuses: [0, 200] },
    },
  },
  {
    urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
    handler: 'StaleWhileRevalidate',
    options: {
      cacheName: 'images-cache',
      expiration: {
        maxEntries: 50,
        maxAgeSeconds: 60 * 60 * 24 * 7,
      },
      cacheableResponse: { statuses: [0, 200] },
    },
  },
  {
    urlPattern: /\/api\/.*/i,
    handler: 'NetworkFirst',
    options: {
      cacheName: 'api-cache',
      networkTimeoutSeconds: 10,
      expiration: {
        maxEntries: 50,
        maxAgeSeconds: 60 * 60,
      },
      cacheableResponse: { statuses: [0, 200] },
    },
  },
];

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
      .filter((name) => name === 'sw.js' || /^workbox-.*\.js$/.test(name))
      .map((name) => rm(path.resolve(outDir, name), { force: true }))
  );
}

async function regenerateServiceWorker() {
  const workboxBuild = await import('workbox-build');
  const generateSW = workboxBuild.generateSW ?? workboxBuild.default?.generateSW;

  if (!generateSW) {
    throw new Error('Unable to load workbox-build generateSW helper.');
  }

  await removeStaleServiceWorkerArtifacts();

  const { count } = await generateSW({
    globDirectory: outDir,
    swDest: path.resolve(outDir, 'sw.js'),
    navigateFallback: 'index.html',
    cleanupOutdatedCaches: true,
    clientsClaim: true,
    skipWaiting: true,
    globPatterns: assetGlobPatterns,
    runtimeCaching,
  });

  if (count < 10) {
    throw new Error(`Unexpectedly small precache manifest: ${count} entries.`);
  }
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

  const files = await readdir(outDir);
  if (!files.some((name) => /^workbox-.*\.js$/.test(name))) {
    throw new Error('Missing generated Workbox runtime file in release-dist/');
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
