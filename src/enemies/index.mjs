import {
  resolveAttackDistancePercent, resolveDamagePercent, resolveDefensePercent,
  resolveLifePercent, resolveMoveSpeedPercent, statAt,
} from '../stats.mjs';
import zombie from './zombie.mjs';
import runner from './runner.mjs';
import brute from './brute.mjs';
import alarmZombie from './alarm-zombie.mjs';
import meleeMinion from './melee-minion.mjs';
import mageMinion from './mage-minion.mjs';
import siegeMinion from './siege-minion.mjs';
import mistWalker from './mist-walker.mjs';
import maiden from './maiden.mjs';
import yorick from './yorick.mjs';
import skeleton from './skeleton.mjs';
import lesserDemon from './lesser-demon.mjs';
import shaman from './shaman.mjs';
import burningElite from './burning-elite.mjs';
import batSwarm from './bat-swarm.mjs';
import lordZir from './lord-zir.mjs';
import lilith from './lilith.mjs';
import barbarian from './barbarian.mjs';
import slaver from './slaver.mjs';
import archer from './archer.mjs';
import alchemist from './alchemist.mjs';
import lotusAlchemist from './lotus-alchemist.mjs';
import taskmaster from './taskmaster.mjs';
import administrator from './administrator.mjs';
import jagras from './jagras.mjs';
import vespoid from './vespoid.mjs';
import kestodon from './kestodon.mjs';
import mernos from './mernos.mjs';
import hornetaur from './hornetaur.mjs';
import greatJagras from './great-jagras.mjs';
import kuluYaKu from './kulu-ya-ku.mjs';
import pukeiPukei from './pukei-pukei.mjs';
import rathalos from './rathalos.mjs';

// Enemy registry, built from one module per kind exactly like src/characters/.
// Each ficha owns its sheet and its drawing; this file only resolves percentages
// into the absolute values the engine consumes. Contract:
// context/discord_survivors_enemigos.md.
//
// Every kind authors the same six combat stats (life, defense, attack,
// attackSpeed, attackDistance, moveSpeed). `radius` and `bounty` are body and
// economy, so they stay as raw fields outside the sheet.
//
// The sheet is the ONLY owner of those six values. An act never re-authors
// them: `act.statMultipliers[kind]` fields that one kind at the act's tier, and
// the multiplier lands on the authored percentage (see scaled).
export const ENEMY_KINDS = { zombie, runner, brute, alarmZombie, meleeMinion, mageMinion, siegeMinion, mistWalker, maiden, yorick,
  skeleton, lesserDemon, shaman, burningElite, batSwarm, lordZir, lilith,
  barbarian, slaver, archer, alchemist, lotusAlchemist, taskmaster, administrator,
  jagras, vespoid, kestodon, mernos, hornetaur, greatJagras, kuluYaKu, pukeiPukei, rathalos };

// Spawn and select order. Kept explicit so a new module is added once, here.
export const ENEMY_IDS = [zombie.id, runner.id, brute.id, alarmZombie.id,
  meleeMinion.id, mageMinion.id, siegeMinion.id, mistWalker.id, maiden.id, yorick.id,
  skeleton.id, lesserDemon.id, shaman.id, burningElite.id, batSwarm.id,
  lordZir.id, lilith.id,
  barbarian.id, slaver.id, archer.id, alchemist.id, lotusAlchemist.id, taskmaster.id,
  jagras.id, vespoid.id, kestodon.id, mernos.id, hornetaur.id,
  greatJagras.id, kuluYaKu.id, pukeiPukei.id, rathalos.id];

export function getEnemyKind(id) {
  return ENEMY_KINDS[id] ?? ENEMY_KINDS.zombie;
}

// An act may field a kind at its own tier instead of the tier the sheet was
// authored for. The tier is per kind and per statistic: one body may hit twice
// as hard while its neighbour only gets more life. The multiplier lands on the
// authored percentage before any resolver runs, so the defense cap and every
// unit conversion stay exactly where they are. A statistic the act never names
// keeps percentage 1: the sheet speaks, untouched.
function scaled(percent, multiplier) {
  return typeof percent === 'number' ? percent * multiplier : percent;
}

export function enemyHp(kind, wave = 1, multiplier = 1) {
  return resolveLifePercent(scaled(statAt(getEnemyKind(kind).stats, 'life', wave), multiplier));
}

export function enemySpeed(kind, wave = 1, multiplier = 1) {
  return resolveMoveSpeedPercent(scaled(statAt(getEnemyKind(kind).stats, 'moveSpeed', wave), multiplier));
}

export function enemyContactDamage(kind, wave = 1, multiplier = 1) {
  return resolveDamagePercent(scaled(statAt(getEnemyKind(kind).stats, 'attack', wave), multiplier));
}

export function enemyDefense(kind, wave = 1, multiplier = 1) {
  return resolveDefensePercent(scaled(statAt(getEnemyKind(kind).stats, 'defense', wave), multiplier));
}

// Reach in scaled pixels, measured from the collision edge. 0 means the enemy
// has to touch: the engine adds both collision radii when it decides whether it
// is close enough to stop and swing.
export function enemyAttackRange(kind, wave = 1, multiplier = 1) {
  return resolveAttackDistancePercent(scaled(statAt(getEnemyKind(kind).stats, 'attackDistance', wave), multiplier));
}

// Seconds between two swings of this kind. The sheet names attacks per second
// as a percentage, so the interval is the same 100 / P the core uses — which is
// why a multiplier on attackSpeed shortens it instead of lengthening it.
export function enemyAttackInterval(kind, wave = 1, multiplier = 1) {
  return 100 / scaled(statAt(getEnemyKind(kind).stats, 'attackSpeed', wave), multiplier);
}

// The whole resolved block for one body, which is what the engine consumes.
// `tier` is the multiplier that act declares for THIS kind ({} or undefined
// when the act has no tier of its own). It is the one place that maps an
// authored statistic to its resolver, so a new statistic cannot be scaled in
// one path and forgotten in another.
export function enemyCombatStats(kind, wave = 1, tier = {}) {
  const multiplier = stat => tier?.[stat] ?? 1;
  return {
    hp: enemyHp(kind, wave, multiplier('life')),
    defense: enemyDefense(kind, wave, multiplier('defense')),
    contactDamage: enemyContactDamage(kind, wave, multiplier('attack')),
    attackRange: enemyAttackRange(kind, wave, multiplier('attackDistance')),
    attackInterval: enemyAttackInterval(kind, wave, multiplier('attackSpeed')),
    speed: enemySpeed(kind, wave, multiplier('moveSpeed')),
  };
}

export function enemyBounty(kind) {
  return getEnemyKind(kind).bounty;
}
