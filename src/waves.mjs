// Wave interpretation. The rows themselves belong to an act (src/campaign/),
// so this module never names a world, a wave count or a boss: it only reads the
// three numbers every row carries.
//
// Density is `perMinute`, so a wave keeps the same pressure whether the reward
// balance runs 15-second playtest waves or 60-second real ones. The engine
// turns it into a budget for the actual duration and stops spawning when it
// runs out: a wave never becomes an endless treadmill just because the player
// kills slowly.
//
// Mix weights are shares of a single roll, so { zombie: 0.7, runner: 0.3 } means
// every spawn is a 70/30 draw. Life percentages are over BASE_STATS
// (src/stats.mjs): 46 == 46 hp for that wave.
export function waveConfig(act, wave) {
  return act?.waves?.[wave - 1] ?? null;
}

export function waveBudget(act, wave, duration) {
  const config = waveConfig(act, wave);
  if (!config || !Number.isFinite(duration)) return 0;
  return Math.round(config.perMinute * duration / 60);
}

// A kind's life is one value for the whole world: the one it first appears
// with. Only the closing waves use the world's peak, so the finale still
// escalates without the same zombie getting tougher every single wave.
export function waveLife(act, wave, kind) {
  const rows = (act?.waves ?? []).filter(row => typeof row.life?.[kind] === 'number');
  if (!rows.length) return undefined;
  const closing = (act?.boss?.wave ?? act?.waves?.length ?? 1) - 1;
  return wave >= closing ? rows[rows.length - 1].life[kind] : rows[0].life[kind];
}

// One roll per spawn. A single-kind wave consumes no rolls at all, so a wave
// that only fields zombies keeps a deterministic spawn sequence.
// A wave may declare `ramp`: stages of its own mix, each with the share of the
// clock it covers (`until`, 0..1). A wave without it keeps one mix all the way.
export function mixAt(config, progress = 0) {
  const ramp = config?.ramp;
  if (!Array.isArray(ramp) || !ramp.length) return config?.mix ?? {};
  for (const stage of ramp) if (progress < stage.until) return stage.mix ?? {};
  return config.mix ?? {};
}

export function pickKind(config, random, progress = 0) {
  const entries = Object.entries(mixAt(config, progress)).filter(([, weight]) => weight > 0);
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
