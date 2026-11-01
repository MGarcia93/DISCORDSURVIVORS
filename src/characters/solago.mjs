import { WORLD_SCALE } from '../constants.mjs';
import { resolveEntityStats } from '../stats.mjs';
import { drawSolago, drawPatrona } from '../sprites.mjs';

// What one smile is worth in damage. It is a block, not a stance: the pool is
// spent by the hits that land while she laughs, and what nobody uses is gone
// when the smile ends.
const SMILE_BLOCK = 40;
// Every bite that lands a kill feeds her: without it a melee body cannot walk
// through a six-wave act, let alone five of them.
const BITE_HEAL = 4;

const solago = {
  id: 'solago',
  name: 'SOLAGO',
  gameNote: 'MORDIDA AUTOMÁTICA · 8 BAJAS = PERMISO PARA JUGAR · STAND CON E',
  // Legacy flags remain valid; the campaign encounter also grants availability.
  unlock: { flag: 'solagoUnlocked', scene: 'act-02-solago' },
  // Selection screen metadata: label, profile block and preview pose belong
  // to the ficha; the roster presents the next missing campaign encounter.
  label: 'Solago',
  detailLabel: 'Solago',
  previewAria: 'Pixel art de Solago: remera oscura, reloj y paletas grandes',
  profile: `
      <div class="eyebrow">Tanque cuerpo a cuerpo · Contraataque</div><h2>SOLAGO</h2>
      <p class="character-desc">Dientón, sin voz ni voto en su casa: hasta las hijas le sacan las cosas. Vive mirando de reojo, con miedo de que lo vuelvan a apuñalar por la espalda con una tijera.</p>
      <p class="character-quote">«Su mayor fortaleza son las paletas. Su mayor debilidad, que lo llamen de otra habitación».</p>
      <div class="stats solago-stats"><div><b>190</b><small>VIDA</small></div><div><b>+133%</b><small>DAÑO MELEE</small></div><div><b>+8%</b><small>ALCANCE</small></div><div><b>+27%</b><small>DEFENSA</small></div><div><b>108%</b><small>VELOCIDAD</small></div></div>
      <div class="skill"><kbd>∞</kbd><div><b>MORDIDA DE PALETA</b><p>Mordidas automáticas de corto alcance y pegada pesada. Acercate para que cuenten: cada baja le devuelve 4 de vida. Pega fuerte, no rápido, y empuja lo que muerde.</p></div></div>
      <div class="skill"><kbd>◈</kbd><div><b>SONRISA BLINDADA</b><p>Cada tanto se ríe mostrando las paletas: bloquea 40 de daño durante 2,5 segundos. Si no le pegan, no sirve de nada. Igual que en su casa.</p></div></div>
      <div class="skill"><kbd>6×</kbd><div><b>PERMISO PARA JUGAR</b><p>Cada 6 bajas completás tareas y ganás +30% de daño y velocidad de ataque durante 8 segundos.</p></div></div>
      <div class="skill"><kbd>E</kbd><div><b>STAND: ¡LA PATRONA!</b><p>Solago se agacha y queda quieto mientras ella tijeretea en área durante 7 segundos. Al final también le pega. Recarga: 26 segundos.</p></div></div>`,
  unlockNote: {
    locked: 'SOLAGO · BLOQUEADO · ENCUENTRO DEL ACTO 2',
    unlocked: 'SOLAGO DESBLOQUEADO · DISPONIBLE PARA JUGAR',
  },
  rosterPose: { x: 26, y: 47 },
  drawRoster(ctx) { drawSolago(ctx, this.rosterPose.x, this.rosterPose.y, { scale: 1 }); },
  preview(ctx, { time, cycle }) {
    drawPatrona(ctx, 145, 151, { time, scale: 1.2 });
    drawSolago(ctx, 124, 150, { time, moving: cycle < 3.4, scale: 2 });
  },
  draw(ctx, x, y, context) {
    drawSolago(ctx, x, y, {
      time: context.time, moving: context.moving, facing: context.facing,
      attacking: context.player.attackFlash > 0, crouching: context.player.stand > 0, scale: 2 });
  },
  // Stat sheet: percentages over BASE_STATS (src/stats.mjs), resolved to the
  // attacker values the engine reads.
  stats: {
    hitRadius: 15 * WORLD_SCALE, // collision size: not one of the six combat stats
    ...resolveEntityStats({
      life: 190,            // 190 points of damage: the tank of the roster
      defense: 55,          // 5.5 defense points -> 27.5% mitigation
      attack: 700,          // 70 damage per bite: the heaviest punch in the cast
      attackSpeed: 150,     // 1.5 bites per second: each one has to hurt
      attackDistance: 78,   // wide enough to bite without standing inside the boss
      moveSpeed: 3550,      // ~178 scaled px/s: she has to reach the bite
    }),
  },
  attack: { type: 'melee' },
  decays: ['permissionActive'],
  // The heaviest bite in the cast shoves what it hits: every bite buys a step
  // forward, so standing still is not a strategy with her.
  combat: { permissionDamageMult: 1.3, permissionRateMult: 0.72, knockback: 15 },
  regenHud(p) { return { ringY: p.y + 2, radius: 34, textX: p.x - 31, textY: p.y - 46 }; },
  initPlayer(p) {
    p.smile = 0;
    p.smileBlock = 0;
    p.smileCooldown = 6;
    p.taskKills = 0;
    p.permissionNeeded = 6;
    p.permissionActive = 0;
  },
  taskHud(p) {
    return {
      percentage: p.permissionActive > 0 ? 100 : p.taskKills / p.permissionNeeded * 100,
      label: p.permissionActive > 0
        ? `${Math.ceil(p.permissionActive)}s · ¡TE DIERON PERMISO!`
        : `${p.taskKills}/${p.permissionNeeded} BAJAS`,
      active: p.permissionActive > 0,
    };
  },
  passives: [
    {
      key: 'smile',
      // The laugh is a block, not a stance: it eats damage while it lasts, and
      // it leaves nothing behind. The engine owns the shield pool, so the ring,
      // a projectile and a punch all hit the same wall.
      tick(run, p, dt, ctx) {
        if (p.smile <= 0 && (p.smileBlock ?? 0) > 0) {
          p.shield = Math.max(0, (p.shield ?? 0) - p.smileBlock);
          p.smileBlock = 0;
        }
        if (p.smileCooldown > 0 || p.smile > 0) return;
        p.smile = 2.5 + (p.rewardBonuses.smileDuration ?? 0);
        p.smileCooldown = Math.max(4, 10 - (p.rewardBonuses.smileCooldown ?? 0));
        p.smileBlock = SMILE_BLOCK;
        p.shield = (p.shield ?? 0) + SMILE_BLOCK;
        run.effects.push({ x: p.x, y: p.y - 40 * WORLD_SCALE, text: '¡JA!', ttl: 0.8, kind: 'smile' });
      },
    },
  ],
  onKill(run, p, enemy, ctx) {
    p.taskKills++;
    p.hp = Math.min(p.maxHp, p.hp + BITE_HEAL);
    if (p.taskKills >= p.permissionNeeded) {
      p.taskKills = 0;
      p.permissionActive = 8;
      run.effects.push({ x: p.x, y: p.y - 60 * WORLD_SCALE, text: '¡PERMISO!', ttl: 1.2, kind: 'permission' });
    }
  },
  specials: [
    {
      key: 'stand', name: 'La Patrona', hotkey: 'e', duration: 7, cooldown: 26, durationBonus: 'standDuration',
      immobilize: true,
      onTick(run, p, dt, ctx) {
        run.standIn -= dt;
        if (run.standIn > 0) return;
        const radius = (170 + (p.rewardBonuses.patronaRadius ?? 0)) * WORLD_SCALE;
        for (const enemy of run.enemies) {
          if (ctx.distance(enemy, p) < radius) ctx.hit(run, enemy, p.damage * 0.9, 'stand');
        }
        run.standIn = 0.4;
      },
      onExpire(run, p, ctx) {
        // Finisher: the scissors get one last wide cut before she leaves.
        const burst = p.rewardBonuses?.patronaFinal ?? 0;
        if (burst > 0) {
          const radius = (170 + (p.rewardBonuses?.patronaRadius ?? 0)) * WORLD_SCALE;
          for (const enemy of run.enemies) {
            if (enemy.hp > 0 && ctx.distance(enemy, p) < radius) ctx.hit(run, enemy, p.damage * burst, 'stand');
          }
          run.effects.push({ x: p.x, y: p.y - 72 * WORLD_SCALE, text: '¡TIJERETAZO FINAL!', ttl: 1, kind: 'stand' });
        }
        p.hp = Math.max(0, p.hp - 15);
        run.effects.push({ x: p.x, y: p.y - 55 * WORLD_SCALE, text: '¡YA VOY!', ttl: 1, kind: 'panic' });
      },
    },
  ],
};

export default solago;
