import { WORLD_SCALE } from '../constants.mjs';
import { drawSolago } from '../sprites.mjs';

const solago = {
  id: 'solago',
  name: 'SOLAGO',
  gameNote: 'MORDIDA AUTOMÁTICA · 8 BAJAS = PERMISO PARA JUGAR · STAND CON E',
  draw(ctx, x, y, context) {
    drawSolago(ctx, x, y, {
      time: context.time, moving: context.moving, facing: context.facing,
      attacking: context.player.attackFlash > 0, crouching: context.player.stand > 0, scale: 2 });
  },
  stats: {
    hp: 100, maxHp: 100, defense: 0.15, damage: 30 * 1.35,
    hitRadius: 15 * WORLD_SCALE, attackRange: 72 * 0.95 * WORLD_SCALE,
    shotInterval: 0.56, speed: 165 * WORLD_SCALE,
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
