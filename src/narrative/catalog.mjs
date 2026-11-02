import { validateLine, validateScene } from './runtime.mjs';
import { worldIds } from '../backgrounds/index.mjs';
import { ACTS, actForWorld } from '../campaign/acts.mjs';
import { ENEMY_KINDS } from '../enemies/index.mjs';
import { DEV } from '../dev-flags.mjs';

// The production bundle moves this module into a hashed chunk, so
// `import.meta.url` stops sitting under `src/`. The narrative tree is copied
// verbatim next to the page (`assets/narrative/...`), so a browser resolves it
// against the document — base path included — while Node keeps resolving it
// against the source file, which is what the scene tests rely on.
const moduleURL = import.meta.url;
export const narrativeBase = (() => {
  const documentBase = globalThis.document?.baseURI;
  return documentBase
    ? new URL('assets/narrative/', documentBase)
    : new URL('../../assets/narrative/', moduleURL);
})();

// The tree is copied verbatim, so its URLs never change and a browser would keep
// serving yesterday's dialogue. The build bakes one hash of the whole tree in
// here and every fetched URL carries it: a different tree is a different URL,
// and the dev server, which serves every file with no-store, leaves it alone.
const narrativeVersion = DEV ? '' : (typeof __NARRATIVE_VERSION__ === 'undefined' ? '' : __NARRATIVE_VERSION__);

export function versionedNarrativeURL(url, version = narrativeVersion) {
  if (!version) return url;
  const stamped = new URL(url.href);
  stamped.searchParams.set('v', version);
  return stamped;
}

export const manifestURL = versionedNarrativeURL(new URL('manifest.json', narrativeBase));
const BACKGROUNDS = Object.freeze(Object.fromEntries(worldIds.map(id => [id, true])));

// The act owns its scenes: `narrative` is a path relative to the shared
// manifest, so a world brings its own cast, sounds, scenes, bindings and banter
// without any module naming them.
export function actManifestURL(act) {
  return act?.narrative ? versionedNarrativeURL(new URL(act.narrative, manifestURL)) : null;
}

// Every manifest the campaign registers, base first, with the act that owns it.
// The development viewer plays all of them; a run plays the base plus its own
// act. The base manifest is shared, so it belongs to no act.
export function campaignCatalogSources() {
  return [
    { url: manifestURL, act: null },
    ...ACTS.filter(act => act.narrative).map(act => ({ url: actManifestURL(act), act: act.id })),
  ];
}

export function campaignCatalogURLs() {
  return campaignCatalogSources().map(source => source.url);
}

// One catalog from one or many manifests. Merging is what makes an act's
// cinematics appear in the viewer and in gameplay from the same files.
export async function loadCatalog({ url = manifestURL, urls, sources, fetcher = globalThis.fetch, importer = url => import(url) } = {}) {
  const signal = AbortSignal.timeout(8000);
  const targets = sources ?? (urls ?? [url]).map(target => ({ url: target, act: null }));
  const read = async target => {
    const response = await fetcher(target, { signal });
    if (!response.ok) throw Error(`Cannot load ${target}: HTTP ${response.status}`);
    return response.json();
  };

  const characters = {}, sounds = {}, descriptors = [], bindings = [], banter = [];
  for (const { url: target, act } of targets) {
    const manifest = await read(target);
    // Portrait paths resolve from characters.json, not from the manifest that
    // names it: an act manifest lives one folder deeper than the shared files.
    const charactersURL = versionedNarrativeURL(new URL(manifest.characters, target));
    for (const [id, character] of Object.entries(await read(charactersURL))) {
      if (!character.name || !character.sprite || !character.expressions?.neutral) throw Error(`Invalid character: ${id}`);
      for (const [expression, path] of Object.entries(character.expressions)) {
        character.expressions[expression] = versionedNarrativeURL(new URL(path, charactersURL)).href;
      }
      characters[id] = character;
    }
    for (const sound of Object.values(manifest.sounds ?? {})) {
      if (sound.src) sound.src = versionedNarrativeURL(new URL(sound.src, target)).href;
      // A tonal sound needs a frequency; a noise burst only needs its length.
      else if (sound.noise) {
        if (!Number.isFinite(sound.duration) || sound.duration <= 0) throw Error('Invalid sound definition');
      } else if (!Number.isFinite(sound.frequency) || sound.frequency <= 0 || !Number.isFinite(sound.duration) || sound.duration <= 0) throw Error('Invalid sound definition');
    }
    Object.assign(sounds, manifest.sounds ?? {});
    for (const item of manifest.scenes ?? []) descriptors.push({ item, target, act });
    bindings.push(...(manifest.bindings ?? []));
    banter.push(...(manifest.banter ?? []));
  }

  const ids = new Set();
  const entries = [];
  for (const { item, target, act } of descriptors) {
    if (ids.has(item.id)) throw Error(`Duplicate scene: ${item.id}`);
    ids.add(item.id);
    const entry = { id: item.id, title: item.title ?? item.id, scene: null, actions: {}, error: null };
    try {
      entry.scene = await read(versionedNarrativeURL(new URL(item.file, target)));
      if (entry.scene.id !== item.id) throw Error('Scene id does not match manifest');
      if (item.module) entry.actions = (await importer(versionedNarrativeURL(new URL(item.module, target)).href)).actions;
      validateScene(entry.scene, { characters, sounds, actions: entry.actions, backgrounds: BACKGROUNDS, enemies: ENEMY_KINDS });
    } catch (error) { entry.error = `${item.id}: ${error.message}`; }
    // The act that owns the scene: the manifest that declared it, or, for a
    // shared-manifest preview, the act whose world it paints. Null means no act,
    // and no act means the fallback track.
    entry.act = act ?? actForWorld(entry.scene?.stage?.background)?.id ?? null;
    entries.push(entry);
  }

  for (const binding of bindings) {
    if (!['before_wave', 'after_wave'].includes(binding.when) || !Number.isInteger(binding.wave) || binding.wave < 1 || !ids.has(binding.scene)) {
      throw Error(`Invalid wave binding: ${JSON.stringify(binding)}`);
    }
  }
  for (const line of banter) {
    if (!Number.isInteger(line.wave) || line.wave < 1) throw Error(`Invalid banter wave: ${JSON.stringify(line)}`);
    if (!Number.isFinite(line.at) || line.at < 0) throw Error(`Invalid banter time: ${JSON.stringify(line)}`);
    try { validateLine(line, characters); } catch (error) { throw Error(`Invalid banter line: ${error.message}`); }
  }
  return { characters, sounds, entries, bindings, banter, backgrounds: BACKGROUNDS, enemies: ENEMY_KINDS };
}
