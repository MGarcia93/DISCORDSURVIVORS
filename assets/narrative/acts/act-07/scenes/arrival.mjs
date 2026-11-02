// Scene-local run: the five jog down the whole street while the player reads the
// dialogue, and stop at the base's gate — the place the scene is going. It is
// presentation only: no damage, no wave, no progress, no clock. The camera
// follows the head of the group, and a slow reader finds them waiting at the
// gate instead of pinned against an edge.
export const actions = {
  run: {
    validate(_step, scene) {
      const { points = {}, actors = {} } = scene.stage ?? {};
      const left = points['run-left'], gate = points['run-gate'];
      if (!['negro', 'solago', 'papasito', 'warrior', 'papafrita'].every(id => actors[id])) {
        throw Error('Invalid run cast');
      }
      if (!left || !gate || gate[0] <= left[0] || left[1] !== gate[1]) throw Error('Invalid run route');
    },
    start(_step, presentation) {
      const points = presentation.scene.stage.points;
      const [leftX, laneY] = points['run-left'];
      const gateX = points['run-gate'][0];
      const span = gateX - leftX;
      // Two rows, not a line, and Negro always in front: he is the main body of
      // every scene, so the camera never loses him behind the pack.
      // Two columns, like the group shot: Papafrita, Warrior and Papasito in
      // the back one; Negro in front with Solago below him.
      const crew = [
        ['papafrita', -70, -110], ['warrior', -70, -30], ['papasito', -70, 40],
        ['negro', 70, -70], ['solago', 70, 10],
      ];
      let elapsed = 0;
      const place = dt => {
        elapsed += dt;
        const travelled = Math.min(span, elapsed * 250);
        const head = leftX + travelled;
        const running = travelled < span;
        for (const [id, offset, lane] of crew) {
          const actor = presentation.actors[id];
          if (!actor) continue;
          actor.x = head + offset;
          actor.y = laneY + lane;
          actor.facing = 1;
          actor.animation = running ? 'walk' : 'idle';
        }
        const targetX = Math.max(572, Math.min(presentation.stageSize.width - 572, head));
        const camera = presentation.camera;
        presentation.camera = { x: camera.x + (targetX - camera.x) * Math.min(1, dt * 5), y: camera.y, zoom: 1 };
      };
      // The run stops where it is: the scene finishes it with a real move to the
      // gate, so a fast reader sees the group sprint the last stretch instead of
      // snapping there.
      const stop = () => {
        for (const [id] of crew) {
          const actor = presentation.actors[id];
          if (actor) actor.animation = 'idle';
        }
      };
      place(0);
      return {
        tick(dt) { place(dt); return false; },
        skip: stop,
        cancel: stop,
      };
    },
  },
};
