import { WIDTH, HEIGHT, WORLD_SCALE, createEnemy, createRun, step } from '../engine.mjs';
import {
  ENEMY_KINDS, enemyAttackInterval, enemyAttackRange, enemyBounty,
  enemyContactDamage, enemyDefense, enemyHp, enemySpeed, getEnemyKind,
} from '../enemies/index.mjs';
import { drawBackground, worldIds, worlds } from '../backgrounds/index.mjs';
import { drawEnemyFigure } from '../game/figures.mjs';
import { state } from '../app/state.mjs';

// Development-only sandbox. It runs a real throwaway run: the selected kind
// spawns at an edge, walks, stops at its own attack distance and swings on its
// own cadence against a dummy that never moves and never attacks. No progress
// is written. Reachable at ?dev=enemies.
export const isEnemyDevelopment = () => new URLSearchParams(globalThis.location?.search ?? '').get('dev') === 'enemies';

const KINDS = Object.keys(ENEMY_KINDS);
// A crowd is what you want for a walker; a boss is looked at one at a time, with
// room around it to see what it summons.
const ALIVE_LIMIT = 6;
const aliveLimit = kind => (getEnemyKind(kind).boss ? 1 : ALIVE_LIMIT);
const SPAWN_EVERY = 0.9;

let arena = null;
let spawnIn = 0;

function resetArena() {
  const run = createRun(Math.random, 'negro');
  run.duration = Infinity;
  run.time = 0;
  run.wave = state.enemyPreviewWave;
  run.spawnBudget = 0;
  run.spawnIn = Infinity;
  run.enemies = [];
  run.projectiles = [];
  // The dummy soaks everything and never shoots, so the only thing on stage is
  // the enemy being inspected.
  run.player.hp = run.player.maxHp = 1e9;
  run.player.shotIn = Infinity;
  run.player.shotInterval = Infinity;
  spawnIn = 0;
  arena = run;
  return run;
}

function spawnAtEdge(run, kind) {
  const edge = Math.floor(Math.random() * 4);
  run.enemies.push(createEnemy(run, kind,
    edge === 0 ? -20 * WORLD_SCALE : edge === 1 ? WIDTH + 20 * WORLD_SCALE : Math.random() * WIDTH,
    edge === 2 ? -20 * WORLD_SCALE : edge === 3 ? HEIGHT + 20 * WORLD_SCALE : Math.random() * HEIGHT));
}

function sheet() {
  const kind = state.enemyPreviewKind;
  const wave = state.enemyPreviewWave;
  const def = ENEMY_KINDS[kind] ?? ENEMY_KINDS.zombie;
  const mitigation = Math.round(enemyDefense(kind, wave) * 100);
  const interval = enemyAttackInterval(kind, wave);
  return `Wave ${wave} — ${Math.round(enemyHp(kind, wave))} hp, ${mitigation}% mitigation, `
    + `${enemyContactDamage(kind, wave)} per hit every ${interval.toFixed(2)} s, `
    + `reach ${Math.round(enemyAttackRange(kind, wave))} px, ${Math.round(enemySpeed(kind, wave))} px/s, `
    + `radius ${Math.round(def.radius * WORLD_SCALE)} px, bounty ${enemyBounty(kind)}.`;
}

function status() {
  const node = document.querySelector('#enemy-status');
  if (node) node.textContent = `${sheet()} The dummy never moves: what you see is the enemy's own rule.`;
}

// Reach is measured from the collision edges, so the ring is the point where
// the enemy stops walking: attack distance plus both bodies.
function reachRing(ctx, enemy, player) {
  const radius = (enemy.attackRange ?? 0) + enemy.radius + player.hitRadius;
  ctx.save();
  ctx.globalAlpha *= 0.55;
  ctx.fillStyle = '#7fd0c8';
  for (let i = 0; i < 64; i++) {
    const angle = i / 64 * Math.PI * 2;
    ctx.fillRect(Math.round((enemy.x + Math.cos(angle) * radius) / 4) * 4,
      Math.round((enemy.y + Math.sin(angle) * radius) / 4) * 4, 3, 3);
  }
  ctx.restore();
}

function bar(ctx, x, y, width, ratio, color) {
  ctx.fillStyle = '#070b0b';
  ctx.fillRect(Math.round(x - width / 2), Math.round(y), Math.round(width), 4);
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x - width / 2), Math.round(y), Math.round(width * Math.max(0, Math.min(1, ratio))), 4);
}

export function drawEnemyPreview(dt) {
  const canvas = document.querySelector('#enemy-stage');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingEnabled = false;
  const run = arena ?? resetArena();
  const tick = Math.min(dt, 0.05);

  spawnIn -= tick;
  if (spawnIn <= 0 && run.enemies.length < aliveLimit(state.enemyPreviewKind)) {
    spawnAtEdge(run, state.enemyPreviewKind);
    spawnIn = SPAWN_EVERY;
  }
  step(run, tick, {});

  const p = run.player;
  drawBackground(ctx, state.enemyPreviewWorld, { width: canvas.width, height: canvas.height, time: run.elapsed });

  if (state.enemyPreviewReach) for (const enemy of run.enemies) reachRing(ctx, enemy, p);

  const figures = [...run.enemies, { x: p.x, y: p.y, kind: 'player' }].sort((a, b) => a.y - b.y);
  for (const figure of figures) {
    if (figure.kind === 'player') {
      if (p.immune > 0 && Math.floor(p.immune * 14) % 2) ctx.globalAlpha = 0.45;
      p.characterDef.draw(ctx, figure.x, figure.y + 38,
        { time: run.elapsed, moving: false, facing: 1, player: p });
    } else {
      drawEnemyFigure(ctx, figure, run.elapsed);
    }
    ctx.globalAlpha = 1;
  }
  for (const enemy of run.enemies) {
    if (enemy.hp < enemy.maxHp) bar(ctx, enemy.x, enemy.y - 62, 30, enemy.hp / enemy.maxHp, '#d7f779');
  }
  bar(ctx, p.x, p.y - 72, 46, p.immune > 0 ? 0.75 : 1, p.immune > 0 ? '#e85c79' : '#bfd890');
}

export function enemiesScreen() {
  state.enemyPreviewWorld = worldIds.includes(state.enemyPreviewWorld) ? state.enemyPreviewWorld : 'zomboid';
  state.enemyPreviewKind = KINDS.includes(state.enemyPreviewKind) ? state.enemyPreviewKind : KINDS[0];
  arena = null;
  state.content.innerHTML = `<section class="screen enemy-viewer world-viewer">
    <div class="screen-heading"><h1>Enemy sandbox</h1><button class="secondary" data-action="home">Back to game menu</button></div>
    <p class="world-viewer-intro">Real engine, throwaway run: the enemy walks in, stops at its own attack distance and swings on its own cadence. No progress is saved.</p>
    <div class="actions">
      <label>World <select id="enemy-world" aria-label="World">${worlds.map(world => `<option value="${world.id}"${world.id === state.enemyPreviewWorld ? ' selected' : ''}>${world.title}</option>`).join('')}</select></label>
      <label>Enemy <select id="enemy-kind" aria-label="Enemy kind">${KINDS.map(kind => `<option value="${kind}"${kind === state.enemyPreviewKind ? ' selected' : ''}>${kind}</option>`).join('')}</select></label>
      <label>Wave <input id="enemy-wave" type="number" min="1" max="6" step="1" value="${state.enemyPreviewWave}" aria-label="Wave"></label>
      <label class="world-cast-toggle"><input type="checkbox" id="enemy-reach"${state.enemyPreviewReach ? ' checked' : ''}> Show attack range</label>
      <button class="secondary" id="enemy-clear">Clear</button>
    </div>
    <div class="world-stage-wrap"><canvas id="enemy-stage" class="world-stage" width="1144" height="748" aria-label="Enemy sandbox"></canvas></div>
    <p id="enemy-status" role="status"></p>
  </section>`;

  const world = state.content.querySelector('#enemy-world');
  world.addEventListener('change', () => { state.enemyPreviewWorld = world.value; world.blur(); status(); });
  const kind = state.content.querySelector('#enemy-kind');
  kind.addEventListener('change', () => {
    state.enemyPreviewKind = kind.value;
    arena = null;
    kind.blur();
    status();
  });
  const wave = state.content.querySelector('#enemy-wave');
  wave.addEventListener('change', () => {
    state.enemyPreviewWave = Math.max(1, Math.min(6, Math.round(Number(wave.value) || 1)));
    wave.value = state.enemyPreviewWave;
    arena = null;
    wave.blur();
    status();
  });
  const reach = state.content.querySelector('#enemy-reach');
  reach.addEventListener('change', () => { state.enemyPreviewReach = reach.checked; reach.blur(); });
  state.content.querySelector('#enemy-clear').addEventListener('click', () => { arena = null; status(); });
  status();
}
