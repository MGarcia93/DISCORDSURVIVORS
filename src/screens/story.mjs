import { drawStory } from '../scenes.mjs';
import { storyPages } from './story-pages.mjs';
import { state } from '../app/state.mjs';

// Narrative interludes between the selection screen and the arena. The pages
// themselves live in story-pages.mjs so each one can name its own world.
export function story() {
  const page = storyPages[state.storyPage];
  state.content.innerHTML = `<section class="story-screen">
    <canvas id="story-scene" class="story-art" width="480" height="270" role="img" aria-label="${page.art}"></canvas>
    <div class="story-chapter">${page.tag}</div>
    <div class="dialogue"><div class="eyebrow">${page.label}</div><h2>${page.title}</h2><p>${page.text}</p><p class="story-quote">“${page.quote}”</p>
    <div class="story-nav"><button class="secondary" data-action="story-back">← ATRÁS</button><div class="story-dots" aria-label="Página ${state.storyPage + 1} de ${storyPages.length}">${storyPages.map((_, i) => `<span class="${i === state.storyPage ? 'current' : ''}">◆</span>`).join('')}</div><div class="actions">${state.storyPage < storyPages.length - 1 ? '<button class="secondary" data-action="play">SALTAR HISTORIA</button>' : ''}<button class="primary" data-action="story-next">${state.storyPage === storyPages.length - 1 ? 'ENTRAR AL CAOS' : 'CONTINUAR'} ▶</button></div></div></div></section>`;
  drawStory(document.querySelector('#story-scene'), page, 0);
  state.content.focus({ preventScroll: true });
}
