import { WIDTH, HEIGHT, WORLD_SCALE } from '../engine.mjs';
import { drawAnime, drawSmokeCloud, drawShroomBlast, drawAstralAura } from '../sprites.mjs';
import { drawProjectiles } from './projectiles.mjs';
import { drawEnemyFigure } from './figures.mjs';
import { pixelText } from '../scenes.mjs';
import { drawBackground } from '../backgrounds/index.mjs';
import { state } from '../app/state.mjs';

export function rounded(ctx, x, y, width, height, radius, fill) {
  ctx.fillStyle = fill;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(width), Math.round(height));
}

function pixelRing(ctx, x, y, radius, color, opacity = 0.65) {
  ctx.save();
  ctx.globalAlpha *= opacity;
  ctx.fillStyle = color;
  for (let i = 0; i < 48; i++) {
    const angle = i / 48 * Math.PI * 2;
    ctx.fillRect(Math.round((x + Math.cos(angle) * radius) / 4) * 4, Math.round((y + Math.sin(angle) * radius) / 4) * 4, 4, 4);
  }
  ctx.restore();
}

// The run as a picture: background, figures, health bars, shockwaves, auras,
// projectiles and floating effects. The game canvas and the enemy sandbox both
// paint through here, so the sandbox cannot show less than the game does. HUD
// and overlays are DOM and live elsewhere. The figure drawers live in
// figures.mjs, shared with the dev screens.
export function drawRunScene(ctx, run, {
  world, time = run?.elapsed ?? 0, facing = 1, moving = true, underlay,
} = {}) {
  if (!run) return;
  const p = run.player;
  drawBackground(ctx, world ?? run.act?.world ?? 'arena', { width: WIDTH, height: HEIGHT, time });
  // Dev-only decoration (the sandbox's reach ring) sits under the actors, the
  // same place the game draws its ground marks.
  underlay?.(ctx, run);
  const astral = p.characterDef.specials.find(special => special.key === 'astral');
  if (p.astral > 0 && astral) {
    drawAstralAura(ctx, p.x, p.y, astral.radius, time, Math.min(1, p.astral / 0.4));
  }
  if (p.chair > 0) {
    ctx.fillStyle = '#a18aff12'; ctx.strokeStyle = '#a18aff66'; ctx.lineWidth = 2;
    pixelRing(ctx, p.x, p.y, 145 * 1.1, '#a18aff');
  }
  const figures = [...run.enemies];
  if (p.chair > 0) figures.push({ x: p.x, y: p.y - 0.6, kind: 'chair' });
  if (p.stand > 0) figures.push({ x: p.x + 13 * WORLD_SCALE, y: p.y - 1, kind: 'stand' });
  figures.push({ x: p.x, y: p.y, kind: 'player' });
  figures.sort((a, b) => a.y - b.y);
  for (const figure of figures) {
    if (figure.kind === 'player' && p.immune > 0 && Math.floor(p.immune * 14) % 2) ctx.globalAlpha = 0.45;
    if (figure.kind === 'player') {
      p.characterDef.draw(ctx, figure.x, figure.y + 38,
        { time, moving, facing, player: p });
    } else {
      drawEnemyFigure(ctx, figure, time);
    }
    ctx.globalAlpha = 1;
    if (figure.kind !== 'player' && (figure.boss || figure.hp < figure.maxHp)) {
      const width = (figure.boss ? 90 : figure.kind === 'brute' ? 44 : 30) * 1.1;
      const y = Math.max(6, figure.y - (figure.boss ? 138 : figure.kind === 'brute' ? 92 : 62) * 1.1);
      rounded(ctx, figure.x - width / 2, y, width, 4, 2, '#070b0b');
      rounded(ctx, figure.x - width / 2, y, width * Math.max(0, figure.hp / figure.maxHp), 4, 2, figure.boss ? '#b499f2' : '#d7f779');
    }
  }
  for (const wave of run.shockwaves ?? []) {
    pixelRing(ctx, wave.x, wave.y, wave.radius, '#ffb3c4', 1 - wave.radius / wave.maxRadius);
  }
  if (p.anime > 0) drawAnime(ctx, p.x + 48, p.y - 35, { time, scale: 1 });
  if (p.smile > 0) {
    // Solago's aura hugs his half-width, shorter frame instead of the tank-sized ring.
    pixelRing(ctx, p.x, p.y + 2, 34 * WORLD_SCALE, '#e8dfa1');
    pixelText(ctx, 'JA!', p.x - 16 * WORLD_SCALE, p.y - 42 * WORLD_SCALE, 2, '#e8dfa1');
  }
  if (p.stand > 0) pixelRing(ctx, p.x, p.y, 170 * WORLD_SCALE, '#a89ac6');
  if (p.still >= 2 && p.hp < p.maxHp) {
    const regen = p.characterDef.regenHud?.(p);
    if (regen) {
      pixelRing(ctx, p.x, regen.ringY, regen.radius, '#bfd890');
      pixelText(ctx, 'REGEN', regen.textX, regen.textY, 2, '#bfd890');
    }
  }
  if (p.sellVisionTtl > 0) {
    // The sold monitor: a forgiving pixel vignette hugging the arena edges.
    // It darkens scenery only; HUD and ability bars are DOM, never covered.
    ctx.save();
    const blur = Math.min(1, p.sellVisionTtl);
    const edge = 96 * WORLD_SCALE;
    const bands = [
      [0, 0, WIDTH, edge], [0, HEIGHT - edge, WIDTH, edge],
      [0, 0, edge * 0.6, HEIGHT], [WIDTH - edge * 0.6, 0, edge * 0.6, HEIGHT],
    ];
    for (const [x, y, w, h] of bands) {
      ctx.globalAlpha = 0.34 * blur;
      ctx.fillStyle = '#0b0912';
      ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
    }
    for (let i = 1; i <= 3; i++) {
      const inset = edge * (0.25 + i * 0.22);
      ctx.globalAlpha = 0.13 * blur;
      ctx.fillStyle = '#0b0912';
      ctx.fillRect(inset, inset, WIDTH - inset * 2, 26);
      ctx.fillRect(inset, HEIGHT - inset - 26, WIDTH - inset * 2, 26);
      ctx.fillRect(inset, inset, 26, HEIGHT - inset * 2);
      ctx.fillRect(WIDTH - inset - 26, inset, 26, HEIGHT - inset * 2);
    }
    ctx.restore();
  }
  drawProjectiles(ctx, run.projectiles);
  ctx.textAlign = 'center'; ctx.font = 'bold 14px monospace';
  for (const effect of run.effects) {
    ctx.globalAlpha = Math.min(1, effect.ttl * 2);
    if (effect.kind === 'smoke') {
      drawSmokeCloud(ctx, effect.x, effect.y, effect.r, time, ctx.globalAlpha);
      continue;
    }
    if (effect.kind === 'shroomBlast') {
      drawShroomBlast(ctx, effect.x, effect.y, effect.radius,
        1 - effect.ttl / effect.duration);
      continue;
    }
    if (typeof effect.text !== 'string') continue;
    ctx.fillStyle = effect.loot ? '#d7f779' : effect.kind === 'stand' ? '#d9c4ef' : effect.kind === 'smile' ? '#fff0ae' : '#f4e9dc';
    ctx.fillText(effect.text, effect.x, effect.y);
  }
  ctx.globalAlpha = 1;
}

// The game canvas only owns the viewport: inside it is the shared run scene.
export function draw() {
  const canvas = document.querySelector('.arena-wrap canvas');
  const ctx = canvas?.getContext('2d');
  if (!ctx || !state.run) return;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingEnabled = false;
  drawRunScene(ctx, state.run, {
    time: state.run.elapsed,
    facing: state.facing,
    moving: state.run.player.still === 0,
  });
}
