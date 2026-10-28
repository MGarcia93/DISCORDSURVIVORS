import { isCharacterUnlocked, isDebugUnlockAll } from '../progression.mjs';
import { drawElNegro, drawSolago, drawPatrona, drawChair, drawWarrior, drawPapazito } from '../sprites.mjs';
import { rounded } from '../game/renderer.mjs';
import { state } from '../app/state.mjs';

// Selection screen: roster grid, profile panel and the animated preview.
// Still literal per character; profiles and previews move into the fichas.
export function characters() {
  state.solagoUnlocked = isCharacterUnlocked('solago');
  state.warriorUnlocked = isCharacterUnlocked('warrior');
  state.papazitoUnlocked = isCharacterUnlocked('papazito');
  state.debugUnlockAll = isDebugUnlockAll();
  if (!state.solagoUnlocked && state.selectedCharacter === 'solago') state.selectedCharacter = 'negro';
  if (!state.warriorUnlocked && state.selectedCharacter === 'warrior') state.selectedCharacter = 'negro';
  if (!state.papazitoUnlocked && state.selectedCharacter === 'papazito') state.selectedCharacter = 'negro';
  const solago = state.selectedCharacter === 'solago' && state.solagoUnlocked;
  const warrior = state.selectedCharacter === 'warrior' && state.warriorUnlocked;
  const papazito = state.selectedCharacter === 'papazito' && state.papazitoUnlocked;
  const rosterButton = (id, name, unlocked, chosen) => `<button class="roster-card ${chosen ? 'selected' : ''} ${unlocked ? '' : 'locked-card'}" data-character="${id}" aria-label="${name}, ${unlocked ? chosen ? 'seleccionado' : 'disponible' : 'bloqueado; ganá el mapa anterior para desbloquearlo'}" ${unlocked ? '' : 'disabled'}>${unlocked ? `<canvas id="roster-${id}" width="52" height="58" aria-hidden="true"></canvas>` : '<span aria-hidden="true">?</span>'}<small>${name}</small></button>`;
  const roster = `${rosterButton('negro', 'Negro', true, !solago && !warrior && !papazito)}${rosterButton('solago', 'Solago', state.solagoUnlocked, solago)}${rosterButton('warrior', 'Warrior', state.warriorUnlocked, warrior)}${rosterButton('papazito', 'Papazito', state.papazitoUnlocked, papazito)}${['Maxi', 'Jhonny', 'Pasasito', 'Tomi'].map(name => `<div class="roster-card locked-card" aria-label="${name}, no disponible en este prototipo"><span aria-hidden="true">?</span><small>${name}</small></div>`).join('')}`;
  const unlockedCount = 1 + (state.solagoUnlocked ? 1 : 0) + (state.warriorUnlocked ? 1 : 0) + (state.papazitoUnlocked ? 1 : 0);
  const warriorProfile = `
      <div class="eyebrow">Controlador · Dificultad media</div><h2>WARRIOR</h2>
      <p class="character-desc">Chamán del norte que jura ser argentino, aunque nadie descifra su acento. Los ojos siempre rojos, el humo siempre encima y una bolsita de hongos de la que nadie pregunta demasiado.</p>
      <p class="character-quote">«Yo soy argentino, boludo».</p>
      <div class="stats warrior-stats"><div><b>−15%</b><small>VIDA MÁXIMA</small></div><div><b>+350%</b><small>DAÑO POR BOMBA</small></div><div><b>+200%</b><small>ALCANCE</small></div><div><b>0,6</b><small>HONGOS/SEGUNDO</small></div><div><b>100%</b><small>VELOCIDAD</small></div></div>
      <div class="skill"><kbd>∞</kbd><div><b>HONGOS ALUCINÓGENOS</b><p>Tira hongos que explotan al impactar: daño en área y Confusión acumulable en el grupo.</p></div></div>
      <div class="skill"><kbd>◈</kbd><div><b>HUMO DE PROCEDENCIA DUDOSA</b><p>Nube periódica que ralentiza un 35% y hace fallar un 20% de los ataques enemigos.</p></div></div>
      <div class="skill"><kbd>Q</kbd><div><b>VIAJE ASTRAL</b><p>Círculo de esporas alucinógenas: daño continuo en área y desorientación. Recarga: 20 segundos.</p></div></div>
      <div class="skill"><kbd>E</kbd><div><b>ME DESAPAREZCO</b><p>Nube de humo enorme, invulnerable y reaparece de a chic: explosión de esporas al volver. Recarga: 30 segundos.</p></div></div>`;
  const papazitoProfile = `
      <div class="eyebrow">Atacante a distancia · Economía · Riesgo y recompensa</div><h2>PAPAZITO</h2>
      <p class="character-desc">El paraguayo trucho: no es albañil, no habla guaraní y por «¡ANAMENCUÁ!» sigue sin entender nada. Malvende su Pentium, pega con ladrillos y en cuanto la cariñosa le escribe entra en pánico.</p>
      <p class="character-quote">«No soy albañil, no hablo guaraní y no me devolvieron la seña».</p>
      <div class="stats papazito-stats"><div><b>+10%</b><small>VIDA MÁXIMA</small></div><div><b>+15%</b><small>DAÑO</small></div><div><b class="penalty">−10%</b><small>VELOCIDAD</small></div><div><b class="penalty">−10%</b><small>ATK/SEG</small></div><div><b>+10%</b><small>DEFENSA</small></div></div>
      <div class="skill"><kbd>∞</kbd><div><b>LADRILLAZO</b><p>Arroja ladrillos pesados y lentos: pega duro,pero con cadencia baja que las mejoras aceleran.</p></div></div>
      <div class="skill"><kbd>◈</kbd><div><b>LA SEÑA</b><p>La cariñosa le cobra la extorsión y le recorta monedas: 5 segundos de pánico con +30% de velocidad y +40% de ataque.</p></div></div>
      <div class="skill"><kbd>Q</kbd><div><b>LIQUIDÓ TODO</b><p>Menú de venta que pausa la acción: malvende pertenencias por fichas y daño temporal, a cambio de un debuff. Cada una se vende una vez por partida.</p></div></div>
      <div class="skill"><kbd>R</kbd><div><b>¡ANAMENCUÁ!</b><p>Ataque de furia: lluvia de ladrillos en todas las direcciones durante 5 segundos. Recarga: 40 segundos.</p></div></div>`;
  const profile = warrior ? warriorProfile : solago ? `
      <div class="eyebrow">Luchador cuerpo a cuerpo · Contraataque</div><h2>SOLAGO</h2>
      <p class="character-desc">Dientón, sin voz ni voto en su casa: hasta las hijas le sacan las cosas. Vive mirando de reojo, con miedo de que lo vuelvan a apuñalar por la espalda con una tijera.</p>
      <p class="character-quote">«Su mayor fortaleza son las paletas. Su mayor debilidad, que lo llamen de otra habitación».</p>
      <div class="stats solago-stats"><div><b>100</b><small>VIDA NORMAL</small></div><div><b>+35%</b><small>DAÑO MELEE</small></div><div><b>−5%</b><small>ALCANCE</small></div><div><b>+15%</b><small>DEFENSA</small></div><div><b>100%</b><small>VELOCIDAD</small></div></div>
      <div class="skill"><kbd>∞</kbd><div><b>MORDIDA DE PALETA</b><p>Mordidas automáticas de corto alcance y pegada pesada. Acercate para que cuenten.</p></div></div>
      <div class="skill"><kbd>◈</kbd><div><b>SONRISA BLINDADA</b><p>Cada tanto se ríe mostrando las paletas: +25% de defensa durante 2,5 segundos.</p></div></div>
      <div class="skill"><kbd>8×</kbd><div><b>PERMISO PARA JUGAR</b><p>Cada 8 bajas completás tareas y ganás +30% de daño y velocidad de ataque durante 8 segundos.</p></div></div>
      <div class="skill"><kbd>E</kbd><div><b>STAND: ¡LA PATRONA!</b><p>Solago se agacha y queda quieto mientras ella tijeretea en área durante 7 segundos. Al final también le pega. Recarga: 26 segundos.</p></div></div>` : `
      <div class="eyebrow">Tanque sedentario · Dificultad fácil</div><h2>EL NEGRO</h2>
      <p class="character-desc">Se cree blanco cuando es negro. Dice que se baña, pero nadie le cree. Amante de las coloradas, las Hello Kitty Girls y las sin papá.</p>
      <p class="character-quote">«El verdadero esfuerzo es levantarse».</p>
      <div class="stats"><div><b>+50%</b><small>VIDA MÁXIMA</small></div><div><b>+20%</b><small>DEFENSA</small></div><div><b class="penalty">−25%</b><small>VELOCIDAD</small></div></div>
      <div class="skill"><kbd>∞</kbd><div><b>ARSENAL GAMER</b><p>Alterna entre control remoto, joystick y celular. Cada tiro puede rebotar hasta tres enemigos.</p></div></div>
      <div class="skill"><kbd>☾</kbd><div><b>SEDENTARISMO EXTREMO</b><p>Quedate quieto 2 segundos para regenerar vida. Por fin una recompensa por no hacer nada.</p></div></div>
      <div class="skill"><kbd>Q</kbd><div><b>MODO OTAKU</b><p>Invocá una waifu pixel art durante 8 segundos. Recarga: 18 segundos.</p></div></div>
      <div class="skill"><kbd>E</kbd><div><b>ME DA PAJA</b><p>6 segundos en el sillón: daño en área, resistencia extra y casi nada de movimiento. Recarga: 22 segundos.</p></div></div>`;
  const selectorLabel = warrior ? 'Warrior' : solago ? 'Solago' : papazito ? 'Papazito' : 'El Negro';
  state.content.innerHTML = `
    <section class="screen">
    <header class="screen-heading"><div><div class="eyebrow">Preparar partida / 01</div><h1>ELEGÍ A TU SOBREVIVIENTE</h1></div><span class="screen-counter">${unlockedCount} / 8 DISPONIBLES</span></header>
    <div class="character-layout"><section aria-label="Personajes">
      <div class="sprite-stage"><canvas id="sprite-preview" width="256" height="190" role="img" aria-label="${warrior ? 'Pixel art de Warrior: banda roja, remera blanca estampada y buzo rosa de los 80' : solago ? 'Pixel art de Solago: remera oscura, reloj y paletas grandes' : papazito ? 'Pixel art de Papazito: remera negra, jean claro con ruedo, zapatillas blancas y la copa en la mano' : 'Sprite de El Negro: buzo amarillo, pelo negro recogido, lentes, mostacho, perilla y piercings'}"></canvas><span class="stage-label">P1 · SELECCIONADO</span><span class="sprite-name">${warrior ? 'WARRIOR' : solago ? 'SOLAGO' : papazito ? 'PAPAZITO' : 'EL NEGRO'}</span></div>
      <div class="roster">${roster}</div>
      <p class="roster-note">${state.debugUnlockAll ? 'MODO PRUEBA · PERSONAJES IMPLEMENTADOS DESBLOQUEADOS' : state.papazitoUnlocked ? 'PAPAZITO DESBLOQUEADO · CADENA DE MAPAS COMPLETADA' : state.warriorUnlocked ? 'WARRIOR DESBLOQUEADO · GANÁ EL MAPA CON WARRIOR PARA PAPAZITO' : state.solagoUnlocked ? 'SOLAGO DESBLOQUEADO · GANÁ EL MAPA 01 CON SOLAGO PARA WARRIOR' : 'SOLAGO · BLOQUEADO · GANÁ EL MAPA 01 PARA DESBLOQUEARLO'}</p>
    </section><section class="detail-panel" aria-label="Habilidades de ${selectorLabel}">${profile}</section></div>
    <div class="bottom-actions"><button class="secondary" data-action="home">← VOLVER</button><button class="primary" data-action="story-start">QUE EMPIECE EL DESASTRE ▶</button></div></section>`;
  const negroRoster = document.querySelector('#roster-negro');
  if (negroRoster) drawElNegro(negroRoster.getContext('2d'), 20, 47, { scale: 1 });
  const solagoRoster = document.querySelector('#roster-solago');
  if (solagoRoster) drawSolago(solagoRoster.getContext('2d'), 26, 47, { scale: 1 });
  const warriorRoster = document.querySelector('#roster-warrior');
  if (warriorRoster) drawWarrior(warriorRoster.getContext('2d'), 28, 46, { scale: 1 });
  const papazitoRoster = document.querySelector('#roster-papazito');
  if (papazitoRoster) drawPapazito(papazitoRoster.getContext('2d'), 26, 46, { scale: 1 });
  drawPreview(0);
}

export function drawPreview(time) {
  const canvas = document.querySelector('#sprite-preview');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#211c2d'; ctx.fillRect(0, 0, 256, 190);
  for (let y = 0; y < 155; y += 16) {
    for (let x = 0; x < 256; x += 24) {
      rounded(ctx, x + 1, y + 1, 22, 14, 0, (x + y) % 5 ? '#292133' : '#2e2538');
    }
  }
  rounded(ctx, 38, 151, 180, 10, 0, '#6a536b');
  rounded(ctx, 44, 161, 168, 5, 0, '#392b42');
  rounded(ctx, 42, 151, 172, 2, 0, '#ad8a99');
  const cycle = time % 10;
  if (state.selectedCharacter === 'warrior' && state.warriorUnlocked) {
    drawWarrior(ctx, 128, 150, { time, moving: cycle < 3.4, scale: 2 });
    return;
  }
  if (state.selectedCharacter === 'papazito' && state.papazitoUnlocked) {
    drawPapazito(ctx, 128, 151, { time, moving: cycle < 3.4, scale: 2 });
    return;
  }
  if (state.selectedCharacter === 'solago' && state.solagoUnlocked) {
    drawPatrona(ctx, 145, 151, { time, scale: 1.2 });
    drawSolago(ctx, 124, 150, { time, moving: cycle < 3.4, scale: 2 });
    return;
  }
  const isSitting = cycle > 6.6;
  const moving = cycle < 3.4;
  const previewFacing = isSitting ? 1 : cycle < 5 ? 1 : -1;
  if (isSitting) drawChair(ctx, 128, 150, { scale: 2 });
  drawElNegro(ctx, 128, 150, { time, moving, facing: previewFacing, sitting: isSitting, scale: 2 });
}
