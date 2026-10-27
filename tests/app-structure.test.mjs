import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// The selection screen module had a runtime ReferenceError: it referenced
// drawWarrior in its body without importing it, every sprite call threw in
// the browser, and the canvas stayed empty. This pins every sprite renderer
// referenced by app.mjs to an explicit import from sprites.mjs.
const app = readFileSync(new URL('../src/app.mjs', import.meta.url), 'utf8');
const sprites = readFileSync(new URL('../src/sprites.mjs', import.meta.url), 'utf8');

test('app.mjs imports every sprite renderer it references', () => {
  const spritesExport = [...sprites.matchAll(/export function (\w+)/g)].map(match => match[1]);
  assert.ok(spritesExport.includes('drawWarrior'), 'sprites.mjs still exports drawWarrior');
  const importLine = app.match(/import \{([^}]*)\} from '\.\/sprites\.mjs';/);
  assert.ok(importLine, 'app.mjs imports sprites.mjs by name');
  const imported = importLine[1].split(',').map(name => name.trim());
  // every sprite renderer used somewhere in the body must be in the import
  for (const name of spritesExport) {
    const referenced = new RegExp(`\\b${name}\\(`).test(app.replace(importLine[0], ''));
    if (referenced) {
      assert.ok(imported.includes(name), `app.mjs body references ${name}() and must import it`);
    }
  }
});
