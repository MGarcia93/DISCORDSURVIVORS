// Act 7 — the Jhony epilogue. The script lives in
// context/historia/Discord_Survivors_Epilogo_Jhony.md: six waves fought in the
// street in front of the base, the fireman breaking into the depot on three and
// the truck's horn calling the horde on six.
//
// The compound is the walled block of `zomboid-siege`; the cinematics live in
// `zomboid-base` and the way in in `zomboid-approach`.
export default {
  id: 'act-07',
  order: 7,
  title: 'No me traigas más zombis',
  status: 'playable',
  // Played after the campaign is cleared twice, not after its last world.
  postgame: true,
  world: 'zomboid-siege',
  duration: 60,
  narrative: 'acts/act-07/manifest.json',
  // The fireman owns wave three: the wall of the depot comes down and he walks
  // through it. The wave is untimed because the fight decides when it ends.
  miniboss: { wave: 3, kind: 'firemanZombie', name: 'EL BOMBERO' },
  boss: { wave: 6, kind: 'truckHorde', name: 'LA HORDA DEL CAMIÓN' },
  waves: [
    // Wave 1 — the run dragged the city in: the plain walkers, the runners and
    // the workers that go for the barricades.
    { wave: 1, perMinute: 60, mix: { zombie: 0.4, runner: 0.3, workerZombie: 0.3 } },
    // Wave 2 — the car alarm: police on the flanks, the protected in front.
    { wave: 2, perMinute: 72, mix: { policeZombie: 0.35, runner: 0.35, protectedZombie: 0.3 } },
    // Wave 3 — the depot: the fireman's escort, untimed until he falls. The
    // fight moves inside the compound: the wall comes down and he walks in.
    { wave: 3, perMinute: 48, untimed: true, world: 'zomboid-base', mix: { zombie: 0.5, workerZombie: 0.5 } },
    // Wave 4 — the circle: the base surrounded, military anchors behind the
    // runners that force the group to move.
    { wave: 4, perMinute: 84, mix: { runner: 0.4, policeZombie: 0.3, militaryZombie: 0.3 } },
    // Wave 5 — the wall comes down: the armored walk in with the horde.
    { wave: 5, perMinute: 60, mix: { zombie: 0.3, runner: 0.25, militaryZombie: 0.25, armoredZombie: 0.2 } },
    // Wave 6 — the truck: the horn calls the horde every couple of seconds
    // (`alarm`), and what it drags in are the heavy bodies, not the walkers.
    // Killing the truck closes the world.
    { wave: 6, perMinute: 54, alarm: 1.6,
      mix: { zombie: 0.2, runner: 0.2, militaryZombie: 0.3, armoredZombie: 0.3 } },
  ],
};
