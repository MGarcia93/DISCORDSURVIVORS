import { ROSTER } from '../characters/index.mjs';

// The playable cast standing on a world preview. Same Y the scenes stage their
// actors on and the same sprite scale, so the dev viewer shows what a scene of
// that world will actually look like. The controlled ficha draws at `pos` and
// walks; the rest keep their line-up slots. Kept free of DOM and shell state so
// a test can prove every ficha still draws with the viewer's context shape.
export function drawCast(ctx, width, height, time, { actor = 'negro', pos = { x: 0.30, y: 0.68 }, moving = false, facing = 1 } = {}) {
  ROSTER.forEach((character, index) => {
    const controlled = character.id === actor;
    const x = controlled ? pos.x : 0.30 + index * 0.14;
    const y = controlled ? pos.y : 0.68;
    character.draw(ctx, width * x, height * y, {
      time,
      moving: controlled && moving,
      facing: controlled ? facing : 1,
      player: {},
    });
  });
}
