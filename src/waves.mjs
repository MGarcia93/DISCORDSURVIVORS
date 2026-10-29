// Wave authoring data. A wave declares what may appear in it, how many enemies
// it may spawn, and the life percentage each kind uses there. The engine never
// names a wave: adding a world is adding rows to this table.
//
// Density is `perMinute`, so a wave keeps the same pressure whether the reward
// balance runs 15-second test waves or 60-second waves. The engine turns it
// into a budget for the actual duration and stops spawning when it runs out: a
// wave never becomes an endless treadmill just because the player kills slowly.
//
// Mix weights are shares of a single roll, so { zombie: 0.7, runner: 0.3 } means
// every spawn is a 70/30 draw. Life percentages are over BASE_STATS
// (src/stats.mjs): 46 == 46 hp for that wave.
//
// A wave with no row here spawns nothing, so raising `waves.bossWave` in the
// reward balance needs its rows authored first.
export const WAVES = [
  { wave: 1, perMinute: 48, mix: { zombie: 1 }, life: { zombie: 46 } },
  { wave: 2, perMinute: 60, mix: { zombie: 0.7, runner: 0.3 }, life: { zombie: 52, runner: 38 } },
  { wave: 3, perMinute: 72, mix: { zombie: 0.55, runner: 0.25, brute: 0.2 }, life: { zombie: 58, runner: 43, brute: 156 } },
  { wave: 4, perMinute: 0, mix: {}, life: { zombie: 64, runner: 48 } },
];

export function waveConfig(wave) {
  return WAVES[wave - 1] ?? null;
}

export function waveBudget(wave, duration) {
  const config = waveConfig(wave);
  if (!config || !Number.isFinite(duration)) return 0;
  return Math.round(config.perMinute * duration / 60);
}

export function waveLife(wave, kind) {
  return waveConfig(wave)?.life?.[kind];
}

// One roll per spawn. A single-kind wave consumes no rolls at all, so a wave
// that only fields zombies keeps a deterministic spawn sequence.
export function pickKind(config, random) {
  const entries = Object.entries(config?.mix ?? {}).filter(([, weight]) => weight > 0);
  if (entries.length === 1) return entries[0][0];
  if (!entries.length) return null;
  const share = entries.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = random() * share;
  for (const [kind, weight] of entries) {
    roll -= weight;
    if (roll < 0) return kind;
  }
  return entries[entries.length - 1][0];
}

// Spreads what is left of the budget over what is left of the wave, so the
// whole budget lands inside the wave and the cadence tightens near the end.
export function spawnInterval(remainingTime, remainingBudget) {
  if (!Number.isFinite(remainingTime) || remainingBudget <= 0) return Infinity;
  return Math.max(0, remainingTime) / (remainingBudget + 1);
}
