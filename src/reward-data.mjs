import { createCatalog } from './reward-catalog.mjs';
import { CHARACTERS } from './characters/index.mjs';

// The shipped balance. Initial tuning, not a measured result, but it is the
// balance the game runs: values are independent of combat logic, and zero boss
// XP avoids terminal choices after the final victory.
//
// XP: an ordinary kill pays 1 point and a level costs a roughly constant
// mouthful (14 at level 1, 45 by level 10, 70 by level 25), so a wave where the
// player cleans up is worth about one level from the first act to the last.
// `multiplier` exists only for the test mode below.
export const BALANCE = {
  // Wave length, density and the boss belong to the act (src/campaign/). This
  // object only carries economy plus an optional length override.
  xp: {
    // The first two waves of the campaign pay two levels each and everything
    // after them settles at one: the cost curve grows faster than a wave's own
    // haul, so the early waves are the generous ones instead of the middle.
    // Later acts pay more experience per kill (`perAct`), which is what lets the
    // same steep curve keep paying a level a wave up to the fifth world.
    factor: 9, exponent: 1.1, perAct: 0.6, multiplier: 1,
    // An ordinary enemy pays one point; an elite pays like three, and the
    // mini-boss like a milestone. The act boss closes the run, so it pays none.
    rewards: {
      zombie: 1, runner: 1, brute: 2, boss: 0,
      meleeMinion: 1, mageMinion: 1, siegeMinion: 1, mistWalker: 1, maiden: 6,
      skeleton: 1, lesserDemon: 1, shaman: 1, burningElite: 3, batSwarm: 1,
      lordZir: 6,
      barbarian: 1, slaver: 1, archer: 1, alchemist: 1, lotusAlchemist: 6,
      jagras: 1, vespoid: 1, kestodon: 1, mernos: 1, hornetaur: 2,
      greatJagras: 3, kuluYaKu: 6, pukeiPukei: 6, rathalos: 0,
      workerZombie: 1, policeZombie: 1, protectedZombie: 2, militaryZombie: 2,
      armoredZombie: 3, firemanZombie: 6, truckHorde: 0,
    },
  },
  gold: {
    rewards: {
      zombie: 1, runner: 1, brute: 5, alarmZombie: 30,
      jagras: 2, vespoid: 2, kestodon: 3, mernos: 2, hornetaur: 4,
      greatJagras: 12, kuluYaKu: 25, pukeiPukei: 25, rathalos: 120,
      workerZombie: 2, policeZombie: 2, protectedZombie: 4, militaryZombie: 5,
      armoredZombie: 7, firemanZombie: 25, truckHorde: 120,
    },
    survival: 5,
  },
  shopSize: 4,
};

// Test mode: the pacing used while tuning. Short waves and ten times the XP, so
// every character reaches the level-3 upgrades quickly. It is opt-in — `?playtest`
// in the URL or the balance lab (?dev=balance) — never a hostname shortcut.
export const LOCAL_WAVE_SECONDS = 15;
const PLAYTEST = { waves: { duration: LOCAL_WAVE_SECONDS }, xp: { multiplier: 10 } };

export function playtestBalance() {
  return { ...BALANCE, ...PLAYTEST, xp: { ...BALANCE.xp, ...PLAYTEST.xp } };
}

// `?waves=<seconds>` forces only the wave length, on top of either mode, so the
// real pacing can be exercised with the test economy and the other way around.
export function balanceFor(search = '') {
  const params = new URLSearchParams(search ?? '');
  const base = params.has('playtest') ? playtestBalance() : BALANCE;
  const requested = Number(params.get('waves'));
  if (!Number.isFinite(requested) || requested <= 0) return base;
  return { ...base, waves: { duration: requested } };
}

const flat = (stat, value) => ({ stat, operation: 'flat', value });
const percent = (stat, value) => ({ stat, operation: 'percent', value });

export const ITEMS = [
  // The cheap flat hit. Two points is the same 7% the Zapatilla pays on the
  // roster's average damage, and it costs less because flat damage never grows
  // with the build: whoever buys it is buying the early game.
  { id: 'scissors', name: 'Tijera', price: 30, maxCopies: 3,
    lore: 'Cuenta la leyenda que una asesina utilizó estas tijeras para apuñalar a alguien por la espalda. Algunos dicen que fue un accidente. Fuente: Solago.',
    modifiers: [flat('attack', 2)] },
  { id: 'bleach', name: 'Lejía', price: 60, maxCopies: 3,
    lore: 'Dicen que cura cualquier enfermedad. El primero que lo comprobó no sobrevivió para confirmarlo.',
    modifiers: [flat('life', 10)] },
  { id: 'slipper', name: 'Zapatilla', price: 40, maxCopies: 3,
    lore: 'Cuenta la leyenda que esta zapatilla fue utilizada para aplastar una cabeza. Por alguna razón, a Maxi Negro le trae malos recuerdos.',
    modifiers: [percent('attack', 7)] },
  { id: 'antidepressants', name: 'Antidepresivos', price: 60, maxCopies: 3,
    lore: 'No solucionan tus problemas, pero al menos evitás explotar antes de terminar la partida.',
    // A defense copy is worth 6% mitigation, not 3%: at the old number three
    // copies of a 60-coin item bought less than one level of life.
    modifiers: [flat('defense', 1.2)] },
  { id: 'extortion-phone', name: 'Teléfono de Extorsión', price: 45, maxCopies: 3,
    lore: 'Se dice que cierto sujeto recibe llamadas de extorsión constantemente. Desde entonces, cada vez que suena el teléfono, sale corriendo.',
    modifiers: [percent('moveSpeed', 6)] },
  { id: 'magic-mushrooms', name: 'Hongos Mágicos', price: 60, maxCopies: 3,
    lore: 'Warrior asegura que con esto anda más rápido. Nadie tuvo los huevos de explicarle que lleva tres horas mirando una pared.',
    // Cadence is a rate, not a multiplier: a percentage made a fast body gain
    // twice what a slow one gains. A flat point adds the same attacks per second
    // to every sheet, so the reward reads the same whoever picks it.
    modifiers: [flat('attackSpeed', 0.07)] },
  { id: 'alcohol', name: 'Alcohol', price: 35, maxCopies: 2,
    lore: 'Te vuelve más agresivo e intolerante. También te hace tanto daño que terminás considerando volver al LoL. Y eso ya es tocar fondo.',
    modifiers: [percent('attack', 10), flat('defense', -0.6)] },
  // Reach is the one statistic that never takes a percentage: a share of the
  // sheet grows the long bodies into artillery. Every source is flat points, the
  // same reach on every ficha, and the value is small on purpose: it is what
  // keeps the worst-case build inside the screen instead of a cap.
  { id: 'chicken', name: 'Gallina', price: 40, maxCopies: 3,
    lore: 'Cuenta la leyenda que alguien pasó horas cuidando de esta gallina, hasta que otro llegó y le pegó un saque. Por alguna razón, a Maxi Negro todavía le cuesta hablar del tema.',
    modifiers: [flat('attackDistance', 5)] },
  // The peer-pressure shelf: the hardware and the purchases the Discord keeps
  // bringing up. Each one buffs a stat; the four that tax another keep the
  // trade-off shape Alcohol already uses.
  { id: 'extra-monitor', name: 'Monitor innecesario', price: 45, maxCopies: 2,
    lore: 'Cuatro monitores y una tele. Igual sigue preguntando quién entró al Discord.',
    modifiers: [flat('attackDistance', 5)] },
  { id: 'free-epic-game', name: 'Juego gratis de Epic', price: 60, maxCopies: 3,
    lore: 'Canjealo que está gratis. No lo vas a instalar, no lo vas a jugar, pero por las dudas tenelo.',
    modifiers: [flat('life', 10)] },
  { id: 'broken-headset', name: 'Auricular roto', price: 60, maxCopies: 3,
    lore: 'Cada vez que entra al Discord parece que está hablando desde una licuadora. Lo acomoda y se arregla. Comprate unos auriculares, hijo de puta.',
    modifiers: [flat('defense', 1.2)] },
  { id: 'steam-sale', name: 'Descuento de Steam', price: 40, maxCopies: 2,
    lore: 'Estaba al 90% de descuento. No lo necesitabas, probablemente nunca lo juegues, pero mirá toda la plata que ahorraste.',
    modifiers: [flat('attackSpeed', 0.07), percent('moveSpeed', -6)] },
  { id: 'pokemon-card', name: 'Carta Pokémon', price: 35, maxCopies: 2,
    lore: 'Pagó una fortuna por un pedazo de cartón con un Pikachu. No juega, no vende, no recupera la plata. Pero mirá qué linda carta.',
    modifiers: [flat('defense', 1.2), flat('attackSpeed', -0.07)] },
  { id: 'bad-internet', name: 'Internet de mierda', price: 35, maxCopies: 2,
    lore: 'La señal llega a todos lados, menos a donde tiene que llegar. Si lo ves teletransportarse, no es una habilidad, es el ping.',
    modifiers: [flat('attackDistance', 5), flat('attack', -1.5)] },
  { id: 'broken-joystick', name: 'Joystick roto', price: 35, maxCopies: 2,
    lore: 'Tiene tantos botones rotos que jugar al Brawlhalla ya es un desafío de supervivencia. Igual insiste en que todavía sirve.',
    modifiers: [flat('attackSpeed', 0.07), percent('attack', -7)] },
];

// Effect execution is wired at integration; this registry owns validation,
// display and accumulation caps, not executable code inside catalog entries.
const duration = label => ({
  max: 4, validate: value => Number.isFinite(value) && value > 0,
  describe: value => `${label} +${value} s`,
});
const points = (label, max, unit = '') => ({
  max, validate: value => Number.isFinite(value) && value > 0,
  describe: value => `${label} +${value}${unit}`,
});
const faster = (label, max) => ({
  max, validate: value => Number.isFinite(value) && value > 0,
  describe: value => `${label} ${Math.round(value * 1000)} ms más rápido`,
});
export const EFFECTS = {
  waifuDuration: duration('Duración de Modo Otaku'),
  standDuration: duration('Duración de La Patrona'),
  smokeDuration: duration('Duración del humo'),
  bounce: { max: 2, validate: value => Number.isSafeInteger(value) && value > 0,
    describe: value => `Rebotes +${value}` },
  saleBonus: { max: 0.3, validate: value => Number.isFinite(value) && value > 0,
    describe: value => `Precio de venta +${Math.round(value * 100)}%` },
  salePenalty: points('Penalizaciones de venta reducidas', 0.4, ''),
  stillThreshold: points('Regeneración empieza', 1.5, ' s antes'),
  chairRadius: points('Radio del sillón', 60, ''),
  waifuInterval: faster('Modo Otaku ataca', 0.18),
  blastRadius: points('Radio de hongos', 45, ''),
  smokeRadius: points('Radio del humo', 60, ''),
  smileDuration: duration('Duración de Sonrisa blindada'),
  smileCooldown: points('Espera de Sonrisa blindada', 6, ' s menos'),
  patronaRadius: points('Radio de La Patrona', 85, ''),
  stillShield: points('Escudo quieto máximo', 45, ''),
  confusionStacks: { max: 1, validate: value => Number.isSafeInteger(value) && value > 0,
    describe: value => `Confusión +${value} acumulación por hongo` },
  waifuPierce: { max: 2, validate: value => Number.isSafeInteger(value) && value > 0,
    describe: value => `Modo Otaku atraviesa +${value} enemigo` },
  biteTargets: { max: 3, validate: value => Number.isSafeInteger(value) && value > 0,
    describe: value => `Mordida alcanza +${value} enemigo` },
  patronaFinal: { max: 1.2, validate: value => Number.isFinite(value) && value > 0,
    describe: value => `Remate de La Patrona: ${Math.round(value * 100)}% del daño` },
  smokeBonus: { max: 0.3, validate: value => Number.isFinite(value) && value > 0,
    describe: value => `Hongos +${Math.round(value * 100)}% contra enemigos en el humo` },
  brickPierce: { max: 2, validate: value => Number.isSafeInteger(value) && value > 0,
    describe: value => `Ladrillos atraviesan +${value} enemigo` },
  brickFragments: { max: 4, validate: value => Number.isSafeInteger(value) && value > 0,
    describe: value => `Fragmentos por impacto: ${value}` },
  secondBite: { max: 1, validate: value => Number.isFinite(value) && value > 0,
    describe: value => `Segunda mordida al ${Math.round(value * 100)}%` },
  knockback: points('Empuje de la mordida', 60, ''),
  smileCounter: { max: 0.8, validate: value => Number.isFinite(value) && value > 0,
    describe: value => `Contraataque riendo: ${Math.round(value * 100)}% del daño` },
  extraShroom: { max: 2, validate: value => Number.isSafeInteger(value) && value > 0,
    describe: value => `Hongos extra: ${value}` },
  sporeZone: { max: 2, validate: value => Number.isSafeInteger(value) && value > 0,
    describe: value => `Zona de esporas al impactar (${value})` },
  smokeTrail: { max: 2, validate: value => Number.isSafeInteger(value) && value > 0,
    describe: value => `Deja humo al moverse (${value})` },
  confusionChain: { max: 1, validate: value => Number.isSafeInteger(value) && value > 0,
    describe: () => 'Matar confundido contagia confusión' },
  brickFan: { max: 2, validate: value => Number.isSafeInteger(value) && value > 0,
    describe: value => `Ladrillos extra: ${value}` },
  saleNext: { max: 0.6, validate: value => Number.isFinite(value) && value > 0,
    describe: value => `Ataque tras vender +${Math.round(value * 100)}%` },
  panicExtend: points('Pánico extendido por baja', 2, ' s'),
  senaBurst: { max: 1.2, validate: value => Number.isFinite(value) && value > 0,
    describe: value => `Ráfaga de La seña: ${Math.round(value * 100)}% del daño` },
  // Jhony's signatures: every entry either adds an attack or reshapes one, so
  // the description names the shape and not a number. `cumulative` makes the
  // descriptor read the total the rank leaves: rank I leaves 1 (the first form)
  // and rank II leaves 2 (its evolution).
  tiltWave: { max: 2, cumulative: true, validate: value => Number.isSafeInteger(value) && value > 0,
    describe: value => value > 1 ? 'Onda de Tilt y el círculo queda en el piso' : 'Onda de Tilt al entrar en Furia' },
  shout: { max: 2, cumulative: true, validate: value => Number.isSafeInteger(value) && value > 0,
    describe: value => value > 1 ? 'Grito que pega en 360°' : 'Grito frontal periódico' },
  bottleShards: { max: 2, cumulative: true, validate: value => Number.isSafeInteger(value) && value > 0,
    describe: value => value > 1 ? 'Fragmentos de vidrio en todas direcciones' : 'Fragmentos de vidrio tras el botellazo' },
  extraBottle: { max: 2, cumulative: true, validate: value => Number.isSafeInteger(value) && value > 0,
    describe: value => value > 1 ? 'Dos botellas arrojadas por ronda' : 'Una botella arrojada cada 4 botellazos' },
  stomp: { max: 2, cumulative: true, validate: value => Number.isSafeInteger(value) && value > 0,
    describe: value => value > 1 ? 'Remate con onda de impacto' : 'Remate sobre enemigos débiles' },
  buildCombo: { max: 2, cumulative: true, validate: value => Number.isSafeInteger(value) && value > 0,
    describe: value => value > 1 ? 'La build suma rebotes' : 'La build dispara más seguido' },
  // Papafrita's six signatures: each one levels I..III, and his passive counts
  // how many DIFFERENT ones he owns, never how many copies.
  waveGrowth: { max: 3, cumulative: true, validate: value => Number.isSafeInteger(value) && value > 0,
    describe: value => `La onda se ensancha y atraviesa +${value} por enemigo` },
  copyWave: { max: 3, cumulative: true, validate: value => Number.isSafeInteger(value) && value > 0,
    describe: value => `Copia hacia otro objetivo cada ${7 - value} ataques` },
  bubbleBurst: { max: 3, cumulative: true, validate: value => Number.isSafeInteger(value) && value > 0,
    describe: value => value > 1 ? `Estallido del globo (nivel ${value})` : 'El globo estalla al desaparecer' },
  escape: { max: 3, cumulative: true, validate: value => Number.isSafeInteger(value) && value > 0,
    describe: value => value > 2 ? 'Se escapa con señuelo y onda al reaparecer' : 'Se escapa con señuelo cuando lo rodean' },
  companion: { max: 3, cumulative: true, validate: value => Number.isSafeInteger(value) && value > 0,
    describe: value => value > 1 ? 'El animal encadena y golpea en área' : 'Un animal ataca objetivos secundarios' },
  echo: { max: 3, cumulative: true, validate: value => Number.isSafeInteger(value) && value > 0,
    describe: value => `Eco demorado cada ${7 - value} ataques` },
  // The drop a body leaves behind: the first effect raises how often it falls,
  // the second how much it gives back. Both are read by `src/pickups.mjs`.
  dropChance: { max: 0.09, validate: value => Number.isFinite(value) && value > 0,
    describe: value => `Probabilidad de botín +${Math.round(value * 100)}%` },
  dropHeal: points('Curación del botín', 9, ''),
};

// Jhony's six signatures and their evolutions (§5). Each one adds or reshapes
// an attack, so the doc's "desbloqueo" and its "evolución" are the two ranks of
// ONE entry: rank I is the first form, rank II is the evolution. It is one card
// per signature, the name never changes, and `value` is the form the rank
// leaves — the descriptors below name the shape, never the number.
const JHONY_UPGRADES = [
  ['tilt-circle', '¡ERA UN CÍRCULO!', 'tiltWave', 0.8],
  ['closed-mouth', '¡CERRÁ EL ORTO, SI NI LO JUGASTE!', 'shout'],
  ['broken-bottle', 'Botella rota', 'bottleShards'],
  ['one-more-beer', 'Una birra más', 'extraBottle'],
  ['zomboid-stomp', '2.000 horas al pedo', 'stomp'],
  ['broken-build', 'La build está rotísima', 'buildCombo'],
].map(([id, name, type, chance]) => ({
  id, name, characters: 'jhony', minLevel: 3, chance, requires: [],
  ranks: [1, 2].map(() => ({ effects: [{ type, value: 1 }] })),
}));


// Papafrita's six signatures (§5), each one with levels I, II and III. A rank
// adds one to its effect; the rules live in the ficha and the passive counts
// distinct ids, so three copies of one signature are still 1/6.
const PAPAFRITA_UPGRADES = [
  ['and-what-else', '¿Y sabés qué más?', 'waveGrowth'],
  ['other-console', 'Lo compré en otra consola', 'copyWave'],
  ['not-done-yet', 'Todavía no terminé', 'bubbleBurst'],
  ['fishing', 'Me salió pesca', 'escape'],
  ['only-one', 'El único que me banca', 'companion'],
  ['definitive-edition', 'Edición definitiva', 'echo'],
].map(([id, name, type]) => ({
  id, name, characters: 'papafrita', minLevel: 2, chance: 0.55, requires: [],
  ranks: [1, 2, 3].map(() => ({ effects: [{ type, value: 1 }] })),
}));

// Upgrades that add a whole extra attack or target: a bounce, a pierce, an
// extra projectile, a second copy, a companion. The campaign does not roll them
// before level 14, so the first acts stay about the six statistics instead of
// about a screen-clearing build. A guaranteed milestone still lands on its own
// level; a milestone is a promise, not a roll.
const LATE_UPGRADES = new Set([
  'remote-bounce', 'remote-chain', 'otaku-pierce',
  'brick-pierce', 'brick-shards', 'brick-fan',
  'extra-shroom',
  'other-console', 'only-one', 'definitive-edition',
]);

const LEVEL_UPGRADE_BASE = [
  ...[
    ['life', 'Más vida', flat('life', 14)], ['defense', 'Más defensa', flat('defense', 0.7)],
    ['attack', 'Más ataque', percent('attack', 7)], ['attackDistance', 'Más alcance', flat('attackDistance', 5)],
    ['attackSpeed', 'Más cadencia', flat('attackSpeed', 0.07)], ['moveSpeed', 'Más velocidad', percent('moveSpeed', 6)],
  ].map(([id, name, modifier]) => ({
    id: `stat-${id}`, name, characters: 'all', minLevel: 2, requires: [],
    ranks: Array.from({ length: 5 }, () => ({ modifiers: [modifier] })),
  })),
  // The drop upgrade. It touches no combat statistic, so it is offered with the
  // shared pool from level two: the first ranks make the drop a plan and the
  // last one turns a bad fight into a small rescue.
  // The loot card waits for the mechanic to be introduced: `lootSeen` is set by
  // the first drop of the run, which is the same moment the Administrator shows
  // the object. Offering it before would sell a drop the player never saw.
  { id: 'loot', name: 'Botín inesperado', characters: 'all', minLevel: 2, requiresLootSeen: true,
    requires: [], ranks: Array.from({ length: 3 }, () => ({
      effects: [{ type: 'dropChance', value: 0.03 }, { type: 'dropHeal', value: 3 }],
    })) },
  ...[
    ['otaku-time', 'Un capítulo más', 'negro', 'waifuDuration'],
    ['patrona-time', 'No terminó de cortar', 'solago', 'standDuration'],
    ['smoke-time', 'Queda humo', 'warrior', 'smokeDuration'],
    ['sale-value', 'Todavía funciona', 'papazito', 'saleBonus'],
  ].map(([id, name, characters, type]) => ({
    id, name, characters, minLevel: 2, requires: [],
    ranks: Array.from({ length: 2 }, () => ({ effects: [{ type, value: type === 'saleBonus' ? 0.1 : 1 }] })),
  })),
  ...[
    ['standing-shield', 'Guardián del sillón', 'negro', 'stillShield', 20],
    ['otaku-pierce', 'La waifu no se detiene', 'negro', 'waifuPierce', 1],
    ['bite-arc', 'Mordida abierta', 'solago', 'biteTargets', 1],
    ['patrona-final', 'Último tijeretazo', 'solago', 'patronaFinal', 0.6],
    ['deeper-confusion', 'Humo con más hongos', 'warrior', 'confusionStacks', 1],
    ['smoked-mushrooms', 'Le pegan más fuerte', 'warrior', 'smokeBonus', 0.1],
    ['brick-pierce', 'Ladrillo agujereado', 'papazito', 'brickPierce', 1],
    ['brick-shards', 'Ladrillo de demolición', 'papazito', 'brickFragments', 2],
  ].map(([id, name, characters, type, value]) => ({
    id, name, characters, minLevel: 3, requires: [],
    ranks: Array.from({ length: 2 }, () => ({ effects: [{ type, value }] })),
  })),
  // The jackpot of her own pool: the mouth grows and the bite stops being melee.
  // Flat, like every reach source: +8 points a rank, the same reach any ficha
  // gains. It is a jackpot, so it is the rarest offer in her pool, not the most
  // common one.
  { id: 'paleta-growth', name: 'Crecimiento de paleta', characters: 'solago',
    minLevel: 3, chance: 0.15, requires: [],
    ranks: Array.from({ length: 3 }, () => ({ modifiers: [flat('attackDistance', 5)] })) },
  ...[
    ['second-bite', 'Doble paleta', 'solago', 'secondBite', 0.5, 0.6],
    ['bite-push', 'Mordida que empuja', 'solago', 'knockback', 25, 0.5],
    ['smile-counter', 'Risa devuelta', 'solago', 'smileCounter', 0.4, 0.5],
    ['extra-shroom', 'Más hongos', 'warrior', 'extraShroom', 1, 0.2],
    ['spore-zone', 'Esporas que quedan', 'warrior', 'sporeZone', 1, 0.5],
    ['smoke-trail', 'Humo a la espalda', 'warrior', 'smokeTrail', 1, 0.5],
    ['confusion-chain', 'Contagio de hongos', 'warrior', 'confusionChain', 1, 0.45],
    ['brick-fan', 'Abanico de ladrillos', 'papazito', 'brickFan', 1, 0.6],
    ['sale-next', 'Ganancia con interés', 'papazito', 'saleNext', 0.3, 0.5],
    ['panic-extend', 'Pánico que no se corta', 'papazito', 'panicExtend', 1.5, 0.5],
    ['sena-burst', 'Explota la seña', 'papazito', 'senaBurst', 0.6, 0.45],
  ].map(([id, name, characters, type, value, chance]) => ({
    id, name, characters, minLevel: 4, chance, requires: [],
    ranks: Array.from({ length: 2 }, () => ({ effects: [{ type, value }] })),
  })),
  ...[
    ['rest-less', 'Menos paciencia para pararse', 'negro', 'stillThreshold', 0.25],
    ['wider-chair', 'Sillón más generoso', 'negro', 'chairRadius', 20],
    ['otaku-pace', 'Cambia de capítulo rápido', 'negro', 'waifuInterval', 0.03],
    ['wider-blast', 'Hongo bien cargado', 'warrior', 'blastRadius', 15],
    ['wider-smoke', 'Humo más espeso', 'warrior', 'smokeRadius', 20],
    ['longer-smile', 'Risa que dura', 'solago', 'smileDuration', 0.5],
    ['shorter-smile', 'Se ríe seguido', 'solago', 'smileCooldown', 1],
    ['wider-patrona', 'Tijeretazos más amplios', 'solago', 'patronaRadius', 25],
    ['softer-sale', 'Vende sin tanto llanto', 'papazito', 'salePenalty', 0.1],
  ].map(([id, name, characters, type, value]) => ({
    id, name, characters, minLevel: 3, requires: [],
    ranks: Array.from({ length: 2 }, () => ({ effects: [{ type, value }] })),
  })),
  { id: 'remote-bounce', name: 'Rebote del control', characters: 'negro', minLevel: 3, chance: 0.5,
    requires: [], ranks: [{ effects: [{ type: 'bounce', value: 1 }] }] },
  { id: 'remote-chain', name: 'Otro salto', characters: 'negro', minLevel: 4,
    requires: [{ id: 'remote-bounce', rank: 1 }], ranks: [{ effects: [{ type: 'bounce', value: 1 }] }] },
  // Jhony's six signatures and their evolutions. Each one adds or reshapes an
  // attack; the evolution only opens once its base was taken.
  ...JHONY_UPGRADES,
  ...PAPAFRITA_UPGRADES,
];

export const LEVEL_UPGRADES = LEVEL_UPGRADE_BASE.map(entry =>
  LATE_UPGRADES.has(entry.id) ? { ...entry, lateLevel: 14 } : entry);

// Milestone levels (4, 8, 12 and 16, owned by `selectLevelOptions`) hand over
// four signatures, and which four is rolled: a milestone promises the menu, not
// the entry. No upgrade carries a `guaranteedAt` of its own any more.

export const DEFAULT_CATALOG = createCatalog({ items: ITEMS, upgrades: LEVEL_UPGRADES }, {
  characters: Object.keys(CHARACTERS), effects: EFFECTS,
});
