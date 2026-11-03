import { step, chooseUpgrade, sellBelonging, startNextWave, activateSpecial } from './engine.mjs';
import { handleRewardAction } from './game/reward-actions.mjs';
import { nextPlayableAct, PLAYABLE_ACTS, actForWorld, getAct } from './campaign/acts.mjs';
import { drawStory } from './scenes.mjs';
import { drawBackground } from './backgrounds/index.mjs';
import { storyPages } from './screens/story-pages.mjs';
import { isCharacterUnlocked, unlockAllForTesting, unlockAllForSession, recordCampaignClear, postgameOpen, UNLOCK_CHAIN } from './progression.mjs';
import { DEV } from './dev-flags.mjs';
import { on } from './bus.mjs';
import { state } from './app/state.mjs';
import { updateHUD } from './game/hud.mjs';
import { overlay } from './game/overlays.mjs';
import { draw } from './game/renderer.mjs';
import { home, controls, sound, closeMenuOverlay } from './screens/home.mjs';
import { story } from './screens/story.mjs';
import { characters, drawPreview } from './screens/characters.mjs';
import { worldsScreen, drawWorldPreview, isWorldDevelopment, isWorldKey } from './screens/worlds.mjs';
import { enemiesScreen, drawEnemyPreview, isEnemyDevelopment } from './screens/enemies.mjs';
import { balance, isBalanceDevelopment } from './screens/balance.mjs';
import { balanceForMode, seedRun } from './game/balance-seed.mjs';
import { game } from './screens/game.mjs';
import { narrative, leaveNarrative, showNarrativeViewer, tickNarrativeViewer, narrativeAction, activeNarrativeHost, trapNarrativeFocus, isNarrativeDevelopment, activeNarrativeAct } from './narrative/integration.mjs';
import { audio } from './audio/index.mjs';
import { musicCue, SFX, UI } from './audio/mix.mjs';
import { warpToWorld } from './game/world-transition.mjs';
import { waveConfig } from './waves.mjs';

// Refresh availability after a world victory. Encounter cinematics own unlock
// announcements; an unrelated boss victory must not repeat a legacy reward.
on('waveCleared', ({ run: clearedRun }) => {
  if (clearedRun.phase !== 'won' && !clearedRun.worldCleared) return;
  for (const id of UNLOCK_CHAIN) state[`${id}Unlocked`] = isCharacterUnlocked(id);
  // Clearing the campaign's last world opens one; an epilogue or a lab wave
  // never does, and the epilogue itself is behind this counter.
  if (clearedRun.worldCleared && !clearedRun.lab && !clearedRun.act.postgame
    && !nextPlayableAct(clearedRun.act.id)) recordCampaignClear();
});

// Gameplay SFX hang off the same post-state events the rest of the shell reads.
// El Negro throws things, he does not shoot them: the engine event is called
// `shot` because a projectile left the player, but what it sounds like is a
// thrown remote, joystick or phone.
on('shot', () => audio.playSound(SFX.throw, 'throw'));
on('kill', () => audio.playSound(SFX.kill, 'kill'));
on('playerDown', () => audio.playSound(SFX.down));

// A sale-menu special (ficha-defined items) pauses the run for its merchant UI.
on('specialActivated', ({ run: activatedRun, special }) => {
  if (activatedRun !== state.run || special !== 'sell' || activatedRun.phase !== 'playing') return;
  const p = activatedRun.player;
  const stock = p.characterDef.specials.find(spec => spec.key === 'sell')?.items ?? {};
  if (!Object.keys(stock).some(item => !p.soldItems?.[item])) return;
  state.sellMenuOpen = true;
  state.lastPhase = '';
});
function show(name, previousRun = null) {
  leaveNarrative();
  state.screen = name;
  state.content.dataset.screen = name;
  state.keys.clear();
  if (name !== 'game') { state.run = null; state.pendingRun = null; }
  state.paused = false;
  state.sellMenuOpen = false;
  document.body.classList.toggle('in-game', name === 'game');
  if (name === 'home') home();
  if (name === 'characters') characters();
  if (name === 'worlds') worldsScreen();
  if (name === 'enemies') enemiesScreen();
  if (name === 'balance') balance();
  if (name === 'story') story();
  if (name === 'game') {
    game(previousRun);
    // A lab run measures a wave, not the story: it skips every cinematic unless
    // the lab's own switch asks for them. When it does, the scenes play with a
    // throwaway memory (`persist: false`), so previewing a boundary can neither
    // burn a `repeat: once` scene nor unlock the character it would have
    // unlocked on a real playthrough.
    const lab = state.run?.lab === true;
    if (!lab || state.balanceCinematics) {
      narrative.attach(state.run, document.querySelector('#narrative-layer'), lab ? { persist: false } : {});
    }
  }
  if (name === 'narrative') showNarrativeViewer(state.content);
  state.content.focus({ preventScroll: true });
  window.scrollTo(0, 0);
}

// Entering a world crosses the server gate, so a jump between worlds reads as a
// transfer instead of a screen swap.
function enterWorld(previousRun = null) {
  show('game', previousRun);
  warpToWorld(state.content, state.run.act.id, { reducedMotion: state.reducedMotion.matches });
}

// The dev viewers have no run, but each one does show a world: the narrative
// viewer the act that owns the scene playing, the world and enemy viewers the
// world picked in their menu. Resolving it here keeps the bed one call, exactly
// like every other screen, instead of granting the viewers a bus of their own.
function previewAct() {
  if (state.screen === 'narrative') return activeNarrativeAct();
  if (state.screen === 'worlds') return actForWorld(state.worldPreview);
  if (state.screen === 'enemies') return actForWorld(state.enemyPreviewWorld);
  if (state.screen === 'balance') return actForWorld(getAct(state.balanceAct).world);
  return null;
}

// The lab seeds the run itself: the chosen wave, the build its budget paid for,
// and the balance mode it compares with. Repeating a wave re-seeds from
// `state.balance*`, so the build is whatever the lab last showed and two runs of
// one build are the same wave.
function playBalanceWave() {
  const { run } = seedRun({
    character: state.balanceCharacter,
    act: getAct(state.balanceAct),
    wave: state.balanceWave,
    balance: balanceForMode(state.balanceMode),
    picks: state.balancePicks,
    items: state.balanceItems,
  });
  state.selectedAct = state.balanceAct;
  state.selectedCharacter = state.balanceCharacter;
  state.pendingRun = run;
  show('game');
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
    // A wave may declare its own noise: the depot fight keeps the car alarm
    // ringing every couple of seconds while it lasts.
    const alarm = waveConfig(state.run.act, state.run.wave)?.alarm;
    if (alarm && state.run.phase === 'playing' && !state.paused && !narrative.blocked) {
      state.alarmIn = (state.alarmIn ?? alarm) - dt;
      if (state.alarmIn <= 0) { audio.playSound(SFX.alarm, 'alarm'); state.alarmIn = alarm; }
    } else state.alarmIn = null;
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
  if (state.screen === 'enemies') drawEnemyPreview(dt);
  // The bed follows the state the shell already has: screen, run phase, wave,
  // pause and whether a scene owns the screen. One call, one signature check.
  audio.setCue(musicCue({
    screen: state.screen,
    run: state.screen === 'game' ? state.run : null,
    act: previewAct(),
    paused: state.paused,
    blocked: narrative.blocked,
  }));
  audio.tick();
  requestAnimationFrame(frame);
}

// One sound per kind of click. The interface answers the finger before the
// screen redraws: a menu with visual feedback and silent buttons reads as broken.
function clickSound(button) {
  const data = button.dataset;
  if (data.level) return 'confirm';
  if (data.sale || data.upgrade || 'heal' in data) return 'coin';
  if (data.character || data.special) return 'select';
  if (data.action === 'next-wave' || data.action === 'resume') return 'confirm';
  if (data.action === 'home' || data.action === 'close-menu' || data.action === 'sell-menu-close') return 'select';
  return 'tap';
}

document.addEventListener('click', event => {
  // Browsers only allow audio after a gesture; this is the first one we get.
  audio.unlock();
  const button = event.target.closest('button');
  if (!button || button.disabled) return;
  audio.playSound(UI[clickSound(button)] ?? UI.tap, 'ui');
  const action = button.dataset.action;
  if (narrativeAction(action)) { state.keys.clear(); return; }
  if (activeNarrativeHost().blocked && action !== 'home') return;
  if (button.dataset.character && isCharacterUnlocked(button.dataset.character)) {
    state.selectedCharacter = button.dataset.character;
    characters();
  }
  if (action === 'controls') controls();
  if (action === 'sound') sound();
  if (action === 'toggle-mute') {
    const muted = audio.toggleMuted();
    button.textContent = muted ? 'ACTIVAR SONIDO' : 'SILENCIAR TODO';
    button.setAttribute('aria-pressed', String(muted));
  }
  if (action === 'close-menu') closeMenuOverlay();
  if (['home', 'characters', 'worlds'].includes(action)) show(action);
  if (action === 'story-start') { state.storyPage = 0; show('story'); }
  if (action === 'story-back') { if (state.storyPage > 0) { state.storyPage--; story(); } else show('characters'); }
  if (action === 'story-next') { if (state.storyPage < storyPages.length - 1) { state.storyPage++; story(); } else enterWorld(); }
  if (action === 'play') enterWorld();
  // Dying ends the campaign. OTRA PARTIDA starts a brand-new run in the first
  // world, with the character the player picked and nothing else carried over.
  if (action === 'restart-campaign') {
    state.selectedAct = PLAYABLE_ACTS[0].id;
    state.pendingRun = null;
    enterWorld();
  }
  // The lab seeds the run itself, and a lab run's own overlays come back here:
  // repeat re-seeds the same wave, back reopens the build screen.
  if (action === 'balance-play' || action === 'balance-repeat') playBalanceWave();
  if (action === 'balance-back') show('balance');
  if (action === 'next-act' && state.run?.worldCleared) {
    const next = nextPlayableAct(state.run.act.id, { postgame: postgameOpen() });
    if (next) {
      state.selectedAct = next.id;
      enterWorld(state.run);
    } else {
      // The last world still owes its ending: the outcome panel is the campaign's.
      state.run.phase = 'won';
      state.lastPhase = '';
      overlay();
    }
  }
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
  handleRewardAction(state.run, button.dataset, () => { state.lastPhase = ''; overlay(); updateHUD(); });
});

document.addEventListener('input', event => {
  const slider = event.target?.closest?.('[data-volume]');
  if (!slider) return;
  const bus = slider.dataset.volume;
  const level = audio.setVolume(bus, Number(slider.value) / 100);
  const label = document.querySelector(`[data-volume-label="${bus}"]`);
  if (label && level !== null) label.textContent = `${Math.round(level * 100)}%`;
});

// Both the Alt+Shift+U shortcut and the Konami code open this door. The shortcut
// is for a build being shown off and stays saved; the code is an easter egg for
// whoever plays, so it only lasts the session.
function unlockEverything(unlock = unlockAllForTesting) {
  if (!unlock()) return false;
  state.debugUnlockAll = true;
  for (const id of UNLOCK_CHAIN) state[`${id}Unlocked`] = true;
  state.selectedCharacter = 'negro';
  show('characters');
  return true;
}

// The Konami code, pressed on the menu. The buffer keeps only the last ten keys,
// so any wrong key simply moves the window along instead of needing a reset.
const KONAMI = ['arrowup', 'arrowup', 'arrowdown', 'arrowdown', 'arrowleft', 'arrowright', 'arrowleft', 'arrowright', 'b', 'a'];
let konamiBuffer = [];
function konamiCode(key) {
  konamiBuffer = [...konamiBuffer, key].slice(-KONAMI.length);
  return konamiBuffer.length === KONAMI.length && konamiBuffer.every((pressed, index) => pressed === KONAMI[index]);
}

document.addEventListener('keydown', event => {
  audio.unlock();
  const key = event.key.toLowerCase();
  // A focused slider owns its own keys: during a run the arrows would otherwise
  // move the player instead of the level.
  if (event.target?.tagName === 'INPUT' && key !== 'escape') return;
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
    if (key === 'escape' && document.querySelector('#menu-overlay .overlay')) closeMenuOverlay();
    if (DEV && state.screen === 'home' && event.altKey && event.shiftKey && key === 'u') {
      unlockEverything();
      event.preventDefault();
      return;
    }
    if (state.screen === 'home' && konamiCode(key)) {
      unlockEverything(unlockAllForSession);
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
    audio.playSound(UI.select, 'ui');
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
show(isNarrativeDevelopment() ? 'narrative' : isWorldDevelopment() ? 'worlds'
  : isEnemyDevelopment() ? 'enemies' : isBalanceDevelopment() ? 'balance' : 'home');
// ?dev=warp replays the world transfer on the menu, so it can be looked at
// without winning a world first.
if (DEV && ['warp', 'portal'].includes(new URLSearchParams(globalThis.location?.search ?? '').get('dev'))) {
  warpToWorld(state.content, PLAYABLE_ACTS[1]?.id ?? state.selectedAct);
}
requestAnimationFrame(frame);
