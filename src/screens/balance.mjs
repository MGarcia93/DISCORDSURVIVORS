import { PLAYABLE_ACTS, getAct } from '../campaign/acts.mjs';
import { ROSTER } from '../characters/index.mjs';
import { DEFAULT_CATALOG, EFFECTS } from '../reward-data.mjs';
import { describeReward } from '../reward-catalog.mjs';
import { countOf, itemPrice, previewReward } from '../run-rewards.mjs';
import { state } from '../app/state.mjs';
import { balanceForMode, itemBlocked, pickBlocked, removeOne, seedRun } from '../game/balance-seed.mjs';
import { rewardEffectTotals } from '../game/reward-view.mjs';
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
  character: 'OTHER CHARACTER',
  incompatible: 'NOT COMPATIBLE',
  coins: 'NOT ENOUGH COINS',
  disabled: 'NOT IN THE POOL',
  unknown: 'UNKNOWN',
};

// A maxed card is not a refusal: it is a card at its top rank, so the counter
// speaks for itself (`RANK 5/5`, `2/2`) instead of a reason nobody can act on.
const statusLine = (reason, count) => {
  if (!reason || reason === 'maxed') return count;
  return `${REASONS[reason] ?? REASONS.unknown} · ${count}`;
};

function currentRun() {
  return seedRun({
    character: state.balanceCharacter,
    act: getAct(state.balanceAct),
    wave: state.balanceWave,
    balance: balanceForMode(state.balanceMode),
    picks: state.balancePicks,
    items: state.balanceItems,
  });
}

function levelCards(run, entry) {
  const character = state.balanceCharacter;
  const upgrades = DEFAULT_CATALOG.upgrades.filter(candidate => candidate.characters === 'all' || candidate.characters === character);
  return upgrades.map(upgrade => {
    const id = escapeText(upgrade.id);
    const rank = countOf(state.balancePicks, upgrade.id);
    const blocked = pickBlocked(upgrade, {
      character, level: entry.level, choices: entry.choices, picks: state.balancePicks,
    });
    const next = upgrade.ranks[rank];
    const preview = blocked || !next ? null : previewReward(run, `balance-level:${upgrade.id}:${rank}`, next);
    const reason = blocked ?? (preview ? null : 'incompatible');
    // The card describes the rank it is actually selling, so rank II reads as
    // its evolution and not as the first form again.
    const totals = next ? rewardEffectTotals(run, `balance-level:${upgrade.id}:${rank}`, next) : null;
    const text = next ? describeReward(next, EFFECTS, totals ?? {}).join(' · ') : 'No ranks left';
    const own = upgrade.characters !== 'all';
    // A picked card keeps its remove control even when the add side is blocked
    // by the budget or the rank cap: the way out has to stay open.
    const remove = rank > 0
      ? `<button class="balance-remove" data-unpick="${id}" aria-label="Remove one rank of ${escapeText(upgrade.name)} (−1)">−1</button>`
      : '';
    return `<div class="balance-pick">
      <button class="upgrade ${own ? 'own' : ''}${reason ? ' blocked' : ''}" data-pick="${id}" data-blocked="${reason ?? ''}" title="${reason ? REASONS[reason] ?? REASONS.unknown : 'Left click adds a rank, right click takes one back'}">
        <b>${escapeText(upgrade.name)}</b>
        <span>${escapeText(text)}</span>
        <small>${statusLine(reason, `RANK ${rank}/${upgrade.ranks.length}`)}</small>
      </button>
      ${remove}
    </div>`;
  }).join('');
}

function itemCards(run) {
  return DEFAULT_CATALOG.items.map(item => {
    const id = escapeText(item.id);
    const owned = countOf(state.balanceItems, item.id);
    const blocked = itemBlocked(item, { coins: run.coins, items: state.balanceItems, wave: state.balanceWave });
    const preview = blocked ? null : previewReward(run, `balance-item:${item.id}`, item);
    const reason = blocked ?? (preview ? null : 'incompatible');
    const remove = owned > 0
      ? `<button class="balance-remove" data-unitem="${id}" aria-label="Remove one ${escapeText(item.name)} (−1)">−1</button>`
      : '';
    const price = reason ? null : itemPrice(item, owned, state.balanceWave);
    const count = `${owned}/${item.maxCopies}`;
    return `<div class="balance-pick">
      <button class="upgrade${reason ? ' blocked' : ''}" data-item="${id}" data-blocked="${reason ?? ''}" title="${reason ? REASONS[reason] ?? REASONS.unknown : 'Left click buys one, right click takes one back'}">
        <b><canvas data-art="${id}" width="24" height="24" aria-hidden="true"></canvas>${escapeText(item.name)}</b>
        <span>${escapeText(describeReward(item, EFFECTS).join(' · '))}</span>
        <small>${statusLine(reason, price === null ? count : `${count} · ${price} ◈`)}</small>
      </button>
      ${remove}
    </div>`;
  }).join('');
}

function budgetLine(entry) {
  const act = getAct(state.balanceAct);
  return `Entering wave ${entry.wave} of ${act.title} at level ${entry.level}. Wave length ${entry.duration} s. `
    + 'The budget is what the campaign already paid by then: every card below spends it and −1 returns it.';
}

export function balance() {
  if (!PLAYABLE_ACTS.some(act => act.id === state.balanceAct)) state.balanceAct = PLAYABLE_ACTS[0].id;
  const act = getAct(state.balanceAct);
  state.balanceWave = Math.max(1, Math.min(act.boss.wave, Math.round(state.balanceWave) || 1));
  if (!ROSTER.some(character => character.id === state.balanceCharacter)) state.balanceCharacter = ROSTER[0].id;
  const { run, entry } = currentRun();
  const spentChoices = Object.values(state.balancePicks).reduce((sum, rank) => sum + rank, 0);
  const leftChoices = Math.max(0, entry.choices - spentChoices);
  const waveOptions = Array.from({ length: act.boss.wave }, (_, index) => index + 1);
  state.content.innerHTML = `<section class="screen world-viewer balance-lab">
    <div class="screen-heading"><h1>Balance lab</h1><button class="secondary" data-action="home">Back to game menu</button></div>
    <p class="world-viewer-intro">A real run, thrown away afterwards: the wave plays with its own HUD, shop and abilities. The budget is what the campaign would have paid you by then. No progress is saved. Left click a card to add, <b>right click</b> or its <b>−1</b> to take one back and return its budget.</p>
    <div class="actions">
      <label>Character <select id="balance-character" aria-label="Character">${ROSTER.map(character => `<option value="${character.id}"${character.id === state.balanceCharacter ? ' selected' : ''}>${escapeText(character.name)}</option>`).join('')}</select></label>
      <label>World <select id="balance-act" aria-label="World">${PLAYABLE_ACTS.map(candidate => `<option value="${candidate.id}"${candidate.id === state.balanceAct ? ' selected' : ''}>${escapeText(candidate.title)}</option>`).join('')}</select></label>
      <label>Wave <select id="balance-wave" aria-label="Wave">${waveOptions.map(wave => `<option value="${wave}"${wave === state.balanceWave ? ' selected' : ''}>${wave}${wave === act.boss.wave ? ' (boss)' : ''}</option>`).join('')}</select></label>
      <label>Balance <select id="balance-mode" aria-label="Balance">${[['real', 'Real (60 s, 1 XP per kill)'], ['playtest', 'Playtest (15 s, ×10 XP)']].map(([value, label]) => `<option value="${value}"${value === state.balanceMode ? ' selected' : ''}>${label}</option>`).join('')}</select></label>
    </div>
    <p id="balance-budget" role="status">${escapeText(budgetLine(entry))}</p>
    <section class="balance-group"><h2>Level choices <small>${leftChoices} of ${entry.choices} left</small></h2><div class="balance-cards">${levelCards(run, entry)}</div></section>
    <section class="balance-group"><h2>Items <small>${run.coins} of ${entry.coins} ◈ left</small></h2><div class="balance-cards">${itemCards(run)}</div></section>
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
    state.balanceItems = {};
    balance();
  });
  // A blocked card is not `disabled`: a disabled button stops firing mouse
  // events, and the same card still has to answer a right click with a removal.
  // The gate lives in the click handler and the look comes from `.blocked`.
  for (const button of state.content.querySelectorAll('[data-pick]')) {
    button.addEventListener('click', () => {
      if (button.dataset.blocked) return;
      const id = button.dataset.pick;
      state.balancePicks = { ...state.balancePicks, [id]: countOf(state.balancePicks, id) + 1 };
      balance();
    });
    // The card follows the shop's left/right grammar: adding is the click, and
    // the right button takes one back without hunting for the −1. The browser
    // menu is cancelled here because on a build card there is nothing to open.
    button.addEventListener('contextmenu', event => {
      event.preventDefault();
      const id = button.dataset.pick;
      if (countOf(state.balancePicks, id) < 1) return;
      state.balancePicks = removeOne(state.balancePicks, id);
      balance();
    });
  }
  for (const button of state.content.querySelectorAll('[data-item]')) {
    button.addEventListener('click', () => {
      if (button.dataset.blocked) return;
      const id = button.dataset.item;
      state.balanceItems = { ...state.balanceItems, [id]: countOf(state.balanceItems, id) + 1 };
      balance();
    });
    button.addEventListener('contextmenu', event => {
      event.preventDefault();
      const id = button.dataset.item;
      if (countOf(state.balanceItems, id) < 1) return;
      state.balanceItems = removeOne(state.balanceItems, id);
      balance();
    });
  }
  // Taking one back is the inverse of picking, and it re-renders the same way:
  // the run re-seeds from the build, so the returned budget is live at once.
  for (const button of state.content.querySelectorAll('[data-unpick]')) {
    button.addEventListener('click', () => {
      state.balancePicks = removeOne(state.balancePicks, button.dataset.unpick);
      balance();
    });
  }
  for (const button of state.content.querySelectorAll('[data-unitem]')) {
    button.addEventListener('click', () => {
      state.balanceItems = removeOne(state.balanceItems, button.dataset.unitem);
      balance();
    });
  }
  for (const canvas of state.content.querySelectorAll('canvas[data-art]')) {
    drawItemIcon(canvas.getContext('2d'), canvas.dataset.art, canvas.width);
  }
}
