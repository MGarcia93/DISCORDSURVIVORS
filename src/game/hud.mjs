import { state } from '../app/state.mjs';
import { nextLevelXP } from '../run-rewards.mjs';
import { activeBuffs } from './buffs.mjs';

// Heads-up display: DOM reads/writes of the shared run state. No canvas
// rendering lives here — the renderer owns every draw call.
export const formatTime = seconds => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`;

const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// The buff list is rebuilt only when what it says changes: the frame loop asks
// for the HUD many times a second and rewriting the same markup churns the DOM.
let lastBuffs = null;
let lastBuffPanel = null;

function renderBuffs(p) {
  const panel = document.querySelector('#buff-panel');
  if (!panel) return;
  const buffs = activeBuffs(p, state.run);
  const signature = buffs.map(buff => `${buff.id}:${Math.ceil(buff.seconds ?? 0)}:${buff.detail ?? ''}`).join('|');
  if (panel === lastBuffPanel && signature === lastBuffs) return;
  lastBuffPanel = panel;
  lastBuffs = signature;
  panel.hidden = buffs.length === 0;
  panel.innerHTML = buffs.length === 0 ? '' : buffs.map(buff => `<span><b>${escape(buff.name)}</b>${buff.seconds > 0 ? `<i>${Math.ceil(buff.seconds)}s</i>` : ''}${buff.detail ? `<em>${escape(buff.detail)}</em>` : ''}</span>`).join('');
}

export function updateHUD() {
  const p = state.run.player;
  document.querySelector('#player-name').textContent = p.characterDef.name;
  document.querySelector('#hp-label').textContent = `${Math.ceil(p.hp)}/${p.maxHp}`;
  document.querySelector('#hp-fill').style.width = `${p.hp / p.maxHp * 100}%`;
  document.querySelector('#coins').textContent = `◈ ${state.run.coins}`;
  const level = document.querySelector('#level');
  const needed = nextLevelXP(state.run);
  // The pending count is part of this line, so keep the number glued to its word
  // with a non-breaking space: if the line has to wrap, "(3 PENDIENTES)" moves
  // whole instead of leaving a dangling number or separator.
  const pending = state.run.pendingLevels.length;
  const pendingLabel = pending ? ` (${pending}\u00A0${pending === 1 ? 'PENDIENTE' : 'PENDIENTES'})` : '';
  if (level) level.textContent = `NIVEL ${state.run.level} · XP ${state.run.xp}/${needed}${pendingLabel}`;
  const xpFill = document.querySelector('#xp-fill');
  if (xpFill) xpFill.style.width = `${Math.min(100, state.run.xp / needed * 100)}%`;
  const { boss } = state.run.act;
  const onBoss = state.run.wave === boss.wave;
  document.querySelector('#timer').textContent = onBoss ? `☠ JEFE · ${formatTime(state.run.time)}` : formatTime(Math.max(0, state.run.duration - state.run.time));
  document.querySelector('#wave-title').innerHTML = `${onBoss ? boss.name : `OLEADA 0${state.run.wave}`} <span class="muted">/ 0${boss.wave}</span>`;
  const taskPanel = document.querySelector('#task-panel');
  const task = p.characterDef.taskHud?.(p);
  if (taskPanel && task) {
    document.querySelector('#task-fill').style.width = `${task.percentage}%`;
    document.querySelector('#task-label').textContent = task.label;
    taskPanel.classList.toggle('boost-active', task.active);
  }
  const statusPanel = document.querySelector('#character-status');
  if (statusPanel) statusPanel.textContent = p.characterDef.statusHud?.(p) ?? '';
  renderBuffs(p);
  for (const special of p.characterDef.specials) {
    const button = document.querySelector(`[data-special="${special.key}"]`);
    const cooldown = p[`${special.key}Cooldown`];
    button.disabled = cooldown > 0 || state.paused || state.sellMenuOpen || state.run.phase !== 'playing';
    button.querySelector('span').textContent = cooldown > 0 ? `${Math.ceil(cooldown)}s`
      : (p.characterDef.specialHudLabel?.(special, p) ?? special.name);
  }
}
