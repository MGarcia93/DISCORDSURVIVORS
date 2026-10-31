import { PLAYABLE_ACTS, getAct } from '../campaign/acts.mjs';
import { ROSTER } from '../characters/index.mjs';
import { DEFAULT_CATALOG, EFFECTS } from '../reward-data.mjs';
import { describeReward } from '../reward-catalog.mjs';
import { countOf, previewReward } from '../run-rewards.mjs';
import { state } from '../app/state.mjs';
import {
  SHOP_UPGRADES, balanceForMode, itemBlocked, pickBlocked, seedRun, shopBlocked,
} from '../game/balance-seed.mjs';
import { drawItemIcon } from '../game/item-icons.mjs';

// Development-only lab. One wave of the campaign, seeded with the build a
// player would already own arriving there, played for real: same engine, same
// HUD, same shop after it. Reachable at ?dev=balance, and it never writes
// progress.
export const isBalanceDevelopment = () =>
  new URLSearchParams(globalThis.location?.search ?? '').get('dev') === 'balance';

const escapeText = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

const REASONS = {
  level: 'LEVEL NOT REACHED',
  budget: 'NO CHOICES LEFT',
  maxed: 'MAXED',
  character: 'OTHER CHARACTER',
  incompatible: 'NOT COMPATIBLE',
  coins: 'NOT ENOUGH COINS',
  disabled: 'NOT IN THE POOL',
  unknown: 'UNKNOWN',
};

function currentRun() {
  return seedRun({
    character: state.balanceCharacter,
    act: getAct(state.balanceAct),
    wave: state.balanceWave,
    balance: balanceForMode(state.balanceMode),
    picks: state.balancePicks,
    shop: state.balanceShop,
    items: state.balanceItems,
  });
}

function levelCards(run, entry) {
  const character = state.balanceCharacter;
  const upgrades = DEFAULT_CATALOG.upgrades.filter(candidate => candidate.characters === 'all' || candidate.characters === character);
  return upgrades.map(upgrade => {
    const rank = countOf(state.balancePicks, upgrade.id);
    const blocked = pickBlocked(upgrade, {
      character, level: entry.level, choices: entry.choices, picks: state.balancePicks,
    });
    const next = upgrade.ranks[rank];
    const preview = blocked || !next ? null : previewReward(run, `balance-level:${upgrade.id}:${rank}`, next);
    const reason = blocked ?? (preview ? null : 'incompatible');
    const text = next ? describeReward(next, EFFECTS).join(' · ') : 'No ranks left';
    const own = upgrade.characters !== 'all';
    return `<button class="upgrade ${own ? 'own' : ''}" data-pick="${escapeText(upgrade.id)}" ${reason ? 'disabled' : ''}>
      <b>${escapeText(upgrade.name)}</b>
      <span>${escapeText(text)}</span>
      <small>${reason ? REASONS[reason] : `RANK ${rank}/${upgrade.ranks.length}`}</small>
    </button>`;
  }).join('');
}

function shopCards(run) {
  return SHOP_UPGRADES.map(upgrade => {
    const level = countOf(state.balanceShop, upgrade.id);
    const blocked = shopBlocked(upgrade, { coins: run.coins, shop: state.balanceShop });
    const cost = upgrade.costs[level];
    return `<button class="upgrade" data-shop="${escapeText(upgrade.id)}" ${blocked ? 'disabled' : ''}>
      <b>${escapeText(upgrade.name)}</b>
      <span>${escapeText(upgrade.description)}</span>
      <small>${blocked ? REASONS[blocked] : `${level}/${upgrade.costs.length} · ${cost} ◈`}</small>
    </button>`;
  }).join('');
}

function itemCards(run) {
  return DEFAULT_CATALOG.items.map(item => {
    const owned = countOf(state.balanceItems, item.id);
    const blocked = itemBlocked(item, { coins: run.coins, items: state.balanceItems });
    const preview = blocked ? null : previewReward(run, `balance-item:${item.id}`, item);
    const reason = blocked ?? (preview ? null : 'incompatible');
    return `<button class="upgrade" data-item="${escapeText(item.id)}" ${reason ? 'disabled' : ''}>
      <b><canvas data-art="${escapeText(item.id)}" width="24" height="24" aria-hidden="true"></canvas>${escapeText(item.name)}</b>
      <span>${escapeText(describeReward(item, EFFECTS).join(' · '))}</span>
      <small>${reason ? REASONS[reason] : `${owned}/${item.maxCopies} · ${item.price} ◈`}</small>
    </button>`;
  }).join('');
}

function budgetLine(entry, run) {
  const act = getAct(state.balanceAct);
  const spent = Object.values(state.balancePicks).reduce((sum, rank) => sum + rank, 0);
  const left = Math.max(0, entry.choices - spent);
  return `Entering wave ${entry.wave} of ${act.title} at level ${entry.level}: ${left} of ${entry.choices} level choice(s) left, `
    + `${run.coins} of ${entry.coins} coins left. Wave length ${entry.duration} s. The budget comes from the waves before this one.`;
}

export function balance() {
  if (!PLAYABLE_ACTS.some(act => act.id === state.balanceAct)) state.balanceAct = PLAYABLE_ACTS[0].id;
  const act = getAct(state.balanceAct);
  state.balanceWave = Math.max(1, Math.min(act.boss.wave, Math.round(state.balanceWave) || 1));
  if (!ROSTER.some(character => character.id === state.balanceCharacter)) state.balanceCharacter = ROSTER[0].id;
  const { run, entry } = currentRun();
  const waveOptions = Array.from({ length: act.boss.wave }, (_, index) => index + 1);
  state.content.innerHTML = `<section class="screen world-viewer balance-lab">
    <div class="screen-heading"><h1>Balance lab</h1><button class="secondary" data-action="home">Back to game menu</button></div>
    <p class="world-viewer-intro">A real run, thrown away afterwards: the wave plays with its own HUD, shop and abilities. The budget is what the campaign would have paid you by then. No progress is saved.</p>
    <div class="actions">
      <label>Character <select id="balance-character" aria-label="Character">${ROSTER.map(character => `<option value="${character.id}"${character.id === state.balanceCharacter ? ' selected' : ''}>${escapeText(character.name)}</option>`).join('')}</select></label>
      <label>World <select id="balance-act" aria-label="World">${PLAYABLE_ACTS.map(candidate => `<option value="${candidate.id}"${candidate.id === state.balanceAct ? ' selected' : ''}>${escapeText(candidate.title)}</option>`).join('')}</select></label>
      <label>Wave <select id="balance-wave" aria-label="Wave">${waveOptions.map(wave => `<option value="${wave}"${wave === state.balanceWave ? ' selected' : ''}>${wave}${wave === act.boss.wave ? ' (boss)' : ''}</option>`).join('')}</select></label>
      <label>Balance <select id="balance-mode" aria-label="Balance">${[['real', 'Real (60 s, 1 XP per kill)'], ['playtest', 'Playtest (15 s, ×10 XP)']].map(([value, label]) => `<option value="${value}"${value === state.balanceMode ? ' selected' : ''}>${label}</option>`).join('')}</select></label>
    </div>
    <p id="balance-budget" role="status">${escapeText(budgetLine(entry, run))}</p>
    <section class="balance-group"><h2>Level choices <small>${entry.level - 1} available</small></h2><div class="balance-cards">${levelCards(run, entry)}</div></section>
    <section class="balance-group"><h2>Shop upgrades <small>${run.coins} ◈ left</small></h2><div class="balance-cards">${shopCards(run)}</div></section>
    <section class="balance-group"><h2>Items <small>${run.coins} ◈ left</small></h2><div class="balance-cards">${itemCards(run)}</div></section>
    <div class="actions">
      <button class="secondary" data-reset>Clear the build</button>
      <button class="primary" data-action="balance-play">PLAY THIS WAVE</button>
    </div>
  </section>`;

  const bind = (selector, event, handler) => state.content.querySelector(selector)
    ?.addEventListener(event, handler);
  bind('#balance-character', 'change', event => {
    state.balanceCharacter = event.target.value;
    // Own upgrades belong to the character that owns them: a switch starts over.
    state.balancePicks = {};
    event.target.blur();
    balance();
  });
  bind('#balance-act', 'change', event => {
    state.balanceAct = event.target.value;
    state.balanceWave = 1;
    state.balancePicks = {};
    event.target.blur();
    balance();
  });
  bind('#balance-wave', 'change', event => {
    state.balanceWave = Number(event.target.value);
    event.target.blur();
    balance();
  });
  bind('#balance-mode', 'change', event => {
    state.balanceMode = event.target.value;
    event.target.blur();
    balance();
  });
  bind('[data-reset]', 'click', () => {
    state.balancePicks = {};
    state.balanceShop = {};
    state.balanceItems = {};
    balance();
  });
  for (const button of state.content.querySelectorAll('[data-pick]')) {
    button.addEventListener('click', () => {
      const id = button.dataset.pick;
      state.balancePicks = { ...state.balancePicks, [id]: countOf(state.balancePicks, id) + 1 };
      balance();
    });
  }
  for (const button of state.content.querySelectorAll('[data-shop]')) {
    button.addEventListener('click', () => {
      const id = button.dataset.shop;
      state.balanceShop = { ...state.balanceShop, [id]: countOf(state.balanceShop, id) + 1 };
      balance();
    });
  }
  for (const button of state.content.querySelectorAll('[data-item]')) {
    button.addEventListener('click', () => {
      const id = button.dataset.item;
      state.balanceItems = { ...state.balanceItems, [id]: countOf(state.balanceItems, id) + 1 };
      balance();
    });
  }
  for (const canvas of state.content.querySelectorAll('canvas[data-art]')) {
    drawItemIcon(canvas.getContext('2d'), canvas.dataset.art, canvas.width);
  }
}
