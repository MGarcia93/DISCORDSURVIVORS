# Act roster — what each act still needs

Taken from `context/historia/Discord_Survivors_Acto_*.md`. Act 1 is shipped and is
the reference implementation. A world already painted in `src/backgrounds/` is not
listed again: `rift`, `inferno`, `exiles` and `discord` exist.

| Act | World | Common kinds | Mini-boss | Boss | New fichas |
| --- | --- | --- | --- | --- | --- |
| 1 | `zomboid` | zombie, runner, brute | — | El Zombi de la Alarma | done (`alarmZombie`) |
| 2 | `rift` | minion melee, minion mage, minion siege, Yorick's mist walker | La Doncella de la Niebla | Yorick | 6 |
| 3 | `inferno` | skeleton, lesser demon, burning elite | El Goblin de las Señas | El Carnicero | 5 |
| 4 | `exiles` | slaver (nets), archer, warrior, alchemist | El Alquimista del Loto | El Capataz de la Rueda del Dolor | 6 |
| 5 | `discord` | corrupted versions of the earlier kinds | — | El Administrador del Servidor | 1 + corrupted variants |

## Per act, from the script

**Act 2 — League of Legends.** Wave 1 melee minions; wave 2 mages and siege with
projectiles; wave 4 Yorick chases through his walkers plus turrets and hazard
zones; wave 5 the Maiden as mini-boss; wave 6 Yorick. Solago is found in wave 3.

**Act 3 — Diablo.** Wave 1 skeletons and lesser demons; wave 4 elites in flames;
wave 5 the Goblin (summons lesser goblins, throws explosive bags, drops fake
loot); wave 6 the Butcher. Papasito appears in wave 3.

**Act 4 — Conan Exiles.** Wave 2 slavers with nets and archers; warriors and
alchemists later; wave 5 the Lotus Alchemist (mushrooms, smoke, false copies);
wave 6 the Taskmaster. Warrior is the surprise of wave 3.

**Act 5 — Discord Corrupto.** Wave 1 zombies and minions; wave 2 demons, walkers
and Conan kinds; wave 5 corrupted bosses; wave 6 the Administrator. Maxi appears
only after the final boss.

## Order of work for an act

1. Common enemies, one file each, visual approval before tests.
2. Mini-boss, then boss, same rule.
3. `src/campaign/act-0N-<world>.mjs`: six wave rows and the boss.
4. `assets/narrative/acts/<act>/manifest.json` and its scenes.
5. The character unlock, once the rule is decided.
