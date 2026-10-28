# Discord Survivors — Sistema narrativo y cinemáticas

**Estado:** diseño narrativo acordado  
**Propósito:** contexto y requisitos para el agente de desarrollo.  
**Referencias:** jugabilidad de supervivencia por oleadas tipo *Brotato*; puesta en escena narrativa inspirada en *Dave the Diver*.

## 1. Objetivo

Contar la historia de los actos de **Discord Survivors** sin convertir las oleadas en una sucesión de interrupciones. La acción principal sigue siendo el combate en una arena tipo *Brotato*. La narrativa se comunica por medio de diálogos y sonidos durante el combate, conversaciones con retratos al inicio y al final de los mundos, y eventos guionizados dentro del escenario para acontecimientos que requieren mostrarse visualmente.

**Regla central:** si los personajes solo hablan o reaccionan, se muestra durante el gameplay. Si sucede algo importante que se necesita *ver*, se usa una secuencia guionizada. No crear cinemáticas automáticamente por terminar una oleada.

## 2. Recursos narrativos

### 2.1. Conversaciones en primera persona (inicio y final de acto)

- Se utilizan **al comenzar cada mundo/acto y al terminarlo**.
- Estilo de conversaciones de *Dave the Diver*: retratos grandes de los personajes que intervienen, nombre del hablante, texto, expresiones y posibilidad de efectos de sonido.
- Diálogos **con avance manual**, para permitir leer chistes y conversaciones completas; ofrecer opción de saltar escena.
- «Primera persona» se refiere a la **presentación de la conversación** desde el punto de vista de quienes hablan, no a convertir el combate en un videojuego con cámara en primera persona.
- En los cierres de mundo, estas conversaciones pueden incluir al **Administrador del Servidor** y servir de transición narrativa al siguiente mundo.
- No se requiere un video pre-renderizado para estas charlas.

### 2.2. Diálogos y sonidos durante las oleadas (banter)

- Conversaciones breves, burlas, chistes, discusiones, reacciones, intentos de llamada, ruidos y efectos característicos de personajes.
- **No interrumpen ni pausan el combate**: el jugador conserva el control y los ataques/enemigos continúan.
- Visualización discreta: cuadro con nombre/retrato en una zona que no tape la acción o globo junto al sprite para frases muy breves.
- Audios y efectos pueden tener sentido narrativo por sí mismos (por ejemplo, un teléfono llamando sin respuesta).
- Evitar saturación: priorizar líneas importantes, limitar superposiciones y retrasar o suprimir comentarios secundarios si el combate está demasiado cargado.
- Diferenciar los diálogos de historia obligatorios de los comentarios opcionales o repetibles.

### 2.3. Eventos guionizados dentro del mapa (scripted sequences)

- Para encuentros, rescates, apariciones y acontecimientos que se deben **mostrar** visualmente.
- Se mantiene **el mismo escenario y los sprites del juego**: no se cambia a un video tradicional.
- Temporalmente el juego controla los personajes: desplazamiento automático, animaciones, cámara que sigue o enfoca, aparición de entidades/objetos, acciones y diálogos sincronizados.
- Durante la secuencia puede bloquearse el control y pausarse el combate, según lo que requiera la escena; devolver el control y restablecer la cámara al finalizar.
- Se permite modificar o ampliar temporalmente la zona visible para que ocurran eventos fuera de la arena habitual, si el diseño del nivel lo necesita.
- Inspiración concreta: escenas de *Dave the Diver* en las que Dave descubre a las sirenas, abre la entrada a su mundo o salva a la ballena: sucede todo dentro del juego mediante movimientos y cámara dirigidos.

### 2.4. Splash cinematográfico

- Presentación visual breve y destacada de personajes nuevos, minijefes, jefes y momentos especialmente importantes.
- Arte grande del personaje/elemento, nombre, composición especial, zoom, movimiento, partículas o efectos de sonido.
- Normalmente **acompaña** una escena guionizada: primero se muestra el evento en el mundo y, cuando corresponde, aparece el splash.
- No es obligatorio para cada diálogo ni cada oleada. Evitar la repetición innecesaria cuando un encuentro ya se ha visto.
- Puede producirse con ilustraciones y animación por capas del motor; no se exige video pre-renderizado.

## 3. Flujo estándar de un acto

1. **Inicio del acto:** conversación en primera persona con retratos, nombre y avance manual.
2. **Oleadas normales:** combate estilo *Brotato*; diálogos, discusiones y sonidos en tiempo real sin quitar el control.
3. **Acontecimiento importante:** secuencia guionizada dentro del escenario, en el punto preciso de la historia donde ocurre; splash si presenta a alguien/algo relevante.
4. **Minijefes:** pueden tener una introducción cinemática breve y/o splash cuando aporten a la historia.
5. **Jefe final:** presentación guionizada de mayor peso, potencialmente con splash.
6. **Final del acto:** conversación en primera persona estilo *Dave the Diver*, especialmente con el Administrador cuando corresponda, y transición al mundo siguiente.

**Importante:** no forzar un evento cinematográfico en todas las oleadas. Su ubicación la dicta el guion existente.

## 4. Ejemplos narrativos ya acordados

### Acto 4 — Conan Exiles / encuentro con Warrior

- **Antes de la oleada 3:** como máximo conversaciones y sonidos durante la pelea; no crear cinemáticas artificiales solo para rellenar.
- **Oleada 3:** aparece **Warrior**; el encuentro se representa como **secuencia guionizada dentro de la arena** y puede terminar con **splash de presentación**. Los personajes y la cámara se mueven automáticamente para mostrar lo que ocurre.
- **Después de su aparición:** Warrior puede intervenir en comentarios durante el combate.
- **Minijefes y jefe:** se permiten escenas breves de aparición y splash, ajustadas a su importancia.
- **Cierre:** conversación narrativa con retratos, según el guion del acto.

**Nota de fidelidad al personaje:** Warrior es un personaje asociado mecánicamente a humo, hongos y control de masas. Sus particularidades al hablar son un rasgo de caracterización, **no una habilidad mecánica**. Respetar los diálogos e historia ya aprobados.

### Acto 3 — Papasito

- **Intentos de llamar a Papasito y falta de respuesta:** suceden **durante el combate**, mediante diálogo breve y audio de llamada, sin detener la partida.
- **Cuando Papasito aparece realmente:** se activa **cinemática guionizada dentro del mapa**, con puesta en escena y posible splash de presentación.
- Separar así la **anticipación narrativa** del **evento visual de aparición**.

### Acto 5 — Discord Corrupto: La Última Partida

- Los comentarios del Administrador y las reacciones a cambios del servidor pueden ocurrir durante el combate.
- Cambios sustanciales del escenario, apariciones de jefes y el desenlace pueden merecer eventos guionizados.
- **No presentar a Maxi como jefe**: aparece **solo después de derrotar al Administrador del Servidor**, según el guion aprobado, y revela por qué programó la experiencia.

## 5. Reglas de ritmo y experiencia

- Prioridad máxima: **mantener el ritmo del combate**.
- Nunca bloquear el juego por un chiste breve o una conversación de poca importancia.
- Reservar pausas para eventos narrativos importantes y conversaciones de apertura/cierre.
- Los comentarios en combate deben ser cortos, legibles y no obstruir visibilidad del jugador, enemigos o proyectiles.
- Las secuencias guionizadas deben ser concisas y ajustadas al hecho narrativo; **no imponer una duración fija** por tipo de evento.
- Las escenas vistas previamente deben poder saltarse, especialmente al repetir actos o tras una derrota.
- Los eventos de historia deben activarse de forma determinista y controlada; evitar que se repitan accidentalmente al reiniciar una oleada o restaurar partida.
- Mantener audio de gameplay y diálogos compatibles: evitar que sonidos se superpongan hasta hacerse ininteligibles.

## 6. Requisitos funcionales orientativos para el agente

Diseñar una solución **reutilizable y basada en datos**, no codificar cada escena como una excepción irrepetible.

**Componentes conceptuales:**

- **Narrative Director:** dispara escenas por acto, oleada, evento o resultado.
- **Dialogue UI:** retratos, nombre, texto, expresiones, avance manual/automático según tipo.
- **Banter Manager:** cola, prioridad y timing de comentarios/sonidos no bloqueantes.
- **Sequence Director:** coordina acciones guionizadas en orden o en paralelo.
- **Actor Controller:** movimiento y animaciones automáticas de personajes/entidades.
- **Camera Controller:** foco, seguimiento, desplazamiento, zoom y restauración.
- **Splash Presenter:** presentaciones visuales especiales.
- **State/Progression:** registra activación, escena vista y avance del acto.

**Acciones que debería poder describir una escena** (conceptuales, no API cerrada): `show_dialogue`, `play_sound`, `lock_input`, `pause_or_clear_combat`, `move_actor`, `play_animation`, `camera_focus`, `camera_pan`, `camera_zoom`, `spawn_entity`, `trigger_world_event`, `show_splash`, `wait`, `restore_camera`, `resume_combat`, `unlock_input`.

El agente deberá adaptar los nombres y la arquitectura a las tecnologías efectivamente elegidas para el juego. Estos componentes son responsabilidades sugeridas, **no instrucciones para agregar clases innecesarias**.

## 7. Cómo adaptar los guiones de los actos

**No reescribir ni inventar el lore o los diálogos aprobados.** Hacer una segunda pasada sobre los documentos de historia existentes y anotar cada momento con:

- `act_id`, `wave_id` y punto de activación (`act_start`, `during_wave`, `wave_end`, `boss_spawn`, `boss_defeat`, `act_end`, etc.).
- Tipo: `first_person_dialogue`, `banter`, `scripted_sequence`, `splash` o combinación.
- Personajes que participan y líneas exactas existentes.
- Acciones en mapa y cambios de cámara necesarios.
- Efectos de sonido y splash, cuando aplique.
- Política de control (continúa gameplay / bloqueado / pausa de combate).
- Condición para finalizar y devolver el control.
- Comportamiento si se repite una partida.

Los ejemplos de este documento **no sustituyen el contenido canónico** de cada acto. Ante diferencias sobre frases, jefe, orden de acontecimientos o ubicación de escenas, prevalece el guion aprobado; las decisiones nuevas se señalan para revisión.

## 8. Criterios de aceptación

1. Cada acto puede abrir y cerrar con un diálogo con retratos, legible y de avance manual.
2. Se pueden reproducir líneas y efectos de sonido durante una oleada sin interrumpir el combate.
3. Se puede ejecutar una escena donde sprites se mueven automáticamente y la cámara dirige la atención, luego se restaura el gameplay.
4. Una escena puede incluir un splash de presentación opcional.
5. Acto 3: llamada no contestada durante el combate; aparición de Papasito en escena guionizada.
6. Acto 4: encuentro de Warrior en oleada 3 mediante escena guionizada, sin forzar escenas anteriores.
7. Minijefes y jefes admiten presentaciones especiales sin que cada oleada exija una.
8. Las escenas narrativas se pueden omitir al repetir contenido sin romper la progresión.
9. Los diálogos, personajes y giros argumentales aprobados se conservan.

---

**Decisión de diseño resumida:** *Brotato* como base del combate; charlas en primera persona al inicio y al final de cada mundo; banter y sonidos durante la pelea; escenas de movimiento automático dentro del mapa para sucesos importantes; splash para presentaciones destacadas.
