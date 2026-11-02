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
    { wave: 1, perMinute: 54, mix: { skeleton: 0.7, lesserDemon: 0.3 }, life: { skeleton: 49, lesserDemon: 70 } },
    {
      wave: 2,
      perMinute: 66,
      mix: { skeleton: 0.4, lesserDemon: 0.35, shaman: 0.25 },
      life: { skeleton: 58, lesserDemon: 81, shaman: 49 },
    },
    {
      wave: 3,
      perMinute: 78,
      mix: { skeleton: 0.4, lesserDemon: 0.35, shaman: 0.25 },
      life: { skeleton: 67, lesserDemon: 93, shaman: 57 },
    },
    {
      wave: 4,
      perMinute: 90,
      // The spike arrives as a slope that ends at the wave's own maximum: half
      // the wave never has an elite, then they climb to the declared 30%.
      // Every kind is on the table from the first second; the ramp only makes
      // the elites more likely as the clock runs.
      ramp: [
        { until: 0.5, mix: { skeleton: 0.6, shaman: 0.32, burningElite: 0.08 } },
        { until: 0.7, mix: { skeleton: 0.45, shaman: 0.35, burningElite: 0.2 } },
        { until: 1, mix: { burningElite: 0.8, skeleton: 0.1, shaman: 0.1 } },
      ],
      // The wave's own total: the ramp only decides when they arrive.
      mix: { burningElite: 0.32, skeleton: 0.42, shaman: 0.26 },
      life: { burningElite: 252, skeleton: 75, shaman: 64 },
    },
    // Lord Zir arrives once at the start of this wave; his court of bats keeps
    // him company and gives the wave its pressure. His death closes the wave,
    // not the clock or the remaining bats.
    { wave: 5, untimed: true, perMinute: 24, mix: { batSwarm: 1 }, life: { batSwarm: 29 } },
    // The boss wave is untimed and carries no budget of its own: Lilith brings
    // her echo with her, not a horde.
    { wave: 6, perMinute: 0, mix: {}, life: {} },
  ],
};
