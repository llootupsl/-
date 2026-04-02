import { existsSync } from 'node:fs';
import { rm } from 'node:fs/promises';

for (const target of ['dist', 'dev-dist', 'release-dist']) {
  if (existsSync(target)) {
    await rm(target, { recursive: true, force: true });
  }
}

await import('./build-release.mjs');
