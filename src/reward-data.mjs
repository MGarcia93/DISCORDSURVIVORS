import { createCatalog } from './reward-catalog.mjs';
import { CHARACTERS } from './characters/index.mjs';

// Initial tuning, not a measured balance result. Values are independent of
// combat logic; zero boss XP avoids terminal choices after the final victory.
export const BALANCE = {
  // Wave length, density and the boss belong to the act (src/campaign/). This
  // object only carries economy plus the local short-wave override below.
  // Playtest XP: 10 per ordinary kill so every character can reach the new
  // level-3 upgrades quickly. Lower it to 1 for real balance.
  xp: {
    factor: 10, exponent: 2,
    // The Rift kinds keep the same 10-per-kill playtest rate as the walkers;
    // the mini-boss pays like a milestone, and the act boss closes the run.
    rewards: {
      zombie: 10, runner: 10, brute: 20, boss: 0,
      meleeMinion: 5, mageMinion: 8, siegeMinion: 12, mistWalker: 8, maiden: 60,
      // Act 3 keeps the same playtest rate: the elite pays like a milestone and
      // the mini-boss like Act 2's Maiden.
      skeleton: 8, lesserDemon: 12, shaman: 10, burningElite: 25, batSwarm: 4,
      lordZir: 60,
      // Act 4 keeps the same playtest rate: the alchemists pay a little more,
      // the mini-boss like Act 2's Maiden and the act boss closes the run.
      barbarian: 8, slaver: 10, archer: 10, alchemist: 12, lotusAlchemist: 60,
    },
  },
  gold: { rewards: { zombie: 1, runner: 1, brute: 5, alarmZombie: 30 }, survival: 5 },
  shopSize: 4,
};

// Local playtests use short waves; any hosted build keeps the act's real
// length. `?waves=<seconds>` forces a length anywhere, so the real pacing can be
// exercised locally. This is the only place that reads the hostname.
export const LOCAL_WAVE_SECONDS = 15;

export function balanceFor(hostname, search = '') {
  const requested = Number(new URLSearchParams(search).get('waves'));
  const forced = Number.isFinite(requested) && requested > 0 ? requested : null;
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(String(hostname ?? '').toLowerCase());
  const duration = forced ?? (local ? LOCAL_WAVE_SECONDS : null);
  return duration === null ? BALANCE : { ...BALANCE, waves: { duration } };
}

const flat = (stat, value) => ({ stat, operation: 'flat', value });
const percent = (stat, value) => ({ stat, operation: 'percent', value });

export const ITEMS = [
  { id: 'scissors', name: 'Tijera', price: 45, maxCopies: 3,
    lore: 'Cuenta la leyenda que una asesina utilizó estas tijeras para apuñalar a alguien por la espalda. Algunos dicen que fue un accidente. Fuente: Solago.',
    modifiers: [flat('attack', 2)] },
  { id: 'bleach', name: 'Lejía', price: 60, maxCopies: 3,
    lore: 'Dicen que cura cualquier enfermedad. El primero que lo comprobó no sobrevivió para confirmarlo.',
    modifiers: [flat('life', 15)] },
  { id: 'slipper', name: 'Zapatilla', price: 40, maxCopies: 3,
    lore: 'Cuenta la leyenda que esta zapatilla fue utilizada para aplastar una cabeza. Por alguna razón, a Maxi Negro le trae malos recuerdos.',
    modifiers: [percent('attack', 10)] },
  { id: 'antidepressants', name: 'Antidepresivos', price: 60, maxCopies: 3,
    lore: 'No solucionan tus problemas, pero al menos evitás explotar antes de terminar la partida.',
    modifiers: [flat('defense', 1)] },
  { id: 'extortion-phone', name: 'Teléfono de Extorsión', price: 45, maxCopies: 3,
    lore: 'Se dice que cierto sujeto recibe llamadas de extorsión constantemente. Desde entonces, cada vez que suena el teléfono, sale corriendo.',
    modifiers: [percent('moveSpeed', 8)] },
  { id: 'magic-mushrooms', name: 'Hongos Mágicos', price: 60, maxCopies: 3,
    lore: 'Warrior asegura que con esto anda más rápido. Nadie tuvo los huevos de explicarle que lleva tres horas mirando una pared.',
    modifiers: [percent('attackSpeed', 10)] },
  { id: 'alcohol', name: 'Alcohol', price: 35, maxCopies: 2,
    lore: 'Te vuelve más agresivo e intolerante. También te hace tanto daño que terminás considerando volver al LoL. Y eso ya es tocar fondo.',
    modifiers: [percent('attack', 15), flat('defense', -1)] },
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
};

export const LEVEL_UPGRADES = [
  ...[
    ['life', 'Más vida', flat('life', 10)], ['defense', 'Más defensa', flat('defense', 0.5)],
    ['attack', 'Más ataque', percent('attack', 5)], ['attackDistance', 'Más alcance', percent('attackDistance', 10)],
    ['attackSpeed', 'Más cadencia', percent('attackSpeed', 5)], ['moveSpeed', 'Más velocidad', percent('moveSpeed', 5)],
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
};
for (const entry of LEVEL_UPGRADES) if (MILESTONES[entry.id]) entry.guaranteedAt = MILESTONES[entry.id];

export const DEFAULT_CATALOG = createCatalog({ items: ITEMS, upgrades: LEVEL_UPGRADES }, {
  characters: Object.keys(CHARACTERS), effects: EFFECTS,
});
