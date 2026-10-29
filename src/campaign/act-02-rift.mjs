// Act 2 — League of Legends. The script lives in
// context/historia/Discord_Survivors_Acto_2_League_of_Legends.md and names six
// waves: the minions turning on Maxi, the mages and siege minions, Yorick's
// walkers, the endless push, the Maiden, and Yorick himself.
//
// Solago is found on wave 3, which is why that wave is the walkers' and the
// scene runs before it. The Maiden closes wave 5 as the act's one mini-boss.
//
// Density is `perMinute`, like every act, so a wave keeps its pressure whether
// localhost plays 15-second waves or the hosted build plays the real minute.
export default {
  id: 'act-02',
  order: 2,
  title: 'El murganeo perdido',
  status: 'playable',
  world: 'rift',
  duration: 60,
  narrative: 'acts/act-02/manifest.json',
  miniboss: { wave: 5, kind: 'maiden', name: 'LA DONCELLA DE LA NIEBLA' },
  boss: { wave: 6, kind: 'yorick', name: 'YORICK, EL ENTERRADOR' },
  waves: [
    { wave: 1, perMinute: 60, mix: { meleeMinion: 1 }, life: { meleeMinion: 44 } },
    {
      wave: 2,
      perMinute: 72,
      mix: { meleeMinion: 0.5, mageMinion: 0.3, siegeMinion: 0.2 },
      life: { meleeMinion: 50, mageMinion: 40, siegeMinion: 80 },
    },
    {
      wave: 3,
      perMinute: 84,
      mix: { mistWalker: 0.7, meleeMinion: 0.3 },
      life: { mistWalker: 46, meleeMinion: 56 },
    },
    {
      wave: 4,
      perMinute: 96,
      mix: { mistWalker: 0.45, mageMinion: 0.3, siegeMinion: 0.25 },
      life: { mistWalker: 54, mageMinion: 52, siegeMinion: 92 },
    },
    // The Maiden arrives once at the start of this wave; the walkers keep her company.
    { wave: 5, perMinute: 30, mix: { mistWalker: 1 }, life: { mistWalker: 62 } },
    // The boss wave is untimed and carries no budget of its own: Yorick brings
    // his walkers with him.
    { wave: 6, perMinute: 0, mix: {}, life: { mistWalker: 66 } },
  ],
};
