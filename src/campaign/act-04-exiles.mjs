// Act 4 — Conan Exiles. The script lives in
// context/historia/Discord_Survivors_Acto_4_Conan_Exiles.md and names six waves:
// the desert welcoming committee, the slavers' nets, Warrior on the Wheel of
// Pain, the lotus plantation, the dealer's laboratory and the taskmaster.
//
// Warrior is found on wave 3, which is why that wave is the one that breaks the
// act open and the rescue scene runs before it. El Alquimista del Loto closes
// wave 5 as the act's one mini-boss; El Capataz is the boss and the only thing
// that ends the run.
//
// The script's wave 1 also names hyenas. This act ships the four common kinds it
// needs (barbarian, slaver, archer, alchemist); hyenas are not a separate ficha,
// so the dunes field the raiders that carry the wave.
//
// Density is `perMinute`, like every act, so a wave keeps its pressure whether
// localhost plays 15-second waves or the hosted build plays the real minute.
export default {
  id: 'act-04',
  order: 4,
  title: 'El boliviano equivocado',
  status: 'playable',
  world: 'exiles',
  duration: 60,
  narrative: 'acts/act-04/manifest.json',
  miniboss: { wave: 5, kind: 'lotusAlchemist', name: 'EL ALQUIMISTA DEL LOTO' },
  boss: { wave: 6, kind: 'taskmaster', name: 'EL CAPATAZ DE LA RUEDA DEL DOLOR' },
  // The Conan raiders were the softest stop of the campaign: a developed build
  // could stand through a wave. Their sheets still speak, and this act brings
  // the four common kinds one notch harder — one or two points on the 20-24
  // they already hit for, so the early acts keep their pacing.
  statMultipliers: {
    barbarian: { attack: 1.08 },
    slaver: { attack: 1.08 },
    archer: { attack: 1.08 },
    alchemist: { attack: 1.08 },
  },
  waves: [
    { wave: 1, perMinute: 54, mix: { barbarian: 1 } },
    {
      wave: 2,
      perMinute: 66,
      mix: { slaver: 0.55, archer: 0.45 },
    },
    {
      wave: 3,
      perMinute: 78,
      mix: { barbarian: 0.45, slaver: 0.3, archer: 0.25 },
    },
    {
      wave: 4,
      world: 'laboratory',
      perMinute: 90,
      mix: { barbarian: 0.35, archer: 0.35, alchemist: 0.3 },
    },
    // El Alquimista arrives once at the start of this wave; his own alchemists
    // keep him company and give the wave its pressure.
    // The Alchemist does not run on a clock: the wave closes when he falls.
    { wave: 5, world: 'laboratory', untimed: true, perMinute: 24, mix: { alchemist: 1 } },
    // The boss wave is untimed and carries no budget of its own: the Capataz
    // calls his own guards, not a horde.
    { wave: 6, perMinute: 0, mix: {} },
  ],
};
