import { AudioEngine } from './engine.mjs';

// The shell and the narrative host share one engine, so there is one context,
// one master and one place where the bed can be ducked.
export const audio = new AudioEngine();
