import { drawZombie } from '../sprites.mjs';

// Act 7 — the Jhony epilogue. The armored zombie: a riot helmet with a closed
// visor and a two-plate carrier. The wall of the last waves: slow, hard to hurt
// and heavy enough that walking around it costs the ground the group was
// holding.
const armoredZombie = {
  id: 'armoredZombie',
  stats: {
    life: 420,
    defense: 55,                        // 55% -> 5.5 points -> 27.5% mitigation
    attack: 520,                        // 52 contact damage
    attackSpeed: 100,                   // 100% -> one swing per second
    attackDistance: 0,
    moveSpeed: 760,
  },
  radius: 22,
  bounty: 7,
  draw(ctx, x, y, options = {}) {
    drawZombie(ctx, x, y + 31, { scale: 2, outfit: 'armored', ...options });
  },
};

export default armoredZombie;
