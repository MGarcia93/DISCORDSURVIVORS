import { WIDTH, HEIGHT, WORLD_SCALE, UPGRADES, HEAL_COST, HEAL_AMOUNT, createRun, step, chooseUpgrade, buyHeal, sellBelonging, startNextWave, activateSpecial } from './engine.mjs';
import { drawRoom, drawStory } from './scenes.mjs';
import { isCharacterUnlocked, isDebugUnlockAll, unlockAllForTesting } from './progression.mjs';
import { on } from './bus.mjs';
import { state } from './app/state.mjs';
import { updateHUD } from './game/hud.mjs';
import { overlay } from './game/overlays.mjs';
import { draw } from './game/renderer.mjs';
import { home, controls, closeControls } from './screens/home.mjs';
import { story } from './screens/story.mjs';
import { characters, drawPreview } from './screens/characters.mjs';
import { game } from './screens/game.mjs';

// Any map victory passes through the bus: progression records the unlock and
// app reads it back to refresh the character roster cache.
on('waveCleared', ({ run: clearedRun }) => {
  if (clearedRun.phase !== 'won') return;
  state.solagoUnlocked = isCharacterUnlocked('solago');
  state.warriorUnlocked = isCharacterUnlocked('warrior');
  state.papazitoUnlocked = isCharacterUnlocked('papazito');
  clearedRun.unlockedSolago = state.solagoUnlocked;
  clearedRun.unlockedWarrior = state.warriorUnlocked;
  clearedRun.unlockedPapazito = state.papazitoUnlocked;
});

// A sale-menu special (ficha-defined items) pauses the state.run for its merchant UI.
on('specialActivated', ({ run: activatedRun, special }) => {
  if (activatedRun !== state.run || special !== 'sell' || activatedRun.phase !== 'playing') return;
  const p = activatedRun.player;
  const stock = p.characterDef.specials.find(spec => spec.key === 'sell')?.items ?? {};
  if (!Object.keys(stock).some(item => !p.soldItems?.[item])) return;
  state.sellMenuOpen = true;
  state.lastPhase = '';
});
function show(name) {
  state.screen = name;
  state.content.dataset.screen = name;
  state.keys.clear();
  if (name !== 'game') state.run = null;
  state.paused = false;
  state.sellMenuOpen = false;
  document.body.classList.toggle('in-game', name === 'game');
  if (name === 'home') home();
  if (name === 'characters') characters();
  if (name === 'story') story();
  if (name === 'game') game();
  state.content.focus({ preventScroll: true });
  window.scrollTo(0, 0);
}

function frame(timestamp) {
  const dt = state.lastFrame ? (timestamp - state.lastFrame) / 1000 : 0;
  state.lastFrame = timestamp;
  if (state.screen === 'game' && state.run) {
    const input = {
      x: (state.keys.has('d') || state.keys.has('arrowright') ? 1 : 0) - (state.keys.has('a') || state.keys.has('arrowleft') ? 1 : 0),
      y: (state.keys.has('s') || state.keys.has('arrowdown') ? 1 : 0) - (state.keys.has('w') || state.keys.has('arrowup') ? 1 : 0),
    };
    if (input.x) state.facing = input.x > 0 ? 1 : -1;
    if (!state.paused && !state.sellMenuOpen) step(state.run, dt, input);
    draw();
    state.hudElapsed += dt;
    if (state.hudElapsed > 0.08 || state.run.phase !== state.lastPhase) { updateHUD(); state.hudElapsed = 0; }
    overlay();
  }
  const animationTime = state.reducedMotion.matches ? 4 : timestamp / 1000;
  if (state.screen === 'characters') drawPreview(animationTime);
  if (state.screen === 'home') drawRoom(document.querySelector('#menu-scene').getContext('2d'), animationTime);
  if (state.screen === 'story') drawStory(document.querySelector('#story-scene'), state.storyPage, animationTime);
  requestAnimationFrame(frame);
}

document.addEventListener('click', event => {
  const button = event.target.closest('button');
  if (!button || button.disabled) return;
  const action = button.dataset.action;
  if (button.dataset.character && isCharacterUnlocked(button.dataset.character)) {
    state.selectedCharacter = button.dataset.character;
    characters();
  }
  if (action === 'controls') controls();
  if (action === 'close-controls') closeControls();
  if (['home', 'characters'].includes(action)) show(action);
  if (action === 'story-start') { state.storyPage = 0; show('story'); }
  if (action === 'story-back') { if (state.storyPage > 0) { state.storyPage--; story(); } else show('characters'); }
  if (action === 'story-next') { if (state.storyPage < 2) { state.storyPage++; story(); } else show('game'); }
  if (action === 'play') show('game');
  if (action === 'pause' && state.run?.phase === 'playing') { state.paused = !state.paused; state.keys.clear(); }
  if (action === 'resume') { state.paused = false; state.keys.clear(); }
  if (action === 'sell-menu-close') { state.sellMenuOpen = false; state.lastPhase = ''; state.keys.clear(); overlay(); updateHUD(); }
  if (action === 'next-wave') { startNextWave(state.run); state.keys.clear(); }
  if (button.dataset.sale && state.run) {
    sellBelonging(state.run, button.dataset.sale);
    const stock = state.run.player.characterDef.specials.find(s => s.key === 'sell')?.items ?? {};
    if (!Object.keys(stock).some(key => !state.run.player.soldItems?.[key])) state.sellMenuOpen = false;
    state.lastPhase = '';
    overlay(); updateHUD();
  }
  if (button.dataset.special && state.run && !state.paused) activateSpecial(state.run, button.dataset.special);
  if (button.dataset.upgrade && state.run) { chooseUpgrade(state.run, button.dataset.upgrade); state.lastPhase = ''; overlay(); updateHUD(); }
  if (button.dataset.heal && state.run) { buyHeal(state.run); state.lastPhase = ''; overlay(); updateHUD(); }
});

document.addEventListener('keydown', event => {
  const key = event.key.toLowerCase();
  if (key === 'tab' && document.querySelector('.overlay')) {
    const buttons = [...document.querySelectorAll('.overlay button:not(:disabled)')];
    const first = buttons[0]; const last = buttons.at(-1);
    if (event.shiftKey && document.activeElement === first) { last?.focus(); event.preventDefault(); }
    if (!event.shiftKey && document.activeElement === last) { first?.focus(); event.preventDefault(); }
  }
  if (state.screen !== 'game') {
    if (key === 'escape' && document.querySelector('#menu-overlay .overlay')) closeControls();
    if (state.screen === 'home' && event.altKey && event.shiftKey && key === 'u') {
      if (unlockAllForTesting()) {
        state.debugUnlockAll = true;
        state.solagoUnlocked = true;
        state.warriorUnlocked = true;
        state.papazitoUnlocked = true;
        state.selectedCharacter = 'negro';
        show('characters');
      }
      event.preventDefault();
      return;
    }
    if (['arrowup', 'arrowdown'].includes(key) && !document.querySelector('.overlay')) {
      const buttons = [...content.querySelectorAll('button:not(:disabled)')];
      const current = buttons.indexOf(document.activeElement);
      const next = current < 0 ? 0 : (current + (key === 'arrowdown' ? 1 : -1) + buttons.length) % buttons.length;
      buttons[next]?.focus();
      event.preventDefault();
    }
    if (key === 'enter' && document.activeElement === state.content) {
      state.content.querySelector('button.primary')?.click();
      event.preventDefault();
    }
    return;
  }
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) event.preventDefault();
  if (key === 'escape' && !event.repeat && state.run.phase === 'playing') {
    if (state.sellMenuOpen) { state.sellMenuOpen = false; state.lastPhase = ''; state.keys.clear(); overlay(); updateHUD(); }
    else { state.paused = !state.paused; state.keys.clear(); }
  }
  if (!state.paused && !state.sellMenuOpen && !event.repeat && state.run.phase === 'playing') {
    for (const special of state.run.player.characterDef.specials) {
      if (special.hotkey === key) activateSpecial(state.run, special.key);
    }
  }
  if (!state.paused && !state.sellMenuOpen) state.keys.add(key);
});
document.addEventListener('keyup', event => state.keys.delete(event.key.toLowerCase()));
const directions = { up: 'w', left: 'a', down: 's', right: 'd' };
document.addEventListener('pointerdown', event => {
  const button = event.target.closest('[data-direction]');
  if (!button) return;
  event.preventDefault(); button.setPointerCapture(event.pointerId); state.keys.add(directions[button.dataset.direction]);
});
for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) document.addEventListener(name, event => {
  const button = event.target.closest('[data-direction]');
  if (button) state.keys.delete(directions[button.dataset.direction]);
});
function suspend() { state.keys.clear(); if (state.screen === 'game' && state.run?.phase === 'playing') state.paused = true; }
window.addEventListener('blur', suspend);
document.addEventListener('visibilitychange', () => { if (document.hidden) suspend(); });
show('home');
requestAnimationFrame(frame);
