// Scene-local pursuit: presentation only, never the combat run or its timers.
// A loop around the long lane lets manual dialogue remain readable indefinitely
// without teleporting the cast, stopping at a wall or auto-advancing a line.
export const actions = {
  pursuit: {
    validate(_step, scene) {
      const { points = {}, actors = {}, size = [] } = scene.stage ?? {};
      const left = points['route-left'], right = points['route-right'];
      if (!['negro', 'solago', 'maiden'].every(id => actors[id])
        || !left || !right || left[0] < 300 || right[0] > size[0] - 300
        || right[0] <= left[0] || right[1] <= left[1]
        || left[1] < 250 || right[1] > size[1] - 200) throw Error('Invalid pursuit route');
    },
    start(_step, presentation) {
      const points = presentation.scene.stage.points;
      const [left, top] = points['route-left'], [right, bottom] = points['route-right'];
      const across = right - left, down = bottom - top;
      const perimeter = 2 * (across + down);
      let elapsed = 0;
      const onRoute = distance => {
        let d = ((distance % perimeter) + perimeter) % perimeter;
        if (d < across) return { x: left + d, y: top, facing: 1 };
        d -= across;
        if (d < down) return { x: right, y: top + d, facing: 1 };
        d -= down;
        if (d < across) return { x: right - d, y: bottom, facing: -1 };
        return { x: left, y: bottom - (d - across), facing: -1 };
      };
      const drawPositions = dt => {
        const travel = 200 + elapsed * 230;
        for (const [id, ahead, lane] of [['solago', 0, 50], ['negro', 150, 0], ['maiden', -200, 25]]) {
          const actor = presentation.actors[id], point = onRoute(travel + ahead);
          actor.x = point.x;
          actor.y = point.y + lane + (id === 'maiden' ? 0 : Math.sin(elapsed * 3) * 8);
          actor.facing = point.facing;
          actor.animation = 'walk';
        }
        // Ease the camera from wherever the entrance pan left it: assigning the
        // follow position outright made the cut from the establishing shot read
        // as a flash instead of the street starting to move.
        const centre = (presentation.actors.negro.x + presentation.actors.solago.x) / 2;
        const targetX = Math.max(572, Math.min(presentation.stageSize.width - 572, centre));
        const camera = presentation.camera;
        presentation.camera = { x: camera.x + (targetX - camera.x) * Math.min(1, dt * 6), y: 374, zoom: 1 };
        // A near miss lands behind either runner, never dealing actual damage.
        const phase = elapsed % 3.5;
        const target = presentation.actors[Math.floor(elapsed / 3.5) % 2 ? 'negro' : 'solago'];
        presentation.flash = phase >= 2.6 && phase < 2.82
          ? { x: target.x - target.facing * 65, y: target.y + 15 } : null;
      };
      const stop = () => {
        presentation.flash = null;
        for (const id of ['negro', 'solago', 'maiden']) presentation.actors[id].animation = 'idle';
      };
      drawPositions(0);
      return {
        tick(dt) { elapsed += dt; drawPositions(dt); return false; },
        skip: stop,
        cancel: stop,
      };
    },
  },
};
