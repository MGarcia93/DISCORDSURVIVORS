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
  waves: [
    { wave: 1, perMinute: 54, mix: { barbarian: 1 }, life: { barbarian: 39 } },
    {
      wave: 2,
      perMinute: 66,
      mix: { slaver: 0.55, archer: 0.45 },
      life: { slaver: 41, archer: 30 },
    },
    {
      wave: 3,
      perMinute: 78,
      mix: { barbarian: 0.45, slaver: 0.3, archer: 0.25 },
      life: { barbarian: 46, slaver: 48, archer: 36 },
    },
    {
      wave: 4,
      perMinute: 90,
      mix: { barbarian: 0.35, archer: 0.35, alchemist: 0.3 },
      life: { barbarian: 52, archer: 40, alchemist: 44 },
    },
    // El Alquimista arrives once at the start of this wave; his own alchemists
    // keep him company and give the wave its pressure.
    { wave: 5, perMinute: 24, mix: { alchemist: 1 }, life: { alchemist: 52 } },
    // The boss wave is untimed and carries no budget of its own: the Capataz
    // calls his own guards, not a horde.
    { wave: 6, perMinute: 0, mix: {}, life: {} },
  ],
};
