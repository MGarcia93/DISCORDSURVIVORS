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
//
// Every statistic these waves field comes from the enemy sheet; the cast is
// brought to this act's tier by `statMultipliers`, never by a table of numbers.
export default {
  id: 'act-05',
  order: 5,
  title: 'La Última Partida',
  status: 'playable',
  world: 'discord',
  duration: 60,
  narrative: 'acts/act-05/manifest.json',
  miniboss: [
    { wave: 5, kind: 'alarmZombie', name: 'EL ZOMBI DE LA ALARMA' },
    { wave: 5, kind: 'yorick', name: 'YORICK' },
    { wave: 5, kind: 'lilith', name: 'LILITH' },
    { wave: 5, kind: 'taskmaster', name: 'EL CAPATAZ DE LA RUEDA DEL DOLOR' },
  ],
  boss: { wave: 6, kind: 'administrator', name: 'EL ADMINISTRADOR DEL SERVIDOR' },
  // Act five fields the whole shipped cast at its own tier. The sheets are the
  // only owner of the six statistics: this block scales them, per kind and per
  // statistic, so the zombie and the archer do not have to grow at the same
  // rate. A statistic named here is multiplied on the authored percentage; a
  // statistic left out keeps the sheet's own value, and an act that declares no
  // block at all fields every body exactly as authored.
  //
  // These numbers reproduce today's flat act-five table at wave 1 (the first
  // wave of this act is the tier the act used to freeze for all six). Wave by
  // wave the sheet keeps growing from there, which is the point of the change.
  statMultipliers: {
    zombie: { life: 2.63, attack: 2 },
    meleeMinion: { life: 3.65, attack: 2 },
    mageMinion: { life: 3.5, attack: 2 },
    mistWalker: { life: 3.25, attack: 2 },
    skeleton: { life: 3.58, attack: 2 },
    barbarian: { life: 3.49, attack: 2 },
    slaver: { life: 3.24, attack: 2 },
    archer: { life: 4.69, attack: 2 },
    alchemist: { life: 4.11, attack: 2 },
  },
  waves: [
    // "Aparecen zombies de Project Zomboid y minions de League of Legends", plus
    // the walker that comes out of the tomb in the middle of the wave.
    {
      wave: 1,
      perMinute: 60,
      mix: { zombie: 0.35, meleeMinion: 0.25, mageMinion: 0.25, mistWalker: 0.15 },
    },
    // "Esqueletos de Diablo, bárbaros de Conan y caminantes de Yorick", with the
    // slaver that runs straight at Warrior.
    {
      wave: 2,
      perMinute: 72,
      mix: { skeleton: 0.3, barbarian: 0.25, mistWalker: 0.2, slaver: 0.25 },
    },
    // The analysis wave: the scenes and the banter carry it, so the arena stays
    // light while the Administrator talks.
    { wave: 3, perMinute: 24, mix: { meleeMinion: 0.5, skeleton: 0.5 } },
    // Hotfix 1.0.4 makes them faster; 1.0.5 cuts the specials for ten seconds.
    {
      wave: 4,
      perMinute: 96,
      speedBoost: 1.3,
      specialLock: 10,
      mix: { zombie: 0.2, skeleton: 0.2, barbarian: 0.2, archer: 0.2, alchemist: 0.2 },
    },
    // The four corrupted bosses bring their own pressure: the alarm drags a
    // horde, Yorick his walkers, Lilith her summons, the Capataz his guards.
    // Untimed: the wave closes only when the last of the four falls, because
    // four bosses do not fit in one minute.
    { wave: 5, perMinute: 0, mix: {}, untimed: true },
    // The boss wave is untimed and carries no budget of its own.
    { wave: 6, perMinute: 0, mix: {} },
  ],
};
