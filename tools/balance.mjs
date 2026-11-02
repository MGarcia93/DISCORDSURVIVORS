#!/usr/bin/env node
import { OWN_PRIORITY } from '../src/game/bot.mjs';
import { measureCharacter, measureRoster } from '../src/game/campaign-sim.mjs';

// Headless balance run. Every character plays the same campaign with the same
// bot, so the numbers compare characters instead of comparing two guesses.
//
//   node tools/balance.mjs                    all four characters, 24 campaigns
//   node tools/balance.mjs --runs=48          tighter estimate
//   node tools/balance.mjs --character=negro
//   node tools/balance.mjs --policy=random --spend=min
//   node tools/balance.mjs --matrix --runs=6  the whole spread at once
//
// `--policy` decides the level choices: optimal reads the character's kit,
// random takes whatever the game rolled (what a new player does). `--spend`
// decides the coins: min heals only, normal buys by priority, max buys every
// offer, adaptive saves through ordinary waves and opens up before a boss.

const args = Object.fromEntries(process.argv.slice(2).map(arg => {
  const [key, value] = arg.replace(/^--/, '').split('=');
  return [key, value ?? 'true'];
}));
const runs = Number(args.runs ?? 24);
const seed = Number(args.seed ?? 11);
const step = Number(args.step ?? 7);
const policy = args.policy ?? 'optimal';
const spend = args.spend ?? 'normal';
const skill = args.skill ?? 'perfect';
const buy = args.buy ?? 'smart';
const only = args.character;

const characters = only ? [only] : ['negro', 'solago', 'warrior', 'papazito'];
const pad = (value, width) => String(value).padEnd(width);
const pct = value => `${Math.round(value * 100)}%`;
const range = row => `${Math.round((row.spread.high - row.spread.low) * 50)}`;

function measure(modePolicy, modeSpend, modeSkill = skill, modeBuy = buy) {
  return only
    ? [measureCharacter(only, { runs, seed, step, policy: modePolicy, spend: modeSpend, skill: modeSkill, buy: modeBuy, ownIds: OWN_PRIORITY[only] ?? [] })]
    : measureRoster({ characters, runs, seed, ownByCharacter: OWN_PRIORITY, policy: modePolicy, spend: modeSpend, skill: modeSkill, buy: modeBuy });
}

if (args.compare) {
  // The same seeds, played once without a mistake and once like a person.
  process.stderr.write('midiendo ejecución perfecta…\n');
  const perfect = measure(policy, spend, 'perfect', buy);
  process.stderr.write('midiendo jugador promedio…\n');
  const average = measure(policy, spend, 'average', buy);
  console.log(`\n${runs} campañas por personaje · semilla ${seed} · ${policy}/${spend}/${buy}\n`);
  console.log(`${pad('personaje', 10)} ${pad('perfecto', 26)} ${pad('promedio', 26)} resultados (perfecto / promedio)`);
  console.log('-'.repeat(96));
  for (let index = 0; index < perfect.length; index++) {
    const exact = perfect[index];
    const human = average[index];
    const cell = row => `${row.wins}/${row.runs} ${pct(row.rate)} ±${range(row)} · nivel ${row.level}`;
    console.log(`${pad(exact.character, 10)} ${pad(cell(exact), 26)} ${pad(cell(human), 26)}`);
    console.log(`${pad('', 10)} ${exact.outcomes.join(' ')}`);
    console.log(`${pad('', 10)} ${human.outcomes.join(' ')}`);
  }
  process.exit(0);
}

if (args.matrix) {
  // The spread a balance question needs: what the game deals a new player, the
  // best build on the thinnest purse, and everything in between.
  const modes = [
    ['random/normal', 'random', 'normal'],
    ['random/max', 'random', 'max'],
    ['optimal/min', 'optimal', 'min'],
    ['optimal/adaptive', 'optimal', 'adaptive'],
    ['optimal/max', 'optimal', 'max'],
  ];
  const table = new Map(characters.map(character => [character, []]));
  for (const [label, modePolicy, modeSpend] of modes) {
    process.stderr.write(`midiendo ${label}…\n`);
    for (const row of measure(modePolicy, modeSpend)) table.get(row.character).push([label, row]);
  }
  console.log(`\n${runs} campañas por celda · semilla ${seed}\n`);
  console.log(`${pad('personaje', 10)} ${modes.map(([label]) => pad(label, 16)).join(' ')}`);
  console.log('-'.repeat(10 + modes.length * 17));
  for (const character of characters) {
    const cells = table.get(character).map(([, row]) => pad(`${row.wins}/${row.runs} ${pct(row.rate)}`, 16));
    console.log(`${pad(character, 10)} ${cells.join(' ')}`);
  }
  process.exit(0);
}

const rows = measure(policy, spend);
console.log(`\n${runs} campañas por personaje · semilla ${seed} · ${policy}/${spend}/${skill}/${buy}\n`);
console.log(`${pad('personaje', 10)} ${pad('campañas', 10)} ${pad('nivel', 7)} ${pad('propias', 9)} dónde muere`);
console.log('-'.repeat(72));
let total = 0;
for (const row of rows) {
  total += row.rate;
  const deaths = row.deaths.length ? row.deaths.map(([where, count]) => `${where}×${count}`).join(' ') : '—';
  console.log(`${pad(row.character, 10)} ${pad(`${row.wins}/${row.runs} ${pct(row.rate)} ±${range(row)}`, 14)} ${pad(row.level, 7)} ${pad(`${row.ownRanks}`, 9)} ${deaths}`);
}
if (rows.length > 1) console.log(`\nmedia del roster: ${pct(total / rows.length)}`);
