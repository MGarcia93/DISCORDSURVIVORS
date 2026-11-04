// Act 3 — Diablo. The script lives in
// context/historia/Discord_Survivors_Acto_3_Diablo.md and names six waves: the
// dungeon opening, the shamans answering at range, Papasito farming, the elites
// in flames, Lord Zir and Lilith herself.
//
// Papasito is found on wave 3, which is why that wave is the one that breaks the
// act open and the scene runs before it. Lord Zir closes wave 5 as the act's one
// mini-boss; Lilith is the boss and the only thing that ends the run.
//
// Density is `perMinute`, like every act, so a wave keeps its pressure whether
// localhost plays 15-second waves or the hosted build plays the real minute.
export default {
  id: 'act-03',
  order: 3,
  title: 'El infierno del paraguayo trucho',
  status: 'playable',
  world: 'inferno',
  duration: 60,
  narrative: 'acts/act-03/manifest.json',
  miniboss: { wave: 5, kind: 'lordZir', name: 'LORD ZIR' },
  boss: { wave: 6, kind: 'lilith', name: 'LILITH' },
  waves: [
    { wave: 1, perMinute: 54, mix: { skeleton: 0.7, lesserDemon: 0.3 } },
    {
      wave: 2,
      perMinute: 66,
      mix: { skeleton: 0.4, lesserDemon: 0.35, shaman: 0.25 },
    },
    {
      wave: 3,
      perMinute: 78,
      mix: { skeleton: 0.4, lesserDemon: 0.35, shaman: 0.25 },
    },
    {
      wave: 4,
      perMinute: 80,
      // The spike arrives as a slope that ends at the wave's own maximum: half
      // the wave never has an elite, then they climb to the declared share.
      // Every kind is on the table from the first second; the ramp only makes
      // the elites more likely as the clock runs.
      //
      // The first version climbed to 80% elites on a 90-a-minute wave: 29 bodies
      // of 370 life, 15.062 points of health at level 16 — act-seven density at
      // half the level. The shelf now peaks at 45% and the wave spawns 80, which
      // keeps the last third heavy without turning the wave into a wall.
      ramp: [
        { until: 0.5, mix: { skeleton: 0.69, shaman: 0.22, burningElite: 0.09 } },
        { until: 0.7, mix: { skeleton: 0.55, shaman: 0.25, burningElite: 0.2 } },
        { until: 1, mix: { burningElite: 0.55, skeleton: 0.3, shaman: 0.15 } },
      ],
      // The wave's own total: the ramp only decides when they arrive. It is the
      // weighted average of the three stages, which is what the loader checks.
      mix: { burningElite: 0.25, skeleton: 0.545, shaman: 0.205 },
    },
    // Lord Zir arrives once at the start of this wave; his court of bats keeps
    // him company and gives the wave its pressure. His death closes the wave,
    // not the clock or the remaining bats.
    { wave: 5, untimed: true, perMinute: 24, mix: { batSwarm: 1 } },
    // The boss wave is untimed and carries no budget of its own: Lilith brings
    // her echo with her, not a horde.
    { wave: 6, perMinute: 0, mix: {} },
  ],
};
