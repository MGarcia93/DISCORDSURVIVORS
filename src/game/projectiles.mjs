import { drawEnemyShot, drawGamerProjectile } from '../sprites.mjs';

// One painter for every projectile, player or enemy. The game canvas and the
// enemy sandbox both call it, so a shot that exists in the run can never be
// invisible in one of the two views.
const CAST_DEVICES = new Set(['remote', 'joystick', 'phone', 'shroom', 'brick', 'bottle', 'shard', 'voice']);

export function drawProjectiles(ctx, projectiles) {
  for (const shot of projectiles) {
    ctx.save();
    ctx.translate(Math.round(shot.x), Math.round(shot.y));
    // Four readable headings instead of free rotation: the pixel art is drawn on
    // the grid and a smooth angle blurs it.
    // A voice wave keeps its own upright shape: it is a sound icon, not an
    // arrow, so snapping it to a quarter turn made it read as coming from the
    // wrong side whenever the shout went diagonally.
    if (shot.device !== 'voice') ctx.rotate(Math.floor(shot.angle / (Math.PI / 2)) * Math.PI / 2);
    if (shot.team === 'enemy') {
      drawEnemyShot(ctx, shot.device);
    } else if (CAST_DEVICES.has(shot.device)) {
      drawGamerProjectile(ctx, shot.device, shot);
    } else {
      ctx.fillStyle = '#d4b6ff'; ctx.fillRect(-6, -2, 12, 4);
      ctx.fillStyle = '#e7d8f2'; ctx.fillRect(-2, -6, 4, 12);
    }
    ctx.restore();
  }
}
