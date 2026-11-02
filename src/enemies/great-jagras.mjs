import { drawGreatJagras } from '../sprites.mjs';

// Act 6 — Monster Hunter, wave 2. Great Jagras: the forest's elite, the same
// family as the pack lizard with twice the mass. The script gives it one rule:
// after it feeds it rolls and shoves. That is two actions, and the roll only
// exists while it is fed, so the fight changes after it swallows.
const greatJagras = {
  id: 'greatJagras',
  stats: {
    life: 1100,
    defense: 30,                        // 30% -> 3 points -> 15% mitigation
    attack: 630,                        // 63 damage
    attackSpeed: 90,                    // 90% -> one bite every 1.11 s
    attackDistance: 0,
    moveSpeed: 780,                     // 39 scaled px/s: heavy, never fast
  },
  radius: 30,
  bounty: 12,
  actions: [
    { key: 'swipe', chance: 3, kind: 'melee' },
    {
      key: 'swallow',
      chance: 1,
      cooldown: 999,
      range: 1100,
      // It eats a smaller Jagras and the belly shows it. One time only.
      when: (run, enemy) => !enemy.fed,
      run(run, enemy) {
        enemy.fed = true;
        enemy.speed *= 1.15;
        run.effects.push({ x: enemy.x, y: enemy.y - 150, text: 'SE TRAGA UN JAGRAS', ttl: 1.1, kind: 'summon' });
      },
    },
    {
      key: 'roll',
      chance: 2,
      cooldown: 8,
      range: 700,
      // Fed, it rolls: a burst of speed plus the shove the script describes.
      when: (run, enemy) => enemy.fed === true,
      run(run, enemy) {
        // It rolls to reach you: speed, never a wave. The hit is the body that
        // arrives, exactly like every other contact.
        enemy.chargeBoost = 2.4;
        enemy.chargeTtl = 1.5;
        run.effects.push({ x: enemy.x, y: enemy.y - 150, text: 'RUEDA', ttl: 0.9, kind: 'summon' });
      },
    },
  ],
  draw(ctx, x, y, options = {}) {
    drawGreatJagras(ctx, x, y + 52, { scale: 2, ...options });
  },
};

export default greatJagras;
