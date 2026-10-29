import { drawMistWalker } from '../sprites.mjs';

// Act 2 — League of Legends, waves 3 and 4. Yorick's mist walker: a pack hunter
// the boss and the Maiden summon. Generic by design: it chases, reaches contact
// and swings. The only thing that makes it dangerous is how many arrive.
const mistWalker = {
  id: 'mistWalker',
  stats: {
    life: wave => 30 + 6 * wave,
    defense: 10,                        // 10% -> 1 defence point -> 5% mitigation
    attack: 90,                         // 90% -> 9 contact damage
    attackSpeed: 130,                   // 130% -> one swing every 0.77 s
    attackDistance: 0,
    moveSpeed: wave => 980 + 90 * wave, // it runs: the pack is the pressure
  },
  radius: 12,
  bounty: 2,
  draw(ctx, x, y, options = {}) {
    drawMistWalker(ctx, x, y + 26, { scale: 2, ...options });
  },
};

export default mistWalker;
