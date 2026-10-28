import { state } from '../app/state.mjs';

// Heads-up display: DOM reads/writes of the shared run state. No canvas
// rendering lives here — the renderer owns every draw call.
export const formatTime = seconds => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`;

export function updateHUD() {
  const p = state.run.player;
  document.querySelector('#player-name').textContent = p.characterDef.name;
  document.querySelector('#hp-label').textContent = `${Math.ceil(p.hp)}/${p.maxHp}`;
  document.querySelector('#hp-fill').style.width = `${p.hp / p.maxHp * 100}%`;
  document.querySelector('#coins').textContent = `◈ ${state.run.coins}`;
  document.querySelector('#timer').textContent = state.run.wave === 4 ? `☠ JEFE · ${formatTime(state.run.time)}` : formatTime(Math.max(0, state.run.duration - state.run.time));
  document.querySelector('#wave-title').innerHTML = `${state.run.wave === 4 ? 'EL ADMINISTRADOR' : `OLEADA 0${state.run.wave}`} <span class="muted">/ 04</span>`;
  const taskPanel = document.querySelector('#task-panel');
  const task = p.characterDef.taskHud?.(p);
  if (taskPanel && task) {
    document.querySelector('#task-fill').style.width = `${task.percentage}%`;
    document.querySelector('#task-label').textContent = task.label;
    taskPanel.classList.toggle('boost-active', task.active);
  }
  for (const special of p.characterDef.specials) {
    const button = document.querySelector(`[data-special="${special.key}"]`);
    const cooldown = p[`${special.key}Cooldown`];
    button.disabled = cooldown > 0 || state.paused || state.sellMenuOpen || state.run.phase !== 'playing';
    button.querySelector('span').textContent = cooldown > 0 ? `${Math.ceil(cooldown)}s`
      : (p.characterDef.specialHudLabel?.(special, p) ?? special.name);
  }
}
