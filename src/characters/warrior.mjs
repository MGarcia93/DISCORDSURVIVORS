import { WORLD_SCALE, WIDTH, HEIGHT } from '../constants.mjs';
import { resolveEntityStats } from '../stats.mjs';
import { drawWarrior } from '../sprites.mjs';

// Warrior — El Chamán del Norte. Stat sheet: percentual values over BASE_STATS
// (src/stats.mjs) per his character sheet (context/personajes) and subsequent
// playtesting balance: life 85, defense 10 pts (standard), base attack 15,
// mushroom damage x3, attack speed 0.6/s, attack distance 297px, normal mobility.
const warrior = {
  id: 'warrior',
  name: 'WARRIOR',
  gameNote: 'CHAMÁN DEL NORTE · CONTROL DE MASAS · SE CREE ARGENTINO',
  // Unlock contract: this flag in local storage means the character is playable.
  unlock: { flag: 'warriorUnlocked' },
  // Selection screen metadata: label, profile block and preview pose belong
  // to the ficha; adding a character never touches screens or app again.
  label: 'Warrior',
  detailLabel: 'Warrior',
  previewAria: 'Pixel art de Warrior: banda roja, remera blanca estampada y buzo rosa de los 80',
  profile: `
      <div class="eyebrow">Controlador · Dificultad media</div><h2>WARRIOR</h2>
      <p class="character-desc">Chamán del norte que jura ser argentino, aunque nadie descifra su acento. Los ojos siempre rojos, el humo siempre encima y una bolsita de hongos de la que nadie pregunta demasiado.</p>
      <p class="character-quote">«Yo soy argentino, boludo».</p>
      <div class="stats warrior-stats"><div><b>−15%</b><small>VIDA MÁXIMA</small></div><div><b>+350%</b><small>DAÑO POR BOMBA</small></div><div><b>+200%</b><small>ALCANCE</small></div><div><b>0,6</b><small>HONGOS/SEGUNDO</small></div><div><b>100%</b><small>VELOCIDAD</small></div></div>
      <div class="skill"><kbd>∞</kbd><div><b>HONGOS ALUCINÓGENOS</b><p>Tira hongos que explotan al impactar: daño en área y Confusión acumulable en el grupo.</p></div></div>
      <div class="skill"><kbd>◈</kbd><div><b>HUMO DE PROCEDENCIA DUDOSA</b><p>Nube periódica que ralentiza un 35% y hace fallar un 20% de los ataques enemigos.</p></div></div>
      <div class="skill"><kbd>Q</kbd><div><b>VIAJE ASTRAL</b><p>Círculo de esporas alucinógenas: daño continuo en área y desorientación. Recarga: 20 segundos.</p></div></div>
      <div class="skill"><kbd>E</kbd><div><b>ME DESAPAREZCO</b><p>Nube de humo enorme, invulnerable y reaparece de a chic: explosión de esporas al volver. Recarga: 30 segundos.</p></div></div>`,
  // Locked text never renders: an unlocked Solago's note always precedes it.
  unlockNote: {
    locked: '',
    unlocked: 'WARRIOR DESBLOQUEADO · GANÁ EL MAPA CON WARRIOR PARA PAPAZITO',
  },
  victoryLine: '¡Warrior desbloqueado! Ya podés elegirlo en la próxima partida.',
  rosterPose: { x: 28, y: 46 },
  drawRoster(ctx) { drawWarrior(ctx, this.rosterPose.x, this.rosterPose.y, { scale: 1 }); },
  preview(ctx, { time, cycle }) { drawWarrior(ctx, 128, 150, { time, moving: cycle < 3.4, scale: 2 }); },
  deathLine: 'WARRIOR SE DESCONECTÓ DE LA REALIDAD.',
  draw(ctx, x, y, context) {
    drawWarrior(ctx, x, y, {
      time: context.time, moving: context.moving, facing: context.facing, scale: 2 });
  },
  stats: {
    hitRadius: 15 * WORLD_SCALE, // lean frame from the photo: not one of the six stats
    ...resolveEntityStats({
      life: 85,              // 85 hp: frágil, sobrevive controlando
      defense: 100,          // defensa estándar: 10 puntos -> 50% de mitigación
      attack: 150,           // 15 damage: 50% above the base attack value
      attackSpeed: 60,       // 0.6 bombs/s: one deliberate bomb every 1.67s
      attackDistance: 300,   // 330px: about 15% farther than El Negro's 286px reach
      moveSpeed: 3300,       // movilidad normal del juego (165 scaled px/s)
    }),
  },
  // Mushroom bombs: direct impact plus a small blast area. The ttl already
  // includes his +35% effect duration (4s base -> 5.4s); the radius keeps his
  // +25% area proposal (70px base -> 77 unscaled).
  attack: {
    type: 'ranged', device: 'shroom', damageMultiplier: 3,
    blast: { radius: 77 * WORLD_SCALE, stacks: 1, ttl: 5.4 },
  },
  decays: [],
  passives: [{
    // Passive: HUMO DE PROCEDENCIA DUDOSA. Warrior drops a periodic cloud
    // around himself; enemies inside move slower and their swings can miss.
    // Every number lives here so balancing stays a one-file change.
    key: 'smokeCloud',
    kind: 'smoke',
    interval: 6,          // seconds between clouds
    r: 90 * WORLD_SCALE,  // cloud radius
    ttl: 5.4,             // cloud lifetime (4s base with his +35% effect duration)
    slow: 0.35,           // base movement slow inside the cloud
    stackSlow: 0.1,       // extra slow per second spent inside
    stackCap: 3,          // staying longer stops stacking here (0.65 total slow)
    missChance: 0.2,      // roll for an enemy swing to miss inside the cloud
    missCd: 1,            // swing cooldown applied on a miss
    tick(run, p) {
      if (p[this.key + 'Cooldown'] > 0) return;
      p[this.key + 'Cooldown'] = this.interval;
      run.effects.push({ x: p.x, y: p.y, kind: 'smoke',
        r: this.r + (p.rewardBonuses?.smokeRadius ?? 0) * WORLD_SCALE,
        ttl: this.ttl + (p.rewardBonuses?.smokeDuration ?? 0) });
    },
  }],
  // Q: VIAJE ASTRAL. A spore circle around Warrior: continuous area damage,
  // disorients normal enemies (drift) and briefly stuns the weak ones; strong
  // enemies and bosses only get slowed.
  specials: [{
    key: 'astral', name: 'Viaje Astral', hotkey: 'q', duration: 6, cooldown: 20,
    radius: 170 * WORLD_SCALE, tickRate: 0.4, tickFactor: 0.6,
    stacksPerTick: 2, confusionTtl: 6, stunThreshold: 150, stunWindow: 1.2,
    onTick(run, p, dt, ctx) {
      run.astralIn = (run.astralIn ?? 0) - dt;
      if (run.astralIn > 0) return;
      run.astralIn = this.tickRate;
      for (const enemy of run.enemies) {
        if (enemy.hp <= 0 || ctx.distance(enemy, p) > this.radius) continue;
        ctx.hit(run, enemy, p.damage * this.tickFactor, 'spore');
        ctx.confuse(enemy, this.stacksPerTick, this.confusionTtl);
        if (enemy.kind !== 'boss' && (enemy.maxHp ?? 0) <= this.stunThreshold) enemy.stunTtl = this.stunWindow;
      }
      run.effects.push({ x: p.x, y: p.y, text: '✿', ttl: 0.5, kind: 'spore' });
    },
  }, {
    // E: ME DESAPAREZCO. Short full invulnerability inside smoke, then he
    // reappears at the safest nearby spot with a spore explosion.
    key: 'vanish', name: 'Me Desaparezco', hotkey: 'e', duration: 2, cooldown: 30,
    contactFactor: 0,
    blink: 90 * WORLD_SCALE, burstRadius: 120 * WORLD_SCALE,
    burstFactor: 1.5, burstStacks: 2,
    onStart(run, p) {
      run.effects.push({ x: p.x, y: p.y - 60 * WORLD_SCALE, text: '¡YA VUELVO!', ttl: 1.2, kind: 'smoketext' });
    },
    onExpire(run, p, ctx) {
      const currentMove = ctx.movement || {};
      const hasCurrentMove = Math.hypot(currentMove.x || 0, currentMove.y || 0) > 0;
      const moveX = hasCurrentMove ? currentMove.x : p.lastMoveX || 0;
      const moveY = hasCurrentMove ? currentMove.y : p.lastMoveY || 0;
      const magnitude = Math.hypot(moveX, moveY);
      let best;
      if (magnitude) {
        // Follow the player's direction in a straight line, clamped inside
        // the arena; the old enemy-scored 8-way scan ignored movement input.
        best = {
          x: Math.max(24 * WORLD_SCALE, Math.min(WIDTH - 24 * WORLD_SCALE, p.x + moveX / magnitude * this.blink)),
          y: Math.max(28 * WORLD_SCALE, Math.min(HEIGHT - 24 * WORLD_SCALE, p.y + moveY / magnitude * this.blink)),
        };
      } else {
        // With no movement history, retain the safe deterministic fallback.
        let bestGap = -Infinity;
        for (let i = 0; i < 8; i++) {
          const angle = i * Math.PI / 4;
          const candidate = {
            x: Math.max(24 * WORLD_SCALE, Math.min(WIDTH - 24 * WORLD_SCALE, p.x + Math.cos(angle) * this.blink)),
            y: Math.max(28 * WORLD_SCALE, Math.min(HEIGHT - 24 * WORLD_SCALE, p.y + Math.sin(angle) * this.blink)),
          };
          let gap = Infinity;
          for (const enemy of run.enemies) if (enemy.hp > 0) gap = Math.min(gap, ctx.distance(enemy, candidate));
          if (gap > bestGap) { bestGap = gap; best = candidate; }
        }
      }
      p.x = best.x; p.y = best.y;
      for (const enemy of run.enemies) {
        if (enemy.hp <= 0 || ctx.distance(enemy, p) > this.burstRadius) continue;
        ctx.hit(run, enemy, p.damage * this.burstFactor, 'spore');
        ctx.confuse(enemy, this.burstStacks, 5.4);
      }
      run.effects.push({ x: p.x, y: p.y, text: '¿QUÉ PASÓ?', ttl: 1.2, kind: 'smoketext' });
      run.effects.push({ x: p.x, y: p.y, text: '☁', ttl: 0.6, kind: 'spore' });
    },
  }],
};

export default warrior;
