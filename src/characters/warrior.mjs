import { WORLD_SCALE } from '../constants.mjs';
import { resolveEntityStats } from '../stats.mjs';
import { drawWarrior } from '../sprites.mjs';

// Warrior — El Chamán del Norte. Stat sheet: percentual values over BASE_STATS
// (src/stats.mjs) per his character sheet (context/personajes) and the stat
// table the user defined: life 85, defense 10 pts (standard), attack 8,
// attack speed 0.9/s, attack distance 120, normal mobility.
const warrior = {
  id: 'warrior',
  name: 'WARRIOR',
  gameNote: 'CHAMÁN DEL NORTE · CONTROL DE MASAS · SE CREE ARGENTINO',
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
      attack: 80,            // 8 de daño directo; los hongos compensan con estados
      attackSpeed: 90,       // 0.9 ataques/s: lanza hongos un poco más lento
      attackDistance: 120,   // 132px: mantiene a los enemigos a distancia
      moveSpeed: 3300,       // movilidad normal del juego (165 scaled px/s)
    }),
  },
  // Mushroom bombs: direct impact plus a small blast area. The ttl already
  // includes his +35% effect duration (4s base -> 5.4s); the radius keeps his
  // +25% area proposal (70px base -> 77 unscaled).
  attack: {
    type: 'ranged', device: 'shroom',
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
      run.effects.push({ x: p.x, y: p.y, kind: 'smoke', r: this.r, ttl: this.ttl });
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
      // Safe reappearance: scan 8 blink candidates and keep the one the
      // nearest enemy is farthest from. Deterministic, no rng.
      let best = null, bestGap = -Infinity;
      for (let i = 0; i < 8; i++) {
        const angle = i * Math.PI / 4;
        const candidate = { x: p.x + Math.cos(angle) * this.blink, y: p.y + Math.sin(angle) * this.blink };
        let gap = Infinity;
        for (const enemy of run.enemies) if (enemy.hp > 0) gap = Math.min(gap, ctx.distance(enemy, candidate));
        if (gap > bestGap) { bestGap = gap; best = candidate; }
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
