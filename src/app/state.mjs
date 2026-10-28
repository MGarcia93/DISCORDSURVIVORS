import { isCharacterUnlocked, isDebugUnlockAll } from '../progression.mjs';

// Shared mutable shell state: screens, HUD, overlays and the game loop all
// read/write this one object, so app.mjs can split into modules without
// hidden cross-module bindings. Anything here belongs to the app shell, not
// to a character ficha or to the character-agnostic engine.
export const state = {
  content: document.querySelector('#content'),
  keys: new Set(),
  screen: 'home',
  storyPage: 0,
  run: null,
  paused: false,
  sellMenuOpen: false,
  lastFrame: 0,
  lastPhase: '',
  hudElapsed: 0,
  facing: 1,
  selectedCharacter: 'negro',
  solagoUnlocked: isCharacterUnlocked('solago'),
  warriorUnlocked: isCharacterUnlocked('warrior'),
  papazitoUnlocked: isCharacterUnlocked('papazito'),
  debugUnlockAll: isDebugUnlockAll(),
  reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)'),
};
