import { WORLD_SCALE } from '../constants.mjs';
import { resolveEntityStats } from '../stats.mjs';
import { drawPapazito } from '../sprites.mjs';

// A sale authors the same signed modifier shape every item and upgrade uses:
// `percent('attack', 10)` is a buff, `percent('moveSpeed', -15)` a penalty. The
// engine resolves them as temporary stat sources, so no sale needs a bespoke
// multiplier or a ceiling of its own.
const percent = (stat, value) => ({ stat, operation: 'percent', value });
// Panel wording for the statistics a sale can move. The ficha owns the labels,
// the way it owns every other name it prints.
const SALE_LABELS = { attack: 'DAÑO', moveSpeed: 'VELOCIDAD', attackSpeed: 'VELOCIDAD DE ATAQUE', defense: 'DEFENSA' };

// Papazito — El Paraguayo Trucho. Stat sheet: percentual values over
// BASE_STATS (src/stats.mjs) per context/personajes/papazito_el_paraguayo_trucho.md §3
// and the playtesting balance so far: life 110, ranged damage 30 (like El Negro),
// attack speed 90 (0.9 bricks/s, interval ~1.11s), attackDistance 280 (308px,
// slightly longer than El Negro's 286px), defense 110 (11 points,
// 55% mitigation), moveSpeed 2970 (148.5 scaled px/s, -10%).
const papazito = {
  id: 'papazito',
  name: 'PAPAZITO',
  gameNote: 'EL PARAGUAYO TRUCHO · LADRILLOS, LA SEÑA Y LIQUIDACIÓN DE PERTENENCIAS',
  // Legacy flags remain valid; the campaign encounter also grants availability.
  unlock: { flag: 'papazitoUnlocked', scene: 'act-03-papasito' },
  // Selection screen metadata: label, profile block and preview pose belong
  // to the ficha; adding a character never touches screens or app again.
  label: 'Papazito',
  detailLabel: 'Papazito',
  previewAria: 'Pixel art de Papazito: chaleco reflectivo naranja sobre remera negra, jean claro con ruedo, zapatillas blancas y un ladrillo enorme en la mano',
  profile: `
      <div class="eyebrow">Atacante a distancia · Economía · Riesgo y recompensa</div><h2>PAPAZITO</h2>
      <p class="character-desc">El paraguayo trucho: no es albañil, no habla guaraní y por «¡ANAMENCUÁ!» sigue sin entender nada. Malvende su Pentium, pega con ladrillos y en cuanto la cariñosa le escribe entra en pánico.</p>
      <p class="character-quote">«No soy albañil, no hablo guaraní y no me devolvieron la seña».</p>
      <div class="stats papazito-stats"><div><b>+10%</b><small>VIDA MÁXIMA</small></div><div><b>+240%</b><small>DAÑO</small></div><div><b class="penalty">−10%</b><small>VELOCIDAD</small></div><div><b class="penalty">−10%</b><small>ATK/SEG</small></div><div><b>+10%</b><small>DEFENSA</small></div></div>
      <div class="skill"><kbd>∞</kbd><div><b>LADRILLAZO</b><p>Arroja ladrillos pesados y lentos: pega duro,pero con cadencia baja que las mejoras aceleran.</p></div></div>
      <div class="skill"><kbd>◈</kbd><div><b>LA SEÑA</b><p>Empieza cobrando 4 fichas cada 8–12 segundos. Cada cobro aumenta el siguiente 1 ficha y acorta el intervalo al menos 1 segundo, hasta un mínimo de 4. Si no alcanza, acumula deuda: las ventas la pagan primero. El cobro activa 5 segundos de pánico: +30% de velocidad y −40% de intervalo de tiro. La deuda y la escalada se reinician en cada etapa.</p></div></div>
      <div class="skill"><kbd>Q</kbd><div><b>¡ANAMENCUÁ!</b><p>Dispara tres ondas circulares de 48 ladrillos hacia afuera, una detrás de otra. Recarga: 25 segundos.</p></div></div>
      <div class="skill"><kbd>E</kbd><div><b>LIQUIDÓ TODO</b><p>Menú de venta que pausa la acción: malvende pertenencias por fichas y daño temporal, a cambio de un debuff. Cada una se vende una vez por partida.</p></div></div>`,
  unlockNote: {
    locked: 'PAPAZITO · BLOQUEADO · ENCUENTRO DEL ACTO 3',
    unlocked: 'PAPAZITO DESBLOQUEADO · DISPONIBLE PARA JUGAR',
  },
  rosterPose: { x: 30, y: 46 },
  drawRoster(ctx) { drawPapazito(ctx, this.rosterPose.x, this.rosterPose.y, { scale: 1 }); },
  preview(ctx, { time, cycle }) { drawPapazito(ctx, 128, 151, { time, moving: cycle < 3.4, scale: 2 }); },
  deathLine: 'VENDIÓ TODO Y NI LA PUSO.',
  draw(ctx, x, y, context) {
    drawPapazito(ctx, x, y, {
      time: context.time, moving: context.moving, facing: context.facing, scale: 2 });
  },
  stats: {
    hitRadius: 18 * WORLD_SCALE, // the bulk frame from the photo: not one of the six stats
    ...resolveEntityStats({
      life: 110,             // +10% vida
      defense: 110,          // 11 points -> 55% mitigation
      attack: 340,           // 34 damage per brick: he pays for the slow cadence with weight
      attackSpeed: 90,       // 0.9 bricks/s: the slow heavy cadence of §4.1
      attackDistance: 280,   // 308px reach, slightly longer than El Negro
      moveSpeed: 2970,       // -10% mobility
    }),
  },
  // Ladrillazo: one heavy brick per shot; balance knobs stay here.
  // Ladrillazo: one heavy brick per shot; balance knobs stay here.
  attack: { type: 'ranged', device: 'brick' },
  // A sale's penalties are temporary stat sources, so the engine's clock only
  // owns the panic window and the monitor's blur. Nothing else needs a timer.
  decays: ['panicTtl', 'sellVisionTtl'],
  // Schedule each bill once so the HUD reveals its exact cost and deadline.
  passives: [{
    key: 'sena', kind: 'sena',
    tick(run, p, dt, ctx) {
      if (p.senaCooldown > 1e-9) return;
      const cost = p.senaNextCost;
      const paid = Math.min(run.coins, cost);
      run.coins -= paid;
      p.senaDebt += cost - paid;
      p.senaLastCost = cost;
      p.senaLastPaid = paid;
      p.senaCharges++;
      p.panicTtl = 5;
      const burst = p.rewardBonuses?.senaBurst ?? 0;
      if (burst > 0) {
        for (const enemy of run.enemies) {
          const away = Math.hypot(enemy.x - p.x, enemy.y - p.y);
          if (enemy.hp > 0 && away < 150 * WORLD_SCALE) ctx.hit(run, enemy, p.damage * burst, 'brick');
        }
        run.effects.push({ x: p.x, y: p.y - 84 * WORLD_SCALE, text: '¡BOMBA DE LA SEÑA!', ttl: 1, kind: 'panic' });
      }
      run.effects.push({ x: p.x, y: p.y - 60 * WORLD_SCALE,
        text: `LA SEÑA: −${paid} ◈${cost > paid ? ` · DEUDA +${cost - paid} ◈` : ''}`, ttl: 2, kind: 'panic' });
      p.characterDef.scheduleSena(run, p);
    },
  }],
  scheduleSena(run, p) {
    // A flat start of four that creeps up by one: a high opening charge left him
    // in debt from the first minute, and a steep ladder kept him there.
    const randomCost = 4 + p.senaCharges;
    const randomInterval = 8 + Math.floor(run.random() * 5) - p.senaCharges;
    p.senaNextCost = p.senaCharges > 0 ? Math.max(p.senaLastCost + 1, randomCost) : randomCost;
    p.senaInterval = Math.max(4, p.senaCharges > 0 ? Math.min(p.senaInterval - 1, randomInterval) : randomInterval);
    p.senaCooldown = p.senaInterval;
  },
  onStageStart(run, p) {
    p.senaCharges = p.senaDebt = p.senaLastCost = p.senaLastPaid = p.panicTtl = 0;
    // A sale's window never crosses a stage boundary, and neither does the blur.
    p.tempSources = {};
    p.tempTtls = {};
    p.sellVisionTtl = 0;
    this.scheduleSena(run, p);
  },
  // Kills during panic keep the panic alive, up to a hard ceiling.
  onKill(run, p, enemy) {
    const extend = p.rewardBonuses?.panicExtend ?? 0;
    if (extend <= 0 || p.panicTtl <= 0) return;
    p.panicTtl = Math.min(12, p.panicTtl + extend);
  },
  // El que vive de la plata cobra más por lo que mata: es su mecánica, no un
  // premio. Sin esto la seña le vacía el bolsillo y llega a la tienda sin poder
  // curarse, que es como está muriendo en el Acto 1.
  goldBonus: 0.5,
  onCoinsGained(run, p, amount) {
    // Half again, carried between kills so a one-coin bounty is not rounded up
    // into a double payout.
    p.goldCarry = (p.goldCarry ?? 0) + amount * this.goldBonus;
    const extra = Math.floor(p.goldCarry);
    if (extra > 0) {
      p.goldCarry -= extra;
      run.coins += extra;
    }
  },
  onSaleIncome(run, p, amount) {
    const paid = Math.min(amount, p.senaDebt);
    run.coins -= paid;
    p.senaDebt -= paid;
    if (paid > 0) run.effects.push({ x: p.x, y: p.y - 84 * WORLD_SCALE,
      text: `VENTA: −${paid} ◈ DE DEUDA`, ttl: 2, kind: 'sale' });
  },
  saleHud(run, item) {
    const paid = Math.min(item.coins, run.player.senaDebt);
    return `${paid} fichas a deuda · ${item.coins - paid} fichas disponibles`;
  },
  taskHudTitle: 'LA SEÑA',
  taskHud(p) {
    const cooldown = Math.max(0, p.senaCooldown ?? 0);
    const active = p.panicTtl > 0;
    return {
      percentage: Math.max(0, Math.min(100, (1 - cooldown / p.senaInterval) * 100)),
      label: `${p.senaNextCost} ◈ · ${Math.ceil(cooldown)}s`,
      active,
    };
  },
  statusHud(p) {
    const lines = [`DEUDA: ${p.senaDebt} ◈`];
    if (p.senaLastCost > 0) lines.push(`ÚLTIMO COBRO: ${p.senaLastCost} ◈ · PAGÓ ${p.senaLastPaid} ◈`);
    return lines.join('\n');
  },
  // Panic and the sale penalties expire on their own, so they are buffs; the
  // status panel keeps the ledger that does not tick down. The penalties are
  // read from the live temporary sources, so the panel prints what the body is
  // really carrying: the sum of every sale still alive, never a stored copy.
  buffs(p) {
    const list = [];
    if (p.panicTtl > 0) {
      list.push({ id: 'panic', name: 'PÁNICO', seconds: p.panicTtl, detail: '+30% MOVIMIENTO · −40% INTERVALO' });
    }
    const totals = {};
    for (const [key, modifiers] of Object.entries(p.tempSources ?? {})) {
      const seconds = p.tempTtls?.[key] ?? 0;
      for (const modifier of modifiers) {
        const entry = totals[modifier.stat] ?? { value: 0, seconds: 0 };
        entry.value += modifier.value;
        entry.seconds = Math.max(entry.seconds, seconds);
        totals[modifier.stat] = entry;
      }
    }
    for (const [stat, entry] of Object.entries(totals)) {
      if (entry.seconds <= 0) continue;
      const sign = entry.value < 0 ? '−' : '+';
      list.push({ id: `sale:${stat}`, name: `${sign}${Math.abs(Math.round(entry.value))}% ${SALE_LABELS[stat] ?? stat}`, seconds: entry.seconds });
    }
    if (p.sellVisionTtl > 0) list.push({ id: 'sellVisionTtl', name: 'VISIÓN REDUCIDA', seconds: p.sellVisionTtl });
    return list;
  },
  passiveSpeedMult: p => (p.panicTtl > 0 ? 1.3 : 1),
  passiveRateMult: p => (p.panicTtl > 0 ? 0.6 : 1),
  // HUD relabel hook for the merchant special: an emptied chango is visible.
  specialHudLabel(special, p) {
    if (special.key !== 'sell') return special.name;
    const items = special.items ?? {};
    return Object.keys(items).some(key => !p.soldItems?.[key]) ? special.name : 'CHANGO VACÍO';
  },
  // Especial «Liquido todo, me voy de putas» (ficha §4.3): invented inventory,
  // engine-routine sale; the app renders the pause menu from this exact table.
  specials: [{
    key: 'sell', name: 'Liquidó todo', hotkey: 'e', duration: 0, cooldown: 0,
    items: {
      psp: { label: 'PSP', coins: 20, ttl: 10, quote: 'Vendió la PSP',
        modifiers: [percent('attack', 10), percent('moveSpeed', -15)] },
      monitor: { label: 'Monitor', coins: 35, ttl: 10, quote: 'Vendió el monitor', visionTtl: 10,
        modifiers: [percent('attack', 15)] },
      keyboard: { label: 'Teclado', coins: 25, ttl: 10, quote: 'Vendió el teclado',
        modifiers: [percent('attack', 15), percent('attackSpeed', -20)] },
      chair: { label: 'Silla gamer', coins: 30, ttl: 10, quote: 'Vendió la silla gamer', flavor: 'Con lo que tenía de trono improvisado',
        modifiers: [percent('attack', 20), percent('defense', -15)] },
      pc: { label: 'PC completa', coins: 100, ttl: 15, quote: 'Vendió hasta la PC', flavor: 'El Pentium de la casa',
        modifiers: [percent('attack', 50), percent('moveSpeed', -30), percent('attackSpeed', -30)] },
    },
  }, {
    // Three dense expanding rings, not a continuous homing rain.
    key: 'anamencua', name: '¡ANAMENCUÁ!', hotkey: 'q', duration: 1.2, cooldown: 25,
    buff: '3 anillos de ladrillos',
    burstCount: 3, bricksPerBurst: 48, burstInterval: 0.45,
    spawnRadius: 18 * WORLD_SCALE, speed: 280 * WORLD_SCALE, damageMult: 1,
    onStart(run, p) {
      run.anamencuaBursts = 0;
      run.anamencuaIn = 0;
      run.effects.push({ x: p.x, y: p.y - 84 * WORLD_SCALE, text: '¡ANAMENCUÁ!', ttl: 1.3, kind: 'panic' });
    },
    onTick(run, p, dt, ctx) {
      if (run.anamencuaBursts >= this.burstCount) return;
      run.anamencuaIn -= dt;
      if (run.anamencuaIn > 0) return;
      // The sale's damage buff is already in `p.damage` (it is a stat source),
      // so every path that swings uses it: the brick, the ring and the burst.
      ctx.fireRadial(run, p, p.damage * this.damageMult,
        { count: this.bricksPerBurst, speed: this.speed, radius: this.spawnRadius });
      run.anamencuaBursts++;
      run.anamencuaIn += this.burstInterval;
    },
  }],
};

export default papazito;
