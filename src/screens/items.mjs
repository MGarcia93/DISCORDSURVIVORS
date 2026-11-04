import { PICKUPS, DROP_HEAL, MISSING_HEALTH_CHANCE, actDropChance, drawPickups } from '../pickups.mjs';
import { DEFAULT_CATALOG } from '../reward-data.mjs';
import { ROSTER } from '../characters/index.mjs';
import { drawBackground } from '../backgrounds/index.mjs';
import { WIDTH, HEIGHT } from '../constants.mjs';
import { state } from '../app/state.mjs';
import { DEV } from '../dev-flags.mjs';
import { pixelText } from '../scenes.mjs';

// Development-only sandbox for the drop a body leaves behind. It paints the
// real draw functions, at the real scale rule, on the real ground layer: what
// the screen shows is what the arena shows, only bigger. It never writes
// progress and it never runs an engine step. Reachable at ?dev=items.
export const isItemsDevelopment = () => DEV
  && new URLSearchParams(globalThis.location?.search ?? '').get('dev') === 'items';

const ORDER = ROSTER.map(character => character.id);
const GROUND = 520;
const SPACING = 180;
const MARGIN = 92;
const SCALE = 7;
const FICHA_NAMES = { negro: 'NEGRO', solago: 'SOLAGO', warrior: 'WARRIOR', papazito: 'PAPAZITO', jhony: 'JHONY', papafrita: 'PAPAFRITA' };

// The run shape `drawPickups` reads. Each object sits far enough from its
// neighbours that nothing overlaps, and its ttl keeps it solid (never blinking).
function stage() {
  return {
    pickups: ORDER.map((character, index) => ({
      character, x: MARGIN + index * SPACING, y: GROUND, ttl: 9,
    })),
  };
}

function percent(value) {
  return `${(value * 100).toFixed(1)}%`;
}

function rules() {
  const snack = DEFAULT_CATALOG.upgrades.find(entry => entry.id === 'snack');
  const chance = snack?.ranks[0].effects.find(effect => effect.type === 'dropChance')?.value ?? 0;
  const heal = snack?.ranks[0].effects.find(effect => effect.type === 'dropHeal')?.value ?? 0;
  return `Every ficha heals ${DROP_HEAL} health with its own drop. The chance is zero at full health and`
    + ` scales with what you are missing: ${percent(actDropChance(1))} per kill in world 1 up to`
    + ` ${percent(actDropChance(7))} in world 7. «Botín inesperado» adds +${percent(chance)} and +${heal} heal per rank.`;
}

function legend() {
  return ORDER.map(character => {
    const item = PICKUPS[character];
    return `<li><b>${FICHA_NAMES[character]}</b> <span>${item.label}</span></li>`;
  }).join('');
}

export function itemsScreen() {
  state.content.innerHTML = `<section class="screen enemy-viewer world-viewer">
    <div class="screen-heading"><h1>Item sandbox</h1><button class="secondary" data-action="home">Back to game menu</button></div>
    <p class="world-viewer-intro">The drop a body leaves behind, at the arena's own scale rule and on the ground layer the run paints it on. Same effect for all six: only the object and its drawing change. No progress is saved.</p>
    <div class="world-stage-wrap"><canvas id="item-stage" class="world-stage" width="1144" height="748" aria-label="Item sandbox"></canvas></div>
    <ul id="item-legend">${legend()}</ul>
    <p id="item-status" role="status">${rules()}</p>
  </section>`;

  const status = state.content.querySelector('#item-status');
  if (status) status.textContent = rules();
}

export function drawItemsPreview(time) {
  const canvas = document.querySelector('#item-stage');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingEnabled = false;
  // The real arena, because the drop is judged against the floor it lands on:
  // a street that swallows the object is not a drawing problem, it is a game
  // problem. Act 1's street is the default world the campaign starts on.
  drawBackground(ctx, 'zomboid-combat', { width: WIDTH, height: HEIGHT, time });

  drawPickups(ctx, stage(), time, { scale: SCALE });

  ORDER.forEach((character, index) => {
    const name = FICHA_NAMES[character];
    const width = name.length * 6 * 2;
    pixelText(ctx, name, MARGIN + index * SPACING - width / 2, GROUND + 18, 2, '#d7f779');
  });
}
