import { WORLD_SCALE } from '../constants.mjs';
import { resolveEntityStats } from '../stats.mjs';
import { drawJhony } from '../sprites.mjs';

// «TILT» (§4.2): a 0..100 bar. Damage taken and the pressure of the horde fill
// it; at 100 he snaps into Furia for six seconds and the bar restarts from
// zero. Receiving hits feeds it, but standing under the horde must be enough.
const TILT_MAX = 100;
const TILT_PER_DAMAGE = 1.5;
const TILT_PRESSURE = 9;        // points per second with the horde on top
const PRESSURE_RADIUS = 170;    // scaled px around him
const FURY_SECONDS = 6;
const FURY_DAMAGE = 1.4;        // +40% ataque
const FURY_RATE = 0.8;          // +25% velocidad de ataque
const FURY_DEFENSE = 0.7;       // -30% defensa
// «Un traguito más» (§4.3): faster botellazos, faster Tilt.
const DRINK_RATE = 0.75;        // ~+33% frecuencia de botellazos
const DRINK_TILT = 1.6;         // el trago amplifica la acumulación
// «ME VI UNA GUÍA» (§4.4): the broken build, for ten seconds.
const GUIDE_DAMAGE = 1.3;       // +30% ataque
const GUIDE_RATE = 2 / 3;       // +50% velocidad de ataque
const GUIDE_BOUNCES = 3;
const GUIDE_RANGE = 360;        // scaled px: bottles pick their own targets
const GUIDE_CADENCE = 0.45;     // seconds between thrown bottles
// Exclusive upgrades (§5). The catalogue stores the ranks; the rules live here.
const WAVE_RADIUS = 110;        // «¡ERA UN CÍRCULO!» scaled px
const ZONE_SECONDS = 5;         // evolución: the circle stays on the floor
const SHOUT_EVERY = 4;          // «¡CERRÁ EL CULO...!»
const SHOUT_RANGE = 150;
const STOMP_EVERY = 3;          // «2.000 HORAS AL PEDO»
const STOMP_RANGE = 120;
const STOMP_EXECUTE = 0.35;     // only finishes enemies below this share of hp
const BOTTLE_EVERY = 4;         // «UNA BIRRA MÁS» swings between throws
const BOTTLE_RANGE = 300;
const SHARD_COUNT = 1;          // «BOTELLA ROTA»: one shard, more when evolved

// Every ficha-owned hit scales with the same multipliers the engine applies to
// the basic attack, so an ability never lags behind the sheet.
function power(p) {
  return p.damage * (p.fury > 0 ? FURY_DAMAGE : 1) * (p.guide > 0 ? GUIDE_DAMAGE : 1);
}

function pushAway(p, enemy, amount) {
  const gap = Math.hypot(enemy.x - p.x, enemy.y - p.y) || 1;
  enemy.x += (enemy.x - p.x) / gap * amount * WORLD_SCALE;
  enemy.y += (enemy.y - p.y) / gap * amount * WORLD_SCALE;
}

// «¡ERA UN CÍRCULO!»: the wave that goes out when he finally snaps. Its
// evolution leaves the circle on the floor, still burning.
function furyWave(run, p, ctx, rank) {
  const radius = (WAVE_RADIUS + (rank > 1 ? 20 : 0)) * WORLD_SCALE;
  for (const enemy of run.enemies) {
    if (enemy.hp <= 0) continue;
    if (Math.hypot(enemy.x - p.x, enemy.y - p.y) > radius) continue;
    ctx.hit(run, enemy, power(p) * 1.2, 'glass');
    pushAway(p, enemy, 18);
  }
  run.effects.push({ x: p.x, y: p.y, kind: 'tiltWave', r: radius, ttl: 0.5, duration: 0.5 });
  if (rank > 1) {
    run.effects.push({
      x: p.x, y: p.y, kind: 'tiltZone', r: radius * 0.8,
      damage: power(p) * 0.25, ttl: ZONE_SECONDS, duration: ZONE_SECONDS, tick: 0,
    });
  }
}

function gainTilt(run, p, amount, ctx) {
  // Furia cannot be retriggered while it lasts, and the bar stays empty.
  if (p.fury > 0 || amount <= 0) return;
  p.tilt = Math.min(TILT_MAX, p.tilt + amount * (p.drink > 0 ? DRINK_TILT : 1));
  if (p.tilt < TILT_MAX) return;
  p.tilt = 0;
  p.fury = FURY_SECONDS;
  // Exploding is what keeps him standing: the adrenaline of the snap gives back
  // a mouthful of life. Without it a melee body with no sustain cannot finish a
  // single act, and the design still keeps him the glassiest ficha.
  p.hp = Math.min(p.maxHp, p.hp + Math.round(p.maxHp * 0.30));
  run.effects.push({ x: p.x, y: p.y - 74 * WORLD_SCALE, text: '¡ME TIENEN LOS HUEVOS LLENOS!', ttl: 1.4, kind: 'fury' });
  const waves = p.rewardBonuses.tiltWave ?? 0;
  if (waves > 0 && ctx) furyWave(run, p, ctx, waves);
}

// A bottle leaves the hand with its own bounce budget. The ficha builds the
// projectile so the ultimate reads as bottles and not as generic shots.
function throwBottle(run, p, ctx, damage, bounces, blast = false) {
  const target = ctx.nearest(run, p, [], GUIDE_RANGE * WORLD_SCALE);
  if (!target) return false;
  run.projectiles.push({
    x: p.x, y: p.y - 18 * WORLD_SCALE, target: target.id,
    damage, kind: 'bottle', device: 'bottle', hit: [], ttl: 3, angle: 0, pierce: bounces,
    blast: blast ? { radius: 70 * WORLD_SCALE, damage: damage * 0.5 } : undefined,
  });
  p.attackFlash = 0.18;
  return true;
}

// «BOTELLA ROTA»: the botellazo sprays glass past what it hits. The evolution
// sends shards around in every direction instead of only forward.
function glassShards(run, p, enemy, rank) {
  const count = rank > 1 ? 3 : SHARD_COUNT;
  const origin = rank > 1 ? 0 : Math.atan2(enemy.y - p.y, enemy.x - p.x);
  for (let i = 0; i < count; i++) {
    const angle = origin + (rank > 1 ? i * Math.PI * 2 / count : (i - (count - 1) / 2) * 0.5);
    const speed = 300 * WORLD_SCALE;
    run.projectiles.push({
      x: enemy.x, y: enemy.y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
      damage: power(p) * 0.35, kind: 'shard', device: 'shard', hit: [], ttl: 1.4,
      angle, radius: 4 * WORLD_SCALE,
    });
  }
}

// «¡CERRÁ EL CULO, SI NI LO JUGASTE!»: a shout that hurts everything he is
// looking at. Evolved, it is a 360-degree ring instead of a cone.
function shoutBlast(run, p, ctx, rank) {
  const front = Math.hypot(p.lastMoveX, p.lastMoveY) > 0
    ? { x: p.lastMoveX, y: p.lastMoveY } : { x: 1, y: 0 };
  const reach = SHOUT_RANGE * WORLD_SCALE;
  let hitAny = false;
  for (const enemy of run.enemies) {
    if (enemy.hp <= 0) continue;
    const dx = enemy.x - p.x, dy = enemy.y - p.y;
    const gap = Math.hypot(dx, dy) || 1;
    if (gap > reach) continue;
    const facing = (dx / gap) * front.x + (dy / gap) * front.y;
    if (rank < 2 && facing < 0.2) continue;
    ctx.hit(run, enemy, power(p) * 0.8, 'shout');
    hitAny = true;
  }
  if (hitAny) {
    run.effects.push({ x: p.x, y: p.y - 64 * WORLD_SCALE, text: '¡CERRÁ EL CULO!', ttl: 0.9, kind: 'shout' });
    run.effects.push({ x: p.x, y: p.y, kind: 'shoutWave', r: reach, ttl: 0.4, duration: 0.4 });
  }
}

// «2.000 HORAS AL PEDO»: every few seconds he finishes a weakened enemy.
// Evolved, the stomp also shakes everyone standing next to it.
function stompFinisher(run, p, ctx, rank) {
  const reach = STOMP_RANGE * WORLD_SCALE;
  const weak = run.enemies
    .filter(enemy => enemy.hp > 0 && enemy.hp <= enemy.maxHp * STOMP_EXECUTE
      && Math.hypot(enemy.x - p.x, enemy.y - p.y) <= reach)
    .sort((a, b) => a.hp - b.hp)[0];
  if (!weak) return false;
  ctx.hit(run, weak, power(p) * 1.8, 'stomp');
  if (rank > 1) {
    for (const other of run.enemies) {
      if (other === weak || other.hp <= 0) continue;
      if (Math.hypot(other.x - weak.x, other.y - weak.y) > 90 * WORLD_SCALE) continue;
      ctx.hit(run, other, power(p) * 0.6, 'stomp');
    }
    run.effects.push({ x: weak.x, y: weak.y, kind: 'stompWave', r: 90 * WORLD_SCALE, ttl: 0.4, duration: 0.4 });
  }
  return true;
}

const jhony = {
  id: 'jhony',
  name: 'JHONY',
  gameNote: 'METALERO TRYHARD · TILT Y BOTELLAZOS · SE DESBLOQUEA AL CONOCERLO EN EL ACTO 1',
  // Meeting him in Project Zomboid is what makes him selectable. The act keeps
  // him out of the group; the roster only borrows the ficha.
  unlock: { flag: 'jhonyUnlocked', scene: 'act-01-jhony' },
  label: 'Jhony',
  detailLabel: 'Jhony',
  previewAria: 'Pixel art de Jhony: campera de cuero negra, pelo largo, anteojos, barba y una botella de cerveza en la mano',
  profile: `
      <div class="eyebrow">Berserker de botella · Dificultad media-alta</div><h2>JHONY</h2>
      <p class="character-desc">Metalero, dos mil horas de Project Zomboid y cero paciencia. Empieza jugando tranquilo, toma algo y jode con los demás; basta una provocación para que empiece a putear a todo el servidor. Jura que no vuelve al LoL, pero cuando está tomado es él quien propone una partida.</p>
      <p class="character-quote">«Estoy jugando tranquilo. No rompan las pelotas».</p>
      <div class="stats jhony-stats"><div><b>110</b><small>VIDA</small></div><div><b>80</b><small>DAÑO</small></div><div><b class="penalty">−10%</b><small>DEFENSA</small></div><div><b class="penalty">−15%</b><small>ALCANCE</small></div><div><b>+5%</b><small>ATK/SEG</small></div></div>
      <div class="skill"><kbd>∞</kbd><div><b>BOTELLAZO</b><p>Golpea con la botella de cerveza al enemigo más cercano. Corto y fuerte: hay que acercarse. La botella no se gasta, no hay inventario.</p></div></div>
      <div class="skill"><kbd>◈</kbd><div><b>TILT</b><p>Barra de 0 a 100. La llena el daño recibido y la presión de la horda. Al llegar a 100 entra en Furia durante 6 segundos: +40% de ataque, +25% de velocidad de ataque y −30% de defensa. Después la barra arranca de cero.</p></div></div>
      <div class="skill"><kbd>Q</kbd><div><b>UN TRAGUITO MÁS</b><p>Saca el whisky: +33% de frecuencia de botellazos y la acumulación de Tilt sube la mitad durante 6 segundos. Recarga: 16 segundos.</p></div></div>
      <div class="skill"><kbd>E</kbd><div><b>ME VI UNA GUÍA</b><p>Revisa la build más rota que encontró en internet y durante 10 segundos suma +30% de ataque y +50% de velocidad de ataque, además de tirar botellas que rebotan hasta 3 enemigos. Recarga: 30 segundos.</p></div></div>`,
  unlockNote: {
    locked: 'JHONY · BLOQUEADO · ENCUENTRO DEL ACTO 1',
    unlocked: 'JHONY DESBLOQUEADO · DISPONIBLE PARA JUGAR',
  },
  deathLine: 'DESINSTALO ESTA MIERDA.',
  rosterPose: { x: 24, y: 47 },
  drawRoster(ctx) { drawJhony(ctx, this.rosterPose.x, this.rosterPose.y, { bottle: true, scale: 1 }); },
  preview(ctx, { time, cycle }) {
    const attacking = cycle > 7 && cycle < 8.2;
    drawJhony(ctx, 128, 150, { time, moving: cycle < 3.4, attacking, bottle: true, scale: 2, facing: 1 });
  },
  draw(ctx, x, y, context) {
    drawJhony(ctx, x, y, {
      time: context.time, moving: context.moving, facing: context.facing, scale: 2, bottle: true,
      attacking: context.player.attackFlash > 0,
      tilt: context.player.fury > 0 ? 1 : (context.player.tilt ?? 0) / TILT_MAX,
    });
  },
  // Stat sheet (§3): percentages over BASE_STATS. Vida +10%, Defensa −10%,
  // Distancia de ataque −15%, Velocidad de ataque +5% and normal movement.
  // Attack is the one value that departs from the doc's literal "+15%": 115% is
  // less than a quarter of the melee reference (Solago's 520%) and the balance
  // bot dies on the first wave with it. The sheet charges him like the berserker
  // the design asks for — a heavy bottle every ~0.95 s — and the run still sits
  // at the roster's average survival.
  stats: {
    hitRadius: 16 * WORLD_SCALE,
    ...resolveEntityStats({
      life: 110,
      defense: 90,
      attack: 800,
      attackSpeed: 105,
      attackDistance: 85,
      moveSpeed: 3300,
    }),
  },
  attack: { type: 'melee' },
  // «Botellazo» (§4.1): short and heavy. The hit reads as glass and pushes a
  // little, so standing still in the horde is not a strategy.
  combat: { hitText: '✦', hitKind: 'glass', knockback: 10 },
  decays: ['fury'],
  passives: [],
  specials: [
    {
      key: 'drink', name: 'Un traguito más', hotkey: 'q', duration: 6, cooldown: 16,
      buff: `+${Math.round((1 / DRINK_RATE - 1) * 100)}% cadencia · llena el tilt más rápido`,
      onStart(run, p) {
        run.effects.push({ x: p.x, y: p.y - 70 * WORLD_SCALE, text: '«Bueno, un traguito más»', ttl: 1.2, kind: 'drink' });
      },
    },
    {
      key: 'guide', name: 'Me vi una guía', hotkey: 'e', duration: 10, cooldown: 30,
      buff: `+${Math.round((1 / GUIDE_RATE - 1) * 100)}% cadencia · ${GUIDE_BOUNCES} rebotes`,
      onStart(run, p) {
        run.guideIn = 0;
        run.effects.push({ x: p.x, y: p.y - 70 * WORLD_SCALE, text: '«Pará, que vi una guía»', ttl: 1.2, kind: 'guide' });
      },
      onTick(run, p, dt, ctx) {
        run.guideIn = (run.guideIn ?? 0) - dt;
        if (run.guideIn > 0) return;
        // «LA BUILD ESTÁ ROTÍSIMA» makes the secondary volley faster; its
        // evolution adds a bounce on top of the base three.
        const combo = p.rewardBonuses.buildCombo ?? 0;
        run.guideIn = GUIDE_CADENCE * (combo > 0 ? 0.6 : 1);
        throwBottle(run, p, ctx, power(p), GUIDE_BOUNCES + (combo > 1 ? 1 : 0));
      },
      onExpire(run, p) {
        run.effects.push({ x: p.x, y: p.y - 70 * WORLD_SCALE, text: '«La nerfearon. Antes pegaba más»', ttl: 1.4, kind: 'guide' });
      },
    },
  ],
  initPlayer(p) {
    p.tilt = 0;
    p.fury = 0;
    p.shoutIn = SHOUT_EVERY;
    p.stompIn = STOMP_EVERY;
    p.bottleSwings = 0;
  },
  // The tilt bar and its Furia window are the character's readout.
  taskHudTitle: 'TILT',
  taskHud(p) {
    return {
      percentage: p.fury > 0 ? 100 : p.tilt / TILT_MAX * 100,
      label: p.fury > 0 ? `¡TILT! · ${Math.ceil(p.fury)}s` : `${Math.floor(p.tilt)}/100`,
      active: p.fury > 0,
    };
  },
  // Every frame: the horde on top of him pushes the bar without a single hit,
  // and the exclusive upgrades run on their own cadence.
  onTick(run, p, dt, ctx) {
    for (const effect of run.effects) {
      if (effect.kind !== 'tiltZone') continue;
      effect.tick -= dt;
      if (effect.tick > 0) continue;
      effect.tick = 0.4;
      for (const enemy of run.enemies) {
        if (enemy.hp <= 0) continue;
        if (Math.hypot(enemy.x - effect.x, enemy.y - effect.y) > effect.r) continue;
        ctx.hit(run, enemy, effect.damage, 'glass');
      }
    }
    if (p.fury <= 0) {
      const horde = run.enemies.some(enemy => enemy.hp > 0
        && Math.hypot(enemy.x - p.x, enemy.y - p.y) <= PRESSURE_RADIUS * WORLD_SCALE);
      if (horde) gainTilt(run, p, TILT_PRESSURE * dt, ctx);
    }
    if ((p.rewardBonuses.shout ?? 0) > 0) {
      p.shoutIn -= dt;
      if (p.shoutIn <= 0) {
        p.shoutIn = SHOUT_EVERY * (p.fury > 0 ? 0.7 : 1);
        shoutBlast(run, p, ctx, p.rewardBonuses.shout);
      }
    }
    if ((p.rewardBonuses.stomp ?? 0) > 0) {
      p.stompIn -= dt;
      if (p.stompIn <= 0) {
        p.stompIn = STOMP_EVERY;
        stompFinisher(run, p, ctx, p.rewardBonuses.stomp);
      }
    }
  },
  // Every hit that lands on him feeds the bar.
  onDamaged(run, p, incoming, ctx) {
    gainTilt(run, p, incoming * TILT_PER_DAMAGE, ctx);
  },
  // The botellazo's follow-ups: glass past the target and, every few swings,
  // one more bottle thrown at whoever is nearby.
  onMeleeHit(run, p, enemy, ctx) {
    if ((p.rewardBonuses.bottleShards ?? 0) > 0) glassShards(run, p, enemy, p.rewardBonuses.bottleShards);
    const extra = p.rewardBonuses.extraBottle ?? 0;
    if (extra > 0) {
      p.bottleSwings += 1;
      if (p.bottleSwings >= BOTTLE_EVERY) {
        p.bottleSwings = 0;
        for (let i = 0; i < (extra > 1 ? 2 : 1); i++) {
          throwBottle(run, p, ctx, power(p) * 0.8, 0, true);
        }
      }
    }
  },
  // The buff list names what the three multipliers are doing while they last;
  // the numbers come from the same constants they apply, so the HUD cannot drift.
  buffs(p) {
    if (!(p.fury > 0)) return [];
    const damage = Math.round((FURY_DAMAGE - 1) * 100);
    const cadence = Math.round((1 / FURY_RATE - 1) * 100);
    const defense = Math.round((1 - FURY_DEFENSE) * 100);
    return [{
      id: 'fury', name: 'FURIA', seconds: p.fury,
      detail: `+${damage}% DAÑO · +${cadence}% CADENCIA · −${defense}% DEFENSA`,
    }];
  },
  // Furia owns the multipliers; the whisky and the guide stack on top of them.
  passiveDamageMult(p) {
    return (p.fury > 0 ? FURY_DAMAGE : 1) * (p.guide > 0 ? GUIDE_DAMAGE : 1);
  },
  passiveRateMult(p) {
    return (p.fury > 0 ? FURY_RATE : 1) * (p.drink > 0 ? DRINK_RATE : 1) * (p.guide > 0 ? GUIDE_RATE : 1);
  },
  passiveDefenseMult(p) {
    return p.fury > 0 ? FURY_DEFENSE : 1;
  },
};

export default jhony;
