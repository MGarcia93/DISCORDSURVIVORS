import { NarrativeHost } from './host.mjs';
import { openViewer } from './viewer.mjs';

export const narrative = new NarrativeHost();
export const isNarrativeDevelopment = () => new URLSearchParams(globalThis.location?.search ?? '').get('dev') === 'narrative';
let viewer = null;

export function leaveNarrative() { viewer?.dispose(); viewer = null; narrative.detach(); }
export function showNarrativeViewer(container) { leaveNarrative(); viewer = openViewer(container); }
export function activeNarrativeHost() { return viewer?.host ?? narrative; }
export function tickNarrativeViewer(dt) { viewer?.tick(dt); }
export function narrativeAction(action) {
  if (viewer) return viewer.action(action);
  if (action === 'narrative-next') narrative.advance();
  else if (action === 'narrative-skip') narrative.skip();
  else return false;
  return true;
}

export function trapNarrativeFocus(event) {
  const host = activeNarrativeHost();
  if (!host.blocked || event.key.toLowerCase() !== 'tab') return;
  const buttons = [...document.querySelectorAll('#narrative-layer button:not(:disabled)')];
  const first = buttons[0], last = buttons.at(-1);
  if (!first) { event.preventDefault(); return; }
  if (!buttons.includes(document.activeElement) || (!event.shiftKey && document.activeElement === last)) { first.focus(); event.preventDefault(); }
  else if (event.shiftKey && document.activeElement === first) { last.focus(); event.preventDefault(); }
}
