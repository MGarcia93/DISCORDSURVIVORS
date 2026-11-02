import { drawKestodon } from '../sprites.mjs';

// Act 6 — Monster Hunter, waves 1 and 4. Kestodon: the short telegraphed charge.
// It walks like any other body and then breaks into a rush; the telegraph is the
// crest it lowers before it comes, which is why the charge is an action of its
// own and not a faster walk.
const kestodon = {
  id: 'kestodon',
  stats: {
    life: 210,
    defense: 25,                        // 25% -> 2.5 points -> 12.5% mitigation
    attack: 410,                        // 41 damage
    attackSpeed: 90,                    // 90% -> one gore every 1.11 s
    attackDistance: 0,
    moveSpeed: 840,
  },
  radius: 20,
  bounty: 3,
  actions: [
    { key: 'swipe', chance: 3, kind: 'melee' },
    {
      key: 'charge',
      chance: 1,
      cooldown: 6,
      range: 720,
      // A short rush: the engine owns the clock and expires the boost on its own.
      run(run, enemy) {
        enemy.chargeBoost = 2.6;
        enemy.chargeTtl = 0.9;
        run.effects.push({ x: enemy.x, y: enemy.y - enemy.radius - 16, text: 'CARGA', ttl: 0.6, kind: 'summon' });
      },
    },
  ],
  draw(ctx, x, y, options = {}) {
    drawKestodon(ctx, x, y + 33, { scale: 2, ...options });
  },
};

export default kestodon;
