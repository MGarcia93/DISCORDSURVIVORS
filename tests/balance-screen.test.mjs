import test from 'node:test';
import assert from 'node:assert/strict';

// A screen is a browser module: the shell state it reads wants a #content node
// and the reduced-motion query. Both are cheap to stand in for, and standing in
// for them is the only way to render the lab without a browser.
const content = {
  dataset: {},
  innerHTML: '',
  querySelector: () => null,
  querySelectorAll: () => [],
  focus: () => {},
};
globalThis.document = {
  querySelector: selector => (selector === '#content' ? content : null),
  querySelectorAll: () => [],
};
globalThis.window = { matchMedia: () => ({ matches: false, addEventListener() {} }) };

const { state } = await import('../src/app/state.mjs');
const { balance } = await import('../src/screens/balance.mjs');
const { PLAYABLE_ACTS } = await import('../src/campaign/acts.mjs');

test('the lab renders its three groups without a gap in the template', () => {
  state.balanceAct = PLAYABLE_ACTS[0].id;
  state.balanceWave = 3;
  state.balancePicks = {};
  state.balanceItems = {};
  balance();
  const html = content.innerHTML;
  assert.match(html, /Balance lab/);
  assert.match(html, /Level choices/);
  assert.match(html, /Items/);
  assert.match(html, /PLAY THIS WAVE/);
  assert.match(html, /Entering wave 3/);
  for (const character of ['EL NEGRO', 'SOLAGO']) assert.ok(html.includes(character), `${character} is offered`);
  assert.equal(html.includes('undefined'), false, 'no missing value leaks into the page');
  assert.equal(html.includes('NaN'), false);
  assert.equal(html.includes('[object Object]'), false);
});

test('the wave selector clamps to the act and never points at a missing wave', () => {
  state.balanceAct = PLAYABLE_ACTS[1].id;
  state.balanceWave = 99;
  balance();
  assert.equal(state.balanceWave, PLAYABLE_ACTS[1].boss.wave);
  state.balanceWave = 0;
  balance();
  assert.equal(state.balanceWave, 1);
});

test('a stale build survives the re-render instead of crashing it', () => {
  state.balanceAct = 'act-01';
  state.balanceWave = 1;
  state.balancePicks = { 'stat-attack': 4, 'brick-pierce': 2 };
  state.balanceItems = { chicken: 3 };
  balance();
  assert.equal(content.innerHTML.includes('undefined'), false);
  assert.match(content.innerHTML, /NO CHOICES LEFT|LEVEL NOT REACHED|OTHER CHARACTER/);
});
