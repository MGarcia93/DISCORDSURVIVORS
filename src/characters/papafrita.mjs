import { WORLD_SCALE } from '../constants.mjs';
import { resolveEntityStats } from '../stats.mjs';
import { drawPapafrita } from '../sprites.mjs';

// «Me falta un ítem» (§4.2): the collection counts DIFFERENT exclusive upgrades,
// never copies. `run.levelRanks` is the run's own record of what was taken, so
// the passive reads the truth instead of a parallel counter.
const EXCLUSIVES = ['and-what-else', 'other-console', 'not-done-yet', 'fishing', 'only-one', 'definitive-edition'];
export function collectionOf(run) {
  return EXCLUSIVES.filter(id => (run.levelRanks?.[id] ?? 0) > 0).length;
}

// Milestones. 2/6 and 4/6 stay active once 6/6 is reached, and echoes never
// chain into more echoes (`echo` shots are terminal).
const PIERCE_MILESTONE = 2;
const SECONDARY_MILESTONE = 4;
const SECONDARY_EVERY = 5;
const ECHO_MILESTONE = 6;
const ECHO_EVERY = 3;

// «Monólogo interminable» (§4.3): a persistent bubble of damage.
const BUBBLE_RADIUS = 120;
const BUBBLE_TICK = 0.5;
const BUBBLE_DAMAGE = 0.45;   // of the sheet's damage, per tick
const BUBBLE_PULL = 26;       // scaled px/s that normals drift toward it

// «AHORA SÍ COMPLETÉ LA BUILD» (§4.4).
const BUILD_DAMAGE = 1.25;
const BUILD_CADENCE = 0.4;
const BUILD_TARGETS = 4;

// «Me salió pesca» (§5.4).
const FISHING_RADIUS = 130;
const FISHING_CROWD = 4;
const FISHING_COOLDOWNS = [0, 9, 7, 5];
const DECOY_SIZES = [0, 3, 4.5, 6];

function power(p) {
  return p.damage * (p.build > 0 ? BUILD_DAMAGE * (1 + 0.1 * (p.collected ?? 0)) : 1);
}

// One voice wave. It points where it was thrown and never tumbles.
function spawnWave(run, p, ctx, { to = null, exclude = [], damage, pierce, width = 10 } = {}) {
  const target = to ?? ctx.nearest(run, p, exclude, p.attackRange);
  if (!target) return false;
  run.projectiles.push({
    x: p.x, y: p.y - 8 * WORLD_SCALE, target: target.id,
    damage, kind: 'voice', device: 'voice', hit: [], ttl: 3,
    angle: Math.atan2(target.y - p.y, target.x - p.x),
    spin: false, pierce, width,
  });
  return true;
}

// The echo travels on its own: same heading, no target, no chaining.
function spawnEcho(run, p, angle, damage, width) {
  const speed = 520 * WORLD_SCALE;
  run.projectiles.push({
    x: p.x, y: p.y - 8 * WORLD_SCALE,
    vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
    damage, kind: 'voice', device: 'voice', hit: [], ttl: 1.6,
    angle, radius: 12 * WORLD_SCALE, width, echo: true,
  });
}

// A zone that hurts on its own cadence and drags ordinary walkers toward it.
function tickBubble(run, p, dt, ctx, bubble) {
  bubble.ttl -= dt;
  bubble.tick -= dt;
  if (bubble.tick <= 0) {
    bubble.tick = BUBBLE_TICK;
    for (const enemy of run.enemies) {
      if (enemy.hp <= 0) continue;
      if (Math.hypot(enemy.x - bubble.x, enemy.y - bubble.y) > bubble.r) continue;
      ctx.hit(run, enemy, power(p) * BUBBLE_DAMAGE, 'voice');
    }
  }
  // "Enemigos normales cercanos pueden dirigirse brevemente hacia la zona": a
  // nudge, never a leash, and bosses ignore it entirely.
  for (const enemy of run.enemies) {
    if (enemy.hp <= 0 || enemy.boss) continue;
    const dx = bubble.x - enemy.x, dy = bubble.y - enemy.y;
    const gap = Math.hypot(dx, dy) || 1;
    if (gap > bubble.r * 2.6 || gap < bubble.r * 0.4) continue;
    enemy.x += dx / gap * BUBBLE_PULL * WORLD_SCALE * dt;
    enemy.y += dy / gap * BUBBLE_PULL * WORLD_SCALE * dt;
  }
  return bubble.ttl > 0;
}

// «El único que me banca» (§5.5): one animal, never a legion.
function tickCompanion(run, p, dt, ctx) {
  const rank = p.rewardBonuses.companion ?? 0;
  if (rank <= 0) { run.companion = null; return; }
  if (!run.companion) run.companion = { biteIn: 1.2 };
  // The animal follows the player at a discrete distance, like a pet.
  run.companion.x = p.x - 34 * WORLD_SCALE;
  run.companion.y = p.y + 14 * WORLD_SCALE;
  run.companion.biteIn -= dt;
  if (run.companion.biteIn > 0) return;
  run.companion.biteIn = 2;
  const first = ctx.nearest(run, p, [], 260 * WORLD_SCALE);
  if (!first) return;
  ctx.hit(run, first, power(p) * 0.55, 'bite');
  run.companion.flash = 0.16;
  if (rank < 2) return;
  const second = ctx.nearest(run, p, [first.id], 260 * WORLD_SCALE);
  if (!second) return;
  ctx.hit(run, second, power(p) * 0.4, 'bite');
  if (rank < 3) return;
  for (const enemy of run.enemies) {
    if (enemy.hp <= 0 || enemy === second) continue;
    if (Math.hypot(enemy.x - second.x, enemy.y - second.y) > 80 * WORLD_SCALE) continue;
    ctx.hit(run, enemy, power(p) * 0.3, 'bite');
  }
  run.effects.push({ x: second.x, y: second.y, kind: 'biteWave', r: 80 * WORLD_SCALE, ttl: 0.35, duration: 0.35 });
}

const papafrita = {
  id: 'papafrita',
  name: 'PAPAFRITA',
  gameNote: 'COLECCIONISTA · ONDAS DE VOZ · SE DESBLOQUEA AL TERMINAR EL ACTO 5',
  // "Condición de acceso: completar Acto 5" and the epilogue script's reward
  // line both point here. The Administrator's monologue is NOT the unlock.
  unlock: { flag: 'papafritaUnlocked', scene: 'act-05-final' },
  label: 'Papafrita',
  detailLabel: 'Papafrita',
  previewAria: 'Pixel art de Papafrita: remera negra, bermuda de jean claro, colita y barba corta, lanzando una onda de voz',
  profile: `
      <div class="eyebrow">Atacante de voz · Coleccionista · Dificultad media-alta</div><h2>PAPAFRITA</h2>
      <p class="character-desc">Habla demasiado. Se mete en Discord, empieza a explicar un juego o una build que nadie le pidió y cuando parece que terminó todavía le quedan veinte minutos. Fanático de los single player y de Monster Hunter, amenaza con irse a jugar solo pero no admite que le gusta jugar con el Negro.</p>
      <p class="character-quote">«Para esto me voy a jugar un single player».</p>
      <div class="stats papafrita-stats"><div><b>90</b><small>VIDA</small></div><div><b>27</b><small>DAÑO</small></div><div><b class="penalty">−15%</b><small>DEFENSA</small></div><div><b>+60%</b><small>ALCANCE</small></div><div><b>+80%</b><small>ATK/SEG</small></div></div>
      <div class="skill"><kbd>∞</kbd><div><b>NO TE CALLÁS MÁS</b><p>Ondas de voz a distancia media que atraviesan a varios enemigos. No sostiene armas: su voz es el ataque.</p></div></div>
      <div class="skill"><kbd>◈</kbd><div><b>ME FALTA UN ÍTEM</b><p>Cuenta los tipos distintos de sus seis mejoras, nunca las copias. Con 2 tipos las ondas atraviesan un enemigo más; con 4, cada 5 ataques sale una onda secundaria; con 6, cada 3 ataques salen dos ecos.</p></div></div>
      <div class="skill"><kbd>Q</kbd><div><b>MONÓLOGO INTERMINABLE</b><p>Un globo enorme sobre una zona: daño periódico y los enemigos normales se acercan a escuchar. Los jefes no pierden el movimiento. Recarga: 18 segundos.</p></div></div>
      <div class="skill"><kbd>E</kbd><div><b>AHORA SÍ COMPLETÉ LA BUILD</b><p>Seis segundos de ondas en varias direcciones, globos extra y sus mejoras potenciadas: escala con lo que juntó, nunca regala lo que no tiene. Recarga: 30 segundos.</p></div></div>`,
  unlockNote: {
    locked: 'PAPAFRITA · BLOQUEADO · TERMINÁ EL ACTO 5',
    unlocked: 'PAPAFRITA DESBLOQUEADO · DISPONIBLE PARA JUGAR',
  },
  deathLine: 'Y... me salió pesca.',
  rosterPose: { x: 25, y: 47 },
  drawRoster(ctx) { drawPapafrita(ctx, this.rosterPose.x, this.rosterPose.y, { scale: 1, talking: true }); },
  preview(ctx, { time, cycle }) {
    const attacking = cycle > 6.6 && cycle < 7.8;
    drawPapafrita(ctx, 128, 150, {
      time, moving: cycle < 3.4, scale: 2, facing: 1, talking: attacking || cycle > 8.4, voice: attacking,
    });
  },
  draw(ctx, x, y, context) {
    const special = (context.player.monologo ?? 0) > 0 || (context.player.build ?? 0) > 0;
    drawPapafrita(ctx, x, y, {
      time: context.time, moving: context.moving, facing: context.facing, scale: 2,
      talking: (context.player.attackFlash ?? 0) > 0 || special,
    });
  },
  // §3 orientation: a little under the average on body, above it on reach and
  // cadence. Percentages over BASE_STATS, tuned with the balance bot.
  stats: {
    hitRadius: 17 * WORLD_SCALE,
    ...resolveEntityStats({
      life: 90,
      defense: 85,
      attack: 270,
      attackSpeed: 240,
      attackDistance: 320,
      moveSpeed: 3300,
    }),
  },
  // «No te callás más»: a voice wave that crosses several bodies.
  attack: { type: 'ranged', device: 'voice', pierce: 2, width: 10, align: true, spin: false },
  ownOfferChance: 0.5,
  combat: {},
  decays: [],
  passives: [],
  specials: [
    {
      key: 'monologo', name: 'Monólogo interminable', hotkey: 'q', duration: 6, cooldown: 18,
      onStart(run, p) {
        run.monologue = { x: p.x, y: p.y, r: BUBBLE_RADIUS * WORLD_SCALE, ttl: p.monologo, tick: 0 };
        run.effects.push({ x: p.x, y: p.y - 78 * WORLD_SCALE, text: '«Y otra cosa...»', ttl: 1.2, kind: 'voice' });
      },
      onTick(run, p, dt, ctx) {
        if (!run.monologue) return;
        // The bubble stays where the talk started; he keeps walking.
        if (!tickBubble(run, p, dt, ctx, run.monologue)) {
          const rank = p.rewardBonuses.bubbleBurst ?? 0;
          if (rank > 0) burstBubble(run, p, ctx, run.monologue, rank);
          run.monologue = null;
        }
      },
    },
    {
      key: 'build', name: 'Ahora sí completé la build', hotkey: 'e', duration: 6, cooldown: 30,
      onStart(run, p) {
        run.buildIn = 0;
        run.buildBubbleIn = 1.2;
        run.effects.push({ x: p.x, y: p.y - 78 * WORLD_SCALE, text: '«Listo, ahora sí puedo pegar»', ttl: 1.4, kind: 'voice' });
      },
      onTick(run, p, dt, ctx) {
        run.buildIn = (run.buildIn ?? 0) - dt;
        if (run.buildIn <= 0) {
          run.buildIn = BUILD_CADENCE;
          const spoken = [];
          for (let index = 0; index < BUILD_TARGETS; index++) {
            const target = ctx.nearest(run, p, spoken, p.attackRange);
            if (!target) break;
            spoken.push(target.id);
            spawnWave(run, p, ctx, { to: target, damage: power(p) * 0.8, pierce: 1, width: 12 });
          }
        }
        // "La habilidad Monólogo interminable genera globos adicionales": the
        // ultimate drops one extra bubble while it lasts.
        run.buildBubbleIn = (run.buildBubbleIn ?? 0) - dt;
        if (run.buildBubbleIn <= 0) {
          run.buildBubbleIn = 2;
          const spot = ctx.nearest(run, p, [], 240 * WORLD_SCALE) ?? p;
          run.monologue = { x: spot.x, y: spot.y, r: BUBBLE_RADIUS * 0.8 * WORLD_SCALE, ttl: 2.6, tick: 0 };
        }
      },
      onExpire(run, p) {
        run.effects.push({ x: p.x, y: p.y - 78 * WORLD_SCALE, text: '«La nerfearon...»', ttl: 1.2, kind: 'voice' });
      },
    },
  ],
  initPlayer(p) {
    p.waves = 0;
    p.echoQueue = [];
    p.fishingIn = 0;
    p.collected = 0;
    p.decoy = 0;
  },
  onStageStart(run, p) {
    // "La colección se reinicia al comenzar cada partida."
    p.collected = collectionOf(run);
    run.companion = null;
    run.monologue = null;
  },
  // Every basic wave that actually left: the collector milestones and the two
  // attack-repeating upgrades count here.
  onShot(run, p, ctx, primary = null) {
    p.waves += 1;
    p.collected = collectionOf(run);
    // "hacia otro enemigo cercano": never the body the main wave is already on.
    const spoken = primary?.target !== undefined ? [primary.target] : [];
    const copies = p.rewardBonuses.copyWave ?? 0;
    if (copies > 0 && p.waves % (7 - copies) === 0) {
      spawnWave(run, p, ctx, { exclude: spoken, damage: power(p) * 0.7, pierce: 1, width: 10 });
    }
    const echoRank = p.rewardBonuses.echo ?? 0;
    if (echoRank > 0 && p.waves % (7 - echoRank) === 0) {
      const target = ctx.nearest(run, p, [], p.attackRange);
      if (target) {
        const angle = Math.atan2(target.y - p.y, target.x - p.x);
        p.echoQueue.push({ at: run.elapsed + 0.35, angle, width: 8 + echoRank * 2 });
      }
    }
    if (p.collected >= ECHO_MILESTONE && p.waves % ECHO_EVERY === 0) {
      spawnWave(run, p, ctx, { exclude: spoken, damage: power(p) * 0.5, pierce: 0, width: 8 });
      spawnWave(run, p, ctx, { exclude: spoken, damage: power(p) * 0.5, pierce: 0, width: 8 });
    } else if (p.collected >= SECONDARY_MILESTONE && p.waves % SECONDARY_EVERY === 0) {
      spawnWave(run, p, ctx, { exclude: spoken, damage: power(p) * 0.6, pierce: 1, width: 10 });
    }
  },
  // «¿Y sabés qué más?»: the wave widens with every listener, and its pierce
  // grows up to the rank's cap.
  onProjectileHit(run, shot) {
    if (shot.echo) return;
    const p = run.player;
    // 2/6: every wave crosses one extra body.
    if (!shot.blessed && collectionOf(run) >= PIERCE_MILESTONE) {
      shot.blessed = true;
      shot.pierce = (shot.pierce ?? 0) + 1;
    }
    const rank = p.rewardBonuses.waveGrowth ?? 0;
    if (rank <= 0) return;
    shot.width = Math.min(12 + rank * 10, (shot.width ?? 10) + 2 + rank * 2);
    // Each listener widens the talk, and up to one extra body per rank gets
    // crossed: level III turns a sentence into a shout.
    if ((shot.grown ?? 0) < rank) {
      shot.grown = (shot.grown ?? 0) + 1;
      shot.pierce = (shot.pierce ?? 0) + 1;
    }
  },
  onTick(run, p, dt, ctx) {
    p.collected = collectionOf(run);
    // The decoy keeps talking for a moment and drags the ordinary walkers.
    if (run.decoy) {
      run.decoy.ttl -= dt;
      for (const enemy of run.enemies) {
        if (enemy.hp <= 0 || enemy.boss) continue;
        const dx = run.decoy.x - enemy.x, dy = run.decoy.y - enemy.y;
        const gap = Math.hypot(dx, dy) || 1;
        if (gap > run.decoy.r || gap < 20 * WORLD_SCALE) continue;
        enemy.x += dx / gap * 40 * WORLD_SCALE * dt;
        enemy.y += dy / gap * 40 * WORLD_SCALE * dt;
      }
      if (run.decoy.ttl <= 0) run.decoy = null;
    }
    // Echoes arrive late, on the heading of the wave that made them.
    if (p.echoQueue?.length) {
      for (const echo of [...p.echoQueue]) {
        if (run.elapsed < echo.at) continue;
        p.echoQueue.splice(p.echoQueue.indexOf(echo), 1);
        spawnEcho(run, p, echo.angle, power(p) * 0.5, echo.width);
      }
    }
    tickCompanion(run, p, dt, ctx);
    // «Me salió pesca»: surrounded, he bails out and leaves the decoy talking.
    const escape = p.rewardBonuses.escape ?? 0;
    p.fishingIn = Math.max(0, p.fishingIn - dt);
    if (escape <= 0) return;
    const crowd = run.enemies.filter(enemy => enemy.hp > 0
      && Math.hypot(enemy.x - p.x, enemy.y - p.y) <= FISHING_RADIUS * WORLD_SCALE).length;
    if (crowd < FISHING_CROWD || p.fishingIn > 0) return;
    p.fishingIn = FISHING_COOLDOWNS[Math.min(3, escape)];
    run.decoy = { x: p.x, y: p.y, r: (BUBBLE_RADIUS + 30) * WORLD_SCALE, ttl: DECOY_SIZES[Math.min(3, escape)] };
    // Blink to the emptiest heading, never into a body.
    let bestSpot = { x: p.x, y: p.y }, bestGap = -1;
    for (let index = 0; index < 8; index++) {
      const angle = index / 8 * Math.PI * 2;
      const x = p.x + Math.cos(angle) * 150 * WORLD_SCALE;
      const y = p.y + Math.sin(angle) * 150 * WORLD_SCALE;
      const gap = Math.min(...run.enemies.map(enemy => Math.hypot(enemy.x - x, enemy.y - y)), Infinity);
      if (gap > bestGap) { bestGap = gap; bestSpot = { x, y }; }
    }
    p.x = bestSpot.x;
    p.y = bestSpot.y;
    p.immune = Math.max(p.immune, 0.4);
    run.effects.push({ x: p.x, y: p.y - 60 * WORLD_SCALE, text: '«Y... me salió pesca»', ttl: 1.2, kind: 'voice' });
    if (escape >= 3) {
      for (const enemy of run.enemies) {
        if (enemy.hp <= 0) continue;
        if (Math.hypot(enemy.x - p.x, enemy.y - p.y) > 110 * WORLD_SCALE) continue;
        ctx.hit(run, enemy, power(p) * 0.8, 'voice');
      }
      run.effects.push({ x: p.x, y: p.y, kind: 'voiceRing', r: 110 * WORLD_SCALE, ttl: 0.4, duration: 0.4 });
    }
  },
  // The decoy's bubble decays on its own clock, even between stages.
  taskHud(p) {
    const total = EXCLUSIVES.length;
    return {
      percentage: (p.collected ?? 0) / total * 100,
      label: p.collected >= total ? '¡COLECCIÓN COMPLETA!' : `${p.collected ?? 0}/${total} tipos`,
      active: p.collected >= total,
    };
  },
  passiveDamageMult(p) {
    return p.build > 0 ? BUILD_DAMAGE : 1;
  },
};

function burstBubble(run, p, ctx, bubble, rank) {
  const radius = (90 + 40 * (rank - 1)) * WORLD_SCALE;
  for (const enemy of run.enemies) {
    if (enemy.hp <= 0) continue;
    if (Math.hypot(enemy.x - bubble.x, enemy.y - bubble.y) > radius) continue;
    ctx.hit(run, enemy, power(p) * (0.6 + 0.3 * rank), 'voice');
  }
  run.effects.push({ x: bubble.x, y: bubble.y, kind: 'voiceRing', r: radius, ttl: 0.45, duration: 0.45 });
  if (rank < 3) return;
  // Nivel III: además de la explosión, un anillo que golpea más lejos.
  const outer = radius * 1.8;
  for (const enemy of run.enemies) {
    if (enemy.hp <= 0) continue;
    const gap = Math.hypot(enemy.x - bubble.x, enemy.y - bubble.y);
    if (gap <= radius || gap > outer) continue;
    ctx.hit(run, enemy, power(p) * 0.6, 'voice');
  }
  run.effects.push({ x: bubble.x, y: bubble.y, kind: 'voiceRing', r: outer, ttl: 0.6, duration: 0.6 });
}

export default papafrita;
