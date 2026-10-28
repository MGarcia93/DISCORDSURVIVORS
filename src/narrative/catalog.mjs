import { validateScene } from './runtime.mjs';
import { worldIds } from '../backgrounds/index.mjs';

export const manifestURL = new URL('../../assets/narrative/manifest.json', import.meta.url);
const BACKGROUNDS = Object.freeze(Object.fromEntries(worldIds.map(id => [id, true])));

export async function loadCatalog({ url = manifestURL, fetcher = globalThis.fetch, importer = url => import(url) } = {}) {
  const signal = AbortSignal.timeout(8000);
  const read = async target => {
    const response = await fetcher(target, { signal });
    if (!response.ok) throw Error(`Cannot load ${target}: HTTP ${response.status}`);
    return response.json();
  };
  const manifest = await read(url);
  const characters = await read(new URL(manifest.characters, url));
  for (const [id, character] of Object.entries(characters)) {
    if (!character.name || !character.sprite || !character.expressions?.neutral) throw Error(`Invalid character: ${id}`);
    for (const [expression, path] of Object.entries(character.expressions)) {
      character.expressions[expression] = new URL(path, url).href;
    }
  }
  for (const sound of Object.values(manifest.sounds ?? {})) {
    if (sound.src) sound.src = new URL(sound.src, url).href;
    else if (!Number.isFinite(sound.frequency) || sound.frequency <= 0 || !Number.isFinite(sound.duration) || sound.duration <= 0) throw Error('Invalid sound definition');
  }
  const ids = new Set();
  const entries = [];
  for (const item of manifest.scenes) {
    if (ids.has(item.id)) throw Error(`Duplicate scene: ${item.id}`);
    ids.add(item.id);
    const entry = { id: item.id, title: item.title ?? item.id, scene: null, actions: {}, error: null };
    try {
      entry.scene = await read(new URL(item.file, url));
      if (entry.scene.id !== item.id) throw Error('Scene id does not match manifest');
      if (item.module) entry.actions = (await importer(new URL(item.module, url).href)).actions;
      validateScene(entry.scene, { characters, sounds: manifest.sounds ?? {}, actions: entry.actions, backgrounds: BACKGROUNDS });
    } catch (error) { entry.error = `${item.id}: ${error.message}`; }
    entries.push(entry);
  }
  const bindings = manifest.bindings ?? [];
  for (const binding of bindings) {
    if (!['before_wave', 'after_wave'].includes(binding.when) || !Number.isInteger(binding.wave) || binding.wave < 1 || !ids.has(binding.scene)) {
      throw Error(`Invalid wave binding: ${JSON.stringify(binding)}`);
    }
  }
  return { characters, sounds: manifest.sounds ?? {}, entries, bindings, backgrounds: BACKGROUNDS };
}
