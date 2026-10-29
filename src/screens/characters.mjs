import { ROSTER, getCharacter } from '../characters/index.mjs';
import { isCharacterUnlocked, isDebugUnlockAll, UNLOCK_CHAIN } from '../progression.mjs';
import { rounded } from '../game/renderer.mjs';
import { state } from '../app/state.mjs';
import { PLAYABLE_ACTS, getAct } from '../campaign/acts.mjs';

// Selection screen: roster grid, profile panel and the animated preview.
// Fully data-driven: every card, profile, preview and progress note comes
// from the ficha (src/characters/); adding a character never touches this
// file — it only fills the ROSTER through the registry.
const ROSTER_PLACEHOLDERS = ['Maxi', 'Jhonny', 'Pasasito', 'Tomi'];
const rosterButton = (ficha, unlocked, chosen) => `<button class="roster-card ${chosen ? 'selected' : ''} ${unlocked ? '' : 'locked-card'}" data-character="${ficha.id}" aria-label="${ficha.label}, ${unlocked ? chosen ? 'seleccionado' : 'disponible' : 'bloqueado; ganá el mapa anterior para desbloquearlo'}" ${unlocked ? '' : 'disabled'}>${unlocked ? `<canvas id="roster-${ficha.id}" width="52" height="58" aria-hidden="true"></canvas>` : '<span aria-hidden="true">?</span>'}<small>${ficha.label}</small></button>`;

export function characters() {
  for (const id of UNLOCK_CHAIN) state[`${id}Unlocked`] = isCharacterUnlocked(id);
  state.debugUnlockAll = isDebugUnlockAll();
  // The selected ficha must stay unlocked: a locked selection falls back to
  // the first unlocked card in roster order (always the first one).
  const ficha = ROSTER.find(entry => entry.id === state.selectedCharacter && isCharacterUnlocked(entry.id))
    ?? ROSTER.find(entry => isCharacterUnlocked(entry.id));
  state.selectedCharacter = ficha.id;
  const unlockedCount = ROSTER.filter(entry => isCharacterUnlocked(entry.id)).length;
  // Progress note: the furthest unlocked ficha along the chain owns the shown
  // text; with none unlocked yet, the first chained ficha's locked note shows.
  const rosterNote = state.debugUnlockAll
    ? 'MODO PRUEBA · PERSONAJES IMPLEMENTADOS DESBLOQUEADOS'
    : UNLOCK_CHAIN.reduce(
        (note, id) => isCharacterUnlocked(id) ? getCharacter(id).unlockNote.unlocked : note,
        getCharacter(UNLOCK_CHAIN[0]).unlockNote.locked);
  state.selectedAct = getAct(state.selectedAct).status === 'playable' ? getAct(state.selectedAct).id : PLAYABLE_ACTS[0].id;
  const actOptions = PLAYABLE_ACTS
    .map(act => `<option value="${act.id}"${act.id === state.selectedAct ? ' selected' : ''}>Mundo 0${act.order} · ${act.title}</option>`)
    .join('');
  const roster = ROSTER.map(entry => rosterButton(entry, isCharacterUnlocked(entry.id), entry.id === state.selectedCharacter)).join('')
    + ROSTER_PLACEHOLDERS.map(name => `<div class="roster-card locked-card" aria-label="${name}, no disponible en este prototipo"><span aria-hidden="true">?</span><small>${name}</small></div>`).join('');
  state.content.innerHTML = `
    <section class="screen character-screen">
    <header class="screen-heading"><div><div class="eyebrow">Preparar partida / 01</div><h1>ELEGÍ A TU SOBREVIVIENTE</h1></div><span class="screen-counter">${unlockedCount} / 8 DISPONIBLES</span></header>
    <div class="character-layout"><section aria-label="Personajes">
      <div class="sprite-stage"><canvas id="sprite-preview" width="256" height="190" role="img" aria-label="${ficha.previewAria}"></canvas><span class="stage-label">P1 · SELECCIONADO</span><span class="sprite-name">${ficha.detailLabel.toUpperCase()}</span></div>
      <div class="roster">${roster}</div>
      <label class="act-picker">MUNDO <select id="act-select" aria-label="Mundo">${actOptions}</select></label>
      <p class="roster-note">${rosterNote}</p>
    </section><section class="detail-panel" aria-label="Habilidades de ${ficha.detailLabel}"><div class="detail-body" tabindex="0">${ficha.profile}</div></section></div>
    <div class="bottom-actions"><button class="secondary" data-action="home">← VOLVER</button><button class="primary" data-action="story-start">QUE EMPIECE EL DESASTRE ▶</button></div></section>`;
  for (const entry of ROSTER) {
    const portrait = document.querySelector(`#roster-${entry.id}`);
    if (portrait) entry.drawRoster(portrait.getContext('2d'));
  }
  const actSelect = document.querySelector('#act-select');
  actSelect?.addEventListener?.('change', () => {
    state.selectedAct = actSelect.value;
    actSelect.blur?.();
  });
  drawPreview(0);
}

export function drawPreview(time) {
  const canvas = document.querySelector('#sprite-preview');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#211c2d'; ctx.fillRect(0, 0, 256, 190);
  for (let y = 0; y < 155; y += 16) {
    for (let x = 0; x < 256; x += 24) {
      rounded(ctx, x + 1, y + 1, 22, 14, 0, (x + y) % 5 ? '#292133' : '#2e2538');
    }
  }
  rounded(ctx, 38, 151, 180, 10, 0, '#6a536b');
  rounded(ctx, 44, 161, 168, 5, 0, '#392b42');
  rounded(ctx, 42, 151, 172, 2, 0, '#ad8a99');
  // The selected ficha owns its pose; scenery (floor, bench, wall tiling) is
  // the shared stage the screen draws around it.
  getCharacter(state.selectedCharacter).preview(ctx, { time, cycle: time % 10 });
}
