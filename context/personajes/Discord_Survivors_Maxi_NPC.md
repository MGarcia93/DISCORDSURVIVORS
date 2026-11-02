# Discord Survivors — Maxi (creador / NPC final)

**Estado:** diseño visual y rol narrativo APROBADOS.  
**Fecha de consolidación:** 2026-10-30.  
**Alcance:** referencia para el agente que implemente el personaje, su retrato, sus sprites y su aparición final.  
**Importante:** no rediseñar el personaje. Las dos imágenes adjuntas **son el resultado final**, no referencias de estilo para generar otras.

## 1. Identidad y función

- **Nombre en el juego:** Maxi. Para distinguirlo internamente, utilizar `maxi_creator` o `maxi_npc`, **no** confundirlo con **Maxi Negro**, que es otro personaje.
- **Rol:** personaje no jugable (NPC / cameo narrativo).
- **Mundo de aparición:** Acto 5 — **Discord Corrupto: La Última Partida**.
- **Momento:** aparece **después** de que el grupo derrota al jefe final **El Administrador del Servidor**.
- **No es** el Administrador del Servidor, **no es** el jefe final, **no pelea**, **no forma parte de los personajes seleccionables** y **no se desbloquea** como luchador.
- **Revelación narrativa aprobada:** Maxi es quien programó y organizó todo el juego para entretener a sus amigos, que no podían ponerse de acuerdo sobre qué jugar esa noche.
- **Tono del remate:** metahumor y humor interno del grupo. La revelación debe sentirse como un cierre cómico, no como una amenaza o una nueva fase de combate.

## 2. Diseño visual DEFINITIVO

### 2.1 Retrato para cinemáticas / diálogos

**Asset oficial:** [`Discord_Survivors_Maxi_NPC_assets/maxi_cinematica_aprobado.png`](./Discord_Survivors_Maxi_NPC_assets/maxi_cinematica_aprobado.png)  
**Origen entregado por el usuario:** `32378.png`.  
**Formato:** PNG RGBA, **480 × 600 px**.

Rasgos fijados por la ilustración aprobada:

- Pixel art **plano**, de formas grandes, con una paleta acotada y sombras simples.
- Retrato en primer plano, de busto.
- Cara alargada, cabello corto y oscuro, cejas oscuras, ojos oscuros.
- Barba y bigote cortos.
- **Sin anteojos.**
- Capucha puesta, en tonos grises; buzo de cuerpo azul oscuro y mangas grises.
- Expresión neutra / ligeramente seria.
- Archivo preparado para componer sobre el UI de diálogos. Respetar la transparencia existente.

**Regla visual:** usar esta imagen para la aparición conversacional; no reemplazarla por los retratos anteriores generados con anteojos, mayor realismo u otro nivel de detalle.

### 2.2 Sprites de escena / movimiento

**Asset oficial:** [`Discord_Survivors_Maxi_NPC_assets/maxi_sprites_aprobados.png`](./Discord_Survivors_Maxi_NPC_assets/maxi_sprites_aprobados.png)  
**Origen entregado por el usuario:** `32380.png`.  
**Formato de la lámina de referencia:** PNG RGBA, **947 × 335 px**.

La lámina contiene cuatro poses, en este orden **de izquierda a derecha**:

| Orden | Etiqueta exacta | Uso previsto |
| --- | --- | --- |
| 1 | `Idle / right` | Maxi quieto, mirando a la derecha |
| 2 | `Idle / left` | Maxi quieto, mirando a la izquierda |
| 3 | `Walk / right` | Maxi caminando a la derecha |
| 4 | `Walk / left` | Maxi caminando a la izquierda |

Rasgos visibles aprobados:

- Sprite simplificado de proporciones compactas y líneas pixeladas, **sin suavizado ni sombreado detallado**.
- Capucha gris, buzo azul oscuro con mangas grises y marcas claras mínimas sobre el pecho.
- Jogging gris y pantuflas / calzado oscuro de entrecasa.
- Cabello oscuro, barba corta, ojos visibles; **sin anteojos**.
- Estética coherente con el resto de los personajes de Discord Survivors.

**Observación técnica importante:** esta lámina incluye fondo oscuro y textos de identificación y **no tiene canal alfa útil para separar el personaje** (el canal alfa es opaco en toda la imagen). Es una lámina visual aprobada, no un atlas transparente listo para importar. Para usarla en el motor, extraer las cuatro figuras sin incluir fondo, etiquetas ni sombras de presentación. **La extracción no habilita a rediseñar el arte.** Mantener los píxeles, siluetas, colores y proporciones originales; no interpolar ni aplicar filtros bilineales.

**Alcance de las animaciones:** hay cuatro **poses/estados aprobados**, no una secuencia compleja de varios cuadros por dirección. Si el motor necesita dar sensación de movimiento con una sola pose, usar desplazamiento y, de ser necesario, un `bob` mínimo sin modificar el dibujo. No inventar nuevos fotogramas o direcciones como si estuvieran aprobados.

## 3. Coherencia entre retrato y sprite

Ambos archivos corresponden **al mismo personaje**. Para mantener la coherencia:

- Mantener el buzo azul, mangas/capucha grises, barba corta y **ausencia de anteojos**.
- El retrato es una representación cercana del rostro; el sprite es deliberadamente más simple por la escala de juego.
- No añadir armas, armaduras, efectos mágicos, halos, coronas ni accesorios de "jefe".
- No utilizar fotos reales ni generaciones anteriores en lugar de estos assets finales.
- No buscar realismo adicional ni aumentar la cantidad de píxeles de detalle.

## 4. Integración con la historia del Acto 5

**Orden narrativo obligatorio:**

1. Se desarrolla el Acto 5 y los personajes enfrentan al **Administrador del Servidor**, jefe final de ese acto.
2. El grupo **derrota** al Administrador. El combate ha terminado.
3. **Recién entonces** se presenta a Maxi como personaje independiente.
4. En una escena de diálogo / cinemática, Maxi explica que **él programó todo para entretener a sus amigos** porque no lograban decidir qué jugar.
5. La escena funciona como remate y cierre de la historia; no comienza un nuevo combate.

Para mostrarlo, seguir el sistema de cinemáticas ya definido para el juego: detener o automatizar temporalmente la acción, presentar la conversación con **nombre + retrato pixel art** en la interfaz y utilizar el sprite de escena cuando sea necesario mostrarlo físicamente en el mundo. Mantener coherencia con los diálogos de primera persona y los splash/retratos usados en los otros actos.

**No inventar como canon un diálogo literal sin aprobación.** El guion definitivo del Acto 5 tiene prioridad para el texto exacto de la escena. Si el agente necesita redactar líneas nuevas, proponerlas por separado, como pendientes de aprobación.

## 5. Personalidad y humor: guía, no nuevo canon

El personaje representa al propio creador y amigo del grupo, no a una figura heroica. Su aparición puede apoyarse en la ironía de que alguien invirtió una cantidad absurda de trabajo en crear un juego para una noche en la que nadie se ponía de acuerdo. El humor tiene que encajar con las cargadas entre amigos del resto de la historia.

**No asumir** como hechos confirmados otros defectos, apodos, maneras de hablar ni chistes personales de Maxi. Si se quiere profundizar su personalidad o añadir un gag nuevo, tratarlo como **propuesta a validar**.

## 6. Reglas de implementación para el agente

**Identificadores sugeridos** (adaptar a la nomenclatura real del proyecto):

```text
characterId: maxi_creator
characterType: npc
isPlayable: false
isBoss: false
appearanceAct: 5
appearanceTrigger: after_final_boss_defeated
cinematicPortrait: maxi_cinematica_aprobado.png
spriteSheetReference: maxi_sprites_aprobados.png
spriteStates:
  - idle_right
  - idle_left
  - walk_right
  - walk_left
```

Estas claves son **sugerencias de integración**, no un esquema de datos obligatorio. Antes de modificar archivos del juego, revisar la arquitectura, el sistema de personajes, el sistema de diálogo/cinemáticas y las convenciones existentes.

**Restricciones:**

- No agregar a Maxi al selector de personajes ni a la progresión de habilidades/estadísticas/ítems de combate.
- No crear mecánicas de ataque, vida, defensa, hitboxes de combate ni patrones de jefe para Maxi.
- No hacer aparecer a Maxi antes de la derrota del Administrador de forma que arruine la sorpresa.
- No intercambiar su identidad con Maxi Negro ni con El Administrador del Servidor.
- No rehacer el sprite o retrato: **usar los dos archivos aprobados**.

## 7. Criterios de aceptación

- [ ] Se utiliza el **retrato aprobado** `maxi_cinematica_aprobado.png` en los diálogos.
- [ ] Se utilizan las **cuatro poses aprobadas** de `maxi_sprites_aprobados.png` para representar a Maxi en escena.
- [ ] Los sprites de producción se extraen de la lámina sin sus rótulos/fondo y conservan pixel art nítido.
- [ ] Maxi aparece únicamente **tras la victoria contra El Administrador del Servidor**.
- [ ] El diálogo comunica que él creó el juego para entretener a sus amigos que no se ponían de acuerdo.
- [ ] Maxi no es luchador, jefe, enemigo ni personaje seleccionable.
- [ ] Retrato y sprites comparten vestuario y rasgos, **sin anteojos**.
- [ ] Las líneas nuevas, animaciones no existentes o comportamientos adicionales se marcan como pendientes de aprobación.

## 8. Fuente de verdad

**Orden de prioridad en caso de contradicciones:**

1. Los **dos PNG aprobados adjuntos** son la fuente de verdad de la apariencia.
2. El **guion definitivo del Acto 5** es la fuente de verdad de los hechos y los diálogos.
3. Este documento fija el rol y las restricciones de integración de Maxi.
4. Cualquier imagen generada antes, nombre inventado o escena propuesta no aprobada queda fuera de la especificación.
