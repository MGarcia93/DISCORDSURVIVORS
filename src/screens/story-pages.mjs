// Story interludes shown between the menu and the arena. Pure data so the
// background each page lives in is authored next to its text, not inferred
// from an array index: `background` names a world from src/backgrounds and
// `overlay` names the extra staging the page draws on top of it.
//
// One page per world: the intro has to tell the whole campaign, so it walks the
// five acts in order and leaves the corrupted server for last.
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
    label: '02 / MUNDO 01 · KNOX COUNTY',
    symbol: '☠',
    tag: 'PROJECT ZOMBOID · ZONA INFECTADA',
    text: 'El Discord colapsó y mezcló todos los mundos que jugaban. El primero es el de los muertos: zombis en la calle, corredores que llegan antes y un resistente que no cae de un tiro. En la sexta oleada suena la alarma.',
    quote: 'Los zombis te persiguen. Los corredores llegan antes. Ninguno respeta el AFK.',
    background: 'zomboid',
    overlay: 'zombies',
    art: 'Maxi Negro rodeado de zombies',
  },
  {
    title: 'Se abre la grieta.',
    label: '03 / MUNDO 02 · SUMMONER’S RIFT',
    symbol: '⚔',
    tag: 'LEAGUE OF LEGENDS · LA GRIETA',
    text: 'Del zombi se pasa a la grieta: minions, torretas y un caminante de la niebla que arrastra a Yorick. Ahí aparece Solago, que juega mal, discute peor y se queda igual.',
    quote: 'Si no te hacen caso en tu casa, ¿acá te van a hacer caso?',
    background: 'rift',
    overlay: null,
    art: 'La grieta de League of Legends',
  },
  {
    title: 'El infierno tiene loot.',
    label: '04 / MUNDO 03 · EL INFIERNO',
    symbol: '♨',
    tag: 'DIABLO · MAZMORRA',
    text: 'Después la mazmorra: esqueletos, demonios y un chamán que tira maldiciones de lejos. El que se suma acá es Papasito, que dice que no le interesa el loot y lo levanta todo igual.',
    quote: 'Los objetos están ahí. Nadie dijo que fueran para vos.',
    background: 'inferno',
    overlay: null,
    art: 'La mazmorra del infierno',
  },
  {
    title: 'El desierto cobra deudas.',
    label: '05 / MUNDO 04 · LAS TIERRAS EXILIADAS',
    symbol: '⛓',
    tag: 'CONAN EXILES · CAMPAMENTO DE ESCLAVISTAS',
    text: 'El cuarto mundo es el de los esclavistas: redes, flechas y alquimistas con frascos de loto. En el campamento hay un boliviano —jujeño, insiste— encadenado a una rueda que necesita que alguien lo saque de ahí.',
    quote: 'Warrior. De Jujuy. Argentina. Igual no hay caso.',
    background: 'exiles',
    overlay: null,
    art: 'El campamento de los esclavistas',
  },
  {
    title: 'Sobreviví. Después discutimos.',
    label: '06 / MUNDO 05 · DISCORD CORRUPTO',
    symbol: '⚡',
    tag: 'OBJETIVO · VOLVER AL DISCORD',
    text: 'El último mundo es el servidor mismo: recicla los zombis, los minions, los demonios y los esclavistas, y en la quinta oleada devuelve a todos los jefes que ya caíste. El que cierra la partida es El Administrador del Servidor.',
    quote: 'No es un error. Es una característica.',
    background: 'discord',
    overlay: 'administrator',
    art: 'El Administrador del Servidor',
  },
];
