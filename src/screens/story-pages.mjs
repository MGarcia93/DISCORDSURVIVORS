// Story interludes shown between the menu and the arena. Pure data so the
// background each page lives in is authored next to its text, not inferred
// from an array index: `background` names a world from src/backgrounds and
// `overlay` names the extra staging the page draws on top of it.
export const storyPages = [
  {
    title: 'Una partida. Era todo lo que pedíamos.',
    label: '01 / EL ÚLTIMO MENSAJE',
    symbol: '⌁',
    tag: 'CANAL DE VOZ · 23:47',
    text: 'Una noche cualquiera. Uno quiere jugar al LoL, otro al Diablo, otro al Zomboid. Maxi Negro no quiere instalar nada. Después de horas sin decidir, alguien propone Monopoly.',
    quote: 'El servidor no soportó una discusión más. Literalmente.',
    background: 'room',
    overlay: null,
    art: 'Maxi Negro en su habitación',
  },
  {
    title: 'Bienvenidos al apocalipsis de los boludos.',
    label: '02 / CONEXIÓN PERDIDA',
    symbol: '☠',
    tag: 'MUNDO 01 · ZONA INFECTADA',
    text: 'El Discord colapsó y mezcló todos los mundos que jugaban. Ahora hay zombis en el servidor, demonios esperando loot y cobradores de alquiler. Esta primera incursión empieza entre los muertos.',
    quote: 'Los zombis te persiguen. Los corredores llegan antes. Ninguno respeta el AFK.',
    background: 'zomboid',
    overlay: 'zombies',
    art: 'Maxi Negro rodeado de zombies',
  },
  {
    title: 'Sobreviví. Después discutimos.',
    label: '03 / LA ÚLTIMA PARTIDA',
    symbol: '♜',
    tag: 'OBJETIVO · VOLVER AL DISCORD',
    text: 'Elegí a tu sobreviviente, aguantá las oleadas y comprá mejoras entre rondas. Sobreviví a lo que te tire el servidor y buscá cómo salir de esta partida.',
    quote: 'Vos caminá. El control remoto pega solo. Si no te movés por dos segundos, recuperás vida.',
    background: 'arena',
    overlay: 'administrator',
    art: 'El Administrador del Servidor',
  },
];
