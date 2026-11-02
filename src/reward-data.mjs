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
    factor: 14, exponent: 0.5, multiplier: 1,
    // An ordinary enemy pays one point; an elite pays like three, and the
    // mini-boss like a milestone. The act boss closes the run, so it pays none.
    rewards: {
      zombie: 1, runner: 1, brute: 2, boss: 0,
      meleeMinion: 1, mageMinion: 1, siegeMinion: 1, mistWalker: 1, maiden: 6,
      skeleton: 1, lesserDemon: 1, shaman: 1, burningElite: 3, batSwarm: 1,
      lordZir: 6,
      barbarian: 1, slaver: 1, archer: 1, alchemist: 1, lotusAlchemist: 6,
    },
  },
  gold: { rewards: { zombie: 1, runner: 1, brute: 5, alarmZombie: 30 }, survival: 5 },
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
  { id: 'scissors', name: 'Tijera', price: 45, maxCopies: 3,
    lore: 'Cuenta la leyenda que una asesina utilizó estas tijeras para apuñalar a alguien por la espalda. Algunos dicen que fue un accidente. Fuente: Solago.',
    modifiers: [flat('attack', 1.5)] },
  { id: 'bleach', name: 'Lejía', price: 60, maxCopies: 3,
    lore: 'Dicen que cura cualquier enfermedad. El primero que lo comprobó no sobrevivió para confirmarlo.',
    modifiers: [flat('life', 10)] },
  { id: 'slipper', name: 'Zapatilla', price: 40, maxCopies: 3,
    lore: 'Cuenta la leyenda que esta zapatilla fue utilizada para aplastar una cabeza. Por alguna razón, a Maxi Negro le trae malos recuerdos.',
    modifiers: [percent('attack', 7)] },
  { id: 'antidepressants', name: 'Antidepresivos', price: 60, maxCopies: 3,
    lore: 'No solucionan tus problemas, pero al menos evitás explotar antes de terminar la partida.',
    modifiers: [flat('defense', 0.6)] },
  { id: 'extortion-phone', name: 'Teléfono de Extorsión', price: 45, maxCopies: 3,
    lore: 'Se dice que cierto sujeto recibe llamadas de extorsión constantemente. Desde entonces, cada vez que suena el teléfono, sale corriendo.',
    modifiers: [percent('moveSpeed', 6)] },
  { id: 'magic-mushrooms', name: 'Hongos Mágicos', price: 60, maxCopies: 3,
    lore: 'Warrior asegura que con esto anda más rápido. Nadie tuvo los huevos de explicarle que lleva tres horas mirando una pared.',
    modifiers: [percent('attackSpeed', 7)] },
  { id: 'alcohol', name: 'Alcohol', price: 35, maxCopies: 2,
    lore: 'Te vuelve más agresivo e intolerante. También te hace tanto daño que terminás considerando volver al LoL. Y eso ya es tocar fondo.',
    modifiers: [percent('attack', 10), flat('defense', -0.6)] },
  // Range assignment remains provisional in the approved design: keep the
  // entry available for authoring but exclude it from offers until confirmed.
  { id: 'chicken', name: 'Gallina', enabled: false, price: 40, maxCopies: 3,
    lore: 'Cuenta la leyenda que alguien pasó horas cuidando de esta gallina, hasta que otro llegó y le pegó un saque. Por alguna razón, a Maxi Negro todavía le cuesta hablar del tema.',
    modifiers: [percent('attackDistance', 10)] },
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
  // the description names the shape and not a number.
  tiltWave: { max: 2, validate: value => Number.isSafeInteger(value) && value > 0,
    describe: value => value > 1 ? 'Onda de Tilt y el círculo queda en el piso' : 'Onda de Tilt al entrar en Furia' },
  shout: { max: 2, validate: value => Number.isSafeInteger(value) && value > 0,
    describe: value => value > 1 ? 'Grito que pega en 360°' : 'Grito frontal periódico' },
  bottleShards: { max: 2, validate: value => Number.isSafeInteger(value) && value > 0,
    describe: value => value > 1 ? 'Fragmentos de vidrio en todas direcciones' : 'Fragmentos de vidrio tras el botellazo' },
  extraBottle: { max: 2, validate: value => Number.isSafeInteger(value) && value > 0,
    describe: value => value > 1 ? 'Dos botellas arrojadas por ronda' : 'Una botella arrojada cada 4 botellazos' },
  stomp: { max: 2, validate: value => Number.isSafeInteger(value) && value > 0,
    describe: value => value > 1 ? 'Remate con onda de impacto' : 'Remate sobre enemigos débiles' },
  buildCombo: { max: 2, validate: value => Number.isSafeInteger(value) && value > 0,
    describe: value => value > 1 ? 'La build suma rebotes' : 'La build dispara más seguido' },
};

// Jhony's six signatures and their evolutions (§5). Each one adds or reshapes
// an attack, and the evolution only opens once its base was taken.
const JHONY_UPGRADES = [
  { id: 'tilt-circle', name: '¡ERA UN CÍRCULO!', characters: 'jhony', minLevel: 3, chance: 0.8,
    requires: [], ranks: [{ effects: [{ type: 'tiltWave', value: 1 }] }] },
  { id: 'tilt-circle-floor', name: 'El círculo queda', characters: 'jhony', minLevel: 4,
    requires: [{ id: 'tilt-circle', rank: 1 }], ranks: [{ effects: [{ type: 'tiltWave', value: 1 }] }] },
  { id: 'closed-mouth', name: '¡CERRÁ EL CULO!', characters: 'jhony', minLevel: 3,
    requires: [], ranks: [{ effects: [{ type: 'shout', value: 1 }] }] },
  { id: 'shout-360', name: 'Grito a 360', characters: 'jhony', minLevel: 4,
    requires: [{ id: 'closed-mouth', rank: 1 }], ranks: [{ effects: [{ type: 'shout', value: 1 }] }] },
  { id: 'broken-bottle', name: 'Botella rota', characters: 'jhony', minLevel: 3,
    requires: [], ranks: [{ effects: [{ type: 'bottleShards', value: 1 }] }] },
  { id: 'glass-everywhere', name: 'Vidrio para todos', characters: 'jhony', minLevel: 4,
    requires: [{ id: 'broken-bottle', rank: 1 }], ranks: [{ effects: [{ type: 'bottleShards', value: 1 }] }] },
  { id: 'one-more-beer', name: 'Una birra más', characters: 'jhony', minLevel: 3,
    requires: [], ranks: [{ effects: [{ type: 'extraBottle', value: 1 }] }] },
  { id: 'beer-round', name: 'La ronda', characters: 'jhony', minLevel: 4,
    requires: [{ id: 'one-more-beer', rank: 1 }], ranks: [{ effects: [{ type: 'extraBottle', value: 1 }] }] },
  { id: 'zomboid-stomp', name: '2.000 horas al pedo', characters: 'jhony', minLevel: 3,
    requires: [], ranks: [{ effects: [{ type: 'stomp', value: 1 }] }] },
  { id: 'stomp-wave', name: 'Remate de Zomboid', characters: 'jhony', minLevel: 4,
    requires: [{ id: 'zomboid-stomp', rank: 1 }], ranks: [{ effects: [{ type: 'stomp', value: 1 }] }] },
  { id: 'broken-build', name: 'La build está rotísima', characters: 'jhony', minLevel: 3,
    requires: [], ranks: [{ effects: [{ type: 'buildCombo', value: 1 }] }] },
  { id: 'build-updated', name: 'Build actualizada', characters: 'jhony', minLevel: 4,
    requires: [{ id: 'broken-build', rank: 1 }], ranks: [{ effects: [{ type: 'buildCombo', value: 1 }] }] },
];

export const LEVEL_UPGRADES = [
  ...[
    ['life', 'Más vida', flat('life', 14)], ['defense', 'Más defensa', flat('defense', 0.7)],
    ['attack', 'Más ataque', percent('attack', 7)], ['attackDistance', 'Más alcance', percent('attackDistance', 12)],
    ['attackSpeed', 'Más cadencia', percent('attackSpeed', 7)], ['moveSpeed', 'Más velocidad', percent('moveSpeed', 6)],
  ].map(([id, name, modifier]) => ({
    id: `stat-${id}`, name, characters: 'all', minLevel: 2, requires: [],
    ranks: Array.from({ length: 5 }, () => ({ modifiers: [modifier] })),
  })),
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
  // Three ranks, each one a bigger mouth: 146 px, 206 px, 266 px, which is a
  // ranged character's reach. Finding it once already changes the run.
  { id: 'paleta-growth', name: 'Crecimiento de paleta', characters: 'solago',
    minLevel: 3, chance: 0.8, requires: [],
    ranks: Array.from({ length: 3 }, () => ({ modifiers: [percent('attackDistance', 70)] })) },
  ...[
    ['second-bite', 'Doble paleta', 'solago', 'secondBite', 0.5, 0.6],
    ['bite-push', 'Mordida que empuja', 'solago', 'knockback', 25, 0.5],
    ['smile-counter', 'Risa devuelta', 'solago', 'smileCounter', 0.4, 0.5],
    ['extra-shroom', 'Más hongos', 'warrior', 'extraShroom', 1, 0.6],
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
    guaranteedAt: [3], requires: [], ranks: [{ effects: [{ type: 'bounce', value: 1 }] }] },
  { id: 'remote-chain', name: 'Otro salto', characters: 'negro', minLevel: 4,
    requires: [{ id: 'remote-bounce', rank: 1 }], ranks: [{ effects: [{ type: 'bounce', value: 1 }] }] },
  // Jhony's six signatures and their evolutions. Each one adds or reshapes an
  // attack; the evolution only opens once its base was taken.
  ...JHONY_UPGRADES,
];

// Milestone levels: at these levels the entry is forced into the selection,
// independently of its chance. Everything else is rolled.
// One guaranteed entry per character and level, so a milestone never competes
// with another guaranteed own upgrade for the single own slot.
const MILESTONES = {
  'remote-bounce': [3], 'waifu-pierce': [4],
  'bite-arc': [3], 'patrona-final': [4],
  'deeper-confusion': [3], 'extra-shroom': [4],
  'brick-pierce': [3], 'sena-burst': [4],
  'tilt-circle': [3],
};
for (const entry of LEVEL_UPGRADES) if (MILESTONES[entry.id]) entry.guaranteedAt = MILESTONES[entry.id];

export const DEFAULT_CATALOG = createCatalog({ items: ITEMS, upgrades: LEVEL_UPGRADES }, {
  characters: Object.keys(CHARACTERS), effects: EFFECTS,
});
