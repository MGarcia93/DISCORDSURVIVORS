import { createHash } from 'node:crypto';
import { cp, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { defineConfig } from 'vite';

// The runtime asset tree is fetched by document-relative path from code that
// names the file as a plain string (`assets/audio/...` in src/audio/mix.mjs,
// the narrative manifests in src/narrative/catalog.mjs). Vite never sees those
// strings, so the tree is copied verbatim instead of hashed: a hashed name
// would break the URL the game already holds. `publicDir` is off for the same
// reason: files under `public/` are served from the root, and these must stay
// under `/assets/`.
const copyRuntimeAssets = {
  name: 'copy-runtime-assets',
  async closeBundle() {
    await cp('assets', 'dist/assets', { recursive: true });
  },
};

// Copying verbatim keeps the URLs stable, which means the browser cannot tell
// one build's dialogue from the next. One hash over the whole narrative tree is
// baked into every URL the catalog fetches, so a different tree is a different
// query string and the same tree stays cached.
async function narrativeVersion(dir = 'assets/narrative') {
  const hash = createHash('sha256');
  const walk = async target => {
    for (const entry of (await readdir(target, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
      const full = path.join(target, entry.name);
      if (entry.isDirectory()) await walk(full);
      else {
        hash.update(full);
        hash.update(await readFile(full));
      }
    }
  };
  await walk(dir);
  return hash.digest('hex').slice(0, 10);
}

export default defineConfig(async () => ({
  // `./` keeps the built game working from any subpath (a project page under
  // /repo/ included) while the document-relative asset URLs keep resolving
  // against the page, not the origin root.
  base: './',
  publicDir: false,
  // Vite emits the bundled JS/CSS under `build/` so the copied runtime tree
  // keeps `assets/` for itself: the game's URLs point there.
  build: { target: 'es2022', assetsDir: 'build' },
  define: { __NARRATIVE_VERSION__: JSON.stringify(await narrativeVersion()) },
  plugins: [copyRuntimeAssets],
}));
