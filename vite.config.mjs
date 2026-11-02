import { cp } from 'node:fs/promises';
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

export default defineConfig({
  // `./` keeps the built game working from any subpath (a project page under
  // /repo/ included) while the document-relative asset URLs keep resolving
  // against the page, not the origin root.
  base: './',
  publicDir: false,
  // Vite emits the bundled JS/CSS under `build/` so the copied runtime tree
  // keeps `assets/` for itself: the game's URLs point there.
  build: { target: 'es2022', assetsDir: 'build' },
  plugins: [copyRuntimeAssets],
});
