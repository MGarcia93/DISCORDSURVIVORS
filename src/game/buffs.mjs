// Active buffs: what the run is applying to the player right now. The ficha owns
// the names and the numbers (`buffs(player, run)`), the same way it owns its
// stats and its HUD hooks; this module only assembles the list the HUD prints.
//
// Two sources feed it:
//   - `characterDef.buffs(player, run)`: passives that switch on, shields, sale
//     penalties — everything the engine keeps in a field the ficha understands.
//   - active specials: the engine already stores their remaining seconds in
//     `player[special.key]`, so a Q/E buff needs no extra declaration.
export function activeBuffs(player, run = null) {
  const def = player?.characterDef ?? {};
  const declared = def.buffs?.(player, run) ?? [];
  const specials = (def.specials ?? [])
    .map(special => ({
      id: special.key,
      name: special.name,
      seconds: player?.[special.key] ?? 0,
      detail: special.buff,
    }))
    .filter(buff => buff.seconds > 0);
  return [...declared, ...specials].filter(buff => buff && buff.name);
}
