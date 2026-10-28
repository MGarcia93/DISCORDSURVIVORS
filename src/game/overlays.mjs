import { HEAL_COST, HEAL_AMOUNT, salePrice } from '../engine.mjs';
import { describeReward } from '../reward-catalog.mjs';
import { EFFECTS } from '../reward-data.mjs';
import { state } from '../app/state.mjs';
import { formatTime } from './hud.mjs';
import { getCharacter } from '../characters/index.mjs';
import { rewardPreviewLines } from './reward-view.mjs';
import { countOf } from '../run-rewards.mjs';

const escapeText = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

// Phase dialogs over the arena: pause, merchant sale menu, upgrades shop and
// end-of-run outcomes. Text and actions only; the canvas never comes here.
export function overlay() {
  const box = document.querySelector('#game-overlay');
  if (!box || !state.run) return;
  const phase = state.sellMenuOpen ? 'sellMenu' : state.paused ? 'paused'
    : state.run.phase === 'shop' && state.run.pendingLevels?.length ? 'levelUp' : state.run.phase;
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
      const boost = [`+${salePrice(state.run, item)} fichas`];
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
      const settlement = state.run.player.characterDef.saleHud?.(state.run, { ...item, coins: salePrice(state.run, item) });
      return `<button class="upgrade" data-sale="${key}" ${sold ? 'disabled' : ''}><b>📦 ${item.label}</b><span>${boost}</span><small>${sold ? 'YA LO MALVENDIÓ' : penalty}</small>${!sold && settlement ? `<small>${settlement}</small>` : ''}</button>`;
    }).join('');
    const itemsLeft = Object.keys(stock).some(key => !state.run.player.soldItems?.[key]);
    body = `<div class="eyebrow">Fondo para la cariñosa</div><h2>¿QUÉ SE VENDE HOY?</h2><p>Cada venta paga fichas y daño temporal, con su debuff correspondiente. Todo se vende una vez por partida. <b>«Total, no lo usaba»</b>.</p><p class="shop-hint"><b>${state.run.coins} fichas disponibles</b></p><div class="shop-grid">${cards}</div><div class="shop-footer"><button class="primary" data-action="sell-menu-close">${itemsLeft ? 'VOLVER A TIRAR LADRILLOS' : 'YA NO QUEDA NADA'} →</button></div>`;
  }
  if (phase === 'levelUp') {
    const cards = state.run.levelChoices.map(entry => {
      const rank = countOf(state.run.levelRanks, entry.id);
      const description = describeReward(entry.ranks[rank], EFFECTS).map(escapeText).join(' · ');
      const preview = rewardPreviewLines(state.run, `level-preview:${entry.id}`, entry.ranks[rank]);
      return `<button class="upgrade" data-level="${escapeText(entry.id)}" ${preview ? '' : 'disabled'}><b>${escapeText(entry.name)}</b><span>${description}</span><small>${preview?.map(escapeText).join(' · ') ?? 'No compatible con las estadísticas actuales'}</small><small>RANGO ${rank + 1}/${entry.ranks.length}</small></button>`;
    }).join('');
    body = `<div class="eyebrow">Nivel ${state.run.pendingLevels[0]} · ${state.run.pendingLevels.length} elecciones pendientes</div><h2>ELEGÍ UNA MEJORA</h2><p>Las mejoras de nivel no cuestan fichas.</p><div class="shop-grid">${cards}</div>${cards ? '' : '<p>No quedan mejoras elegibles.</p><button class="primary" data-action="skip-level">CONTINUAR SIN RECOMPENSA →</button>'}`;
  }
  if (phase === 'shop') {
    const cards = (state.run.shopOffers ?? []).map(offer => {
      const item = state.run.rewardCatalog.items.find(entry => entry.id === offer.id);
      const count = countOf(state.run.items, item.id);
      const preview = offer.bought ? [] : rewardPreviewLines(state.run, `item-preview:${item.id}`, item);
      const disabled = offer.bought || count >= item.maxCopies || state.run.coins < item.price || !preview;
      const description = describeReward(item, EFFECTS).map(escapeText).join(' · ');
      return `<button class="upgrade" data-item="${escapeText(item.id)}" ${disabled ? 'disabled' : ''}><b>${escapeText(item.name)}</b><span>${description}</span><small>${preview?.map(escapeText).join(' · ') ?? 'No compatible con las estadísticas actuales'}</small><span>${escapeText(item.lore)}</span><small>${offer.bought ? 'COMPRADO' : `${item.price} FICHAS`} · ${count}/${item.maxCopies}</small></button>`;
    }).join('');
    const full = state.run.player.hp >= state.run.player.maxHp;
    const healDisabled = full || state.run.coins < HEAL_COST;
    body = `<div class="eyebrow">Oleada ${state.run.wave} completada</div><h2>ELEGÍ QUÉ COMPRAR</h2><p>Comprá objetos o guardá las fichas para otra oleada.<br><b>${state.run.coins} fichas disponibles</b> · +${state.run.rewardBalance.gold?.survival ?? 20} por sobrevivir</p><div class="shop-grid">${cards || '<p>No quedan objetos elegibles.</p>'}</div><section aria-label="Servicio de curación"><button class="upgrade shop-heal" data-heal ${healDisabled ? 'disabled' : ''}><b>✚ DELIVERY DE EMERGENCIA</b><span>Servicio de curación: recuperás ${HEAL_AMOUNT} de vida.</span><small>${full ? 'VIDA COMPLETA' : `${HEAL_COST} FICHAS`}</small></button></section><div class="shop-footer"><button class="primary" data-action="next-wave">${state.run.wave === 3 ? 'ENFRENTAR AL ADMINISTRADOR' : 'SIGUIENTE OLEADA'} →</button></div>`;
  }
  if (phase === 'dead' || phase === 'won') {
    // The run remembers which ficha's chain step lit up on victory; the ficha
    // itself owns the spoken line, so the outcome never names characters here.
    const victoryFicha = phase === 'won' && state.run.unlocked ? getCharacter(state.run.unlocked) : null;
    body = `<div class="eyebrow">${phase === 'won' ? 'Conexión restablecida' : 'Se desconectó del canal'}</div><h2>${phase === 'won' ? 'EL SERVIDOR ES TUYO.' : state.run.player.characterDef.deathLine ?? 'SE TERMINÓ LA PAJA.'}</h2><p>${phase === 'won' ? victoryFicha?.victoryLine ?? 'Derrotaste al Administrador. Ahora falta decidir qué jugar.' : 'Murió haciendo lo que amaba: el mínimo esfuerzo posible.'}</p><p>${state.run.kills} enemigos · ${formatTime(state.run.elapsed)} de supervivencia · Oleada ${state.run.wave}</p><div class="actions"><button class="primary" data-action="play">OTRA PARTIDA</button><button class="secondary" data-action="home">VOLVER AL INICIO</button></div>`;
  }
  box.innerHTML = `<div class="overlay" role="dialog" aria-modal="true" aria-label="${phase === 'shop' ? 'Mejoras entre oleadas' : phase === 'levelUp' ? 'Elegir mejora de nivel' : phase === 'paused' ? 'Partida pausada' : 'Resultado de la partida'}"><div class="${phase === 'shop' || phase === 'levelUp' ? 'shop-dialog' : ''}">${body}</div></div>`;
  box.querySelector('button:not(:disabled)')?.focus({ preventScroll: true });
}
