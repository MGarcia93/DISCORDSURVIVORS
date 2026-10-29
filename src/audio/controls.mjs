import { audio } from './index.mjs';

// One row per bus. Shared by the home dialog and the pause overlay so the level
// is reachable wherever the player is: the shell listens for `input` once, at
// the document, so a row only has to carry `data-volume`.
export function volumeRow(bus, label, scope = 'menu') {
  const value = Math.round((audio.volumes?.[bus] ?? 1) * 100);
  const id = `vol-${scope}-${bus}`;
  return `<p class="mix-row"><label for="${id}">${label}</label>
    <input id="${id}" type="range" min="0" max="100" step="5" value="${value}"
      data-volume="${bus}" aria-label="${label}">
    <span data-volume-label="${bus}">${value}%</span></p>`;
}
