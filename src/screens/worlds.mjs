import { worldIds, worlds } from '../backgrounds/index.mjs';
import { drawBackground } from '../backgrounds/index.mjs';
import { ROSTER } from '../characters/index.mjs';
import { state } from '../app/state.mjs';
import { drawCast } from './world-cast.mjs';

// Development-only viewer: every world at full stage size, animating, with the
// playable cast standing on it at the same scale scenes use. The selected
// ficha walks with WASD or the arrow keys so staging can be tried in place.
// Reachable at ?dev=worlds and it never writes progress.
export const isWorldDevelopment = () => new URLSearchParams(globalThis.location?.search ?? '').get('dev') === 'worlds';

const MOVE = { x: 0.26, y: 0.18 };
// Top-down maps: the whole canvas is walkable. No horizon, no facade to bump into.
const BOUNDS = { x: [0.03, 0.97], y: [0.05, 0.95] };
const WORLD_KEYS = new Set(['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright']);
let facing = 1;
let moving = false;

const castOn = () => state.worldPreviewCast !== false;
const slotFor = id => 0.30 + Math.max(0, ROSTER.findIndex(character => character.id === id)) * 0.14;
const actorLabel = () => (ROSTER.find(character => character.id === state.worldPreviewActor) ?? ROSTER[0]).label;

export function isWorldKey(key) { return WORLD_KEYS.has(key); }

const clamp = (value, [min, max]) => Math.min(max, Math.max(min, value));

// Called from the shell's keydown so movement needs no listener of its own.
export function moveWorldActor(dt) {
  const left = state.keys.has('a') || state.keys.has('arrowleft');
  const right = state.keys.has('d') || state.keys.has('arrowright');
  const up = state.keys.has('w') || state.keys.has('arrowup');
  const down = state.keys.has('s') || state.keys.has('arrowdown');
  const dx = (right ? 1 : 0) - (left ? 1 : 0);
  const dy = (down ? 1 : 0) - (up ? 1 : 0);
  moving = Boolean(dx || dy);
  if (!moving) return;
  const length = Math.hypot(dx, dy);
  const step = Math.min(dt, 0.1);
  const position = state.worldPreviewPos;
  position.x = clamp(position.x + (dx / length) * MOVE.x * step, BOUNDS.x);
  position.y = clamp(position.y + (dy / length) * MOVE.y * step, BOUNDS.y);
  if (dx) facing = dx < 0 ? -1 : 1;
}

function status() {
  const canvas = document.querySelector('#world-stage');
  const entry = worlds.find(world => world.id === state.worldPreview) ?? worlds[0];
  const cast = castOn() ? ` ${actorLabel()} walks with WASD or the arrow keys.` : '';
  document.querySelector('#world-status').textContent =
    `${entry.title} — ${canvas.width}×${canvas.height}. Painted once into a baked canvas, then one blit per frame.${cast}`;
}

export function worldsScreen() {
  state.worldPreview = worldIds.includes(state.worldPreview) ? state.worldPreview : worldIds[0];
  moving = false; facing = 1;
  state.content.innerHTML = `<section class="screen world-viewer">
    <div class="screen-heading"><h1>World backgrounds</h1><button class="secondary" data-action="home">Back to game menu</button></div>
    <p class="world-viewer-intro">Every act's backdrop. Development viewer — no progress is saved.</p>
    <div class="actions">
      <label>World <select id="world-select" aria-label="World">${worlds.map(world => `<option value="${world.id}"${world.id === state.worldPreview ? ' selected' : ''}>${world.title}</option>`).join('')}</select></label>
      <label>Actor <select id="world-actor" aria-label="Controlled character">${ROSTER.map(character => `<option value="${character.id}"${character.id === state.worldPreviewActor ? ' selected' : ''}>${character.label}</option>`).join('')}</select></label>
      <label class="world-cast-toggle"><input type="checkbox" id="world-cast"${castOn() ? ' checked' : ''}> Show the cast</label>
    </div>
    <div class="world-stage-wrap"><canvas id="world-stage" class="world-stage" width="1144" height="748" tabindex="0" aria-label="World background preview"></canvas></div>
    <p id="world-status" role="status"></p>
  </section>`;
  const select = state.content.querySelector('#world-select');
  select.addEventListener('change', () => { state.worldPreview = select.value; select.blur(); status(); });
  const actor = state.content.querySelector('#world-actor');
  actor.addEventListener('change', () => {
    state.worldPreviewActor = actor.value;
    state.worldPreviewPos = { x: slotFor(actor.value), y: 0.68 };
    actor.blur();
    status();
  });
  const cast = state.content.querySelector('#world-cast');
  cast.addEventListener('change', () => { state.worldPreviewCast = cast.checked; cast.blur(); status(); });
  status();
}

export function drawWorldPreview(dt, time) {
  const canvas = document.querySelector('#world-stage');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  moveWorldActor(dt);
  drawBackground(ctx, state.worldPreview, { width: canvas.width, height: canvas.height, time });
  if (castOn()) {
    drawCast(ctx, canvas.width, canvas.height, time, {
      actor: state.worldPreviewActor, pos: state.worldPreviewPos, moving, facing,
    });
  }
}
