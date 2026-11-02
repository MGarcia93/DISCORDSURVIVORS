import { drawEnemyShot, drawGamerProjectile } from '../sprites.mjs';

// One painter for every projectile, player or enemy. The game canvas and the
// enemy sandbox both call it, so a shot that exists in the run can never be
// invisible in one of the two views.
const CAST_DEVICES = new Set(['remote', 'joystick', 'phone', 'shroom', 'brick', 'bottle', 'shard', 'voice']);

export function drawProjectiles(ctx, projectiles) {
  for (const shot of projectiles) {
    ctx.save();
    // `lift` and `lead` move only the drawing: the hitbox keeps its own place,
    // so an enemy at contact distance is never skipped.
    const lead = shot.lead ?? 0;
    ctx.translate(
      Math.round(shot.x + Math.cos(shot.angle) * lead),
      Math.round(shot.y - (shot.lift ?? 0) + Math.sin(shot.angle) * lead),
    );
    // Four readable headings instead of free rotation: the pixel art is drawn on
    // the grid and a smooth angle blurs it.
    // A voice wave turns with its heading: the loud end leads, so going left
    // mirrors it and going up or down stands it on end. `Math.round` splits the
    // diagonals fairly, which `Math.floor` did not.
    const turn = shot.device === 'voice' ? Math.round : Math.floor;
    ctx.rotate(turn(shot.angle / (Math.PI / 2)) * Math.PI / 2);
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
