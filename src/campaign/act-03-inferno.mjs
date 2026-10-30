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
    { wave: 1, perMinute: 54, mix: { skeleton: 0.7, lesserDemon: 0.3 }, life: { skeleton: 34, lesserDemon: 48 } },
    {
      wave: 2,
      perMinute: 66,
      mix: { skeleton: 0.4, lesserDemon: 0.35, shaman: 0.25 },
      life: { skeleton: 40, lesserDemon: 56, shaman: 34 },
    },
    {
      wave: 3,
      perMinute: 78,
      mix: { skeleton: 0.4, lesserDemon: 0.35, shaman: 0.25 },
      life: { skeleton: 46, lesserDemon: 64, shaman: 39 },
    },
    {
      wave: 4,
      perMinute: 90,
      mix: { burningElite: 0.3, skeleton: 0.35, shaman: 0.35 },
      life: { burningElite: 174, skeleton: 52, shaman: 44 },
    },
    // Lord Zir arrives once at the start of this wave; his court of bats keeps
    // him company and gives the wave its pressure.
    { wave: 5, perMinute: 24, mix: { batSwarm: 1 }, life: { batSwarm: 20 } },
    // The boss wave is untimed and carries no budget of its own: Lilith brings
    // her echo with her, not a horde.
    { wave: 6, perMinute: 0, mix: {}, life: {} },
  ],
};
