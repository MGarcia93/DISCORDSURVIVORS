import { createCatalog } from './reward-catalog.mjs';
import { CHARACTERS } from './characters/index.mjs';

// Initial tuning, not a measured balance result. Values are independent of
// combat logic; zero boss XP avoids terminal choices after the final victory.
export const BALANCE = {
  xp: { factor: 10, exponent: 2, rewards: { zombie: 1, runner: 1, boss: 0 } },
  gold: { rewards: { zombie: 1, runner: 1, boss: 30 }, survival: 5 },
  shopSize: 4,
};

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
    lore: 'Cuenta la leyenda que esta zapatilla fue utilizada para aplastar una cabeza. Por alguna razón, al Negro le trae malos recuerdos.',
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
    lore: 'Cuenta la leyenda que alguien pasó horas cuidando de esta gallina, hasta que otro llegó y le pegó un saque. Por alguna razón, al Negro todavía le cuesta hablar del tema.',
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
  { id: 'remote-bounce', name: 'Rebote del control', characters: 'negro', minLevel: 3, requires: [],
    ranks: [{ effects: [{ type: 'bounce', value: 1 }] }] },
  { id: 'remote-chain', name: 'Otro salto', characters: 'negro', minLevel: 4,
    requires: [{ id: 'remote-bounce', rank: 1 }], ranks: [{ effects: [{ type: 'bounce', value: 1 }] }] },
];

export const DEFAULT_CATALOG = createCatalog({ items: ITEMS, upgrades: LEVEL_UPGRADES }, {
  characters: Object.keys(CHARACTERS), effects: EFFECTS,
});
