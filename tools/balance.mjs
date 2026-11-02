#!/usr/bin/env node
import { OWN_PRIORITY } from '../src/game/bot.mjs';
import { measureCharacter, measureRoster } from '../src/game/campaign-sim.mjs';

// Headless balance run. Every character plays the same campaign with the same
// bot, so the numbers compare characters instead of comparing two guesses.
//
//   node tools/balance.mjs                 all four characters, 24 campaigns each
//   node tools/balance.mjs --runs=48       more campaigns, tighter estimate
//   node tools/balance.mjs --character=negro --verbose
//   node tools/balance.mjs --seed=11 --step=7

const args = Object.fromEntries(process.argv.slice(2).map(arg => {
  const [key, value] = arg.replace(/^--/, '').split('=');
  return [key, value ?? 'true'];
}));
const runs = Number(args.runs ?? 24);
const seed = Number(args.seed ?? 11);
const step = Number(args.step ?? 7);
const only = args.character;

const characters = only ? [only] : ['negro', 'solago', 'warrior', 'papazito'];
const rows = only
  ? characters.map(character => measureCharacter(character, { runs, seed, step, ownIds: OWN_PRIORITY[character] ?? [] }))
  : measureRoster({ characters, runs, seed, ownByCharacter: OWN_PRIORITY });

const pad = (value, width) => String(value).padEnd(width);
const pct = value => `${Math.round(value * 100)}%`;
console.log(`\n${runs} campañas por personaje · semilla ${seed} · paso ${step}\n`);
console.log(`${pad('personaje', 10)} ${pad('campañas', 10)} ${pad('nivel', 7)} ${pad('propias', 9)} dónde muere`);
console.log('-'.repeat(72));
let total = 0;
for (const row of rows) {
  total += row.rate;
  const deaths = row.deaths.length ? row.deaths.map(([where, count]) => `${where}×${count}`).join(' ') : '—';
  console.log(`${pad(row.character, 10)} ${pad(`${row.wins}/${row.runs} ${pct(row.rate)}`, 10)} ${pad(row.level, 7)} ${pad(`${row.ownRanks}`, 9)} ${deaths}`);
}
if (rows.length > 1) console.log(`\nmedia del roster: ${pct(total / rows.length)}`);
