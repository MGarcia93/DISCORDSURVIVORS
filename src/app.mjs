import { step, chooseUpgrade, buyHeal, sellBelonging, startNextWave, activateSpecial } from './engine.mjs';
import { drawStory } from './scenes.mjs';
import { drawBackground } from './backgrounds/index.mjs';
import { storyPages } from './screens/story-pages.mjs';
import { isCharacterUnlocked, unlockAllForTesting, UNLOCK_CHAIN } from './progression.mjs';
import { on } from './bus.mjs';
import { state } from './app/state.mjs';
import { updateHUD } from './game/hud.mjs';
import { overlay } from './game/overlays.mjs';
import { draw } from './game/renderer.mjs';
import { home, controls, closeControls } from './screens/home.mjs';
import { story } from './screens/story.mjs';
import { characters, drawPreview } from './screens/characters.mjs';
import { worldsScreen, drawWorldPreview, isWorldDevelopment, isWorldKey } from './screens/worlds.mjs';
import { game } from './screens/game.mjs';
import { narrative, leaveNarrative, showNarrativeViewer, tickNarrativeViewer, narrativeAction, activeNarrativeHost, trapNarrativeFocus, isNarrativeDevelopment } from './narrative/integration.mjs';

// Any map victory passes through the bus: progression records the unlock and
// app reads it back through the chain to refresh the roster cache and mark
// which ficha's victory line the outcome overlay should speak.
on('waveCleared', ({ run: clearedRun }) => {
  if (clearedRun.phase !== 'won') return;
  for (const id of UNLOCK_CHAIN) state[`${id}Unlocked`] = isCharacterUnlocked(id);
  clearedRun.unlocked = UNLOCK_CHAIN.find(id => isCharacterUnlocked(id)) ?? null;
});

// A sale-menu special (ficha-defined items) pauses the run for its merchant UI.
on('specialActivated', ({ run: activatedRun, special }) => {
  if (activatedRun !== state.run || special !== 'sell' || activatedRun.phase !== 'playing') return;
  const p = activatedRun.player;
  const stock = p.characterDef.specials.find(spec => spec.key === 'sell')?.items ?? {};
  if (!Object.keys(stock).some(item => !p.soldItems?.[item])) return;
  state.sellMenuOpen = true;
  state.lastPhase = '';
});
function show(name) {
  leaveNarrative();
  state.screen = name;
  state.content.dataset.screen = name;
  state.keys.clear();
  if (name !== 'game') state.run = null;
  state.paused = false;
  state.sellMenuOpen = false;
  document.body.classList.toggle('in-game', name === 'game');
  if (name === 'home') home();
  if (name === 'characters') characters();
  if (name === 'worlds') worldsScreen();
  if (name === 'story') story();
  if (name === 'game') { game(); narrative.attach(state.run, document.querySelector('#narrative-layer')); }
  if (name === 'narrative') showNarrativeViewer(state.content);
  state.content.focus({ preventScroll: true });
  window.scrollTo(0, 0);
}

function frame(timestamp) {
  const dt = state.lastFrame ? (timestamp - state.lastFrame) / 1000 : 0;
  state.lastFrame = timestamp;
  if (state.screen === 'game' && state.run) {
    const sceneWasBlocking = narrative.blocked;
    const input = {
      x: (state.keys.has('d') || state.keys.has('arrowright') ? 1 : 0) - (state.keys.has('a') || state.keys.has('arrowleft') ? 1 : 0),
      y: (state.keys.has('s') || state.keys.has('arrowdown') ? 1 : 0) - (state.keys.has('w') || state.keys.has('arrowup') ? 1 : 0),
    };
    if (input.x && !sceneWasBlocking) state.facing = input.x > 0 ? 1 : -1;
    if (!state.paused && !state.sellMenuOpen) {
      narrative.tick(dt);
      if (!sceneWasBlocking && !narrative.blocked) step(state.run, dt, input);
      narrative.observe();
    }
    if (narrative.blocked) state.keys.clear();
    draw();
    state.hudElapsed += dt;
    if (state.hudElapsed > 0.08 || state.run.phase !== state.lastPhase) { updateHUD(); state.hudElapsed = 0; }
    overlay();
    const phaseOverlay = document.querySelector('#game-overlay');
    if (phaseOverlay) phaseOverlay.hidden = narrative.blocked;
    const controls = document.querySelector('.game-controls');
    if (controls) controls.inert = narrative.blocked;
    narrative.render();
  }
  if (state.screen === 'narrative' && !document.hidden) tickNarrativeViewer(dt);
  const animationTime = state.reducedMotion.matches ? 4 : timestamp / 1000;
  if (state.screen === 'characters') drawPreview(animationTime);
  if (state.screen === 'home') {
    const canvas = document.querySelector('#menu-scene');
    drawBackground(canvas.getContext('2d'), 'room', { width: canvas.width, height: canvas.height, time: animationTime });
  }
  if (state.screen === 'story') drawStory(document.querySelector('#story-scene'), storyPages[state.storyPage] ?? storyPages[0], animationTime);
  if (state.screen === 'worlds') drawWorldPreview(dt, animationTime);
  requestAnimationFrame(frame);
}

document.addEventListener('click', event => {
  const button = event.target.closest('button');
  if (!button || button.disabled) return;
  const action = button.dataset.action;
  if (narrativeAction(action)) { state.keys.clear(); return; }
  if (activeNarrativeHost().blocked && action !== 'home') return;
  if (button.dataset.character && isCharacterUnlocked(button.dataset.character)) {
    state.selectedCharacter = button.dataset.character;
    characters();
  }
  if (action === 'controls') controls();
  if (action === 'close-controls') closeControls();
  if (['home', 'characters', 'worlds'].includes(action)) show(action);
  if (action === 'story-start') { state.storyPage = 0; show('story'); }
  if (action === 'story-back') { if (state.storyPage > 0) { state.storyPage--; story(); } else show('characters'); }
  if (action === 'story-next') { if (state.storyPage < storyPages.length - 1) { state.storyPage++; story(); } else show('game'); }
  if (action === 'play') show('game');
  if (action === 'pause' && state.run?.phase === 'playing') { state.paused = !state.paused; state.keys.clear(); }
  if (action === 'resume') { state.paused = false; state.keys.clear(); }
  if (action === 'sell-menu-close') { state.sellMenuOpen = false; state.lastPhase = ''; state.keys.clear(); overlay(); updateHUD(); }
  if (action === 'next-wave') { narrative.nextWave(() => startNextWave(state.run)); state.keys.clear(); }
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
  if (activeNarrativeHost().blocked) {
    trapNarrativeFocus(event);
    if (activeNarrativeHost().key(key, event.repeat) || key === 'tab') {
      if (key !== 'tab') event.preventDefault();
      state.keys.clear(); return;
    }
  }
  if (key === 'tab' && document.querySelector('.overlay')) {
    const buttons = [...document.querySelectorAll('.overlay button:not(:disabled)')];
    const first = buttons[0]; const last = buttons.at(-1);
    if (event.shiftKey && document.activeElement === first) { last?.focus(); event.preventDefault(); }
    if (!event.shiftKey && document.activeElement === last) { first?.focus(); event.preventDefault(); }
  }
  if (state.screen !== 'game') {
    // Native form controls keep their own keyboard behaviour (the dev viewers
    // use selects, which need their arrow keys).
    if (event.target?.tagName === 'SELECT') return;
    // The worlds viewer walks the selected ficha around the backdrop.
    if (state.screen === 'worlds' && isWorldKey(key)) {
      state.keys.add(key);
      event.preventDefault();
      return;
    }
    if (key === 'escape' && document.querySelector('#menu-overlay .overlay')) closeControls();
    if (state.screen === 'home' && event.altKey && event.shiftKey && key === 'u') {
      if (unlockAllForTesting()) {
        state.debugUnlockAll = true;
        for (const id of UNLOCK_CHAIN) state[`${id}Unlocked`] = true;
        state.selectedCharacter = 'negro';
        show('characters');
      }
      event.preventDefault();
      return;
    }
    if (['arrowup', 'arrowdown'].includes(key) && !document.querySelector('.overlay')) {
      const buttons = [...state.content.querySelectorAll('button:not(:disabled)')];
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
  if (activeNarrativeHost().blocked) return;
  const button = event.target.closest('[data-direction]');
  if (!button) return;
  event.preventDefault(); button.setPointerCapture(event.pointerId); state.keys.add(directions[button.dataset.direction]);
});
for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) document.addEventListener(name, event => {
  const button = event.target.closest('[data-direction]');
  if (button) state.keys.delete(directions[button.dataset.direction]);
});
function suspend() {
  state.keys.clear();
  const host = activeNarrativeHost();
  if (host.blocked) host.suspend();
  else if (state.screen === 'game' && state.run?.phase === 'playing') state.paused = true;
}
function resumeNarrative() { if (!document.hidden) activeNarrativeHost().resume(); }
window.addEventListener('blur', suspend);
window.addEventListener('focus', resumeNarrative);
document.addEventListener('visibilitychange', () => { if (document.hidden) suspend(); else resumeNarrative(); });
show(isNarrativeDevelopment() ? 'narrative' : isWorldDevelopment() ? 'worlds' : 'home');
requestAnimationFrame(frame);
