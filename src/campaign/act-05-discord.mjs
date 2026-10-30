// Act 5 — Discord Corrupto. The script lives in
// context/historia/Discord_Survivors_Acto_5_Discord_Corrupto.md and names six
// waves: the reconnection, the corrupted files, the server remembering, the
// hotfix in production, the ghosts of the past and the last game.
//
// This act authors no new common enemy: the Administrator recycles the four
// previous worlds, so every wave but the last mixes shipped kinds. Wave 5
// restores the four bosses the group already beat, in script order and one at a
// time; that is why `miniboss` here is a line and not a single entry.
//
// Wave 4 is the hotfix: the same raiders of every world, faster (1.0.4) and with
// the cast's specials cut for the first seconds (1.0.5). The script's "the
// scenario changes constantly" is carried by that wave's scene and its banter,
// not by swapping the painted world mid-run.
//
// Density is `perMinute`, like every act, so a wave keeps its pressure whether
// localhost plays 15-second waves or the hosted build plays the real minute.
export default {
  id: 'act-05',
  order: 5,
  title: 'La Última Partida',
  status: 'playable',
  world: 'discord',
  duration: 60,
  miniboss: [
    { wave: 5, kind: 'alarmZombie', name: 'EL ZOMBI DE LA ALARMA' },
    { wave: 5, kind: 'yorick', name: 'YORICK' },
    { wave: 5, kind: 'lilith', name: 'LILITH' },
    { wave: 5, kind: 'taskmaster', name: 'EL CAPATAZ DE LA RUEDA DEL DOLOR' },
  ],
  boss: { wave: 6, kind: 'administrator', name: 'EL ADMINISTRADOR DEL SERVIDOR' },
  waves: [
    // "Aparecen zombies de Project Zomboid y minions de League of Legends", plus
    // the walker that comes out of the tomb in the middle of the wave.
    {
      wave: 1,
      perMinute: 60,
      mix: { zombie: 0.35, meleeMinion: 0.25, mageMinion: 0.25, mistWalker: 0.15 },
      life: { zombie: 62, meleeMinion: 58, mageMinion: 50, mistWalker: 60 },
    },
    // "Esqueletos de Diablo, bárbaros de Conan y caminantes de Yorick", with the
    // slaver that runs straight at Warrior.
    {
      wave: 2,
      perMinute: 72,
      mix: { skeleton: 0.3, barbarian: 0.25, mistWalker: 0.2, slaver: 0.25 },
      life: { skeleton: 66, barbarian: 70, mistWalker: 72, slaver: 68 },
    },
    // The analysis wave: the scenes and the banter carry it, so the arena stays
    // light while the Administrator talks.
    { wave: 3, perMinute: 24, mix: { meleeMinion: 0.5, skeleton: 0.5 }, life: { meleeMinion: 74, skeleton: 74 } },
    // Hotfix 1.0.4 makes them faster; 1.0.5 cuts the specials for ten seconds.
    {
      wave: 4,
      perMinute: 96,
      speedBoost: 1.3,
      specialLock: 10,
      mix: { zombie: 0.2, skeleton: 0.2, barbarian: 0.2, archer: 0.2, alchemist: 0.2 },
      life: { zombie: 80, skeleton: 82, barbarian: 84, archer: 70, alchemist: 76 },
    },
    // The four corrupted bosses bring their own pressure: the alarm drags a
    // horde, Yorick his walkers, Lilith her summons, the Capataz his guards.
    { wave: 5, perMinute: 0, mix: {}, life: {} },
    // The boss wave is untimed and carries no budget of its own.
    { wave: 6, perMinute: 0, mix: {}, life: {} },
  ],
};
