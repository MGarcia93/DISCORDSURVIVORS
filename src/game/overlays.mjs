import { UPGRADES, HEAL_COST, HEAL_AMOUNT } from '../engine.mjs';
import { state } from '../app/state.mjs';
import { formatTime } from './hud.mjs';

// Phase dialogs over the arena: pause, merchant sale menu, upgrades shop and
// end-of-run outcomes. Text and actions only; the canvas never comes here.
export function overlay() {
  const box = document.querySelector('#game-overlay');
  if (!box || !state.run) return;
  const phase = state.sellMenuOpen ? 'sellMenu' : state.paused ? 'paused' : state.run.phase;
  if (state.lastPhase === phase) return;
  state.lastPhase = phase;
  if (phase === 'playing') { box.innerHTML = ''; return; }
  let body = '';
  if (phase === 'paused') body = `<div class="eyebrow">Micrófono silenciado</div><h2>UN MOMENTO DE PAJA.</h2><p>La horda puede esperar. La partida está pausada.</p><div class="actions"><button class="primary" data-action="resume">SEGUIR JUGANDO</button><button class="secondary" data-action="home">SALIR AL INICIO</button></div>`;
  if (phase === 'sellMenu') {
    // Data-driven merchant: every special that carries an items table owns a
    // pause-sale menu; nothing here knows a character id.
    const stockEntry = state.run.player.characterDef.specials.find(special => special.items);
    const stock = stockEntry?.items ?? {};
    const saleCopy = item => {
      const boost = [`+${item.coins} fichas`];
      if (item.damageFrac) boost.push(`+${Math.round(item.damageFrac * 100)}% daño ${item.damageTtl}s`);
      const penalty = [];
      if (item.moveSlowFrac) penalty.push(`−${Math.round(item.moveSlowFrac * 100)}% velocidad ${item.moveSlowTtl}s`);
      if (item.atkSlowFrac) penalty.push(`−${Math.round(item.atkSlowFrac * 100)}% cadencia ${item.atkSlowTtl}s`);
      if (item.defFrac) penalty.push(`−${Math.round(item.defFrac * 100)}% defensa ${item.defTtl}s`);
      if (item.visionTtl) penalty.push(`visión borrosa ${item.visionTtl}s`);
      return { boost: boost.join(' · '), penalty: penalty.join(' · ') };
    };
    const cards = Object.entries(stock).map(([key, item]) => {
      const sold = state.run.player.soldItems?.[key];
      const { boost, penalty } = saleCopy(item);
      return `<button class="upgrade" data-sale="${key}" ${sold ? 'disabled' : ''}><b>📦 ${item.label}</b><span>${boost}</span><small>${sold ? 'YA LO MALVENDIÓ' : penalty}</small></button>`;
    }).join('');
    const itemsLeft = Object.keys(stock).some(key => !state.run.player.soldItems?.[key]);
    body = `<div class="eyebrow">Fondo para la cariñosa</div><h2>¿QUÉ SE VENDE HOY?</h2><p>Cada venta paga fichas y daño temporal, con su debuff correspondiente. Todo se vende una vez por partida. <b>«Total, no lo usaba»</b>.</p><p class="shop-hint"><b>${state.run.coins} fichas disponibles</b></p><div class="shop-grid">${cards}</div><div class="shop-footer"><button class="primary" data-action="sell-menu-close">${itemsLeft ? 'VOLVER A TIRAR LADRILLOS' : 'YA NO QUEDA NADA'} →</button></div>`;
  }
  if (phase === 'shop') {
    const cards = UPGRADES.map(u => {
      const level = state.run.upgrades[u.id] || 0;
      const maxed = level >= u.costs.length;
      const cost = maxed ? 0 : u.costs[level];
      const disabled = maxed || state.run.coins < cost;
      return `<button class="upgrade" data-upgrade="${u.id}" ${disabled ? 'disabled' : ''}><b>${u.icon} ${u.name}</b><span>${u.description}</span><small>${maxed ? `NIVEL ${level}/${u.costs.length} · MÁXIMO` : `NIVEL ${level}/${u.costs.length} · ${cost} FICHAS`}</small></button>`;
    }).join('');
    const full = state.run.player.hp >= state.run.player.maxHp;
    const healDisabled = full || state.run.coins < HEAL_COST;
    body = `<div class="eyebrow">Oleada ${state.run.wave} completada</div><h2>SEGUÍS VIVO. INCREÍBLE.</h2><p>Gastá el botín. Las mejoras se acumulan y cada nivel cuesta más.<br><b>${state.run.coins} fichas disponibles</b> · +20 por sobrevivir</p><p class="shop-hint">DESLIZÁ PARA VER TODAS LAS MEJORAS ↓</p><div class="shop-grid">${cards}<button class="upgrade shop-heal" data-heal ${healDisabled ? 'disabled' : ''}><b>✚ DELIVERY DE EMERGENCIA</b><span>Te hacés traer ${HEAL_AMOUNT} de vida ahora mismo.</span><small>${full ? 'VIDA COMPLETA' : `${HEAL_COST} FICHAS`}</small></button></div><div class="shop-footer"><button class="primary" data-action="next-wave">${state.run.wave === 3 ? 'ENFRENTAR AL ADMINISTRADOR' : 'SIGUIENTE OLEADA'} →</button></div>`;
  }
  if (phase === 'dead' || phase === 'won') body = `<div class="eyebrow">${phase === 'won' ? 'Conexión restablecida' : 'Se desconectó del canal'}</div><h2>${phase === 'won' ? 'EL SERVIDOR ES TUYO.' : state.run.player.characterDef.deathLine ?? 'SE TERMINÓ LA PAJA.'}</h2><p>${phase === 'won' ? state.run.unlockedSolago ? '¡Solago desbloqueado! Ya podés elegirlo en la próxima partida.' : state.run.unlockedWarrior ? '¡Warrior desbloqueado! Ya podés elegirlo en la próxima partida.' : state.run.unlockedPapazito ? '¡Papazito desbloqueado! Vino por la seña, se queda por los ladrillos.' : 'Derrotaste al Administrador. Ahora falta decidir qué jugar.' : 'Murió haciendo lo que amaba: el mínimo esfuerzo posible.'}</p><p>${state.run.kills} enemigos · ${formatTime(state.run.elapsed)} de supervivencia · Oleada ${state.run.wave}</p><div class="actions"><button class="primary" data-action="play">OTRA PARTIDA</button><button class="secondary" data-action="home">VOLVER AL INICIO</button></div>`;
  box.innerHTML = `<div class="overlay" role="dialog" aria-modal="true" aria-label="${phase === 'shop' ? 'Mejoras entre oleadas' : phase === 'paused' ? 'Partida pausada' : 'Resultado de la partida'}"><div class="${phase === 'shop' ? 'shop-dialog' : ''}">${body}</div></div>`;
  box.querySelector('button:not(:disabled)')?.focus({ preventScroll: true });
}
