import { drawKuluYaKu } from '../sprites.mjs';

// Act 6 — Monster Hunter, wave 3 mini-boss. Kulu-Ya-Ku: the bird wyvern that
// fights behind a rock. Its rule is the rock: while it holds it, frontal damage
// almost does not land; break it and the fight opens. It is a mini-boss, so it
// carries `boss: true` (boss bar, reduced crowd control) without closing the run.
//
// The rock is the sheet's own defense, swapped by its own actions: nothing here
// is inherited from another boss.
const kuluYaKu = {
  id: 'kuluYaKu',
  boss: true,
  stats: {
    life: 1800,
    defense: 30,                        // 30% -> 3 points -> 15% while exposed
    attack: 560,                        // 56 damage
    attackSpeed: 110,                   // 110% -> one hit every 0.91 s
    attackDistance: 0,
    moveSpeed: 950,                     // 47.5 scaled px/s
  },
  radius: 26,
  bounty: 25,
  actions: [
    { key: 'swipe', chance: 3, kind: 'melee' },
    {
      key: 'raise',
      chance: 3,
      cooldown: 999,
      range: 1300,
      // It picks the rock up once, at the start of the fight.
      when: (run, enemy) => !enemy.raised && !enemy.exposed,
      run(run, enemy) {
        enemy.baseDefense = enemy.defense;
        enemy.raised = true;
        enemy.defense = 0.75;           // the rock eats most frontal damage
        run.effects.push({ x: enemy.x, y: enemy.y - enemy.radius - 20, text: 'LEVANTA LA ROCA', ttl: 1, kind: 'summon' });
      },
    },
    {
      key: 'slam',
      chance: 2,
      cooldown: 6,
      range: 150,
      // The rock comes down: more reach than the beak and more damage.
      when: (run, enemy) => enemy.raised === true,
      kind: 'melee',
      damage: 34,
    },
    {
      key: 'expose',
      chance: 3,
      cooldown: 999,
      range: 1300,
      // The rock breaks at three quarters: exposed, faster, and it never gets it
      // back, because the script's rock is a one-time opening.
      when: (run, enemy) => enemy.raised === true && enemy.hp <= enemy.maxHp * 0.75,
      run(run, enemy) {
        enemy.raised = false;
        enemy.exposed = true;
        enemy.defense = 0.15;
        enemy.speed *= 1.25;
        enemy.attackInterval *= 0.85;
        run.effects.push({ x: enemy.x, y: enemy.y - enemy.radius - 20, text: 'SIN ROCA', ttl: 1.1, kind: 'summon' });
      },
    },
  ],
  draw(ctx, x, y, options = {}) {
    drawKuluYaKu(ctx, x, y + 62, { scale: 2, ...options });
  },
};

export default kuluYaKu;
