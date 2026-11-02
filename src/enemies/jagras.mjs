import { drawJagras } from '../sprites.mjs';

// Act 6 — Monster Hunter, wave 1. Jagras: the small pack lizard of the
// Primordial Forest and the act's cheapest body. It runs in a group and bites;
// its one move of its own is a short lunge that closes the gap, so a pack that
// is kited does not simply walk in a straight line forever.
//
// Sheet rung: act 6 is +25% over act 5 (whole-campaign ladder), so the plain
// body is 140 life / 37 damage. New fichas author that rung directly; an act
// only needs `statMultipliers` when it fields a body from another rung.
const jagras = {
  id: 'jagras',
  stats: {
    life: 140,
    defense: 0,
    attack: 370,                        // 37 damage
    attackSpeed: 140,                   // 140% -> one bite every 0.71 s
    attackDistance: 0,
    moveSpeed: 840,
  },
  radius: 18,
  bounty: 2,
  actions: [
    { key: 'swipe', chance: 3, kind: 'melee' },
    {
      key: 'lunge',
      chance: 1,
      cooldown: 7,
      range: 520,
      // A short burst of speed toward the player: the lizard accelerates to
      // reach, it never fires anything.
      run(run, enemy) {
        enemy.chargeBoost = 2.4;
        enemy.chargeTtl = 0.7;
        run.effects.push({ x: enemy.x, y: enemy.y - enemy.radius - 14, text: 'SE LANZA', ttl: 0.6, kind: 'summon' });
      },
    },
  ],
  draw(ctx, x, y, options = {}) {
    drawJagras(ctx, x, y + 31, { scale: 2, ...options });
  },
};

export default jagras;
