import { WORLD_SCALE } from '../constants.mjs';
import { resolveEntityStats } from '../stats.mjs';
import { drawPapazito } from '../sprites.mjs';

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
  // Unlock contract: this flag in local storage means the character is playable.
  unlock: { flag: 'papazitoUnlocked' },
  // Selection screen metadata: label, profile block and preview pose belong
  // to the ficha; adding a character never touches screens or app again.
  label: 'Papazito',
  detailLabel: 'Papazito',
  previewAria: 'Pixel art de Papazito: remera negra, jean claro con ruedo, zapatillas blancas y un ladrillo enorme en la mano',
  profile: `
      <div class="eyebrow">Atacante a distancia · Economía · Riesgo y recompensa</div><h2>PAPAZITO</h2>
      <p class="character-desc">El paraguayo trucho: no es albañil, no habla guaraní y por «¡ANAMENCUÁ!» sigue sin entender nada. Malvende su Pentium, pega con ladrillos y en cuanto la cariñosa le escribe entra en pánico.</p>
      <p class="character-quote">«No soy albañil, no hablo guaraní y no me devolvieron la seña».</p>
      <div class="stats papazito-stats"><div><b>+10%</b><small>VIDA MÁXIMA</small></div><div><b>+200%</b><small>DAÑO</small></div><div><b class="penalty">−10%</b><small>VELOCIDAD</small></div><div><b class="penalty">−10%</b><small>ATK/SEG</small></div><div><b>+10%</b><small>DEFENSA</small></div></div>
      <div class="skill"><kbd>∞</kbd><div><b>LADRILLAZO</b><p>Arroja ladrillos pesados y lentos: pega duro,pero con cadencia baja que las mejoras aceleran.</p></div></div>
      <div class="skill"><kbd>◈</kbd><div><b>LA SEÑA</b><p>Empieza cobrando 8–12 fichas cada 8–12 segundos. Cada cobro aumenta el siguiente al menos 4 fichas y acorta el intervalo al menos 1 segundo, hasta un mínimo de 4. Si no alcanza, acumula deuda: las ventas la pagan primero. El cobro activa 5 segundos de pánico: +30% de velocidad y −40% de intervalo de tiro. La deuda y la escalada se reinician en cada etapa.</p></div></div>
      <div class="skill"><kbd>Q</kbd><div><b>LIQUIDÓ TODO</b><p>Menú de venta que pausa la acción: malvende pertenencias por fichas y daño temporal, a cambio de un debuff. Cada una se vende una vez por partida.</p></div></div>
      <div class="skill"><kbd>R</kbd><div><b>¡ANAMENCUÁ!</b><p>Dispara tres ondas circulares de 48 ladrillos hacia afuera, una detrás de otra. Recarga: 40 segundos.</p></div></div>`,
  // Locked text never renders: an unlocked Warrior's note always precedes it.
  unlockNote: {
    locked: '',
    unlocked: 'PAPAZITO DESBLOQUEADO · CADENA DE MAPAS COMPLETADA',
  },
  victoryLine: '¡Papazito desbloqueado! Vino por la seña, se queda por los ladrillos.',
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
      attack: 300,           // 30 damage per brick, matching El Negro
      attackSpeed: 90,       // 0.9 bricks/s: the slow heavy cadence of §4.1
      attackDistance: 280,   // 308px reach, slightly longer than El Negro
      moveSpeed: 2970,       // -10% mobility
    }),
  },
  // Ladrillazo: one heavy brick per shot; balance knobs stay here.
  // Ladrillazo: one heavy brick per shot; balance knobs stay here.
  attack: { type: 'ranged', device: 'brick' },
  decays: ['panicTtl', 'sellDamageTtl', 'sellMoveSlowTtl', 'sellAtkSlowTtl', 'sellDefLossTtl', 'sellVisionTtl'],
  // Schedule each bill once so the HUD reveals its exact cost and deadline.
  passives: [{
    key: 'sena', kind: 'sena',
    tick(run, p) {
      if (p.senaCooldown > 1e-9) return;
      const cost = p.senaNextCost;
      const paid = Math.min(run.coins, cost);
      run.coins -= paid;
      p.senaDebt += cost - paid;
      p.senaLastCost = cost;
      p.senaLastPaid = paid;
      p.senaCharges++;
      p.panicTtl = 5;
      run.effects.push({ x: p.x, y: p.y - 60 * WORLD_SCALE,
        text: `LA SEÑA: −${paid} ◈${cost > paid ? ` · DEUDA +${cost - paid} ◈` : ''}`, ttl: 2, kind: 'panic' });
      p.characterDef.scheduleSena(run, p);
    },
  }],
  scheduleSena(run, p) {
    const randomCost = 8 + Math.floor(run.random() * 5) + p.senaCharges * 4;
    const randomInterval = 8 + Math.floor(run.random() * 5) - p.senaCharges;
    p.senaNextCost = p.senaCharges > 0 ? Math.max(p.senaLastCost + 4, randomCost) : randomCost;
    p.senaInterval = Math.max(4, p.senaCharges > 0 ? Math.min(p.senaInterval - 1, randomInterval) : randomInterval);
    p.senaCooldown = p.senaInterval;
  },
  onStageStart(run, p) {
    p.senaCharges = p.senaDebt = p.senaLastCost = p.senaLastPaid = p.panicTtl = 0;
    this.scheduleSena(run, p);
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
    if (p.panicTtl > 0) lines.push(`PÁNICO · ${Math.ceil(p.panicTtl)}s · +30% MOVIMIENTO · −40% INTERVALO`);
    const penalties = [
      ['sellMoveSlowTtl', `−${Math.round((p.sellMoveSlowFrac ?? 0) * 100)}% VELOCIDAD`],
      ['sellAtkSlowTtl', `+${Math.round((p.sellAtkSlowFrac ?? 0) * 100)}% INTERVALO DE TIRO`],
      ['sellDefLossTtl', `−${Math.round((p.sellDefLossFrac ?? 0) * 100)}% DEFENSA`],
      ['sellVisionTtl', 'VISIÓN REDUCIDA'],
    ];
    for (const [key, label] of penalties) if (p[key] > 0) lines.push(`${label} · ${Math.ceil(p[key])}s`);
    return lines.join('\n');
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
    key: 'sell', name: 'Liquidó todo', hotkey: 'q', duration: 0, cooldown: 0,
    items: {
      psp: { label: 'PSP', coins: 20, damageFrac: 0.1, damageTtl: 10, moveSlowFrac: 0.15, moveSlowTtl: 10, quote: 'Vendió la PSP' },
      monitor: { label: 'Monitor', coins: 35, damageFrac: 0.15, damageTtl: 10, visionTtl: 10, quote: 'Vendió el monitor' },
      keyboard: { label: 'Teclado', coins: 25, damageFrac: 0.15, damageTtl: 10, atkSlowFrac: 0.2, atkSlowTtl: 10, quote: 'Vendió el teclado' },
      chair: { label: 'Silla gamer', coins: 30, damageFrac: 0.2, damageTtl: 10, defFrac: 0.15, defTtl: 10, quote: 'Vendió la silla gamer', flavor: 'Con lo que tenía de trono improvisado' },
      pc: { label: 'PC completa', coins: 100, damageFrac: 0.5, damageTtl: 15, moveSlowFrac: 0.3, moveSlowTtl: 15, atkSlowFrac: 0.3, atkSlowTtl: 15, quote: 'Vendió hasta la PC', flavor: 'El Pentium de la casa' },
    },
  }, {
    // Three dense expanding rings, not a continuous homing rain.
    key: 'anamencua', name: '¡ANAMENCUÁ!', hotkey: 'r', duration: 1.2, cooldown: 40,
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
      const saleBonus = p.sellDamageTtl > 0 ? 1 + (p.sellDamageFrac ?? 0) : 1;
      ctx.fireRadial(run, p, p.damage * this.damageMult * saleBonus,
        { count: this.bricksPerBurst, speed: this.speed, radius: this.spawnRadius });
      run.anamencuaBursts++;
      run.anamencuaIn += this.burstInterval;
    },
  }],
};

export default papazito;
