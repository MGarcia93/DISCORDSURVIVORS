import { audio } from '../audio/index.mjs';
import { SFX } from '../audio/mix.mjs';
import { getAct } from '../campaign/acts.mjs';

// A world change is the Administrator switching servers, so the crossing speaks
// its language: a session closing and a loader that fills. The destination is not
// written on the button that starts the trip; it is announced by the card that
// opens the new world. The veil is opaque from the first frame because the next
// run is already live underneath, and it swallows clicks for its short life.
const LOADER_MS = 1200;
const CARD_MS = 1300;
const FADE_MS = 260;
const REDUCED_LOADER_MS = 120;
const REDUCED_CARD_MS = 600;

export function warpToWorld(content, actId, { reducedMotion = false, document: doc = globalThis.document } = {}) {
  if (!content || typeof content.append !== 'function' || typeof doc?.createElement !== 'function') return null;
  const act = getAct(actId);
  const layer = doc.createElement('div');
  layer.className = 'world-warp';
  layer.setAttribute('aria-hidden', 'true');
  const panel = doc.createElement('div');
  panel.className = 'warp-panel';
  layer.append(panel);
  content.append(layer);
  audio.playSound(SFX.warp, 'warp');

  const element = (tag, className, text) => {
    const node = doc.createElement(tag);
    node.className = className;
    node.textContent = text;
    return node;
  };
  const showLoader = () => {
    panel.className = 'warp-panel warp-loader';
    const track = doc.createElement('div');
    track.className = 'warp-track';
    const fill = doc.createElement('div');
    fill.className = 'warp-fill';
    track.append(fill);
    panel.replaceChildren(
      element('div', 'warp-eyebrow', 'ADMINISTRADOR DEL SERVIDOR'),
      element('h2', 'warp-title', 'Preparando siguiente mundo...'),
      track,
      element('p', 'warp-log', 'Sesión finalizada. Transferiendo integrantes.'),
    );
  };
  const showCard = () => {
    panel.className = 'warp-panel warp-card';
    panel.replaceChildren(
      element('p', 'warp-number', `MUNDO 0${act.order}`),
      element('h2', 'warp-card-title', act.title),
    );
  };
  const later = (ms, action) => {
    const timer = setTimeout(action, ms);
    timer?.unref?.();
    return timer;
  };
  const loaderMs = reducedMotion ? REDUCED_LOADER_MS : LOADER_MS;
  const cardMs = reducedMotion ? REDUCED_CARD_MS : CARD_MS;
  const total = loaderMs + cardMs;
  showLoader();
  later(loaderMs, showCard);
  later(total, () => layer.classList.add('world-warp-out'));
  later(total + FADE_MS, () => layer.remove());
  return layer;
}
