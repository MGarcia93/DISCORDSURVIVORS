export const WORLD_SCALE = 1.1;
export const WIDTH = 1144;
export const HEIGHT = 748;
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

export function createRun(random = Math.random, character = 'negro') {
  const selectedCharacter = character === 'solago' ? 'solago' : 'negro';
  const solago = selectedCharacter === 'solago';
  return {
    phase: 'playing', wave: 1, duration: 60, time: 0, elapsed: 0, coins: 0, kills: 0,
    random, character: selectedCharacter, serial: 0, shotCount: 0, spawnIn: 0.8, shotIn: 0, summonIn: 0, auraIn: 0, standIn: 0,
    player: { character: selectedCharacter, x: WIDTH / 2, y: HEIGHT / 2,
      hp: solago ? 100 : 150, maxHp: solago ? 100 : 150, speed: 165 * WORLD_SCALE,
      defense: solago ? 0.15 : 0.2, damage: solago ? 30 * 1.35 : 30,
      hitRadius: (solago ? 15 : 17) * WORLD_SCALE,
      attackRange: solago ? 72 * 0.95 * WORLD_SCALE : Infinity,
      regen: 4, still: 0, immune: 0, shotInterval: solago ? 0.56 : 0.45,
      attackFlash: 0,
      chair: 0, anime: 0, stand: 0,
      chairCooldown: 0, animeCooldown: 0, standCooldown: 0,
      smile: 0, smileCooldown: solago ? 6 : 0,
      taskKills: 0, permissionNeeded: 8, permissionActive: 0 },
    enemies: [], projectiles: [], effects: [],
    upgrades: { damage: 0, rate: 0, health: 0, armor: 0, regen: 0, speed: 0 },
  };
}

export function activateSpecial(run, type) {
  if (run.phase !== 'playing') return false;
  const player = run.player;
  if (player.character === 'solago') {
    if (type !== 'stand' || player.standCooldown > 0) return false;
    player.stand = 7;
    player.standCooldown = 26;
    return true;
  }
  if (!['chair', 'anime'].includes(type)) return false;
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
    run.enemies.push({ id: ++run.serial, kind: 'boss', x: WIDTH / 2, y: 80 * WORLD_SCALE,
      hp: 2200, maxHp: 2200, speed: 52 * WORLD_SCALE, radius: 38 * WORLD_SCALE });
  }
  return true;
}

function spawn(run) {
  const edge = Math.floor(run.random() * 4);
  const kind = run.wave > 1 && run.random() < 0.3 ? 'runner' : 'zombie';
  const hp = kind === 'runner' ? 28 + run.wave * 5 : 40 + run.wave * 6;
  run.enemies.push({ id: ++run.serial, kind,
    x: edge === 0 ? -20 * WORLD_SCALE : edge === 1 ? WIDTH + 20 * WORLD_SCALE : run.random() * WIDTH,
    y: edge === 2 ? -20 * WORLD_SCALE : edge === 3 ? HEIGHT + 20 * WORLD_SCALE : run.random() * HEIGHT,
    hp, maxHp: hp, radius: (kind === 'runner' ? 13 : 17) * WORLD_SCALE,
    speed: ((kind === 'runner' ? 88 : 40) + run.wave * 4 + run.random() * 10) * WORLD_SCALE });
}

function distance(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }

function nearest(run, origin, excluded = []) {
  return run.enemies.filter(e => e.hp > 0 && !excluded.includes(e.id))
    .sort((a, b) => distance(a, origin) - distance(b, origin))[0];
}

function fire(run, source, damage, kind) {
  const target = nearest(run, source);
  if (!target) return;
  const device = kind === 'remote' ? ['remote', 'joystick', 'phone'][run.shotCount++ % 3] : 'magic';
  run.projectiles.push({ x: source.x, y: source.y, target: target.id,
    damage, kind, device, hit: [], ttl: 3, angle: 0 });
}

function hit(run, enemy, damage, kind = 'damage') {
  enemy.hp -= damage;
  run.effects.push({ x: enemy.x, y: enemy.y - enemy.radius, text: `${Math.round(damage)}`, ttl: 0.65, kind });
}

function attackMelee(run) {
  const p = run.player;
  const target = nearest(run, p);
  if (!target || distance(target, p) > p.attackRange) return;
  const damage = p.damage * (p.permissionActive > 0 ? 1.3 : 1);
  hit(run, target, damage, 'bite');
  p.attackFlash = 0.22;
  run.effects.push({ x: target.x, y: target.y - target.radius - 12, text: '✦', ttl: 0.35, kind: 'bite' });
}

export function step(run, seconds, input = {}) {
  if (run.phase !== 'playing') return;
  const dt = Math.min(0.05, Math.max(0, seconds));
  const p = run.player;
  run.time += dt;
  run.elapsed += dt;
  const standWasActive = p.stand > 0;
  for (const key of ['immune', 'chair', 'anime', 'stand', 'attackFlash', 'chairCooldown', 'animeCooldown', 'standCooldown', 'smile', 'permissionActive']) {
    p[key] = Math.max(0, p[key] - dt);
  }
  if (p.character === 'solago') {
    p.smileCooldown = Math.max(0, p.smileCooldown - dt);
    if (p.smileCooldown === 0 && p.smile === 0) {
      p.smile = 2.5;
      p.smileCooldown = 12;
      run.effects.push({ x: p.x, y: p.y - 40 * WORLD_SCALE, text: 'JA!', ttl: 0.8, kind: 'smile' });
    }
  }
  if (standWasActive && p.stand === 0) {
    p.hp = Math.max(0, p.hp - 15);
    run.effects.push({ x: p.x, y: p.y - 55 * WORLD_SCALE, text: '¡YA VOY!', ttl: 1, kind: 'panic' });
  }
  const mx = p.stand > 0 ? 0 : (input.x || 0);
  const my = p.stand > 0 ? 0 : (input.y || 0);
  const magnitude = Math.hypot(mx, my);
  if (magnitude) {
    const speed = p.speed * (p.chair > 0 ? 0.12 : 1);
    p.x = Math.max(24 * WORLD_SCALE, Math.min(WIDTH - 24 * WORLD_SCALE, p.x + mx / magnitude * speed * dt));
    p.y = Math.max(28 * WORLD_SCALE, Math.min(HEIGHT - 24 * WORLD_SCALE, p.y + my / magnitude * speed * dt));
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
  if (run.shotIn <= 0) {
    if (p.character === 'solago') attackMelee(run);
    else fire(run, p, p.damage, 'remote');
    run.shotIn = p.shotInterval * (p.permissionActive > 0 ? 0.72 : 1);
  }
  run.summonIn -= dt;
  if (p.anime > 0 && run.summonIn <= 0) {
    fire(run, { x: p.x + 40 * WORLD_SCALE, y: p.y - 40 * WORLD_SCALE }, p.damage * 1.5, 'magic');
    run.summonIn = 0.3;
  }
  run.auraIn -= dt;
  if (p.chair > 0 && run.auraIn <= 0) {
    for (const enemy of run.enemies) if (distance(enemy, p) < 145 * WORLD_SCALE) hit(run, enemy, p.damage * 0.8);
    run.auraIn = 0.5;
  }
  run.standIn -= dt;
  if (p.stand > 0 && run.standIn <= 0) {
    for (const enemy of run.enemies) {
      if (distance(enemy, p) < 170 * WORLD_SCALE) hit(run, enemy, p.damage * 0.9, 'stand');
    }
    run.standIn = 0.4;
  }

  for (const enemy of run.enemies) {
    if (enemy.hp <= 0) continue;
    const dist = distance(enemy, p) || 1;
    enemy.x += (p.x - enemy.x) / dist * enemy.speed * dt;
    enemy.y += (p.y - enemy.y) / dist * enemy.speed * dt;
    if (dist < enemy.radius + p.hitRadius && p.immune <= 0) {
      const smileDefense = p.smile > 0 ? 0.25 : 0;
      p.hp = Math.max(0, p.hp - (enemy.kind === 'boss' ? 30 : 12) * (1 - Math.min(0.75, p.defense + smileDefense)) * (p.chair > 0 ? 0.2 : 1));
      p.immune = 0.65;
    }
  }
  for (const shot of run.projectiles) {
    shot.ttl -= dt;
    shot.angle += dt * 12;
    let target = run.enemies.find(e => e.id === shot.target && e.hp > 0);
    if (!target) {
      shot.ttl = 0;
      continue;
    }
    const dist = distance(shot, target);
    const movement = 530 * WORLD_SCALE * dt;
    if (dist < movement + target.radius) {
      shot.x = target.x;
      shot.y = target.y;
      hit(run, target, shot.damage);
      shot.hit.push(target.id);
      const next = nearest(run, shot, shot.hit);
      if (shot.kind === 'remote' && shot.hit.length < 3 && next && distance(next, shot) < 300 * WORLD_SCALE) {
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
    if (p.character === 'solago') {
      p.taskKills++;
      if (p.taskKills >= p.permissionNeeded) {
        p.taskKills = 0;
        p.permissionActive = 8;
        run.effects.push({ x: p.x, y: p.y - 60 * WORLD_SCALE, text: '¡PERMISO!', ttl: 1.2, kind: 'permission' });
      }
    }
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
