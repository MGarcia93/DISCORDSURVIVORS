// One statistics block for every ficha. The selector card always shows the same
// six rows, in the same order, in the same unit: a percentage of the neutral
// reference in `src/stats.mjs` (context/discord_survivors_estadisticas_base.md).
//
// A ficha never hand-writes these rows. It authors one percentage sheet and
// reads it twice: `resolveEntityStats` for the engine, `statBlock` for the card.
// That is what keeps two characters from showing different lists, different
// units — or a row that one has and the other silently drops.

// Order is the reading order of the card, and it is identical for everyone.
const ROWS = [
  ['life', 'VIDA'],
  ['attack', 'DAÑO'],
  ['defense', 'DEFENSA'],
  ['attackDistance', 'ALCANCE'],
  ['attackSpeed', 'ATQ/SEG'],
  ['moveSpeed', 'VELOCIDAD'],
];

// Spanish grouping: 3300 reads as 3.300, and a tuned 83.3 keeps one decimal
// instead of a float tail.
function grouped(value) {
  const rounded = Math.round(value * 10) / 10;
  const [whole, fraction] = String(Math.abs(rounded)).split('.');
  const digits = whole.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${rounded < 0 ? '−' : ''}${digits}${fraction ? `,${fraction}` : ''}`;
}

function cell(value) {
  const rounded = Math.round(value * 10) / 10;
  // Unlimited reach is the one percentage that does not exist.
  if (!Number.isFinite(rounded)) return '<b>∞</b>';
  const signed = rounded > 100 ? `+${grouped(rounded)}` : grouped(rounded);
  const penalty = rounded < 100 ? ' class="penalty"' : '';
  return `<b${penalty}>${signed}%</b>`;
}

export function statBlock(sheet) {
  for (const [key] of ROWS) {
    if (!(key in sheet)) throw new Error(`statBlock: the sheet does not author "${key}"`);
  }
  const rows = ROWS.map(([key, label]) => `<div>${cell(sheet[key])}<small>${label}</small></div>`).join('');
  return `<div class="stats">${rows}</div>`;
}
