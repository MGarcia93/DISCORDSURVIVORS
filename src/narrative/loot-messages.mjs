// The Administrator's first-drop notice. His voice is the system log from Act 5
// ("Ejecutando comando", "No son errores. Son características"), so the roast
// arrives as an admin note: he never chats, he reports, analyses and then hands
// the object over.
//
// The notice plays as a short sequence of beats inside the same box: the
// diagnosis, a progress bar, and finally the generated object with its picture.
// The opening is the same for every ficha; only the verdict changes, and the
// third line says out loud that the object heals.
const OPENING = Object.freeze([
  'Usuario con rendimiento deficiente.',
  'Iniciando protocolo de asistencia.',
  'Analizando historial, gustos y patrones de comportamiento para generar un objeto de recuperación adaptado al perfil del usuario...',
]);

// What the bot hands over, one entry per ficha: the generated line and the
// verdict that follows it.
const VERDICTS = {
  negro: [
    'Objeto personalizado generado: Figura de Kuromi.',
    'Nota del sistema: ideal para atraer minas de personalidad dudosa.',
    'No juzgo. Solo registro.',
  ],
  jhony: [
    'Objeto personalizado generado: Whisky.',
    'Nota del sistema: uno por cada guía que miraste. Vas a necesitar muchos más.',
  ],
  papafrita: [
    'Objeto personalizado generado: Consola portátil.',
    'Nota del sistema: otra consola para tu colección. Con esta ya tenés más plataformas que juegos terminados.',
  ],
  solago: [
    'Objeto personalizado generado: Paleta de agua.',
    'Nota del sistema: consumila rápido, antes de que se derrita como tu elo.',
    'Error detectado.',
    'El análisis prolongado de este usuario está afectando mis capacidades lingüísticas.',
    'Era paleta pero de diente, no de agua.',
    'Olvídenlo. Ya está.',
  ],
  warrior: [
    'Objeto personalizado generado: Hongo de Jujuy.',
    'Error de clasificación detectado.',
    'Corrigiendo ubicación: Bolivia.',
    'Problema resuelto.',
  ],
  papazito: [
    'Objeto personalizado generado: Chipá.',
    'Nota del sistema: comelo antes de que intentes venderlo para pagar una seña.',
  ],
};

function sequence(character) {
  return Object.freeze([
    Object.freeze({
      lines: OPENING,
      progress: 0.15,
      duration: 4.2,
    }),
    Object.freeze({
      lines: Object.freeze(['Procesando datos...']),
      progress: 0.68,
      // The only beat that runs by itself: it is the loading bar, and the
      // player has nothing to read on it.
      auto: true,
      duration: 1.5,
    }),
    Object.freeze({
      lines: Object.freeze(VERDICTS[character]),
      progress: 1,
      item: character,
      // Reading speed, not a beat: three or four short lines get their own time.
      duration: Math.max(7, Math.ceil(VERDICTS[character].join(' ').length / 16)),
    }),
  ]);
}

export const LOOT_MESSAGES = Object.freeze({
  negro: sequence('negro'),
  jhony: sequence('jhony'),
  papafrita: sequence('papafrita'),
  solago: sequence('solago'),
  warrior: sequence('warrior'),
  papazito: sequence('papazito'),
});

export function lootMessageFor(character) {
  return LOOT_MESSAGES[character] ?? LOOT_MESSAGES.negro;
}
