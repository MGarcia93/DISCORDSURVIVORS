import { CHARACTERS } from '../characters/index.mjs';
import { drawBackground } from '../backgrounds/index.mjs';
import { drawEnemyFigure } from '../game/figures.mjs';
import jhony from '../npcs/jhony.mjs';
import yorick from '../npcs/yorick.mjs';
import papafrita from '../npcs/papafrita.mjs';
import lordZir from '../npcs/lord-zir.mjs';
import lilith from '../npcs/lilith.mjs';
import lotusAlchemist from '../npcs/lotus-alchemist.mjs';
import taskmaster from '../npcs/taskmaster.mjs';
import esclavista from '../npcs/esclavista.mjs';
import maxiBlanco from '../npcs/maxi-blanco.mjs';

// Narrative actors may be NPCs without entering the playable roster.
const STAGE_SPRITES = { ...CHARACTERS, jhony, papafrita, yorick, lordZir, lilith, lotusAlchemist, taskmaster, esclavista, 'maxi-blanco': maxiBlanco };

const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Props are staging, not combat furniture: the ones a shipped act uses get real
// pixel art, and an unknown prop keeps the old block so a sample scene still
// shows something. `chains` is the Wheel of Pain's: a shackle at the prisoner's
// ankle and the slack running to a coil on the ground, snapped when broken.
const PROP_ART = {
  // A portal opening in the floor: a violet ring seen from above, with a dark
  // vortex inside, a lit rim and sparks climbing out of it. `closed` paints
  // nothing, so a scene can open them one by one under each actor.
  portal(ctx, x, y, state) {
    if (state === 'closed') return;
    const wide = state === 'wide' ? 1.3 : 1;
    const rx = 46 * wide, ry = 14 * wide;
    const ink = '#0b0714', deep = '#2a1355', mid = '#4a2390', glow = '#7a4fd0';
    const light = '#c9a6ff', rim = '#6b3fbe';
    const ellipse = (k, color, inset = 0) => {
      const ex = Math.round(rx * k), ey = Math.round(ry * k);
      for (let row = -ey; row <= ey; row += 2) {
        const t = row / ey;
        const half = Math.round(ex * Math.sqrt(Math.max(0, 1 - t * t)));
        if (half <= inset) continue;
        ctx.fillStyle = color;
        ctx.fillRect(x - half + inset, y + row, (half - inset) * 2, 2);
      }
    };
    ellipse(1, ink);
    ellipse(0.92, rim);
    ellipse(0.78, ink);
    ellipse(0.7, deep);
    ellipse(0.5, mid);
    ellipse(0.3, glow);
    // The mouth of the hole: a dark core with a bent spiral of light escaping.
    ctx.fillStyle = ink; ctx.fillRect(x - 10, y - 3, 20, 5);
    ctx.fillStyle = light; ctx.fillRect(x - 7, y - 3, 14, 2);
    ctx.fillStyle = '#f2e7ff'; ctx.fillRect(x - 3, y - 3, 6, 1);
    for (let spark = 0; spark < 6; spark++) {
      const side = spark % 2 ? 1 : -1;
      ctx.fillStyle = spark % 3 ? glow : light;
      ctx.fillRect(Math.round(x + side * (6 + spark * 4)), Math.round(y - 6 - (spark % 3) * 4), 2, 3);
    }
    // Rim light on the top lip, so the hole reads as cut into the floor.
    for (let col = -rx + 6; col <= rx - 6; col += 3) {
      const t = col / rx;
      ctx.fillStyle = light;
      ctx.fillRect(x + col, y - Math.round(ry * Math.sqrt(Math.max(0, 1 - t * t))) + 1, 3, 1);
    }
  },
  // The tail that sends Warrior flying: a chain of Rathalos tail segments swept
  // across the stage in three frames, with the impact star on the contact frame.
  // Stage-owned, so a scene can stage a swipe without a new sprite variant.
  tailSwipe(ctx, x, y, state) {
    if (state === 'closed') return;
    const phase = state === 'hit2' ? 1 : state === 'hit3' ? 2 : 0;
    const ink = '#21100e', base = '#b5472a', mid = '#8a2f1c', light = '#e0764a', horn = '#cfc4a8';
    const startX = [40, 70, 20][phase];
    const count = [5, 7, 5][phase];
    for (let i = 0; i < count; i++) {
      const px = x + startX - i * 20;
      const py = y - 42 - Math.round(Math.sin((i / (count - 1)) * Math.PI) * 16);
      const w = 22 - (i % 2);
      ctx.fillStyle = ink; ctx.fillRect(px, py, w, 12);
      ctx.fillStyle = i < count - 3 ? base : mid; ctx.fillRect(px + 2, py + 2, w - 4, 8);
      ctx.fillStyle = light; ctx.fillRect(px + 2, py + 2, w - 6, 2);
      ctx.fillStyle = horn;
      ctx.fillRect(px + 6, py - 5, 4, 5);
      ctx.fillRect(px + 14, py - 4, 3, 4);
    }
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = i % 2 ? '#8a2f1c' : '#e0764a';
      ctx.fillRect(x - 40 + i * 8 + phase * 14, y - 58 - i * 6, 46 - i * 6, 2);
    }
    if (phase === 1) {
      ctx.fillStyle = '#ffe9a0'; ctx.fillRect(x - 62, y - 40, 12, 12);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(x - 58, y - 36, 5, 5);
    } else if (phase === 2) {
      ctx.fillStyle = '#e0764a'; ctx.fillRect(x - 66, y - 36, 6, 6);
    }
  },
  chains(ctx, x, y, state) {
    const ink = '#16151c', iron = '#6d6a72', light = '#cfcbcd', rust = '#5e3a24';
    const broken = state === 'broken';
    // Coil on the ground, always in the same spot so the beat reads as a change.
    ctx.fillStyle = ink; ctx.fillRect(x + 14, y - 5, 20, 5);
    ctx.fillStyle = rust; ctx.fillRect(x + 16, y - 4, 16, 3);
    ctx.fillStyle = iron; ctx.fillRect(x + 17, y - 4, 13, 2);
    ctx.fillStyle = light; ctx.fillRect(x + 17, y - 4, 5, 1);
    ctx.fillStyle = ink; ctx.fillRect(x + 22, y - 4, 2, 3);
    // Links between the ankle and the coil.
    for (let link = 0; link < 5; link++) {
      const lx = x - 4 + link * 4;
      if (broken && link > 2) break;
      ctx.fillStyle = ink; ctx.fillRect(lx, y - 6, 4, 3);
      ctx.fillStyle = link % 2 ? iron : rust; ctx.fillRect(lx + 1, y - 5, 2, 2);
    }
    if (broken) {
      // The snapped end points away from the coil instead of reaching it.
      ctx.fillStyle = ink; ctx.fillRect(x + 6, y - 8, 3, 2);
      ctx.fillStyle = light; ctx.fillRect(x + 7, y - 8, 1, 1);
    }
    // Shackle: closed while bound, sprung open once the chains are broken.
    if (broken) {
      ctx.fillStyle = ink; ctx.fillRect(x - 8, y - 9, 3, 5); ctx.fillRect(x + 1, y - 9, 3, 5);
      ctx.fillStyle = iron; ctx.fillRect(x - 7, y - 8, 1, 3); ctx.fillRect(x + 2, y - 8, 1, 3);
      ctx.fillStyle = light; ctx.fillRect(x - 7, y - 8, 1, 1);
    } else {
      ctx.fillStyle = ink; ctx.fillRect(x - 8, y - 10, 12, 7);
      ctx.fillStyle = iron; ctx.fillRect(x - 7, y - 9, 10, 5);
      ctx.fillStyle = light; ctx.fillRect(x - 7, y - 9, 4, 1);
      ctx.fillStyle = ink; ctx.fillRect(x - 4, y - 8, 4, 3);
    }
  },
  // The souvenir Warrior picks up: a small glass vial of yellow lotus, still
  // glowing on the floor until he takes it.
  flask(ctx, x, y, state) {
    if (state === 'taken') return;
    const ink = '#16151c', glass = '#cfe2d8', cork = '#5e3a24', lotus = '#f0c24e';
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = '#ffe9a0'; ctx.fillRect(x - 10, y - 22, 20, 20);
    ctx.restore();
    ctx.fillStyle = ink; ctx.fillRect(x - 4, y - 14, 9, 13);
    ctx.fillStyle = glass; ctx.fillRect(x - 3, y - 13, 7, 11);
    ctx.fillStyle = lotus; ctx.fillRect(x - 3, y - 8, 7, 6);
    ctx.fillStyle = '#fff6cf'; ctx.fillRect(x - 2, y - 7, 3, 2);
    ctx.fillStyle = cork; ctx.fillRect(x - 2, y - 17, 5, 4);
    ctx.fillStyle = '#8a5f18'; ctx.fillRect(x - 3, y - 2, 7, 2);
  },
  // A cell drawn in front of the actor, so the prisoner reads as locked inside
  // instead of standing next to a cage. The door swings when it is opened.
  cell(ctx, x, y, state) {
    const ink = '#16151c', iron = '#5f5c66', light = '#c9c5cd', rust = '#6a4328';
    const open = state === 'open';
    const bar = (bx, top, height) => {
      ctx.fillStyle = ink; ctx.fillRect(bx, top, 4, height);
      ctx.fillStyle = iron; ctx.fillRect(bx + 1, top, 2, height);
      ctx.fillStyle = light; ctx.fillRect(bx + 1, top, 1, height - 2);
    };
    ctx.fillStyle = '#131a20'; ctx.fillRect(x - 38, y - 2, 76, 3);
    // Top and bottom rails of the cage.
    ctx.fillStyle = ink; ctx.fillRect(x - 38, y - 76, 76, 6);
    ctx.fillStyle = iron; ctx.fillRect(x - 37, y - 75, 74, 3);
    ctx.fillStyle = light; ctx.fillRect(x - 37, y - 75, 30, 1);
    ctx.fillStyle = ink; ctx.fillRect(x - 38, y - 12, 76, 5);
    ctx.fillStyle = iron; ctx.fillRect(x - 37, y - 11, 74, 2);
    ctx.fillStyle = rust; ctx.fillRect(x - 37, y - 10, 22, 1);
    // Bars: the whole front when locked, only the left leaf when opened.
    const bars = open ? [-34, -22] : [-34, -22, -10, 2, 14, 26];
    for (const bx of bars) bar(x + bx, y - 70, 59);
    if (open) {
      // The door, swung out to the right and lying against the ground.
      ctx.fillStyle = ink; ctx.fillRect(x + 22, y - 10, 30, 4);
      ctx.fillStyle = iron; ctx.fillRect(x + 23, y - 9, 28, 2);
      ctx.fillStyle = light; ctx.fillRect(x + 23, y - 9, 12, 1);
      ctx.fillStyle = ink; ctx.fillRect(x + 26, y - 18, 3, 9);
      ctx.fillStyle = iron; ctx.fillRect(x + 27, y - 17, 1, 7);
    } else {
      // Lock plate on the closed door.
      ctx.fillStyle = ink; ctx.fillRect(x + 20, y - 46, 9, 11);
      ctx.fillStyle = iron; ctx.fillRect(x + 21, y - 45, 7, 9);
      ctx.fillStyle = light; ctx.fillRect(x + 21, y - 45, 3, 1);
      ctx.fillStyle = ink; ctx.fillRect(x + 23, y - 42, 3, 5);
    }
  },
};

export const NARRATIVE_PROP_ART = PROP_ART;

export function createPresenter(root, catalog, onError) {
  for (const [id, character] of Object.entries(catalog.characters)) {
    if (!Object.hasOwn(STAGE_SPRITES, character.sprite)) throw Error(`Unknown sprite for ${id}: ${character.sprite}`);
  }
  root.innerHTML = '<canvas class="narrative-stage" width="1144" height="748" aria-label="Scripted scene"></canvas><div class="narrative-content"></div><p class="narrative-error" role="status" hidden></p>';
  const canvas = root.querySelector('canvas'), content = root.querySelector('.narrative-content'), errorBox = root.querySelector('.narrative-error');
  let previous = '', previousFocus = null, disposed = false, revision = 0;
  const portrait = (speaker, expression = 'neutral') => {
    const character = catalog.characters[speaker];
    const layout = character.portraitLayout === 'extended' ? ' portrait-extended' : '';
    return `<img class="narrative-portrait${layout}" src="${escape(character.expressions[expression])}" alt="${escape(character.name)} — ${escape(expression)}">`;
  };
  const restoreFocus = () => {
    if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    previousFocus = null;
  };
  return {
    render(player, banter, error, { preview = false } = {}) {
      const active = player?.active, showStage = player && (active || preview);
      canvas.hidden = !showStage;
      // Portraits overlay the scene; actors remain present on the stage.
      if (showStage) {
        const ctx = canvas.getContext('2d'), camera = player.camera;
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false;
        ctx.fillStyle = '#151320'; ctx.fillRect(0, 0, 1144, 748);
        ctx.translate(572, 374); ctx.scale(camera.zoom, camera.zoom); ctx.translate(-camera.x, -camera.y);
        drawBackground(ctx, player.scene.stage?.background ?? 'arena', { ...player.stageSize, time: player.time });
        const frontProps = [];
        const paintProp = (id, prop) => {
          const [x, y] = player.scene.stage.points[prop.at];
          // A prop id may carry a suffix (`portal-negro`) so a scene can hold
          // four of them; the art is registered once, under the family name.
          const art = PROP_ART[id] ?? PROP_ART[id.split('-')[0]];
          if (art) { art(ctx, x, y, prop.state); return; }
          ctx.fillStyle = prop.state === 'open' ? '#bfd890' : '#786b95';
          ctx.fillRect(x - 25, y - 65, 50, 60);
        };
        for (const [id, prop] of Object.entries(player.props)) {
          // A prop may declare itself in front of the actors (a cell's bars), so
          // the prisoner reads as standing inside it instead of beside it.
          if (prop.front) { frontProps.push([id, prop]); continue; }
          paintProp(id, prop);
        }
        for (const actor of Object.values(player.actors).sort((a, b) => a.y - b.y)) {
          if (actor.hidden) continue;
          if (actor.enemy) {
            // Enemies stand on the stage and walk with their own art; a dead one
            // lies on the ground instead.
            ctx.save();
            ctx.translate(actor.x, actor.y);
            if (actor.dead) { ctx.rotate(-Math.PI / 2); ctx.globalAlpha = 0.6; }
            // A corpse does not walk: freeze its frame so it stays still.
            drawEnemyFigure(ctx, { kind: actor.enemy, x: 0, y: 0, id: 1, variant: actor.variant, facing: actor.facing }, actor.dead ? 0 : player.time);
            ctx.restore();
            continue;
          }
          const def = STAGE_SPRITES[catalog.characters[actor.character].sprite];
          const lift = actor.animation === 'celebrate' ? Math.abs(Math.sin(player.time * 7)) * 12 : 0;
          def.draw(ctx, actor.x, actor.y - lift, { time: player.time, moving: actor.animation === 'walk', facing: actor.facing, player: {}, kneeling: actor.animation === 'kneel', outfit: actor.outfit });
          if (actor.animation === 'point') {
            ctx.fillStyle = '#f3dea4'; ctx.fillRect(actor.x + 16 * actor.facing, actor.y - 45, 35 * actor.facing, 6);
          }
        }
        for (const [id, prop] of frontProps) paintProp(id, prop);
        if (player.flash) {
          // Pixel burst: hot core, yellow cross, orange tips.
          const spot = player.flash.actor ? player.actors[player.flash.actor] : player.flash;
          const x = spot.x, y = spot.y - (player.flash.actor ? 42 : 0);
          ctx.fillStyle = '#fff6cf'; ctx.fillRect(x - 4, y - 4, 8, 8);
          ctx.fillStyle = '#ffd166';
          ctx.fillRect(x - 16, y - 2, 32, 4); ctx.fillRect(x - 2, y - 16, 4, 32);
          ctx.fillStyle = '#ff9f43';
          ctx.fillRect(x - 26, y - 1, 8, 2); ctx.fillRect(x + 18, y - 1, 8, 2);
          ctx.fillRect(x - 1, y - 26, 2, 8); ctx.fillRect(x - 1, y + 18, 2, 8);
        }
        ctx.restore();
        if (player.fade > 0) {
          // A cut to black covers the whole viewport, camera or not.
          ctx.save();
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.globalAlpha = Math.min(1, player.fade);
          ctx.fillStyle = '#07060b';
          ctx.fillRect(0, 0, 1144, 748);
          ctx.restore();
        }
      }
      const signature = JSON.stringify([Boolean(active), player?.dialogue, player?.splash, player?.notice, player?.flash, banter]);
      if (signature !== previous) {
        previous = signature;
        const currentRevision = ++revision;
        const line = player?.dialogue;
        if (active && !previousFocus) previousFocus = document.activeElement;
        // No stale line: a beat between two conversations (a move, a camera
        // push) shows the stage, not the sentence the player already read.
        const spoken = line ?? null;
        // The held beats (splash, notice) close with the same actions block as a
        // character panel, in the same corner, and it must re-enable pointer
        // events: the narrative layer otherwise passes the click to the game.
        const heldActions = '<div class="actions"><button class="primary" data-action="narrative-next">Continue</button><button class="secondary" data-action="narrative-skip">Skip scene</button></div>';
        if (spoken?.layout === 'stage') {
          // Keep moving sprites visible; a compact subtitle panel replaces the
          // large portraits only for dialogue that explicitly opts into it.
          content.innerHTML = `<div class="narrative-dialog narrative-stage-dialog" role="dialog" aria-modal="true" aria-label="Scene conversation"><div class="narrative-text"><strong>${escape(spoken.name ?? catalog.characters[spoken.speaker].name)}</strong><p>${escape(spoken.text)}</p><div class="actions"><button class="primary" data-action="narrative-next">Continue</button><button class="secondary" data-action="narrative-skip">Skip scene</button></div></div></div>`;
        } else if (spoken) {
          // The cast keeps the same slots for the whole scene, ordered by where
          // each actor stands, and faces the centre of the conversation.
          const sceneSpeakers = [...new Set(player.scene.steps.flatMap(step => step.type === 'dialogue' ? step.lines.map(item => item.speaker) : []))];
          const stageX = id => {
            const stage = player.scene.stage;
            const actors = Object.values(stage?.actors ?? {});
            // A speaker id may dress the same body differently (`papafrita-casual`
            // against `papafrita`), so an exact miss falls back to the actor that
            // shares its stage sprite. Otherwise the portrait queues at the end.
            const sprite = catalog.characters[id]?.sprite;
            const entry = actors.find(actor => actor.character === id)
              ?? actors.find(actor => catalog.characters[actor.character]?.sprite === sprite);
            const point = entry ? stage.points?.[entry.at] : null;
            return Array.isArray(point) ? point[0] : null;
          };
          const cast = sceneSpeakers
            .map((id, index) => ({ id, index, x: stageX(id) }))
            .sort((a, b) => (a.x ?? Infinity) - (b.x ?? Infinity) || a.index - b.index);
          const placed = cast.map(entry => entry.x).filter(x => x !== null);
          const midpoint = placed.length > 1 ? (Math.min(...placed) + Math.max(...placed)) / 2 : null;
          const facing = entry => (midpoint === null || entry.x === null ? '' : entry.x > midpoint ? ' mirrored' : '');
          const actions = line
            ? '<div class="actions"><button class="primary" data-action="narrative-next">Continue</button><button class="secondary" data-action="narrative-skip">Skip scene</button></div>'
            : '';
          content.innerHTML = `<div class="narrative-dialog" role="dialog" aria-modal="true" aria-label="Scene conversation"${line ? '' : ' aria-live="off"'}><div class="narrative-portraits">${cast.map(entry => `<div class="${entry.id === spoken.speaker ? 'speaking' : 'listening'}${facing(entry)}${catalog.characters[entry.id].portraitLayout === 'extended' ? ' portrait-extended-frame' : ''}">${portrait(entry.id, entry.id === spoken.speaker ? spoken.expression : (spoken.expressions?.[entry.id] ?? 'neutral'))}</div>`).join('')}</div><div class="narrative-text"><strong>${escape(spoken.name ?? catalog.characters[spoken.speaker].name)}</strong><p>${escape(spoken.text)}</p>${actions}</div></div>`;
        } else if (player?.notice) {
          content.innerHTML = `<div class="narrative-notice" role="status"><strong>${escape(player.notice.title)}</strong>${player.notice.lines.map(text => `<p>${escape(text)}</p>`).join('')}${heldActions}</div>`;
        } else if (player?.splash) {
          const speaker = player.splash.speaker;
          const image = portrait(speaker);
          const framed = catalog.characters[speaker].portraitLayout === 'extended'
            ? `<div class="narrative-splash-extended-frame">${image}</div>` : image;
          content.innerHTML = `<div class="narrative-splash">${framed}<h2>${escape(player.splash.text)}</h2>${heldActions}</div>`;
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
