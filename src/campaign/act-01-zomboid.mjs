// Act 1 — Project Zomboid. The script lives in
// context/historia/Discord_Survivors_Acto_1_Project_Zomboid.md and names six
// waves: the awakening, something making noise, not being alone, the alarm, the
// last horde and the alarm zombie itself.
//
// Density is `perMinute`, so these rows keep the same pressure whether
// localhost plays 15-second playtest waves or the hosted build plays the real
// minute. The boss wave is untimed and carries no spawn budget of its own: the
// alarm zombie brings the horde with it.
export default {
  id: 'act-01',
  order: 1,
  title: '2.000 horas al pedo',
  status: 'playable',
  world: 'zomboid',
  duration: 60,
  boss: { wave: 6, kind: 'alarmZombie', name: 'EL ZOMBI DE LA ALARMA' },
  waves: [
    { wave: 1, perMinute: 48, mix: { zombie: 1 }, life: { zombie: 46 } },
    { wave: 2, perMinute: 60, mix: { zombie: 0.7, runner: 0.3 }, life: { zombie: 52, runner: 38 } },
    { wave: 3, perMinute: 72, mix: { zombie: 0.55, runner: 0.25, brute: 0.2 }, life: { zombie: 58, runner: 43, brute: 156 } },
    { wave: 4, perMinute: 84, mix: { zombie: 0.45, runner: 0.35, brute: 0.2 }, life: { zombie: 64, runner: 48, brute: 168 } },
    { wave: 5, perMinute: 96, mix: { zombie: 0.35, runner: 0.4, brute: 0.25 }, life: { zombie: 70, runner: 52, brute: 180 } },
    { wave: 6, perMinute: 0, mix: {}, life: { zombie: 76, runner: 56, brute: 190 } },
  ],
};
