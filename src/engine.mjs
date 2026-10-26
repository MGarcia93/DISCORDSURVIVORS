export const WIDTH = 1040;
export const HEIGHT = 680;
export const UPGRADES = [
  { id: 'damage', name: 'Pilas nuevas', description: '+30% de daño del control. Se puede comprar varias veces.', costs: [20, 30, 40, 50], icon: 'ϟ' },
  { id: 'rate', name: 'Menos paja, más clics', description: '-8% de recarga del control remoto.', costs: [20, 30, 40, 50], icon: '↻' },
  { id: 'health', name: 'Delivery de emergencia', description: '+25 de vida máxima y recuperás 50 de vida.', costs: [20, 30, 40], icon: '✚' },
  { id: 'armor', name: 'Modo avión', description: '+5% de defensa. Que te peguen menos.', costs: [18, 26, 34], icon: '⛨' },
  { id: 'regen', name: 'Cinco minutitos más', description: '+2,5 de regeneración por segundo al estar quieto.', costs: [15, 22, 30], icon: '☾' },
  { id: 'speed', name: 'Hay comida en la cocina', description: '+8% de velocidad. Una causa noble.', costs: [15, 25], icon: '»' },
];
export const HEAL_COST = 12;
export const HEAL_AMOUNT = 60;

export function createRun(random = Math.random) {
  return {
    phase: 'playing', wave: 1, duration: 60, time: 0, elapsed: 0, coins: 0, kills: 0,
    random, serial: 0, spawnIn: 0.8, shotIn: 0, summonIn: 0, auraIn: 0,
    player: { x: WIDTH / 2, y: HEIGHT / 2, hp: 150, maxHp: 150, speed: 165,
      defense: 0.2, damage: 30, regen: 4, still: 0, immune: 0, shotInterval: 0.45,
      chair: 0, anime: 0, chairCooldown: 0, animeCooldown: 0 },
    enemies: [], projectiles: [], effects: [],
    upgrades: { damage: 0, rate: 0, health: 0, armor: 0, regen: 0, speed: 0 },
  };
}

export function activateSpecial(run, type) {
  if (run.phase !== 'playing' || !['chair', 'anime'].includes(type)) return false;
  const player = run.player;
  if (player[`${type}Cooldown`] > 0) return false;
  player[type] = type === 'chair' ? 6 : 8;
  player[`${type}Cooldown`] = type === 'chair' ? 22 : 18;
  return true;
}

export function chooseUpgrade(run, id) {
  const upgrade = UPGRADES.find(item => item.id === id);
  if (run.phase !== 'shop' || !upgrade) return false;
  const level = run.upgrades[id] || 0;
  if (level >= upgrade.costs.length) return false;
  const cost = upgrade.costs[level];
  if (run.coins < cost) return false;
  run.coins -= cost;
  run.upgrades[id] = level + 1;
  const p = run.player;
  if (id === 'damage') p.damage *= 1.3;
  if (id === 'rate') p.shotInterval *= 0.92;
  if (id === 'health') { p.maxHp += 25; p.hp = Math.min(p.maxHp, p.hp + 50); }
  if (id === 'armor') p.defense = Math.min(0.6, p.defense + 0.05);
  if (id === 'regen') p.regen += 2.5;
  if (id === 'speed') p.speed *= 1.08;
  return true;
}

export function buyHeal(run) {
  if (run.phase !== 'shop' || run.coins < HEAL_COST || run.player.hp >= run.player.maxHp) return false;
  run.coins -= HEAL_COST;
  run.player.hp = Math.min(run.player.maxHp, run.player.hp + HEAL_AMOUNT);
  return true;
}

export function startNextWave(run) {
  if (run.phase !== 'shop') return false;
  run.wave++;
  run.duration = 60;
  run.time = 0;
  run.spawnIn = 0.5;
  run.phase = 'playing';
  run.enemies = [];
  run.projectiles = [];
  if (run.wave === 4) {
    run.enemies.push({ id: ++run.serial, kind: 'boss', x: WIDTH / 2, y: 80,
      hp: 2200, maxHp: 2200, speed: 52, radius: 38 });
  }
  return true;
}

function spawn(run) {
  const edge = Math.floor(run.random() * 4);
  const kind = run.wave > 1 && run.random() < 0.3 ? 'runner' : 'zombie';
  const hp = kind === 'runner' ? 28 + run.wave * 5 : 40 + run.wave * 6;
  run.enemies.push({ id: ++run.serial, kind,
    x: edge === 0 ? -20 : edge === 1 ? WIDTH + 20 : run.random() * WIDTH,
    y: edge === 2 ? -20 : edge === 3 ? HEIGHT + 20 : run.random() * HEIGHT,
    hp, maxHp: hp, radius: kind === 'runner' ? 13 : 17,
    speed: (kind === 'runner' ? 88 : 40) + run.wave * 4 + run.random() * 10 });
}

function distance(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }

function nearest(run, origin, excluded = []) {
  return run.enemies.filter(e => e.hp > 0 && !excluded.includes(e.id))
    .sort((a, b) => distance(a, origin) - distance(b, origin))[0];
}

function fire(run, source, damage, kind) {
  const target = nearest(run, source);
  if (!target) return;
  run.projectiles.push({ x: source.x, y: source.y, target: target.id,
    damage, kind, hit: [], ttl: 3, angle: 0 });
}

function hit(run, enemy, damage) {
  enemy.hp -= damage;
  run.effects.push({ x: enemy.x, y: enemy.y - enemy.radius, text: `${Math.round(damage)}`, ttl: 0.65 });
}

export function step(run, seconds, input = {}) {
  if (run.phase !== 'playing') return;
  const dt = Math.min(0.05, Math.max(0, seconds));
  const p = run.player;
  run.time += dt;
  run.elapsed += dt;
  for (const key of ['immune', 'chair', 'anime', 'chairCooldown', 'animeCooldown']) p[key] = Math.max(0, p[key] - dt);
  const mx = input.x || 0;
  const my = input.y || 0;
  const magnitude = Math.hypot(mx, my);
  if (magnitude) {
    const speed = p.speed * (p.chair > 0 ? 0.12 : 1);
    p.x = Math.max(24, Math.min(WIDTH - 24, p.x + mx / magnitude * speed * dt));
    p.y = Math.max(28, Math.min(HEIGHT - 24, p.y + my / magnitude * speed * dt));
    p.still = 0;
  } else {
    p.still += dt;
    if (p.still >= 2) p.hp = Math.min(p.maxHp, p.hp + p.regen * dt);
  }

  run.spawnIn -= dt;
  if (run.wave < 4 && run.spawnIn <= 0 && run.enemies.length < 120) {
    spawn(run);
    run.spawnIn = Math.max(0.24, 0.85 - run.wave * 0.07 - run.time * 0.006);
  }
  run.shotIn -= dt;
  if (run.shotIn <= 0) { fire(run, p, p.damage, 'remote'); run.shotIn = p.shotInterval; }
  run.summonIn -= dt;
  if (p.anime > 0 && run.summonIn <= 0) {
    fire(run, { x: p.x + 40, y: p.y - 40 }, p.damage * 1.5, 'magic');
    run.summonIn = 0.3;
  }
  run.auraIn -= dt;
  if (p.chair > 0 && run.auraIn <= 0) {
    for (const enemy of run.enemies) if (distance(enemy, p) < 145) hit(run, enemy, p.damage * 0.8);
    run.auraIn = 0.5;
  }

  for (const enemy of run.enemies) {
    if (enemy.hp <= 0) continue;
    const dist = distance(enemy, p) || 1;
    enemy.x += (p.x - enemy.x) / dist * enemy.speed * dt;
    enemy.y += (p.y - enemy.y) / dist * enemy.speed * dt;
    if (dist < enemy.radius + 17 && p.immune <= 0) {
      p.hp = Math.max(0, p.hp - (enemy.kind === 'boss' ? 30 : 12) * (1 - p.defense) * (p.chair > 0 ? 0.2 : 1));
      p.immune = 0.65;
    }
  }
  for (const shot of run.projectiles) {
    shot.ttl -= dt;
    shot.angle += dt * 12;
    let target = run.enemies.find(e => e.id === shot.target && e.hp > 0);
    if (!target) {
      target = nearest(run, shot, shot.hit);
      if (!target) { shot.ttl = 0; continue; }
      shot.target = target.id;
    }
    const dist = distance(shot, target);
    const movement = 530 * dt;
    if (dist < movement + target.radius) {
      shot.x = target.x;
      shot.y = target.y;
      hit(run, target, shot.damage);
      shot.hit.push(target.id);
      const next = nearest(run, shot, shot.hit);
      if (shot.kind === 'remote' && shot.hit.length < 3 && next && distance(next, shot) < 300) {
        shot.target = next.id;
        shot.damage *= 0.85;
      } else shot.ttl = 0;
    } else {
      shot.x += (target.x - shot.x) / dist * movement;
      shot.y += (target.y - shot.y) / dist * movement;
    }
  }
  const killed = run.enemies.filter(enemy => enemy.hp <= 0);
  for (const enemy of killed) {
    run.kills++;
    run.coins += enemy.kind === 'boss' ? 30 : 2;
    run.effects.push({ x: enemy.x, y: enemy.y, text: '+2', ttl: 0.9, loot: true });
  }
  run.enemies = run.enemies.filter(enemy => enemy.hp > 0);
  run.projectiles = run.projectiles.filter(shot => shot.ttl > 0);
  for (const effect of run.effects) { effect.ttl -= dt; effect.y -= dt * 20; }
  run.effects = run.effects.filter(effect => effect.ttl > 0);
  if (p.hp <= 0) run.phase = 'dead';
  else if (killed.some(enemy => enemy.kind === 'boss')) run.phase = 'won';
  else if (run.wave < 4 && run.time >= run.duration) {
    run.phase = 'shop';
    run.coins += 20;
    run.enemies = [];
    run.projectiles = [];
  }
}
