import { CHARACTERS } from '../characters/index.mjs';
import { drawArena } from '../scenes.mjs';

const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function createPresenter(root, catalog, onError) {
  for (const [id, character] of Object.entries(catalog.characters)) {
    if (!Object.hasOwn(CHARACTERS, character.sprite)) throw Error(`Unknown sprite for ${id}: ${character.sprite}`);
  }
  root.innerHTML = '<canvas class="narrative-stage" width="1144" height="748" aria-label="Scripted scene"></canvas><div class="narrative-content"></div><p class="narrative-error" role="status" hidden></p>';
  const canvas = root.querySelector('canvas'), content = root.querySelector('.narrative-content'), errorBox = root.querySelector('.narrative-error');
  let previous = '', previousFocus = null, disposed = false, revision = 0;
  const portrait = (speaker, expression = 'neutral') => {
    const character = catalog.characters[speaker];
    return `<img class="narrative-portrait" src="${escape(character.expressions[expression])}" alt="${escape(character.name)} — ${escape(expression)}">`;
  };
  const restoreFocus = () => {
    if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    previousFocus = null;
  };
  return {
    render(player, banter, error, { preview = false } = {}) {
      const active = player?.active, showStage = player && (active || preview);
      canvas.hidden = !showStage;
      if (showStage) {
        const ctx = canvas.getContext('2d'), camera = player.camera;
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false;
        ctx.fillStyle = '#151320'; ctx.fillRect(0, 0, 1144, 748);
        ctx.translate(572, 374); ctx.scale(camera.zoom, camera.zoom); ctx.translate(-camera.x, -camera.y);
        drawArena(ctx, 1144, 748);
        for (const [id, prop] of Object.entries(player.props)) {
          const [x, y] = player.scene.stage.points[prop.at];
          ctx.fillStyle = prop.state === 'open' ? '#bfd890' : '#786b95';
          ctx.fillRect(x - 25, y - 65, 50, 60);
          ctx.font = '14px monospace'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff';
          ctx.fillText(`${id}: ${prop.state}`, x, y - 76);
        }
        for (const actor of Object.values(player.actors).sort((a, b) => a.y - b.y)) {
          const def = CHARACTERS[catalog.characters[actor.character].sprite];
          const lift = actor.animation === 'celebrate' ? Math.abs(Math.sin(player.time * 7)) * 12 : 0;
          def.draw(ctx, actor.x, actor.y - lift, { time: player.time, moving: actor.animation === 'walk', facing: actor.facing, player: {} });
          if (actor.animation === 'point') {
            ctx.fillStyle = '#f3dea4'; ctx.fillRect(actor.x + 16 * actor.facing, actor.y - 45, 35 * actor.facing, 6);
          }
        }
        ctx.restore();
      }
      const signature = JSON.stringify([Boolean(active), player?.dialogue, player?.splash, banter]);
      if (signature !== previous) {
        previous = signature;
        const currentRevision = ++revision;
        const line = player?.dialogue;
        if (active && !previousFocus) previousFocus = document.activeElement;
        if (line) {
          // The cast keeps the same slots for the whole scene, ordered by where
          // each actor stands, and faces the centre of the conversation.
          const sceneSpeakers = [...new Set(player.scene.steps.flatMap(step => step.type === 'dialogue' ? step.lines.map(item => item.speaker) : []))];
          const stageX = id => {
            const stage = player.scene.stage;
            const entry = Object.values(stage?.actors ?? {}).find(actor => actor.character === id);
            const point = entry ? stage.points?.[entry.at] : null;
            return Array.isArray(point) ? point[0] : null;
          };
          const cast = sceneSpeakers
            .map((id, index) => ({ id, index, x: stageX(id) }))
            .sort((a, b) => (a.x ?? Infinity) - (b.x ?? Infinity) || a.index - b.index)
            .slice(0, 3);
          const placed = cast.map(entry => entry.x).filter(x => x !== null);
          const midpoint = placed.length > 1 ? (Math.min(...placed) + Math.max(...placed)) / 2 : null;
          const facing = entry => (midpoint === null || entry.x === null ? '' : entry.x < midpoint ? ' facing-right' : '');
          content.innerHTML = `<div class="narrative-dialog" role="dialog" aria-modal="true" aria-label="Scene conversation"><div class="narrative-portraits">${cast.map(entry => `<div class="${entry.id === line.speaker ? 'speaking' : 'listening'}${facing(entry)}">${portrait(entry.id, entry.id === line.speaker ? line.expression : 'neutral')}</div>`).join('')}</div><div class="narrative-text"><strong>${escape(catalog.characters[line.speaker].name)}</strong><p>${escape(line.text)}</p><div class="actions"><button class="primary" data-action="narrative-next">Continue</button><button class="secondary" data-action="narrative-skip">Skip scene</button></div></div></div>`;
        } else if (player?.splash) {
          content.innerHTML = `<div class="narrative-splash">${portrait(player.splash.speaker)}<h2>${escape(player.splash.text)}</h2></div><button class="secondary narrative-skip" data-action="narrative-skip">Skip scene</button>`;
        } else if (active) {
          content.innerHTML = '<button class="secondary narrative-skip" data-action="narrative-skip">Skip scene</button>';
        } else if (banter) {
          content.innerHTML = `<div class="narrative-banter" role="status">${portrait(banter.speaker, banter.expression)}<div><strong>${escape(catalog.characters[banter.speaker].name)}</strong><p>${escape(banter.text)}</p></div></div>`;
        } else content.innerHTML = '';
        for (const image of content.querySelectorAll('img')) image.onerror = () => {
          if (!disposed && revision === currentRevision) onError(`Portrait unavailable: ${image.getAttribute('src')}`);
        };
        if (active) content.querySelector('button')?.focus({ preventScroll: true });
        else restoreFocus();
      }
      root.hidden = !showStage && !banter && !error;
      errorBox.hidden = !error; errorBox.textContent = error ?? '';
    },
    dispose() { disposed = true; revision++; restoreFocus(); root.innerHTML = ''; root.hidden = true; },
  };
}
