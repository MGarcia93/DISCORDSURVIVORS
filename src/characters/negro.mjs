import { WORLD_SCALE } from '../constants.mjs';
import { resolveEntityStats } from '../stats.mjs';
import { drawElNegro, drawChair } from '../sprites.mjs';

const negro = {
  id: 'negro',
  name: 'EL NEGRO',
  gameNote: '4 OLEADAS DE 60 SEGUNDOS · MEJORAS ACUMULABLES · SOLAGO SE DESBLOQUEA AL GANAR',
  // Unlock contract: a null flag means always playable. Progress reads this
  // descriptor, so adding a character never adds a branch to progression.
  unlock: { flag: null },
  // Selection screen metadata: label, profile block and preview pose belong
  // to the ficha. Adding a character never touches app.mjs or screens again.
  label: 'Negro',
  detailLabel: 'El Negro',
  previewAria: 'Sprite de El Negro: buzo amarillo, pelo negro recogido, lentes, mostacho, perilla y piercings',
  profile: `
      <div class="eyebrow">Sedentario a distancia · Dificultad fácil</div><h2>EL NEGRO</h2>
      <p class="character-desc">Se cree blanco cuando es negro. Dice que se baña, pero nadie le cree. Amante de las coloradas, las Hello Kitty Girls y las sin papá.</p>
      <p class="character-quote">«El verdadero esfuerzo es levantarse».</p>
      <div class="stats"><div><b>120</b><small>VIDA</small></div><div><b>+15%</b><small>DEFENSA</small></div><div><b class="penalty">−15%</b><small>VELOCIDAD</small></div></div>
      <div class="skill"><kbd>∞</kbd><div><b>ARSENAL GAMER</b><p>Alterna entre control remoto, joystick y celular. Empieza sin rebote; podés elegirlo al subir de nivel.</p></div></div>
      <div class="skill"><kbd>☾</kbd><div><b>SEDENTARISMO EXTREMO</b><p>Quedate quieto 2 segundos para regenerar vida. Por fin una recompensa por no hacer nada.</p></div></div>
      <div class="skill"><kbd>Q</kbd><div><b>ME DA PAJA</b><p>6 segundos en el sillón: daño en área, resistencia extra y casi nada de movimiento. Recarga: 22 segundos.</p></div></div>
      <div class="skill"><kbd>E</kbd><div><b>MODO OTAKU</b><p>Invocá una waifu pixel art durante 8 segundos. Recarga: 18 segundos.</p></div></div>`,
  // Roster card pose and the animated selection preview live here too.
  rosterPose: { x: 20, y: 47 },
  drawRoster(ctx) { drawElNegro(ctx, this.rosterPose.x, this.rosterPose.y, { scale: 1 }); },
  preview(ctx, { time, cycle }) {
    const isSitting = cycle > 6.6;
    const moving = cycle < 3.4;
    const previewFacing = isSitting ? 1 : cycle < 5 ? 1 : -1;
    if (isSitting) drawChair(ctx, 128, 150, { scale: 2 });
    drawElNegro(ctx, 128, 150, { time, moving, facing: previewFacing, sitting: isSitting, scale: 2 });
  },
  regenHud(p) { return { ringY: p.y + 31, radius: 37, textX: p.x - 31, textY: p.y - 77 }; },
  // «Guardián del sillón»: the still passive banks a shield, and the HUD says so
  // while there is something left to absorb.
  buffs(p) {
    return (p.shield ?? 0) > 0
      ? [{ id: 'shield', name: 'ESCUDO', detail: `absorbe ${Math.round(p.shield)}` }]
      : [];
  },
  draw(ctx, x, y, context) {
    drawElNegro(ctx, x, y, {
      time: context.time, moving: context.moving, facing: context.facing,
      sitting: context.player.chair > 0, scale: 2 });
  },
  // Stat sheet: percentages over BASE_STATS (src/stats.mjs), resolved to the
  // attacker values the engine reads.
  stats: {
    hitRadius: 17 * WORLD_SCALE, // collision size: not one of the six combat stats
    ...resolveEntityStats({
      // The joke is the effort he does not make: he is the slowest body in the
      // roster and he does not take hits for anyone. The tank is Solago.
      life: 120,             // 120 points of damage
      defense: 30,           // 3 defense points -> 15% mitigation
      attack: 240,           // 24 damage per shot: ranged pays 20% less, it never has to close
      attackSpeed: 190,      // 1.9 attacks/s: faster than the cast, still not a standing wave clear
      attackDistance: 260,   // quarter of the screen: 286px (no sniping the whole arena)
      moveSpeed: 2800,       // 140 scaled px/s: last one to arrive, as always
    }),
  },
  // Sedentarismo extremo: the only body in the cast that heals by not moving.
  initPlayer(p) {
    p.regen = 4;
  },
  attack: { type: 'ranged', device: 'remote' },
  decays: [],
  passives: [],
  specials: [
    {
      key: 'anime', name: 'Modo Otaku', hotkey: 'e', duration: 8, cooldown: 18, durationBonus: 'waifuDuration',
      buff: 'waifu que dispara sola',
      onTick(run, p, dt, ctx) {
        run.animeIn -= dt;
        if (run.animeIn > 0) return;
        ctx.fire(run, { x: p.x + 40 * WORLD_SCALE, y: p.y - 40 * WORLD_SCALE }, p.damage * 1.5, 'magic');
        run.animeIn = Math.max(0.12, 0.3 - (p.rewardBonuses.waifuInterval ?? 0));
      },
    },
    {
      key: 'chair', name: 'Me da paja', hotkey: 'q', duration: 6, cooldown: 22,
      buff: 'daño en área · casi no te movés',
      speedFactor: 0.12, contactFactor: 0.2,
      onTick(run, p, dt, ctx) {
        run.chairIn -= dt;
        if (run.chairIn > 0) return;
        const radius = (145 + (p.rewardBonuses.chairRadius ?? 0)) * WORLD_SCALE;
        for (const enemy of run.enemies) if (ctx.distance(enemy, p) < radius) ctx.hit(run, enemy, p.damage * 0.8);
        run.chairIn = 0.5;
      },
    },
  ],
};

export default negro;
