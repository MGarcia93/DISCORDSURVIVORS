import { drawTitle } from '../scenes.mjs';
import { drawBackground } from '../backgrounds/index.mjs';
import { state } from '../app/state.mjs';
import { audio } from '../audio/index.mjs';
import { volumeRow } from '../audio/controls.mjs';

// Home screen: title room, main menu and the controls dialog overlays.
export function home() {
  state.content.innerHTML = `
    <section class="home-screen" aria-label="Menú principal">
      <canvas id="menu-scene" class="scene-backdrop" width="480" height="270" role="img" aria-label="Habitación pixel art: Maxi Negro con buzo amarillo en el sillón, frente a su computadora"></canvas>
      <div class="home-content">
        <p class="chapter-label">UNA NOCHE MÁS EN EL SERVIDOR</p>
        <h1 class="sr-only">Discord Survivors — La última partida</h1>
        <canvas id="title-art" class="title-art" width="174" height="63" aria-hidden="true"></canvas>
        <p class="title-subtitle">— La última partida —</p>
        <nav class="main-menu" aria-label="Opciones del juego">
          <button class="primary" data-action="characters">EMPEZAR PARTIDA</button>
          <button class="pixel-button" data-action="controls">CONTROLES</button>
          <button class="pixel-button" data-action="mute" aria-pressed="${audio.muted}">${audio.muted ? '♪ MUDO' : '♪ SONIDO'}</button>
        </nav>
        <p class="menu-caption">El servidor se cayó.<br>Levantarse del sillón ya no es opcional.</p>
        <p class="menu-help">↑ ↓ ELEGIR &nbsp; / &nbsp; ENTER CONFIRMAR</p>
      </div>
      <div class="room-caption"><b>EL NEGRO</b>TANQUE SEDENTARIO</div>
      <div class="game-status"><span><b>●</b> UN JUGADOR · SIN CONEXIÓN AL SERVIDOR</span><span>PROTOTIPO 0.2 / PIXEL EDITION</span></div>
      <div id="menu-overlay"></div>
    </section>`;
  drawTitle(document.querySelector('#title-art'));
  const scene = document.querySelector('#menu-scene');
  drawBackground(scene.getContext('2d'), 'room', { width: scene.width, height: scene.height });
}

export function controls() {
  document.querySelector('#menu-overlay').innerHTML = `<div class="overlay" role="dialog" aria-modal="true" aria-label="Controles"><div>
    <div class="eyebrow">Manual de supervivencia</div><h2>CON LO MÍNIMO ALCANZA</h2>
    <p><kbd>WASD</kbd> / <kbd>↑ ← ↓ →</kbd> Moverse<br>El control remoto ataca automáticamente.</p>
    <p><kbd>Q</kbd> Modo Otaku · <kbd>E</kbd> Me da paja<br><kbd>ESC</kbd> Pausar la partida</p>
    <p>Quedate quieto 2 segundos para regenerar vida.<br>En pantalla táctil usá las flechas y los botones.</p>
    ${volumeRow('music', 'Música', 'menu')}
    ${volumeRow('sfx', 'Efectos', 'menu')}
    <button class="primary" data-action="close-controls">ENTENDIDO</button>
    </div></div>`;
  document.querySelector('[data-action="close-controls"]').focus();
}

export function closeControls() {
  document.querySelector('#menu-overlay').innerHTML = '';
  document.querySelector('[data-action="controls"]').focus();
}
