import { WORLD_SCALE } from '../constants.mjs';
import { resolveEntityStats } from '../stats.mjs';
import { drawSolago, drawPatrona } from '../sprites.mjs';

const solago = {
  id: 'solago',
  name: 'SOLAGO',
  gameNote: 'MORDIDA AUTOMÁTICA · 8 BAJAS = PERMISO PARA JUGAR · STAND CON E',
  // Unlock contract: this flag in local storage means the character is playable.
  unlock: { flag: 'solagoUnlocked' },
  // Selection screen metadata: label, profile block and preview pose belong
  // to the ficha; the note folds over the unlock chain order.
  label: 'Solago',
  detailLabel: 'Solago',
  previewAria: 'Pixel art de Solago: remera oscura, reloj y paletas grandes',
  profile: `
      <div class="eyebrow">Luchador cuerpo a cuerpo · Contraataque</div><h2>SOLAGO</h2>
      <p class="character-desc">Dientón, sin voz ni voto en su casa: hasta las hijas le sacan las cosas. Vive mirando de reojo, con miedo de que lo vuelvan a apuñalar por la espalda con una tijera.</p>
      <p class="character-quote">«Su mayor fortaleza son las paletas. Su mayor debilidad, que lo llamen de otra habitación».</p>
      <div class="stats solago-stats"><div><b>100</b><small>VIDA NORMAL</small></div><div><b>+35%</b><small>DAÑO MELEE</small></div><div><b>−5%</b><small>ALCANCE</small></div><div><b>+15%</b><small>DEFENSA</small></div><div><b>100%</b><small>VELOCIDAD</small></div></div>
      <div class="skill"><kbd>∞</kbd><div><b>MORDIDA DE PALETA</b><p>Mordidas automáticas de corto alcance y pegada pesada. Acercate para que cuenten.</p></div></div>
      <div class="skill"><kbd>◈</kbd><div><b>SONRISA BLINDADA</b><p>Cada tanto se ríe mostrando las paletas: +25% de defensa durante 2,5 segundos.</p></div></div>
      <div class="skill"><kbd>8×</kbd><div><b>PERMISO PARA JUGAR</b><p>Cada 8 bajas completás tareas y ganás +30% de daño y velocidad de ataque durante 8 segundos.</p></div></div>
      <div class="skill"><kbd>E</kbd><div><b>STAND: ¡LA PATRONA!</b><p>Solago se agacha y queda quieto mientras ella tijeretea en área durante 7 segundos. Al final también le pega. Recarga: 26 segundos.</p></div></div>`,
  unlockNote: {
    locked: 'SOLAGO · BLOQUEADO · GANÁ EL MAPA 01 PARA DESBLOQUEARLO',
    unlocked: 'SOLAGO DESBLOQUEADO · GANÁ EL MAPA 01 CON SOLAGO PARA WARRIOR',
  },
  victoryLine: '¡Solago desbloqueado! Ya podés elegirlo en la próxima partida.',
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
      life: 100,            // 100 points of damage
      defense: 30,          // 3 defense points -> 15% mitigation
      attack: 405,          // 40.5 damage per bite (135% of EL NEGRO's shot)
      attackSpeed: 178.57,  // ~1.79 attacks/s (~0.56s between bites)
      attackDistance: 68.4, // 68.4% of the base 100-unit reach
      moveSpeed: 3300,      // 165 scaled px/s
    }),
  },
  attack: { type: 'melee' },
  decays: ['permissionActive'],
  combat: { permissionDamageMult: 1.3, permissionRateMult: 0.72 },
  contactDefenseBonus(p) { return p.smile > 0 ? 0.25 : 0; },
  regenHud(p) { return { ringY: p.y + 2, radius: 34, textX: p.x - 31, textY: p.y - 46 }; },
  initPlayer(p) {
    p.smile = 0;
    p.smileCooldown = 6;
    p.taskKills = 0;
    p.permissionNeeded = 8;
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
      tick(run, p, dt, ctx) {
        if (p.smileCooldown > 0 || p.smile > 0) return;
        p.smile = 2.5;
        p.smileCooldown = 12;
        run.effects.push({ x: p.x, y: p.y - 40 * WORLD_SCALE, text: 'JA!', ttl: 0.8, kind: 'smile' });
      },
    },
  ],
  onKill(run, p, enemy, ctx) {
    p.taskKills++;
    if (p.taskKills >= p.permissionNeeded) {
      p.taskKills = 0;
      p.permissionActive = 8;
      run.effects.push({ x: p.x, y: p.y - 60 * WORLD_SCALE, text: '¡PERMISO!', ttl: 1.2, kind: 'permission' });
    }
  },
  specials: [
    {
      key: 'stand', name: 'La Patrona', hotkey: 'e', duration: 7, cooldown: 26,
      immobilize: true,
      onTick(run, p, dt, ctx) {
        run.standIn -= dt;
        if (run.standIn > 0) return;
        for (const enemy of run.enemies) {
          if (ctx.distance(enemy, p) < 170 * WORLD_SCALE) ctx.hit(run, enemy, p.damage * 0.9, 'stand');
        }
        run.standIn = 0.4;
      },
      onExpire(run, p, ctx) {
        p.hp = Math.max(0, p.hp - 15);
        run.effects.push({ x: p.x, y: p.y - 55 * WORLD_SCALE, text: '¡YA VOY!', ttl: 1, kind: 'panic' });
      },
    },
  ],
};

export default solago;
