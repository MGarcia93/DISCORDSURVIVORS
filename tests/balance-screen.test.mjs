import test from 'node:test';
import assert from 'node:assert/strict';

// A screen is a browser module: the shell state it reads wants a #content node
// and the reduced-motion query. The stand-in also remembers the listeners the
// screen binds, so the cards are exercised as controls instead of as markup.
const listeners = new Map();
const attrSelectors = { '[data-pick]': 'pick', '[data-item]': 'item', '[data-unpick]': 'unpick', '[data-unitem]': 'unitem' };
const node = dataset => ({
  dataset,
  classList: { contains: () => false },
  addEventListener(event, handler) {
    const identity = Object.entries(dataset).filter(([key]) => key !== 'blocked');
    listeners.set(`${identity.map(([key, value]) => `${key}=${value}`).join(',')}|${event}`, handler);
  },
});
const content = {
  dataset: {},
  innerHTML: '',
  querySelector: selector => node({ selector }),
  querySelectorAll: selector => {
    const attr = attrSelectors[selector];
    if (!attr) return [];
    // The cards carry their gate as data-blocked, so the stub reads the whole
    // opening tag instead of only the id attribute.
    return [...content.innerHTML.matchAll(new RegExp(`<button([^>]*data-${attr}="([^"]+)"[^>]*)>`, 'g'))]
      .map(match => node({
        [attr]: match[2],
        blocked: /data-blocked="([^"]*)"/.exec(match[1])?.[1] ?? '',
      }));
  },
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

const control = key => {
  const handler = listeners.get(key);
  assert.ok(handler, `${key} is bound`);
  return handler;
};
const press = (key, event = {}) => control(key)({ preventDefault() {}, ...event });

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

test('a picked card shows its count and a −1 that takes one back', () => {
  state.balanceAct = 'act-01';
  state.balanceWave = 4;
  state.balancePicks = { 'stat-attack': 2 };
  state.balanceItems = { alcohol: 1 };
  balance();
  const html = content.innerHTML;
  assert.match(html, /data-pick="stat-attack"/, 'the card still adds');
  assert.match(html, /data-unpick="stat-attack"/, 'the picked rank can be taken back');
  assert.doesNotMatch(html, /data-unpick="stat-life"/, 'an unpicked upgrade offers nothing to remove');
  assert.match(html, /data-unitem="alcohol"/, 'a bought item can be taken back');
  assert.doesNotMatch(html, /data-unitem="bleach"/, 'an unowned item offers nothing to remove');
  assert.match(html, /Level choices <small>\d+ of \d+ left<\/small>/, 'the heading counts the budget left');
  assert.match(html, /Items <small>\d+ of \d+ ◈ left<\/small>/);

  press('unpick=stat-attack|click');
  assert.deepEqual(state.balancePicks, { 'stat-attack': 1 });
  press('unitem=alcohol|click');
  assert.deepEqual(state.balanceItems, {});
});

test('an empty build has no removal controls at all', () => {
  state.balanceAct = 'act-01';
  state.balanceWave = 4;
  state.balancePicks = {};
  state.balanceItems = {};
  balance();
  assert.doesNotMatch(content.innerHTML, /data-unpick="/);
  assert.doesNotMatch(content.innerHTML, /data-unitem="/);
});

test('a top-rank card keeps its counter instead of a MAXED label', () => {
  state.balanceAct = 'act-01';
  state.balanceWave = 4;
  state.balancePicks = { 'stat-attack': 5 };
  state.balanceItems = { alcohol: 2 };
  balance();
  const html = content.innerHTML;
  assert.match(html, /RANK 5\/5/, 'the rank at its cap still reads as a count');
  assert.match(html, /<small>2\/2<\/small>/, 'a maxed item is just its copies');
  assert.doesNotMatch(html, /MAXED/);
});

test('right click takes one back and cancels the browser menu', () => {
  state.balanceAct = 'act-01';
  state.balanceWave = 4;
  state.balancePicks = { 'stat-attack': 2 };
  state.balanceItems = { alcohol: 1 };
  balance();
  let prevented = 0;
  press('pick=stat-attack|contextmenu', { preventDefault: () => { prevented++; } });
  assert.equal(prevented, 1, 'the context menu never opens over a build card');
  assert.deepEqual(state.balancePicks, { 'stat-attack': 1 });
  press('item=alcohol|contextmenu', { preventDefault: () => { prevented++; } });
  assert.equal(prevented, 2);
  assert.deepEqual(state.balanceItems, {});
});

test('right click on an empty or blocked card removes nothing but still cancels the menu', () => {
  state.balanceAct = 'act-01';
  state.balanceWave = 1;
  state.balancePicks = {};
  state.balanceItems = {};
  balance();
  let prevented = 0;
  press('pick=stat-attack|contextmenu', { preventDefault: () => { prevented++; } });
  assert.equal(prevented, 1);
  assert.deepEqual(state.balancePicks, {}, 'a card with no picks has nothing to take back');
});

test('a blocked card refuses the left click and keeps the right one', () => {
  state.balanceAct = 'act-01';
  state.balanceWave = 1;
  state.balancePicks = {};
  state.balanceItems = {};
  balance();
  // Wave one grants no choices, so every upgrade is blocked by the level gate.
  assert.match(content.innerHTML, /data-blocked="level"/);
  press('pick=stat-attack|click');
  assert.deepEqual(state.balancePicks, {}, 'the blocked card does not add');
});

test('the lab offers the cinematics switch and remembers it', () => {
  state.balanceAct = 'act-01';
  state.balanceCinematics = false;
  balance();
  assert.match(content.innerHTML, /id="balance-cinematics"/, 'the build screen can turn the story on');
  assert.doesNotMatch(content.innerHTML, /id="balance-cinematics"[^>]* checked/, 'off is the default');
  press('selector=#balance-cinematics|change', { target: { checked: true } });
  assert.equal(state.balanceCinematics, true, 'the switch is state, not markup');
  balance();
  assert.match(content.innerHTML, /id="balance-cinematics"[^>]* checked/, 'the switch survives a re-render');
  state.balanceCinematics = false;
});

test('Jhony owns six cards, one per signature, and each one states its own rank', () => {
  state.balanceCharacter = 'jhony';
  state.balanceAct = 'act-01';
  state.balanceWave = 4;
  state.balancePicks = {};
  state.balanceItems = {};
  balance();
  const cards = [...content.innerHTML.matchAll(/<button class="upgrade ([^"]*)" data-pick="([^"]+)"[\s\S]*?<b>([^<]*)<\/b>\s*<span>([^<]*)<\/span>/g)]
    .filter(([, classes]) => classes.split(' ').includes('own'));
  assert.equal(cards.length, 6, 'six signatures, not twelve cards');
  const texts = cards.map(([, , , , text]) => text);
  assert.equal(new Set(texts).size, texts.length, 'no two signatures sell the same thing');

  // The rank being sold is the one described: rank II is the evolution, never
  // the first form again.
  state.balancePicks = { 'tilt-circle': 1 };
  balance();
  const circle = /data-pick="tilt-circle"[\s\S]*?<span>([^<]*)<\/span>/.exec(content.innerHTML);
  assert.ok(circle, 'the circle card is on the board');
  assert.equal(circle[1], 'Onda de Tilt y el círculo queda en el piso');
  assert.match(content.innerHTML, /RANK 1\/2/);
});
