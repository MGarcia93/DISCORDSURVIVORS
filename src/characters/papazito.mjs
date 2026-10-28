import { WORLD_SCALE } from '../constants.mjs';
import { resolveEntityStats } from '../stats.mjs';
import { drawPapazito } from '../sprites.mjs';

// Papazito — El Paraguayo Trucho. Stat sheet: percentual values over
// BASE_STATS (src/stats.mjs) per context/personajes/papazito_el_paraguayo_trucho.md §3
// and the playtesting balance so far: life 110, ranged damage 11.5 (+15%),
// attack speed 90 (0.9 bricks/s, interval ~1.11s), attackDistance 150 (165px,
// charged proposal: the sheet has no reach value), defense 110 (11 points,
// 55% mitigation), moveSpeed 2970 (148.5 scaled px/s, -10%).
const papazito = {
  id: 'papazito',
  name: 'PAPAZITO',
  gameNote: 'EL PARAGUAYO TRUCHO · LADRILLOS, LA SEÑA Y LIQUIDACIÓN DE PERTENENCIAS',
  // Selection screen metadata: label, profile block and preview pose belong
  // to the ficha; adding a character never touches screens or app again.
  label: 'Papazito',
  detailLabel: 'Papazito',
  previewAria: 'Pixel art de Papazito: remera negra, jean claro con ruedo, zapatillas blancas y la copa en la mano',
  profile: `
      <div class="eyebrow">Atacante a distancia · Economía · Riesgo y recompensa</div><h2>PAPAZITO</h2>
      <p class="character-desc">El paraguayo trucho: no es albañil, no habla guaraní y por «¡ANAMENCUÁ!» sigue sin entender nada. Malvende su Pentium, pega con ladrillos y en cuanto la cariñosa le escribe entra en pánico.</p>
      <p class="character-quote">«No soy albañil, no hablo guaraní y no me devolvieron la seña».</p>
      <div class="stats papazito-stats"><div><b>+10%</b><small>VIDA MÁXIMA</small></div><div><b>+15%</b><small>DAÑO</small></div><div><b class="penalty">−10%</b><small>VELOCIDAD</small></div><div><b class="penalty">−10%</b><small>ATK/SEG</small></div><div><b>+10%</b><small>DEFENSA</small></div></div>
      <div class="skill"><kbd>∞</kbd><div><b>LADRILLAZO</b><p>Arroja ladrillos pesados y lentos: pega duro,pero con cadencia baja que las mejoras aceleran.</p></div></div>
      <div class="skill"><kbd>◈</kbd><div><b>LA SEÑA</b><p>La cariñosa le cobra la extorsión y le recorta monedas: 5 segundos de pánico con +30% de velocidad y +40% de ataque.</p></div></div>
      <div class="skill"><kbd>Q</kbd><div><b>LIQUIDÓ TODO</b><p>Menú de venta que pausa la acción: malvende pertenencias por fichas y daño temporal, a cambio de un debuff. Cada una se vende una vez por partida.</p></div></div>
      <div class="skill"><kbd>R</kbd><div><b>¡ANAMENCUÁ!</b><p>Ataque de furia: lluvia de ladrillos en todas las direcciones durante 5 segundos. Recarga: 40 segundos.</p></div></div>`,
  // Locked text never renders: an unlocked Warrior's note always precedes it.
  unlockNote: {
    locked: '',
    unlocked: 'PAPAZITO DESBLOQUEADO · CADENA DE MAPAS COMPLETADA',
  },
  victoryLine: '¡Papazito desbloqueado! Vino por la seña, se queda por los ladrillos.',
  rosterPose: { x: 26, y: 46 },
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
      attack: 115,           // 11.5 damage per brick (+15% daño a distancia)
      attackSpeed: 90,       // 0.9 bricks/s: the slow heavy cadence of §4.1
      attackDistance: 150,   // 165px reach proposal: ladrillos a media cancha
      moveSpeed: 2970,       // -10% mobility
    }),
  },
  // Ladrillazo: one heavy brick per shot; balance knobs stay here.
  // Ladrillazo: one heavy brick per shot; balance knobs stay here.
  attack: { type: 'ranged', device: 'brick' },
  decays: ['panicTtl', 'sellDamageTtl', 'sellMoveSlowTtl', 'sellAtkSlowTtl', 'sellDefLossTtl', 'sellVisionTtl'],
  // Pasiva «La seña» (ficha §4.2). Coins only stream through the kill bounty
  // and the survival bonus, so the tax hooks def.onCoinsGained. Ficha rules:
  // a 25s cooldown, keep a small cut (10% of current coins, capped at 15),
  // only when there is something to lose; the 5s panic adds +30% movement and
  // +40% attack speed, NEVER direct damage.
  passives: [{ key: 'sena', kind: 'sena' }],
  senaCooldownSeconds: 25,
  onCoinsGained(run, p, _amount) {
    const cut = Math.min(15, Math.round(run.coins * 0.1));
    const cooldown = p.senaCooldown ?? 0;
    if (cooldown > 0 || cut < 1) return;
    run.coins -= cut;
    p.senaCooldown = this.senaCooldownSeconds;
    p.panicTtl = 5; // ¡ME RE CAGARON!
    run.effects.push({ x: p.x, y: p.y - 60 * WORLD_SCALE, text: '📱 ¡ME ESCRIBIÓ!', ttl: 1.4, kind: 'panic' });
    run.effects.push({ x: p.x, y: p.y - 78 * WORLD_SCALE, text: '¡ME RE CAGARON!', ttl: 1.6, kind: 'panic' });
    run.effects.push({ x: p.x, y: p.y - 96 * WORLD_SCALE, text: '¡LA CONCHA DE TU MADRE, ME ESTAFARON!', ttl: 1.8, kind: 'panic' });
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
    // Definitiva «¡ANAMENCUÁ!» (ficha §4.4): a fury brick rain from every
    // direction. Spawn sources ride a rotating circle around him; each brick
    // homes on its nearest target. Numbers are ficha-adjustable for balance.
    key: 'anamencua', name: '¡ANAMENCUÁ!', hotkey: 'r', duration: 5, cooldown: 40,
    spawnRadius: 70 * WORLD_SCALE, tickIn: 0.25, damageMult: 1,
    onStart(run, p) {
      run.effects.push({ x: p.x, y: p.y - 84 * WORLD_SCALE, text: '¡ANAMENCUÁ!', ttl: 1.3, kind: 'panic' });
    },
    onTick(run, p, dt, ctx) {
      const door = run.anamencuaIn - dt;
      run.anamencuaIn = 0;
      if (door > 0) { run.anamencuaIn = door; return; }
      run.anamencuaIn = this.tickIn;
      const angle = (run.elapsed * 2.6 + run.projectiles.length * 1.7) % (Math.PI * 2);
      const saleBonus = p.sellDamageTtl > 0 ? 1 + (p.sellDamageFrac ?? 0) : 1;
      ctx.fire(run, { x: p.x + Math.cos(angle) * this.spawnRadius, y: p.y + Math.sin(angle) * this.spawnRadius },
        p.damage * this.damageMult * saleBonus, 'brick');
    },
  }],
};

export default papazito;
