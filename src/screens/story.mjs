import { drawStory } from '../scenes.mjs';
import { state } from '../app/state.mjs';

// Narrative interludes between the selection screen and the arena.
const stories = [
  { title: 'Una partida. Era todo lo que pedíamos.', label: '01 / EL ÚLTIMO MENSAJE', symbol: '⌁', tag: 'CANAL DE VOZ · 23:47',
    text: 'Una noche cualquiera. Uno quiere jugar al LoL, otro al Diablo, otro al Zomboid. El Negro no quiere instalar nada. Después de horas sin decidir, alguien propone Monopoly.',
    quote: 'El servidor no soportó una discusión más. Literalmente.' },
  { title: 'Bienvenidos al apocalipsis de los boludos.', label: '02 / CONEXIÓN PERDIDA', symbol: '☠', tag: 'MUNDO 01 · ZONA INFECTADA',
    text: 'El Discord colapsó y mezcló todos los mundos que jugaban. Ahora hay zombis en el servidor, demonios esperando loot y cobradores de alquiler. Esta primera incursión empieza entre los muertos.',
    quote: 'Los zombis te persiguen. Los corredores llegan antes. Ninguno respeta el AFK.' },
  { title: 'Sobreviví. Después discutimos.', label: '03 / LA ÚLTIMA PARTIDA', symbol: '♜', tag: 'OBJETIVO · VOLVER AL DISCORD',
    text: 'Elegí a tu sobreviviente, aguantá tres oleadas y comprá mejoras entre rondas. En la cuarta te espera El Administrador del Servidor. Derrotalo para cerrar esta primera partida.',
    quote: 'Vos caminá. El control remoto pega solo. Si no te movés por dos segundos, recuperás vida.' },
];

export function story() {
  const page = stories[state.storyPage];
  state.content.innerHTML = `<section class="story-screen">
    <canvas id="story-scene" class="story-art" width="480" height="270" role="img" aria-label="${state.storyPage === 0 ? 'El Negro en su habitación' : state.storyPage === 1 ? 'El Negro rodeado de zombis' : 'El Administrador espera con su martillo'}"></canvas>
    <div class="story-chapter">${page.tag}</div>
    <div class="dialogue"><div class="eyebrow">${page.label}</div><h2>${page.title}</h2><p>${page.text}</p><p class="story-quote">“${page.quote}”</p>
    <div class="story-nav"><button class="secondary" data-action="story-back">← ATRÁS</button><div class="story-dots" aria-label="Página ${state.storyPage + 1} de 3">${stories.map((_, i) => `<span class="${i === state.storyPage ? 'current' : ''}">◆</span>`).join('')}</div><div class="actions">${state.storyPage < 2 ? '<button class="secondary" data-action="play">SALTAR HISTORIA</button>' : ''}<button class="primary" data-action="story-next">${state.storyPage === 2 ? 'ENTRAR AL CAOS' : 'CONTINUAR'} ▶</button></div></div></div></section>`;
  drawStory(document.querySelector('#story-scene'), state.storyPage, 0);
  state.content.focus({ preventScroll: true });
}
