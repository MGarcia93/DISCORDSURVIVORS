import { WIDTH, HEIGHT, createRun } from '../engine.mjs';
import { balanceFor } from '../reward-data.mjs';
import { state } from '../app/state.mjs';
import { updateHUD } from '../game/hud.mjs';

// Arena DOM builder: built once per run; HUD values update separately.
export function game() {
  state.run = createRun(Math.random, state.selectedCharacter, {
    balance: balanceFor(globalThis.location?.hostname, globalThis.location?.search),
  });
  state.facing = 1;
  state.lastPhase = '';
  const act = state.run.act;
  const def = state.run.player.characterDef;
  const abilityButtons = def.specials
    .map(special => `<button class="ability" data-special="${special.key}"><kbd>${special.hotkey.toUpperCase()}</kbd> <span>${special.name}</span></button>`)
    .join('');
  state.content.innerHTML = `
    <section class="game-screen">
    <div class="arena-header"><div><div class="eyebrow">Mundo 0${act.order} · ${act.title}</div><h2 id="wave-title">OLEADA 01 <span class="muted">/ 0${act.boss.wave}</span></h2></div><button class="secondary" data-action="pause">Ⅱ PAUSA</button></div>
    <div class="arena-wrap"><canvas width="1144" height="748" aria-label="Arena de supervivencia ampliada. Movete con WASD o las flechas. Q y E activan tus habilidades."></canvas>
      <div class="hud"><div class="health-box"><div class="hud-label"><span id="player-name"></span><span id="hp-label"></span></div><div class="hp-track"><div class="hp-fill" id="hp-fill"></div></div><div class="level-line"><small id="level" aria-live="off"></small><span class="xp-track"><span class="xp-fill" id="xp-fill"></span></span></div></div><div class="hud-numbers"><span id="coins"></span><span id="timer"></span></div></div>
      <div id="task-panel" class="task-panel" ${def.taskHud ? '' : 'hidden'}><div><b>${def.taskHudTitle ?? 'PERMISO PARA JUGAR'}</b><span id="task-label"></span></div><div class="task-track"><div id="task-fill" class="task-fill"></div></div></div>
      <div id="character-status" class="character-status" ${def.statusHud ? '' : 'hidden'} aria-live="off"></div>
      <div id="game-overlay"></div>
      <div id="narrative-layer" hidden></div>
    </div>
    <div class="game-controls"><div class="key-help"><kbd>W A S D</kbd> / <kbd>↑ ← ↓ →</kbd> Mover <span>·</span> Ataque automático <span>·</span><kbd>ESC</kbd> Pausa</div>
      <div class="touch-pad" aria-label="Movimiento táctil"><button data-direction="up" aria-label="Arriba">↑</button><button data-direction="left" aria-label="Izquierda">←</button><button data-direction="down" aria-label="Abajo">↓</button><button data-direction="right" aria-label="Derecha">→</button></div>
      <div class="ability-buttons">${abilityButtons}</div></div>
    <p class="game-note">${def.gameNote}</p></section>`;
  const canvas = document.querySelector('.arena-wrap canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  updateHUD();
}
