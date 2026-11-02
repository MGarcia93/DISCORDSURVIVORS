// Act 6 — Monster Hunter's Primordial Forest, the Papafrita epilogue. The script
// lives in context/historia/Discord_Survivors_Epilogo_Papafrita.md and names six
// waves: the reunion, the explanations, the missing item, the way out, the
// venomous stretch and the wyvern.
//
// Two mini-bosses sit on two different waves (Kulu-Ya-Ku on 3, Pukei-Pukei on 5),
// so the engine opens a mini-boss line per wave instead of one line per act.
//
// No `statMultipliers`: every kind here is a new ficha authored on the act-6
// rung of the ladder (140 life / 37 damage for the plain body), so the sheets
// already speak at this tier.
export default {
  id: 'act-06',
  order: 6,
  title: 'Nadie te vino a buscar',
  status: 'playable',
  // Played after the campaign is cleared twice, not after its last world.
  postgame: true,
  world: 'monster-hunter',
  duration: 60,
  narrative: 'acts/act-06/manifest.json',
  miniboss: [
    { wave: 3, kind: 'kuluYaKu', name: 'KULU-YA-KU' },
    { wave: 5, kind: 'pukeiPukei', name: 'PUKEI-PUKEI' },
  ],
  boss: { wave: 6, kind: 'rathalos', name: 'RATHALOS' },
  waves: [
    // "Jagras, Vespoid y Kestodon": the pack that did not ask to be rescued.
    { wave: 1, perMinute: 60, mix: { jagras: 0.5, vespoid: 0.3, kestodon: 0.2 } },
    // "Jagras, Vespoid y Mernos", with the Great Jagras as the wave's elite: it
    // walks in with the pack, it is not a mini-boss, and it eats before it rolls.
    { wave: 2, perMinute: 72, mix: { jagras: 0.47, vespoid: 0.22, mernos: 0.28, greatJagras: 0.03 } },
    // "Vespoid, Hornetaur y Jagras" plus Kulu-Ya-Ku. Untimed: the rock decides
    // when this wave ends, not the clock.
    { wave: 3, perMinute: 48, untimed: true, mix: { vespoid: 0.35, hornetaur: 0.3, jagras: 0.35 } },
    // "Jagras, Kestodon, Hornetaur y Mernos": the narrow path out.
    { wave: 4, perMinute: 84, mix: { jagras: 0.3, kestodon: 0.25, hornetaur: 0.2, mernos: 0.25 } },
    // "Jagras, Vespoid, Hornetaur y Kestodon" in the venomous stretch, with
    // Pukei-Pukei. Untimed for the same reason as wave 3.
    { wave: 5, perMinute: 60, untimed: true, mix: { jagras: 0.3, vespoid: 0.2, hornetaur: 0.25, kestodon: 0.25 } },
    // The nest: Wolf. A handful of the pack stays on the field while the wyvern
    // owns the wave. No clock closes it: killing Rathalos does.
    { wave: 6, perMinute: 18, mix: { jagras: 0.6, vespoid: 0.4 } },
  ],
};
