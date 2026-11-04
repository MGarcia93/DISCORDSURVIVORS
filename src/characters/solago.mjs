import { WORLD_SCALE } from '../constants.mjs';
import { resolveEntityStats } from '../stats.mjs';
import { drawSolago, drawPatrona } from '../sprites.mjs';
import { statBlock } from './stat-block.mjs';

// What one smile is worth in damage. It is a block, not a stance: the pool is
// spent by the hits that land while she laughs, and what nobody uses is gone
// when the smile ends.
const SMILE_BLOCK = 40;
// Sustain comes from her kit, never from farming a horde: the laugh pays back a
// share of what it actually swallowed, and each ability hands something over the
// moment it starts. Kills pay nothing.
const SMILE_HEAL_SHARE = 0.35;
const SMILE_HEAL_CAP = 14;
// While the laugh is up she pays for being aggressive, not only for being hit:
// every bite hands back a point and every kill a mouthful.
const SMILE_HIT_HEAL = 1;
const SMILE_KILL_HEAL = 3;
const PERMISSION_HEAL = 5;
const PATRONA_HEAL = 10;

// How far the scissors cut, in world units, from Solago's body. It has to pass
// the longest ranged reach (an archer parks at 231 px) or the ultimate leaves
// every caster standing outside the ring and she cannot punish them for it.
const STAND_RADIUS = 240;

// The six statistics as a percentage of the neutral reference. The selector
// card and the engine read this one sheet, so they cannot disagree.
const SHEET = {
  life: 150,            // 150 points of damage: the tank of the roster
  defense: 70,          // 7 defense points -> 35% mitigation: the tank of the ladder
  attack: 440,          // 44 per bite: just under a walker's 46, one upgrade finishes it
  attackSpeed: 120,     // 1.2 bites per second: the boss answer has to earn its window
  attackDistance: 83,   // close to Jhony: a bite that lands without living inside the boss
  moveSpeed: 3550,      // ~178 scaled px/s: she has to reach the bite
};

const solago = {
  id: 'solago',
  name: 'SOLAGO',
  gameNote: 'MORDIDA AUTOMÁTICA · 6 BAJAS = PERMISO PARA JUGAR · STAND CON E',
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
      ${statBlock(SHEET)}
      <div class="skill"><kbd>∞</kbd><div><b>MORDIDA DE PALETA</b><p>Mordidas automáticas de corto alcance y pegada pesada. Acercate para que cuenten: cada 6 bajas recupera 5 de vida. Pega fuerte, no rápido, y empuja lo que muerde.</p></div></div>
      <div class="skill"><kbd>◈</kbd><div><b>SONRISA BLINDADA</b><p>Cada tanto se ríe mostrando las paletas: bloquea 40 de daño durante 2,5 segundos. Mientras se ríe, cada mordida le devuelve 1 de vida y cada baja 3, y además recupera el 35% de lo que bloqueó, hasta 14. Si no le pegan ni pega, no sirve de nada. Igual que en su casa.</p></div></div>
      <div class="skill"><kbd>6×</kbd><div><b>PERMISO PARA JUGAR</b><p>Cada 6 bajas completás tareas y ganás +30% de daño y velocidad de ataque durante 8 segundos.</p></div></div>
      <div class="skill"><kbd>Q</kbd><div><b>STAND: ¡LA PATRONA!</b><p>Solago se agacha y queda quieto mientras ella tijeretea en área durante 7 segundos: mientras la patrona está en escena, a Solago no le entra nada y al entrar recupera 10 de vida. Al final también le pega. Recarga: 26 segundos.</p></div></div>`,
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
    ...resolveEntityStats(SHEET),
  },
  attack: { type: 'melee' },
  decays: ['permissionActive'],
  // No reach ceiling: the shelf is tuned low enough that no build turns her into
  // artillery, so the stat core keeps every point the build earns.
  // The heaviest bite in the cast shoves what it hits: every bite buys a step
  // forward, so standing still is not a strategy with her.
  combat: { permissionDamageMult: 1.3, permissionRateMult: 0.72, knockback: 15 },
  regenHud(p) { return { ringY: p.y + 2, radius: 34, textX: p.x - 31, textY: p.y - 46 }; },
  initPlayer(p) {
    p.smile = 0;
    p.smileBlock = 0;
    p.smileCooldown = 6;
    p.smileHealed = 0;
    p.shieldSeen = 0;
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
  // «PERMISO» and «RISA» already have their own feedback; the buff list repeats
  // them with the numbers they are actually applying.
  buffs(p) {
    const list = [];
    if (p.permissionActive > 0) {
      const damage = Math.round(((this.combat?.permissionDamageMult ?? 1) - 1) * 100);
      const interval = Math.round((1 - (this.combat?.permissionRateMult ?? 1)) * 100);
      list.push({
        id: 'permission', name: 'PERMISO', seconds: p.permissionActive,
        detail: `+${damage}% DAÑO · −${interval}% INTERVALO`,
      });
    }
    if (p.smile > 0) {
      list.push({ id: 'smile', name: 'RISA', seconds: p.smile, detail: `bloquea ${Math.round(p.smileBlock ?? 0)}` });
    }
    return list;
  },
  passives: [
    {
      key: 'smile',
      // The laugh is a block, not a stance: it eats damage while it lasts, and
      // it leaves nothing behind. The engine owns the shield pool, so the ring,
      // a projectile and a punch all hit the same wall.
      tick(run, p, dt, ctx) {
        // What the wall swallowed since the last tick comes back as health, a
        // quarter of it and never more than the cap: the smile pays for being
        // hit while it lasts, which is exactly her job.
        const seen = p.shieldSeen ?? 0, now = p.shield ?? 0;
        if (p.smile > 0 && now < seen) {
          const room = SMILE_HEAL_CAP - (p.smileHealed ?? 0);
          const heal = Math.min(room, Math.round((seen - now) * SMILE_HEAL_SHARE));
          if (heal > 0) {
            p.hp = Math.min(p.maxHp, p.hp + heal);
            p.smileHealed = (p.smileHealed ?? 0) + heal;
          }
        }
        if (p.smile <= 0 && (p.smileBlock ?? 0) > 0) {
          p.shield = Math.max(0, now - p.smileBlock);
          p.smileBlock = 0;
        }
        const beforeStart = p.smile > 0;
        if (!beforeStart && p.smileCooldown <= 0) {
          p.smile = 2.5 + (p.rewardBonuses.smileDuration ?? 0);
          p.smileCooldown = Math.max(4, 10 - (p.rewardBonuses.smileCooldown ?? 0));
          p.smileBlock = SMILE_BLOCK;
          p.smileHealed = 0;
          p.shield = (p.shield ?? 0) + SMILE_BLOCK;
          run.effects.push({ x: p.x, y: p.y - 40 * WORLD_SCALE, text: '¡JA!', ttl: 0.8, kind: 'smile' });
        }
        // Baseline after every change this tick, so the end-of-smile refund is
        // never mistaken for damage the wall blocked.
        p.shieldSeen = p.shield ?? 0;
      },
    },
  ],
  // Landing a bite while she laughs pays a point; the wall keeps doing its own
  // job, so being hit still pays through the passive.
  onMeleeHit(run, p) {
    if ((p.smile ?? 0) <= 0) return;
    p.hp = Math.min(p.maxHp, p.hp + SMILE_HIT_HEAL);
  },
  onKill(run, p, enemy, ctx) {
    if ((p.smile ?? 0) > 0) p.hp = Math.min(p.maxHp, p.hp + SMILE_KILL_HEAL);
    p.taskKills++;
    if (p.taskKills >= p.permissionNeeded) {
      p.taskKills = 0;
      p.permissionActive = 8;
      // The permission is the reward: it hands back a mouthful when it starts.
      p.hp = Math.min(p.maxHp, p.hp + PERMISSION_HEAL);
      run.effects.push({ x: p.x, y: p.y - 60 * WORLD_SCALE, text: '¡PERMISO!', ttl: 1.2, kind: 'permission' });
    }
  },
  specials: [
    {
      key: 'stand', name: 'La Patrona', hotkey: 'q', duration: 7, cooldown: 26, durationBonus: 'standDuration',
      buff: 'daño en área · inmune · no te podés mover',
      // The woman covers her: arriving is worth a mouthful, leaving costs 15.
      onStart(run, p) { p.hp = Math.min(p.maxHp, p.hp + PATRONA_HEAL); },
      immobilize: true,
      // She covers up and the woman fights: no bite of her own while the stand
      // is up. The engine reads this flag next to `immobilize`.
      noAttack: true,
      // She is the one on stage: whatever lands, lands on her. The engine reads
      // this flag in invulnerable(), so every hit path skips the body.
      invulnerable: true,
      onTick(run, p, dt, ctx) {
        run.standIn -= dt;
        if (run.standIn > 0) return;
        const radius = (STAND_RADIUS + (p.rewardBonuses.patronaRadius ?? 0)) * WORLD_SCALE;
        for (const enemy of run.enemies) {
          if (ctx.distance(enemy, p) < radius) ctx.hit(run, enemy, p.damage * 0.9, 'stand');
        }
        run.standIn = 0.4;
      },
      onExpire(run, p, ctx) {
        // Finisher: the scissors get one last wide cut before she leaves.
        const burst = p.rewardBonuses?.patronaFinal ?? 0;
        if (burst > 0) {
          const radius = (STAND_RADIUS + (p.rewardBonuses?.patronaRadius ?? 0)) * WORLD_SCALE;
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
