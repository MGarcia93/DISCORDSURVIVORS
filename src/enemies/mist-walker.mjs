import { drawMistWalker } from '../sprites.mjs';

// Act 2 — League of Legends, waves 3, 4 and 5, and whatever Yorick and the
// Maiden call. Yorick's mist walker: a pack hunter that chases, reaches contact
// and swings. Its one move of its own is the leap — a short burst of speed from
// a distance, never a projectile — because a pack that only walks in a straight
// line stops existing the moment the player kites. That is the LoL ghoul that
// jumps at whoever the mist touched, translated into a ficha with no mark.
//
// 1300% is 71.5 scaled px/s: a step over the act 1 walker and still under half
// of the slowest player. A pack that catches a player who runs is a wall, not a
// pack; the leap is what closes a gap the walk cannot.
const mistWalker = {
  id: 'mistWalker',
  stats: {
    life: 59,
    defense: 10,                        // 10% -> 1 defence point -> 5% mitigation
    attack: 130,                         // 130% -> 13 contact damage
    attackSpeed: 130,                   // 130% -> one swing every 0.77 s
    attackDistance: 0,
    moveSpeed: 1300, // it runs, and it leaps
  },
  radius: 12,
  bounty: 2,
  actions: [
    { key: 'swipe', chance: 3, kind: 'melee' },
    {
      key: 'lunge',
      chance: 1,
      cooldown: 6,
      range: 420,
      // The leap only starts from a real gap: a burst from the body would read
      // as a teleport, so inside 150 px it just closes on foot.
      when: (run, enemy) => Math.hypot(run.player.x - enemy.x, run.player.y - enemy.y) > 150,
      // No floating text: wave 3 fields dozens of walkers and a label each
      // would bury the pack under its own words. The burst is the tell.
      run(run, enemy) {
        enemy.chargeBoost = 2.6;
        enemy.chargeTtl = 0.5;
      },
    },
  ],
  draw(ctx, x, y, options = {}) {
    drawMistWalker(ctx, x, y + 26, { scale: 2, ...options });
  },
};

export default mistWalker;
