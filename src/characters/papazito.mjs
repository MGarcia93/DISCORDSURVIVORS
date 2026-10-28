import { WORLD_SCALE } from '../constants.mjs';
import { resolveEntityStats } from '../stats.mjs';
import { drawPapazito } from '../sprites.mjs';

// Papazito — El Paraguayo Trucho. Stat sheet: percentual values over
// BASE_STATS (src/stats.mjs) per context/personajes/papazito_el_paraguayo_trucho.md §3
// and the playtesting balance so far: life 110, ranged damage 11.5 (+15%),
// attack speed 90 (0.9 bricks/s, interval ~1.11s), attackDistance 150 (165px,
// charged proposal: the sheet has no reach value), defense 110 (11 points,
// 55% mitigation), moveSpeed 2970 (148.5 scaled px/s, -10%).
const papazito = {
  id: 'papazito',
  name: 'PAPAZITO',
  gameNote: 'EL PARAGUAYO TRUCHO · LADRILLOS, LA SEÑA Y LIQUIDACIÓN DE PERTENENCIAS',
  deathLine: 'VENDIÓ TODO Y NI LA PUSO.',
  draw(ctx, x, y, context) {
    drawPapazito(ctx, x, y, {
      time: context.time, moving: context.moving, facing: context.facing, scale: 2 });
  },
  stats: {
    hitRadius: 18 * WORLD_SCALE, // the bulk frame from the photo: not one of the six stats
    ...resolveEntityStats({
      life: 110,             // +10% vida
      defense: 110,          // 11 points -> 55% mitigation
      attack: 115,           // 11.5 damage per brick (+15% daño a distancia)
      attackSpeed: 90,       // 0.9 bricks/s: the slow heavy cadence of §4.1
      attackDistance: 150,   // 165px reach proposal: ladrillos a media cancha
      moveSpeed: 2970,       // -10% mobility
    }),
  },
  // Ladrillazo: one heavy brick per shot; balance knobs stay here.
  // Ladrillazo: one heavy brick per shot; balance knobs stay here.
  attack: { type: 'ranged', device: 'brick' },
  decays: ['panicTtl', 'sellDamageTtl', 'sellMoveSlowTtl', 'sellAtkSlowTtl', 'sellDefLossTtl', 'sellVisionTtl'],
  // Pasiva «La seña» (ficha §4.2). Coins only stream through the kill bounty
  // and the survival bonus, so the tax hooks def.onCoinsGained. Ficha rules:
  // a 25s cooldown, keep a small cut (10% of current coins, capped at 15),
  // only when there is something to lose; the 5s panic adds +30% movement and
  // +40% attack speed, NEVER direct damage.
  passives: [{ key: 'sena', kind: 'sena' }],
  senaCooldownSeconds: 25,
  onCoinsGained(run, p, _amount) {
    const cut = Math.min(15, Math.round(run.coins * 0.1));
    const cooldown = p.senaCooldown ?? 0;
    if (cooldown > 0 || cut < 1) return;
    run.coins -= cut;
    p.senaCooldown = this.senaCooldownSeconds;
    p.panicTtl = 5; // ¡ME RE CAGARON!
    run.effects.push({ x: p.x, y: p.y - 60 * WORLD_SCALE, text: '📱 ¡ME ESCRIBIÓ!', ttl: 1.4, kind: 'panic' });
    run.effects.push({ x: p.x, y: p.y - 78 * WORLD_SCALE, text: '¡ME RE CAGARON!', ttl: 1.6, kind: 'panic' });
    run.effects.push({ x: p.x, y: p.y - 96 * WORLD_SCALE, text: '¡LA CONCHA DE TU MADRE, ME ESTAFARON!', ttl: 1.8, kind: 'panic' });
  },
  passiveSpeedMult: p => (p.panicTtl > 0 ? 1.3 : 1),
  passiveRateMult: p => (p.panicTtl > 0 ? 0.6 : 1),
  // Especial «Liquido todo, me voy de putas» (ficha §4.3): invented inventory,
  // engine-routine sale; the app renders the pause menu from this exact table.
  specials: [{
    key: 'sell', name: 'Liquidó todo', hotkey: 'q', duration: 0, cooldown: 0,
    items: {
      psp: { label: 'PSP', coins: 20, damageFrac: 0.1, damageTtl: 10, moveSlowFrac: 0.15, moveSlowTtl: 10, quote: 'Vendió la PSP' },
      monitor: { label: 'Monitor', coins: 35, damageFrac: 0.15, damageTtl: 10, visionTtl: 10, quote: 'Vendió el monitor' },
      keyboard: { label: 'Teclado', coins: 25, damageFrac: 0.15, damageTtl: 10, atkSlowFrac: 0.2, atkSlowTtl: 10, quote: 'Vendió el teclado' },
      chair: { label: 'Silla gamer', coins: 30, damageFrac: 0.2, damageTtl: 10, defFrac: 0.15, defTtl: 10, quote: 'Vendió la silla gamer', flavor: 'Con lo que tenía de trono improvisado' },
      pc: { label: 'PC completa', coins: 100, damageFrac: 0.5, damageTtl: 15, moveSlowFrac: 0.3, moveSlowTtl: 15, atkSlowFrac: 0.3, atkSlowTtl: 15, quote: 'Vendió hasta la PC', flavor: 'El Pentium de la casa' },
    },
  }],
};

export default papazito;
