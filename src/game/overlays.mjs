import { HEAL_COST, HEAL_AMOUNT, salePrice } from '../engine.mjs';
import { describeReward, STAT_LABELS } from '../reward-catalog.mjs';
import { EFFECTS } from '../reward-data.mjs';
import { state } from '../app/state.mjs';
import { formatTime } from './hud.mjs';
import { rewardEffectTotals, rewardPreviewLines } from './reward-view.mjs';
import { countOf, itemPrice } from '../run-rewards.mjs';
import { drawItemIcon } from './item-icons.mjs';
import { volumeRow, muteRow } from '../audio/controls.mjs';
import { nextPlayableAct } from '../campaign/acts.mjs';
import { postgameOpen } from '../progression.mjs';

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
  // A lab run is a throwaway measurement, not a campaign: its overlays offer
  // repeat and back to the lab, never the next wave of a real run.
  const lab = state.run.lab === true;
  let body = '';
  if (phase === 'paused') body = `<div class="eyebrow">${lab ? 'Laboratorio de balance' : 'Micrófono silenciado'}</div><h2>UN MOMENTO DE PAJA.</h2><p>La horda puede esperar. La partida está pausada.</p>${volumeRow('music', 'Música', 'pause')}${volumeRow('sfx', 'Efectos', 'pause')}${muteRow()}<div class="actions"><button class="primary" data-action="resume">SEGUIR JUGANDO</button>${lab ? '<button class="secondary" data-action="balance-back">VOLVER AL LABORATORIO</button>' : ''}<button class="secondary" data-action="home">SALIR AL INICIO</button></div>`;
  if (phase === 'sellMenu') {
    // Data-driven merchant: every special that carries an items table owns a
    // pause-sale menu; nothing here knows a character id. A belonging can also
    // declare the world it shows up in: the big ticket waits for the big world
    // instead of funding the first shop.
    const stockEntry = state.run.player.characterDef.specials.find(special => special.items);
    const stock = stockEntry?.items ?? {};
    const saleCopy = item => {
      const boost = [`+${salePrice(state.run, item)} fichas`];
      const penalty = [];
      // The card prints the same signed modifiers the engine resolves: a sale is
      // an item with a deadline, so it is described like an item.
      for (const modifier of item.modifiers ?? []) {
        const value = `${modifier.value < 0 ? '−' : '+'}${Math.abs(Math.round(modifier.value))}%`;
        const line = `${STAT_LABELS[modifier.stat]} ${value} (${item.ttl}s)`;
        (modifier.value < 0 ? penalty : boost).push(line);
      }
      if (item.heal) boost.push(`+${item.heal} vida`);
      if (item.visionTtl) penalty.push(`visión borrosa (${item.visionTtl}s)`);
      return { boost: boost.join(' · '), penalty: penalty.join(' · ') };
    };
    const cards = Object.entries(stock).map(([key, item]) => {
      const sold = state.run.player.soldItems?.[key];
      const { boost, penalty } = saleCopy(item);
      const settlement = state.run.player.characterDef.saleHud?.(state.run, { ...item, coins: salePrice(state.run, item) });
      return `<button class="upgrade" data-sale="${key}" ${sold ? 'disabled' : ''}><b>📦 ${item.label}</b><span>${boost}</span><small>${sold ? 'YA LO MALVENDIÓ' : penalty}</small>${!sold && settlement ? `<small>${settlement}</small>` : ''}</button>`;
    }).join('');
    const itemsLeft = Object.keys(stock).some(key => !state.run.player.soldItems?.[key]);
    body = `<div class="eyebrow">Fondo para la cariñosa</div><h2>¿QUÉ SE VENDE HOY?</h2><p>Cada venta paga fichas y daño temporal, con su debuff correspondiente. Se vende <b>una cosa por vez</b> y la habilidad queda en recarga. Cuando liquidás todo, el chango se renueva en la oleada siguiente. <b>«Total, no lo usaba»</b>.</p><p class="shop-hint"><b>${state.run.coins} fichas disponibles</b></p><div class="shop-grid">${cards}</div><div class="shop-footer"><button class="primary" data-action="sell-menu-close">${itemsLeft ? 'VOLVER A TIRAR LADRILLOS' : 'YA NO QUEDA NADA'} →</button></div>`;
  }
  if (phase === 'levelUp') {
    const cards = state.run.levelChoices.map(entry => {
      const rank = countOf(state.run.levelRanks, entry.id);
      const totals = rewardEffectTotals(state.run, `level-preview:${entry.id}`, entry.ranks[rank]);
      const description = describeReward(entry.ranks[rank], EFFECTS, totals).map(escapeText).join(' · ');
      const preview = rewardPreviewLines(state.run, `level-preview:${entry.id}`, entry.ranks[rank]);
      const pips = Array.from({ length: entry.ranks.length },
        (_, index) => `<i class="${index < rank ? 'on' : ''}"></i>`).join('');
      const own = entry.characters !== 'all';
      return `<button class="reward-card level-card ${own ? 'own' : 'common'}" data-level="${escapeText(entry.id)}" ${preview ? '' : 'disabled'}>
        <span class="reward-top"><span class="reward-tag">${own ? 'PROPIA' : 'ESTADÍSTICA'}</span><span class="reward-rank">RANGO ${rank + 1}/${entry.ranks.length}</span></span>
        <b class="reward-name">${escapeText(entry.name)}</b>
        <span class="reward-effect">${description}</span>
        <span class="reward-preview">${preview ? preview.map(escapeText).join('<br>') : 'No compatible con las estadísticas actuales'}</span>
        <span class="reward-pips" aria-hidden="true">${pips}</span>
      </button>`;
    }).join('');
    body = `<div class="eyebrow">Subida de nivel</div><h2>ELEGÍ UNA MEJORA</h2><p class="reward-sub">Nivel ${state.run.pendingLevels[0]} · ${state.run.pendingLevels.length} ${state.run.pendingLevels.length === 1 ? 'elección pendiente' : 'elecciones pendientes'} · no cuestan fichas</p><div class="reward-grid">${cards}</div>${cards ? '<div class="reward-footnote">Elegí una sola opción. Las demás quedan para próximos niveles.</div>' : '<p>No quedan mejoras elegibles.</p><button class="primary" data-action="skip-level">CONTINUAR SIN RECOMPENSA →</button>'}`;
  }
  if (phase === 'shop') {
    const cards = (state.run.shopOffers ?? []).map(offer => {
      const item = state.run.rewardCatalog.items.find(entry => entry.id === offer.id);
      const count = countOf(state.run.items, item.id);
      const preview = offer.bought ? [] : rewardPreviewLines(state.run, `item-preview:${item.id}`, item);
      const price = itemPrice(item, count, state.run.act.order);
      const disabled = offer.bought || count >= item.maxCopies || state.run.coins < price || !preview;
      const description = describeReward(item, EFFECTS).map(escapeText).join(' · ');
      return `<button class="reward-card item-card ${offer.bought ? 'bought' : ''}" data-item="${escapeText(item.id)}" ${disabled ? 'disabled' : ''}>
        <span class="reward-art"><canvas data-art="${escapeText(item.id)}" width="64" height="64" aria-hidden="true"></canvas></span>
        <span class="reward-body">
          <span class="reward-top"><b class="reward-name">${escapeText(item.name)}</b><span class="reward-price">${price} ◈</span></span>
          <span class="reward-effect">${description}</span>
          <span class="reward-preview">${preview ? preview.map(escapeText).join('<br>') : 'No compatible con las estadísticas actuales'}</span>
          <span class="reward-lore">${escapeText(item.lore)}</span>
          <span class="reward-foot"><span class="reward-owned">${count}/${item.maxCopies}</span><span class="reward-state">${offer.bought ? 'COMPRADO' : 'TOCÁ PARA COMPRAR'}</span></span>
        </span>
      </button>`;
    }).join('');
    const full = state.run.player.hp >= state.run.player.maxHp;
    const healDisabled = full || state.run.coins < HEAL_COST;
    // A world boss pays into the same shop as any wave, and its continue button
    // is the trip itself: the next world is announced on arrival, not here.
    const cleared = state.run.worldCleared === true;
    const nextWorld = cleared ? nextPlayableAct(state.run.act.id, { postgame: postgameOpen() }) : null;
    const footer = lab
      ? `<button class="primary" data-action="balance-repeat">REPETIR LA OLEADA →</button><button class="secondary" data-action="balance-back">VOLVER AL LABORATORIO</button>`
      : cleared
        ? `<button class="primary" data-action="next-act">${nextWorld ? (nextWorld.postgame ? 'VOLVER AL DISCORD' : 'SIGUIENTE MUNDO') : 'TERMINAR CAMPAÑA'} →</button>`
        : `<button class="primary" data-action="next-wave">${state.run.wave === state.run.act.boss.wave - 1 ? `ENFRENTAR: ${state.run.act.boss.name}` : 'SIGUIENTE OLEADA'} →</button>`;
    const labHint = lab
      ? '<p class="shop-hint">Laboratorio: lo que compres acá se tira al salir. El build se arma en el laboratorio.</p>'
      : '';
    body = `<div class="eyebrow">${cleared ? `Mundo 0${state.run.act.order} completado` : `Oleada ${state.run.wave} completada`}</div><h2>EL BOTÍN ES TUYO</h2><p class="reward-sub"><b class="wallet">${state.run.coins} ◈</b> disponibles · +${state.run.rewardBalance.gold?.survival ?? 20} por sobrevivir</p>${labHint}<div class="reward-grid">${cards || '<p>No quedan objetos elegibles.</p>'}</div><div class="reward-extras"><button class="upgrade shop-heal" data-heal ${healDisabled ? 'disabled' : ''}><b>✚ DELIVERY DE EMERGENCIA</b><span>Servicio de curación: recuperás ${HEAL_AMOUNT} de vida.</span><small>${full ? 'VIDA COMPLETA' : `${HEAL_COST} ◈`}</small></button></div><div class="shop-footer">${footer}</div>`;
  }
  if (phase === 'dead' || phase === 'won') {
    const next = phase === 'won' ? nextPlayableAct(state.run.act.id, { postgame: postgameOpen() }) : null;
    // The epilogue is not the next world: it is what the second ending finds, so
    // the button says where it takes you.
    const returnsToDiscord = next?.postgame === true;
    // The next world is announced by its arrival card, not by the button.
    const continueButton = next ? `<button class="primary" data-action="next-act">${returnsToDiscord ? 'VOLVER AL DISCORD' : 'SIGUIENTE MUNDO'}</button>` : '';
    // Dying ends the campaign, it does not rewind one world: the run starts over
    // from Mundo 01 with a fresh build. A cleared campaign still replays the
    // last world it ended on.
    const replayAction = phase === 'dead' ? 'restart-campaign' : 'play';
    body = lab
      ? `<div class="eyebrow">Laboratorio de balance</div><h2>${phase === 'won' ? 'OLEADA TERMINADA.' : state.run.player.characterDef.deathLine ?? 'SE TERMINÓ LA PAJA.'}</h2><p>La partida se tira: el build sigue en el laboratorio, así que podés repetir esta oleada o ajustar los items antes de volver.</p><p>${state.run.kills} enemigos · ${formatTime(state.run.elapsed)} de supervivencia · Oleada ${state.run.wave}</p><div class="actions"><button class="primary" data-action="balance-repeat">REPETIR LA OLEADA</button><button class="secondary" data-action="balance-back">VOLVER AL LABORATORIO</button></div>`
      : `<div class="eyebrow">${phase === 'won' ? next && !returnsToDiscord ? 'Mundo completado' : 'Campaña completada' : 'Se desconectó del canal'}</div><h2>${phase === 'won' ? next && !returnsToDiscord ? 'SEGUIMOS CONECTADOS.' : 'EL SERVIDOR ES TUYO.' : state.run.player.characterDef.deathLine ?? 'SE TERMINÓ LA PAJA.'}</h2><p>${phase === 'won' ? (returnsToDiscord ? 'Todavía queda alguien adentro.' : next ? 'Superaste este mundo. La partida continúa.' : 'Derrotaste al Administrador. Ahora falta decidir qué jugar.') : 'Murió haciendo lo que amaba: el mínimo esfuerzo posible. La campaña vuelve a empezar en el Mundo 01.'}</p><p>${state.run.kills} enemigos · ${formatTime(state.run.elapsed)} de supervivencia · Oleada ${state.run.wave}</p><div class="actions">${continueButton}<button class="${next ? 'secondary' : 'primary'}" data-action="${replayAction}">OTRA PARTIDA</button><button class="secondary" data-action="home">VOLVER AL INICIO</button></div>`;
  }
  box.innerHTML = `<div class="overlay" role="dialog" aria-modal="true" aria-label="${phase === 'shop' ? 'Mejoras entre oleadas' : phase === 'levelUp' ? 'Elegir mejora de nivel' : phase === 'paused' ? 'Partida pausada' : 'Resultado de la partida'}"><div class="${phase === 'shop' || phase === 'levelUp' ? 'shop-dialog' : ''}">${body}</div></div>`;
  for (const canvas of box.querySelectorAll?.('canvas[data-art]') ?? []) {
    drawItemIcon(canvas.getContext('2d'), canvas.dataset.art, canvas.width);
  }
  box.querySelector('button:not(:disabled)')?.focus({ preventScroll: true });
}
