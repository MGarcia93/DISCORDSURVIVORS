import { WIDTH, HEIGHT, WORLD_SCALE, UPGRADES, HEAL_COST, HEAL_AMOUNT, createRun, step, chooseUpgrade, buyHeal, sellBelonging, startNextWave, activateSpecial } from './engine.mjs';
import { drawElNegro, drawSolago, drawPatrona, drawChair, drawZombie, drawAdministrator, drawAnime, drawGamerProjectile, drawWarrior, drawPapazito, drawSmokeCloud, drawShroomBlast, drawAstralAura } from './sprites.mjs';
import { drawRoom, drawTitle, drawArena, drawStory, pixelText } from './scenes.mjs';
import { isCharacterUnlocked, isDebugUnlockAll, unlockAllForTesting } from './progression.mjs';
import { on } from './bus.mjs';
import { state } from './app/state.mjs';

// Any map victory passes through the bus: progression records the unlock and
// app reads it back to refresh the character roster cache.
on('waveCleared', ({ run: clearedRun }) => {
  if (clearedRun.phase !== 'won') return;
  state.solagoUnlocked = isCharacterUnlocked('solago');
  state.warriorUnlocked = isCharacterUnlocked('warrior');
  state.papazitoUnlocked = isCharacterUnlocked('papazito');
  clearedRun.unlockedSolago = state.solagoUnlocked;
  clearedRun.unlockedWarrior = state.warriorUnlocked;
  clearedRun.unlockedPapazito = state.papazitoUnlocked;
});

// A sale-menu special (ficha-defined items) pauses the state.run for its merchant UI.
on('specialActivated', ({ run: activatedRun, special }) => {
  if (activatedRun !== state.run || special !== 'sell' || activatedRun.phase !== 'playing') return;
  const p = activatedRun.player;
  const stock = p.characterDef.specials.find(spec => spec.key === 'sell')?.items ?? {};
  if (!Object.keys(stock).some(item => !p.soldItems?.[item])) return;
  state.sellMenuOpen = true;
  state.lastPhase = '';
});
const formatTime = seconds => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`;

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

function show(name) {
  state.screen = name;
  state.content.dataset.screen = name;
  state.keys.clear();
  if (name !== 'game') state.run = null;
  state.paused = false;
  state.sellMenuOpen = false;
  document.body.classList.toggle('in-game', name === 'game');
  if (name === 'home') home();
  if (name === 'characters') characters();
  if (name === 'story') story();
  if (name === 'game') game();
  state.content.focus({ preventScroll: true });
  window.scrollTo(0, 0);
}

function home() {
  state.content.innerHTML = `
    <section class="home-screen" aria-label="Menú principal">
      <canvas id="menu-scene" class="scene-backdrop" width="480" height="270" role="img" aria-label="Habitación pixel art: El Negro con buzo amarillo en el sillón, frente a su computadora"></canvas>
      <div class="home-content">
        <p class="chapter-label">UNA NOCHE MÁS EN EL SERVIDOR</p>
        <h1 class="sr-only">Discord Survivors — La última partida</h1>
        <canvas id="title-art" class="title-art" width="174" height="63" aria-hidden="true"></canvas>
        <p class="title-subtitle">— La última partida —</p>
        <nav class="main-menu" aria-label="Opciones del juego">
          <button class="primary" data-action="characters">EMPEZAR PARTIDA</button>
          <button class="pixel-button" data-action="controls">CONTROLES</button>
        </nav>
        <p class="menu-caption">El servidor se cayó.<br>Levantarse del sillón ya no es opcional.</p>
        <p class="menu-help">↑ ↓ ELEGIR &nbsp; / &nbsp; ENTER CONFIRMAR</p>
      </div>
      <div class="room-caption"><b>EL NEGRO</b>TANQUE SEDENTARIO</div>
      <div class="game-status"><span><b>●</b> UN JUGADOR · SIN CONEXIÓN AL SERVIDOR</span><span>PROTOTIPO 0.2 / PIXEL EDITION</span></div>
      <div id="menu-overlay"></div>
    </section>`;
  drawTitle(document.querySelector('#title-art'));
  drawRoom(document.querySelector('#menu-scene').getContext('2d'));
}

function characters() {
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

function story() {
  const page = stories[state.storyPage];
  state.content.innerHTML = `<section class="story-screen">
    <canvas id="story-scene" class="story-art" width="480" height="270" role="img" aria-label="${state.storyPage === 0 ? 'El Negro en su habitación' : state.storyPage === 1 ? 'El Negro rodeado de zombis' : 'El Administrador espera con su martillo'}"></canvas>
    <div class="story-chapter">${page.tag}</div>
    <div class="dialogue"><div class="eyebrow">${page.label}</div><h2>${page.title}</h2><p>${page.text}</p><p class="story-quote">“${page.quote}”</p>
    <div class="story-nav"><button class="secondary" data-action="story-back">← ATRÁS</button><div class="story-dots" aria-label="Página ${state.storyPage + 1} de 3">${stories.map((_, i) => `<span class="${i === state.storyPage ? 'current' : ''}">◆</span>`).join('')}</div><div class="actions">${state.storyPage < 2 ? '<button class="secondary" data-action="play">SALTAR HISTORIA</button>' : ''}<button class="primary" data-action="story-next">${state.storyPage === 2 ? 'ENTRAR AL CAOS' : 'CONTINUAR'} ▶</button></div></div></div></section>`;
  drawStory(document.querySelector('#story-scene'), state.storyPage, 0);
  state.content.focus({ preventScroll: true });
}

function game() {
  state.run = createRun(Math.random, state.selectedCharacter);
  state.facing = 1;
  state.lastPhase = '';
  const def = state.run.player.characterDef;
  const abilityButtons = def.specials
    .map(special => `<button class="ability" data-special="${special.key}"><kbd>${special.hotkey.toUpperCase()}</kbd> <span>${special.name}</span></button>`)
    .join('');
  state.content.innerHTML = `
    <section class="game-screen">
    <div class="arena-header"><div><div class="eyebrow">Mundo 01 · El apocalipsis de los boludos</div><h2 id="wave-title">OLEADA 01 <span class="muted">/ 04</span></h2></div><button class="secondary" data-action="pause">Ⅱ PAUSA</button></div>
    <div class="arena-wrap"><canvas width="1144" height="748" aria-label="Arena de supervivencia ampliada. Movete con WASD o las flechas. Q y E activan tus habilidades."></canvas>
      <div class="hud"><div class="health-box"><div class="hud-label"><span id="player-name"></span><span id="hp-label"></span></div><div class="hp-track"><div class="hp-fill" id="hp-fill"></div></div></div><div class="hud-numbers"><span id="coins"></span><span id="timer"></span></div></div>
      <div id="task-panel" class="task-panel" ${def.taskHud ? '' : 'hidden'}><div><b>PERMISO PARA JUGAR</b><span id="task-label"></span></div><div class="task-track"><div id="task-fill" class="task-fill"></div></div></div>
      <div id="game-overlay"></div>
    </div>
    <div class="game-controls"><div class="key-help"><kbd>W A S D</kbd> / <kbd>↑ ← ↓ →</kbd> Mover <span>·</span> Ataque automático <span>·</span><kbd>ESC</kbd> Pausa</div>
      <div class="touch-pad" aria-label="Movimiento táctil"><button data-direction="up" aria-label="Arriba">↑</button><button data-direction="left" aria-label="Izquierda">←</button><button data-direction="down" aria-label="Abajo">↓</button><button data-direction="right" aria-label="Derecha">→</button></div>
      <div class="ability-buttons">${abilityButtons}</div></div>
    <p class="game-note">${def.gameNote}</p></section>`;
  const canvas = document.querySelector('.arena-wrap canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  updateHUD();
}

function overlay() {
  const box = document.querySelector('#game-overlay');
  if (!box || !state.run) return;
  const phase = state.sellMenuOpen ? 'sellMenu' : state.paused ? 'paused' : state.run.phase;
  if (state.lastPhase === phase) return;
  state.lastPhase = phase;
  if (phase === 'playing') { box.innerHTML = ''; return; }
  let body = '';
  if (phase === 'paused') body = `<div class="eyebrow">Micrófono silenciado</div><h2>UN MOMENTO DE PAJA.</h2><p>La horda puede esperar. La partida está pausada.</p><div class="actions"><button class="primary" data-action="resume">SEGUIR JUGANDO</button><button class="secondary" data-action="home">SALIR AL INICIO</button></div>`;
  if (phase === 'sellMenu') {
    // Data-driven merchant: every special that carries an items table owns a
    // pause-sale menu; nothing here knows a character id.
    const stockEntry = state.run.player.characterDef.specials.find(special => special.items);
    const stock = stockEntry?.items ?? {};
    const saleCopy = item => {
      const boost = [`+${item.coins} fichas`];
      if (item.damageFrac) boost.push(`+${Math.round(item.damageFrac * 100)}% daño ${item.damageTtl}s`);
      const penalty = [];
      if (item.moveSlowFrac) penalty.push(`−${Math.round(item.moveSlowFrac * 100)}% velocidad ${item.moveSlowTtl}s`);
      if (item.atkSlowFrac) penalty.push(`−${Math.round(item.atkSlowFrac * 100)}% cadencia ${item.atkSlowTtl}s`);
      if (item.defFrac) penalty.push(`−${Math.round(item.defFrac * 100)}% defensa ${item.defTtl}s`);
      if (item.visionTtl) penalty.push(`visión borrosa ${item.visionTtl}s`);
      return { boost: boost.join(' · '), penalty: penalty.join(' · ') };
    };
    const cards = Object.entries(stock).map(([key, item]) => {
      const sold = state.run.player.soldItems?.[key];
      const { boost, penalty } = saleCopy(item);
      return `<button class="upgrade" data-sale="${key}" ${sold ? 'disabled' : ''}><b>📦 ${item.label}</b><span>${boost}</span><small>${sold ? 'YA LO MALVENDIÓ' : penalty}</small></button>`;
    }).join('');
    const itemsLeft = Object.keys(stock).some(key => !state.run.player.soldItems?.[key]);
    body = `<div class="eyebrow">Fondo para la cariñosa</div><h2>¿QUÉ SE VENDE HOY?</h2><p>Cada venta paga fichas y daño temporal, con su debuff correspondiente. Todo se vende una vez por partida. <b>«Total, no lo usaba»</b>.</p><p class="shop-hint"><b>${state.run.coins} fichas disponibles</b></p><div class="shop-grid">${cards}</div><div class="shop-footer"><button class="primary" data-action="sell-menu-close">${itemsLeft ? 'VOLVER A TIRAR LADRILLOS' : 'YA NO QUEDA NADA'} →</button></div>`;
  }
  if (phase === 'shop') {
    const cards = UPGRADES.map(u => {
      const level = state.run.upgrades[u.id] || 0;
      const maxed = level >= u.costs.length;
      const cost = maxed ? 0 : u.costs[level];
      const disabled = maxed || state.run.coins < cost;
      return `<button class="upgrade" data-upgrade="${u.id}" ${disabled ? 'disabled' : ''}><b>${u.icon} ${u.name}</b><span>${u.description}</span><small>${maxed ? `NIVEL ${level}/${u.costs.length} · MÁXIMO` : `NIVEL ${level}/${u.costs.length} · ${cost} FICHAS`}</small></button>`;
    }).join('');
    const full = state.run.player.hp >= state.run.player.maxHp;
    const healDisabled = full || state.run.coins < HEAL_COST;
    body = `<div class="eyebrow">Oleada ${state.run.wave} completada</div><h2>SEGUÍS VIVO. INCREÍBLE.</h2><p>Gastá el botín. Las mejoras se acumulan y cada nivel cuesta más.<br><b>${state.run.coins} fichas disponibles</b> · +20 por sobrevivir</p><p class="shop-hint">DESLIZÁ PARA VER TODAS LAS MEJORAS ↓</p><div class="shop-grid">${cards}<button class="upgrade shop-heal" data-heal ${healDisabled ? 'disabled' : ''}><b>✚ DELIVERY DE EMERGENCIA</b><span>Te hacés traer ${HEAL_AMOUNT} de vida ahora mismo.</span><small>${full ? 'VIDA COMPLETA' : `${HEAL_COST} FICHAS`}</small></button></div><div class="shop-footer"><button class="primary" data-action="next-wave">${state.run.wave === 3 ? 'ENFRENTAR AL ADMINISTRADOR' : 'SIGUIENTE OLEADA'} →</button></div>`;
  }
  if (phase === 'dead' || phase === 'won') body = `<div class="eyebrow">${phase === 'won' ? 'Conexión restablecida' : 'Se desconectó del canal'}</div><h2>${phase === 'won' ? 'EL SERVIDOR ES TUYO.' : state.run.player.characterDef.deathLine ?? 'SE TERMINÓ LA PAJA.'}</h2><p>${phase === 'won' ? state.run.unlockedSolago ? '¡Solago desbloqueado! Ya podés elegirlo en la próxima partida.' : state.run.unlockedWarrior ? '¡Warrior desbloqueado! Ya podés elegirlo en la próxima partida.' : state.run.unlockedPapazito ? '¡Papazito desbloqueado! Vino por la seña, se queda por los ladrillos.' : 'Derrotaste al Administrador. Ahora falta decidir qué jugar.' : 'Murió haciendo lo que amaba: el mínimo esfuerzo posible.'}</p><p>${state.run.kills} enemigos · ${formatTime(state.run.elapsed)} de supervivencia · Oleada ${state.run.wave}</p><div class="actions"><button class="primary" data-action="play">OTRA PARTIDA</button><button class="secondary" data-action="home">VOLVER AL INICIO</button></div>`;
  box.innerHTML = `<div class="overlay" role="dialog" aria-modal="true" aria-label="${phase === 'shop' ? 'Mejoras entre oleadas' : phase === 'paused' ? 'Partida pausada' : 'Resultado de la partida'}"><div class="${phase === 'shop' ? 'shop-dialog' : ''}">${body}</div></div>`;
  box.querySelector('button:not(:disabled)')?.focus({ preventScroll: true });
}

function updateHUD() {
  const p = state.run.player;
  document.querySelector('#player-name').textContent = p.characterDef.name;
  document.querySelector('#hp-label').textContent = `${Math.ceil(p.hp)}/${p.maxHp}`;
  document.querySelector('#hp-fill').style.width = `${p.hp / p.maxHp * 100}%`;
  document.querySelector('#coins').textContent = `◈ ${state.run.coins}`;
  document.querySelector('#timer').textContent = state.run.wave === 4 ? `☠ JEFE · ${formatTime(state.run.time)}` : formatTime(Math.max(0, state.run.duration - state.run.time));
  document.querySelector('#wave-title').innerHTML = `${state.run.wave === 4 ? 'EL ADMINISTRADOR' : `OLEADA 0${state.run.wave}`} <span class="muted">/ 04</span>`;
  const taskPanel = document.querySelector('#task-panel');
  const task = p.characterDef.taskHud?.(p);
  if (taskPanel && task) {
    document.querySelector('#task-fill').style.width = `${task.percentage}%`;
    document.querySelector('#task-label').textContent = task.label;
    taskPanel.classList.toggle('boost-active', task.active);
  }
  for (const special of p.characterDef.specials) {
    const button = document.querySelector(`[data-special="${special.key}"]`);
    const cooldown = p[`${special.key}Cooldown`];
    button.disabled = cooldown > 0 || state.paused || state.sellMenuOpen || state.run.phase !== 'playing';
    button.querySelector('span').textContent = cooldown > 0 ? `${Math.ceil(cooldown)}s`
      : (p.characterDef.specialHudLabel?.(special, p) ?? special.name);
  }
}

function rounded(ctx, x, y, width, height, radius, fill) {
  ctx.fillStyle = fill;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(width), Math.round(height));
}

function pixelRing(ctx, x, y, radius, color) {
  ctx.save();
  ctx.globalAlpha *= 0.65;
  ctx.fillStyle = color;
  for (let i = 0; i < 48; i++) {
    const angle = i / 48 * Math.PI * 2;
    ctx.fillRect(Math.round((x + Math.cos(angle) * radius) / 4) * 4, Math.round((y + Math.sin(angle) * radius) / 4) * 4, 4, 4);
  }
  ctx.restore();
}

function controls() {
  document.querySelector('#menu-overlay').innerHTML = `<div class="overlay" role="dialog" aria-modal="true" aria-label="Controles"><div>
    <div class="eyebrow">Manual de supervivencia</div><h2>CON LO MÍNIMO ALCANZA</h2>
    <p><kbd>WASD</kbd> / <kbd>↑ ← ↓ →</kbd> Moverse<br>El control remoto ataca automáticamente.</p>
    <p><kbd>Q</kbd> Modo Otaku · <kbd>E</kbd> Me da paja<br><kbd>ESC</kbd> Pausar la partida</p>
    <p>Quedate quieto 2 segundos para regenerar vida.<br>En pantalla táctil usá las flechas y los botones.</p>
    <button class="primary" data-action="close-controls">ENTENDIDO</button>
    </div></div>`;
  document.querySelector('[data-action="close-controls"]').focus();
}

function closeControls() {
  document.querySelector('#menu-overlay').innerHTML = '';
  document.querySelector('[data-action="controls"]').focus();
}

function drawPreview(time) {
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

// Sprite map: kind -> drawer for the non-player figures. Adding a character or
// a special figure only needs an entry here, not new branching in draw().
const FIGURE_DRAWERS = {
  chair: (ctx, figure) => drawChair(ctx, figure.x, figure.y, { scale: 2 }),
  stand: (ctx, figure, time) => drawPatrona(ctx, figure.x, figure.y + 38 * WORLD_SCALE, { time, scale: 2 }),
  boss: (ctx, figure, time) => drawAdministrator(ctx, figure.x, figure.y + 77, { time, scale: 4 }),
};

function draw() {
  const canvas = document.querySelector('.arena-wrap canvas');
  const ctx = canvas?.getContext('2d');
  if (!ctx || !state.run) return;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingEnabled = false;
  drawArena(ctx, WIDTH, HEIGHT);
  const p = state.run.player;
  const astral = p.characterDef.specials.find(special => special.key === 'astral');
  if (p.astral > 0 && astral) {
    drawAstralAura(ctx, p.x, p.y, astral.radius, state.run.elapsed, Math.min(1, p.astral / 0.4));
  }
  if (p.chair > 0) {
    ctx.fillStyle = '#a18aff12'; ctx.strokeStyle = '#a18aff66'; ctx.lineWidth = 2;
    pixelRing(ctx, p.x, p.y, 145 * 1.1, '#a18aff');
  }
  const figures = [...run.enemies];
  if (p.chair > 0) figures.push({ x: p.x, y: p.y - 0.6, kind: 'chair' });
  if (p.stand > 0) figures.push({ x: p.x + 13 * WORLD_SCALE, y: p.y - 1, kind: 'stand' });
  figures.push({ x: p.x, y: p.y, kind: 'player' });
  figures.sort((a, b) => a.y - b.y);
  for (const figure of figures) {
    if (figure.kind === 'player' && p.immune > 0 && Math.floor(p.immune * 14) % 2) ctx.globalAlpha = 0.45;
    if (figure.kind === 'player') {
      p.characterDef.draw(ctx, figure.x, figure.y + 38,
        { time: state.run.elapsed, moving: p.still === 0, facing: state.facing, player: p });
    } else if (FIGURE_DRAWERS[figure.kind]) {
      FIGURE_DRAWERS[figure.kind](ctx, figure, state.run.elapsed);
    } else {
      drawZombie(ctx, figure.x, figure.y + 31, { kind: figure.kind, time: state.run.elapsed, seed: figure.id, scale: 2 });
    }
    ctx.globalAlpha = 1;
    if (figure.kind !== 'player' && (figure.kind === 'boss' || figure.hp < figure.maxHp)) {
      const width = (figure.kind === 'boss' ? 90 : 30) * 1.1;
      const y = Math.max(6, figure.y - (figure.kind === 'boss' ? 138 : 62) * 1.1);
      rounded(ctx, figure.x - width / 2, y, width, 4, 2, '#070b0b');
      rounded(ctx, figure.x - width / 2, y, width * Math.max(0, figure.hp / figure.maxHp), 4, 2, figure.kind === 'boss' ? '#b499f2' : '#d7f779');
    }
  }
  if (p.anime > 0) drawAnime(ctx, p.x + 48, p.y - 35, { time: state.run.elapsed, scale: 1 });
  if (p.smile > 0) {
    // Solago's aura hugs his half-width, shorter frame instead of the tank-sized ring.
    pixelRing(ctx, p.x, p.y + 2, 34 * WORLD_SCALE, '#e8dfa1');
    pixelText(ctx, 'JA!', p.x - 16 * WORLD_SCALE, p.y - 42 * WORLD_SCALE, 2, '#e8dfa1');
  }
  if (p.stand > 0) pixelRing(ctx, p.x, p.y, 170 * WORLD_SCALE, '#a89ac6');
  if (p.still >= 2 && p.hp < p.maxHp) {
    const regen = p.characterDef.regenHud?.(p);
    if (regen) {
      pixelRing(ctx, p.x, regen.ringY, regen.radius, '#bfd890');
      pixelText(ctx, 'REGEN', regen.textX, regen.textY, 2, '#bfd890');
    }
  }
  if (p.sellVisionTtl > 0) {
    // The sold monitor: a forgiving pixel vignette hugging the arena edges.
    // It darkens scenery only; HUD and ability bars are DOM, never covered.
    ctx.save();
    const blur = Math.min(1, p.sellVisionTtl);
    const edge = 96 * WORLD_SCALE;
    const bands = [
      [0, 0, WIDTH, edge], [0, HEIGHT - edge, WIDTH, edge],
      [0, 0, edge * 0.6, HEIGHT], [WIDTH - edge * 0.6, 0, edge * 0.6, HEIGHT],
    ];
    for (const [x, y, w, h] of bands) {
      ctx.globalAlpha = 0.34 * blur;
      ctx.fillStyle = '#0b0912';
      ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
    }
    for (let i = 1; i <= 3; i++) {
      const inset = edge * (0.25 + i * 0.22);
      ctx.globalAlpha = 0.13 * blur;
      ctx.fillStyle = '#0b0912';
      ctx.fillRect(inset, inset, WIDTH - inset * 2, 26);
      ctx.fillRect(inset, HEIGHT - inset - 26, WIDTH - inset * 2, 26);
      ctx.fillRect(inset, inset, 26, HEIGHT - inset * 2);
      ctx.fillRect(WIDTH - inset - 26, inset, 26, HEIGHT - inset * 2);
    }
    ctx.restore();
  }
  for (const shot of state.run.projectiles) {
    ctx.save(); ctx.translate(Math.round(shot.x), Math.round(shot.y)); ctx.rotate(Math.floor(shot.angle / (Math.PI / 2)) * Math.PI / 2);
    if (shot.device === 'remote' || shot.device === 'joystick' || shot.device === 'phone' || shot.device === 'shroom' || shot.device === 'brick') {
      drawGamerProjectile(ctx, shot.device);
    } else {
      rounded(ctx, -6, -2, 12, 4, 0, '#d4b6ff'); rounded(ctx, -2, -6, 4, 12, 0, '#e7d8f2');
    }
    ctx.restore();
  }
  ctx.textAlign = 'center'; ctx.font = 'bold 14px monospace';
  for (const effect of state.run.effects) {
    ctx.globalAlpha = Math.min(1, effect.ttl * 2);
    if (effect.kind === 'smoke') {
      drawSmokeCloud(ctx, effect.x, effect.y, effect.r, state.run.elapsed, ctx.globalAlpha);
      continue;
    }
    if (effect.kind === 'shroomBlast') {
      drawShroomBlast(ctx, effect.x, effect.y, effect.radius,
        1 - effect.ttl / effect.duration);
      continue;
    }
    if (typeof effect.text !== 'string') continue;
    ctx.fillStyle = effect.loot ? '#d7f779' : effect.kind === 'stand' ? '#d9c4ef' : effect.kind === 'smile' ? '#fff0ae' : '#f4e9dc';
    ctx.fillText(effect.text, effect.x, effect.y);
  }
  ctx.globalAlpha = 1;
}

function frame(timestamp) {
  const dt = state.lastFrame ? (timestamp - state.lastFrame) / 1000 : 0;
  state.lastFrame = timestamp;
  if (state.screen === 'game' && state.run) {
    const input = {
      x: (state.keys.has('d') || state.keys.has('arrowright') ? 1 : 0) - (state.keys.has('a') || state.keys.has('arrowleft') ? 1 : 0),
      y: (state.keys.has('s') || state.keys.has('arrowdown') ? 1 : 0) - (state.keys.has('w') || state.keys.has('arrowup') ? 1 : 0),
    };
    if (input.x) state.facing = input.x > 0 ? 1 : -1;
    if (!state.paused && !state.sellMenuOpen) step(state.run, dt, input);
    draw();
    state.hudElapsed += dt;
    if (state.hudElapsed > 0.08 || state.run.phase !== state.lastPhase) { updateHUD(); state.hudElapsed = 0; }
    overlay();
  }
  const animationTime = state.reducedMotion.matches ? 4 : timestamp / 1000;
  if (state.screen === 'characters') drawPreview(animationTime);
  if (state.screen === 'home') drawRoom(document.querySelector('#menu-scene').getContext('2d'), animationTime);
  if (state.screen === 'story') drawStory(document.querySelector('#story-scene'), state.storyPage, animationTime);
  requestAnimationFrame(frame);
}

document.addEventListener('click', event => {
  const button = event.target.closest('button');
  if (!button || button.disabled) return;
  const action = button.dataset.action;
  if (button.dataset.character && isCharacterUnlocked(button.dataset.character)) {
    state.selectedCharacter = button.dataset.character;
    characters();
  }
  if (action === 'controls') controls();
  if (action === 'close-controls') closeControls();
  if (['home', 'characters'].includes(action)) show(action);
  if (action === 'story-start') { state.storyPage = 0; show('story'); }
  if (action === 'story-back') { if (state.storyPage > 0) { state.storyPage--; story(); } else show('characters'); }
  if (action === 'story-next') { if (state.storyPage < 2) { state.storyPage++; story(); } else show('game'); }
  if (action === 'play') show('game');
  if (action === 'pause' && state.run?.phase === 'playing') { state.paused = !state.paused; state.keys.clear(); }
  if (action === 'resume') { state.paused = false; state.keys.clear(); }
  if (action === 'sell-menu-close') { state.sellMenuOpen = false; state.lastPhase = ''; state.keys.clear(); overlay(); updateHUD(); }
  if (action === 'next-wave') { startNextWave(state.run); state.keys.clear(); }
  if (button.dataset.sale && state.run) {
    sellBelonging(state.run, button.dataset.sale);
    const stock = state.run.player.characterDef.specials.find(s => s.key === 'sell')?.items ?? {};
    if (!Object.keys(stock).some(key => !state.run.player.soldItems?.[key])) state.sellMenuOpen = false;
    state.lastPhase = '';
    overlay(); updateHUD();
  }
  if (button.dataset.special && state.run && !state.paused) activateSpecial(state.run, button.dataset.special);
  if (button.dataset.upgrade && state.run) { chooseUpgrade(state.run, button.dataset.upgrade); state.lastPhase = ''; overlay(); updateHUD(); }
  if (button.dataset.heal && state.run) { buyHeal(state.run); state.lastPhase = ''; overlay(); updateHUD(); }
});

document.addEventListener('keydown', event => {
  const key = event.key.toLowerCase();
  if (key === 'tab' && document.querySelector('.overlay')) {
    const buttons = [...document.querySelectorAll('.overlay button:not(:disabled)')];
    const first = buttons[0]; const last = buttons.at(-1);
    if (event.shiftKey && document.activeElement === first) { last?.focus(); event.preventDefault(); }
    if (!event.shiftKey && document.activeElement === last) { first?.focus(); event.preventDefault(); }
  }
  if (state.screen !== 'game') {
    if (key === 'escape' && document.querySelector('#menu-overlay .overlay')) closeControls();
    if (state.screen === 'home' && event.altKey && event.shiftKey && key === 'u') {
      if (unlockAllForTesting()) {
        state.debugUnlockAll = true;
        state.solagoUnlocked = true;
        state.warriorUnlocked = true;
        state.papazitoUnlocked = true;
        state.selectedCharacter = 'negro';
        show('characters');
      }
      event.preventDefault();
      return;
    }
    if (['arrowup', 'arrowdown'].includes(key) && !document.querySelector('.overlay')) {
      const buttons = [...content.querySelectorAll('button:not(:disabled)')];
      const current = buttons.indexOf(document.activeElement);
      const next = current < 0 ? 0 : (current + (key === 'arrowdown' ? 1 : -1) + buttons.length) % buttons.length;
      buttons[next]?.focus();
      event.preventDefault();
    }
    if (key === 'enter' && document.activeElement === state.content) {
      state.content.querySelector('button.primary')?.click();
      event.preventDefault();
    }
    return;
  }
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) event.preventDefault();
  if (key === 'escape' && !event.repeat && state.run.phase === 'playing') {
    if (state.sellMenuOpen) { state.sellMenuOpen = false; state.lastPhase = ''; state.keys.clear(); overlay(); updateHUD(); }
    else { state.paused = !state.paused; state.keys.clear(); }
  }
  if (!state.paused && !state.sellMenuOpen && !event.repeat && state.run.phase === 'playing') {
    for (const special of state.run.player.characterDef.specials) {
      if (special.hotkey === key) activateSpecial(state.run, special.key);
    }
  }
  if (!state.paused && !state.sellMenuOpen) state.keys.add(key);
});
document.addEventListener('keyup', event => state.keys.delete(event.key.toLowerCase()));
const directions = { up: 'w', left: 'a', down: 's', right: 'd' };
document.addEventListener('pointerdown', event => {
  const button = event.target.closest('[data-direction]');
  if (!button) return;
  event.preventDefault(); button.setPointerCapture(event.pointerId); state.keys.add(directions[button.dataset.direction]);
});
for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) document.addEventListener(name, event => {
  const button = event.target.closest('[data-direction]');
  if (button) state.keys.delete(directions[button.dataset.direction]);
});
function suspend() { state.keys.clear(); if (state.screen === 'game' && state.run?.phase === 'playing') state.paused = true; }
window.addEventListener('blur', suspend);
document.addEventListener('visibilitychange', () => { if (document.hidden) suspend(); });
show('home');
requestAnimationFrame(frame);
