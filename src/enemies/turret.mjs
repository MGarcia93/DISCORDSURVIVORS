import { drawTurret } from '../sprites.mjs';

// Act 2 — League of Legends, wave 4. The turret: the Rift's own artillery. It
// never walks, so it keeps its distance forever and forces the player to break
// it instead of waiting for it. Its attack distance is the longest of the act.
const turret = {
  id: 'turret',
  stats: {
    life: wave => 90 + 10 * wave,
    defense: 60,                        // 60% -> 3 defence points -> 15% mitigation
    attack: 140,                        // 140% -> 14 damage per slug
    attackSpeed: 50,                    // 50% -> one slug every 2 s
    attackDistance: 220,                // 220% -> 242 px: it shoots the lane
    moveSpeed: 0,                       // bolted to the ground
  },
  radius: 22,
  bounty: 3,
  projectile: 'shot',
  draw(ctx, x, y, options = {}) {
    drawTurret(ctx, x, y + 44, { scale: 2, ...options });
  },
};

export default turret;
