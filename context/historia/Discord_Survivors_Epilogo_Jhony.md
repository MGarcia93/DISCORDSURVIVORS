# Discord Survivors — Epílogo de Jhony

> **Documento de implementación para el agente**  
> **Título:** «No me traigas más zombis»  
> **Estado:** guion base aprobado; especificaciones jugables propuestas donde se indica.  
> **Duración:** seis oleadas.  
> **Mundo:** Project Zomboid (segunda visita, después de la campaña y del epílogo de Papafrita).

## 1. Reglas de canon y continuidad

- El epílogo comienza en Discord después de que **Maxi (programador)** baneó a Papafrita de Monster Hunter y lo expulsó forzosamente al Discord. Papafrita ya no está atrapado en Monster Hunter.
- Jhony permaneció en Project Zomboid desde el Acto 1. No es un jefe enemigo; es un **NPC aliado**. Al finalizar debe regresar al Discord con el grupo.
- Maxi (programador) no es un personaje jugable ni un jefe. Abre el portal y manda al grupo a buscar a Jhony haciéndose el boludo.
- Los cuatro que viajan son **Maxi Negro, Solago, Papasito y Warrior**. Si el juego permite seleccionar otro personaje, preservar a los cuatro como participantes de las cinemáticas; el jugador controla a su personaje elegido y el resto puede representarse como retratos/acompañantes según el sistema existente.
- **Secuencia inalterable:** inicio Discord → portal → los cuatro corren a la base → encuentro «¡ME TRAJERON TODA LA PUTA CIUDAD!» → **oleada 1** → diálogo sobre la casa y las cajas → Negro activa alarma de auto → **oleadas 2–6** → Jhony vuelve al Discord → postcréditos.
- Mantener los diálogos en el orden indicado. No inventar cambios a voces aprobadas al implementar.
- Voz: Papasito es paraguayo del interior, generalmente educado; Warrior jujeño, sin caricaturizar dificultades del habla; Maxi seco y breve; Jhony tryhard y temperamental; Negro vago, bocón; Solago se suma a cargadas.
- Sin obligar a que Jhony sea jugable al completar; el posible desbloqueo se define aparte.

## 2. Presentación, sistemas y restricciones técnicas

### Sistema de oleadas

- Mantener la lógica de combate survivor/Brotato del juego: oleada de enemigos → fin → progreso/mejoras/tienda según el sistema global → siguiente oleada.
- Las **seis oleadas** pertenecen al mismo escenario de la base de Jhony, con sectores y defensas que cambian entre oleadas; evitar crear seis mapas totalmente diferentes.
- Durante cinemáticas, pausar spawn, daño y cronómetro. Durante la pelea, los diálogos breves aparecen como overlay sin detener el combate.
- El guion marca qué diálogos son previos, durante o posteriores; los overlays durante combate deben dispararse **una vez** con prioridad para que no se pisen.
- El sistema de stats general sigue siendo: Vida, Defensa, Ataque, Distancia de ataque, Velocidad de ataque y Velocidad de movimiento. No crear stat separado de ataque melee.
- **Duraciones, cantidades exactas, HP/ATK/velocidades, drops y escalados numéricos quedan a balanceo**: no confundir las sugerencias de comportamiento con números aprobados.

### Estado persistente del escenario

- `baseGateDamaged`: luego de oleada 1.
- `carAlarmActive`: se activa exclusivamente después de la conversación sobre la base; justifica oleadas 2–6. Puede cesar físicamente antes del final si conviene, pero las hordas convocadas ya están en camino.
- `trapsEnabled`: oleada 2.
- `warehouseDamaged`: oleada 3.
- `basePerimeterBreached`: oleadas 4–5.
- `truckHornActive`: oleada 6, cesa al completar objetivo del jefe.
- `jhonyReturnsToDiscord`: verdadero únicamente después de la cinemática final.

### NPC aliado Jhony

- Pelea como aliado, nunca dañable por ataques del jugador, nunca bloquea el movimiento. El agente debe usar, si existe, el controlador de aliados actual.
- Rol: defensa de base y apoyo a distancia. Ataca enemigos cercanos con arma de fuego; al terminar cada oleada vuelve a su ubicación de escena.
- IA sugerida: priorizar enemigos que atacan la entrada, depósito o cultivos; buscar línea de visión; mantenerse próximo a posiciones de defensa; sin perseguir enemigos fuera de la zona.
- Sus disparos y animaciones deben ser compatibles con los sprites minimalistas; no recrear un shooter complejo.
- Las trampas o barricadas son ayudas del escenario y **no nuevas estadísticas de personaje**.

## 3. Catálogo de enemigos del epílogo

> **Diseño propuesto para implementar; los nombres y parámetros precisos pueden balancearse.** Reutilizar las familias de zombis del Acto 1 cuando sea posible y distinguir variantes por sprite pequeño, color/equipamiento y conducta.

| Enemigo | Aspecto legible en pixel art | Comportamiento | Papel / aparición |
|---|---|---|---|
| Zombi común | ropa civil rota, silueta simple | persigue al jugador más cercano; contacto cuerpo a cuerpo | masa principal, oleadas 1–6 |
| Corredor | cuerpo inclinado, movimiento rápido | poco resistente; acorta distancias, castiga quedarse quieto | presión móvil, 1–6 |
| Zombi trabajador | overol/casco simple | algo más resistente; avanza hacia barricadas y objetivos de base | primeras brechas, 1 y 3 |
| Zombi policía | uniforme azul oscuro | resistencia media; se agrupa hacia accesos laterales | oleadas 2 y 4 |
| Zombi protegido | ropa gruesa/chaleco | recibe menos daño, lento; protege el avance de otros | oleadas 2 y 5 |
| Zombi militar | casco y uniforme verde | alta resistencia, avanza en línea hacia zonas vulnerables | oleadas 4–6 |
| Zombi blindado | silueta ancha y placa visible | lento, resistente, fuerza rutas en oleadas finales | oleadas 5 y 6 |
| **Minijefe: El Bombero** | bombero grande con casco y traje | embestida anunciada, destruye barricadas del depósito, ventana vulnerable tras embestir | oleada 3 |
| **Jefe: La Horda del Camión** | camión con bocina y zombis agrupados | evento de avance y objetivos, refuerzos hasta silenciar bocina; la amenaza principal es el conjunto | oleada 6 |

### Reglas generales de IA enemiga

1. Enemigos normales siguen al jugador; si el objetivo de oleada está en riesgo, algunos priorizan puertas, depósito o cultivos (sin requerir sistema destructible global: pueden usarse triggers y daños visuales).
2. Corredores flanquean por accesos abiertos. Los pesados mantienen presión frontal.
3. Las puertas y barricadas pueden ser objetos del escenario con estados intacto/dañado/roto. Si la infraestructura actual no permite HP de objetos, usar destrucciones **scripted entre fases** en vez de añadir un sistema nuevo.
4. Mantener telegráficos claros para embestidas y hordas; ninguna muerte instantánea sin aviso.
5. Ajustar cantidades al rendimiento y densidad actual del juego.

---

## 4. Cinemática inicial — «El último que falta»

**Lugar:** Discord, inmediatamente después del epílogo de Papafrita.  
**Presentación:** retratos/nombre, cámara estática. Maxi aparece después de que lo mencionan.

*El grupo está de vuelta en Discord. Maxi acaba de banear a Papafrita de Monster Hunter y sacarlo por la fuerza.*

**Negro:** Bueno. Uno menos.

**Solago:** ¿Uno menos? ¡Si Maxi lo tuvo que sacar a la fuerza!

**Negro:** Y bueno, pero volvió. Cuenta.

**Papasito:** Por lo menos ya estamos todos.

**Warrior:** Falta Jhony.

*Silencio.*

**Negro:** ...

**Negro:** Uh.

**Solago:** ¿Recién te acordás?

**Negro:** Yo pensé que había vuelto.

*Aparece Maxi.*

**Maxi:** No.

**Negro:** ¿Sigue en el Project Zomboid?

**Maxi:** Sí.

**Solago:** ¿Desde el primer mundo?

**Maxi:** Sí.

**Negro:** ...

**Negro:** Bueno, tampoco pasó tanto.

**Maxi:** Para él sí.

**Negro:** Che, ¿y le mandaste mensaje?

**Maxi:** Sí.

**Solago:** ¿Y qué dijo?

**Maxi:** Nada. Ya saben cómo es Jhony, no mira los mensajes.

**Negro:** Bueno, sacalo como hiciste con Papafrita.

**Maxi:** Dale.

*Maxi empieza a tocar unas cosas en la computadora.*

**Solago:** ¿Lo estás sacando?

**Maxi:** Sí, sí.

**Negro:** Bueno, listo.

*De repente aparece un portal debajo de los cuatro.*

**Negro:** Pará, ¿qué hacés?

**Maxi:** Vayan a buscarlo.

**Negro:** ¡PERO LA CONCHA DE TU MADRE!

*Los cuatro caen por el portal.*

*Maxi se queda mirando la pantalla.*

**Maxi:** Qué paja.

*Se cierra el portal.*

### Transición al mapa

- Los cuatro llegan al mundo de Project Zomboid y **corren directamente hasta la casa de Jhony**; es una secuencia de desplazamiento sin combate ni oleada adicional.
- Mostrar visualmente que vienen corriendo y que una horda los sigue. No activar daño ni oleada hasta finalizar la cinematica de encuentro.
- La base debe verse significativamente más fortificada que en el Acto 1: murallas, cultivos, generador, galpón, depósito, auto y cajas. Estética plana, pixel art consistente.

## 5. Cinemática de llegada — «La visita»

*Los cuatro aparecen en Project Zomboid. Reconocen el mundo del primer acto y empiezan a correr para buscar a Jhony.*

*Tras atravesar las calles, encuentran una base enorme, rodeada por murallas y barricadas.*

*Jhony está cerca de la entrada. Los ve acercarse corriendo.*

**Jhony:** No.

**Negro:** ¿Qué?

**Jhony:** No, no, no, no…

**Solago:** ¿Qué pasa?

**Jhony:** ¿USTEDES VINIERON CORRIENDO HASTA ACÁ?

**Negro:** Sí.

**Jhony:** …

**Jhony:** ¡ME TRAJERON TODA LA PUTA CIUDAD!

*La cámara muestra una horda enorme de zombis que viene persiguiéndolos.*

**COMIENZA LA OLEADA 1.**

## 6. Oleada 1 — «No toques nada»

**Causa:** los cuatro arrastraron a todos los zombis mientras corrían hacia Jhony.  
**Enemigos:** zombis comunes, corredores y zombis trabajadores.  
**Objetivo jugable:** acabar con la primera horda junto a la entrada de la base.

**Desarrollo de gameplay:**

- Primeros segundos: la horda se acerca desde la calle por donde corrieron los protagonistas.
- Aparecen comunes en grupos amplios, corredores que alcanzan a personajes alejados y trabajadores que golpean la puerta.
- Jhony defiende como NPC y puede apuntar prioritariamente a zombis junto a la entrada.
- Al finalizar, la puerta queda visualmente dañada (`baseGateDamaged=true`); no es un fail automático si un zombi se acerca a ella, a menos que el sistema general de misión ya lo soporte.

### Durante la oleada

**Jhony:** ¡No se separen de la base!

**Negro:** ¡Me están siguiendo todos!

**Jhony:** ¡Y SÍ, PELOTUDO, VOS LOS TRAJISTE!

**Solago:** ¡Son una banda!

**Jhony:** ¡Hay armas en el galpón!

**Negro:** ¿Cuál galpón?

**Jhony:** ¡EL QUE TENÉS ADELANTE!

### Final de oleada — «Las 2.000 horas»

*Desaparecen los últimos zombis. Jhony examina las barricadas.*

**Jhony:** Me hicieron mierda la entrada.

**Papasito:** Pero aguantó bastante bien.

**Jhony:** Porque la hice bien.

**Negro:** Bueno, viste. No pasó nada.

**Jhony:** ¡ME ROMPIERON LA PUERTA!

**Negro:** Y bueno, hacés otra.

**Jhony:** ...

**Solago:** No, Negro. No lo ayudés más.

*El grupo entra a la base y observa las construcciones, los cultivos, los vehículos y las cajas perfectamente ordenadas.*

**Solago:** A la mierda.

**Papasito:** Qué grande es esto.

**Negro:** ¿Vos hiciste toda esta base?

**Jhony:** Sí.

**Negro:** Qué enfermo de mierda.

**Jhony:** ¿Qué querés? ¿Que me quede parado como un pelotudo?

**Solago:** Igual, alta base te mandaste.

**Jhony:** Y sí. Me vi unas guías, armé una buena build, limpié toda la zona...

**Negro:** ¿Y para qué tenés tantas cajas?

**Jhony:** Para organizar las cosas.

**Negro:** ¿Y esta?

**Jhony:** Herramientas.

**Negro:** ¿Y esta?

**Jhony:** Comida.

**Negro:** ¿Y esta?

**Jhony:** ¡NEGRO, NO ME ROMPÁS LAS PELOTAS CON LAS CAJAS!

*El Negro se aleja y se acerca a un auto estacionado.*

**Negro:** Che, ¿y este auto funciona?

**Jhony:** Sí, pero no lo toqués.

**Negro:** A ver.

**Jhony:** ¡NEGRO!

*Suena la alarma del auto.*

*Silencio.*

**Jhony:** ...

**Negro:** Ah.

**Solago:** JAJAJAJA.

**Jhony:** Apagala.

**Negro:** ¿Cómo?

**Jhony:** ¡APAGÁ LA ALARMA!

*Se escuchan zombis a lo lejos.*

**Jhony:** La concha de tu madre...

**Negro:** Bueno, tampoco es para tanto.

*La cámara se aleja y muestra una horda enorme acercándose desde varios lados.*

**Jhony:** ¡ME LIMPIÉ TODA LA PUTA CIUDAD Y EN CINCO MINUTOS ME TRAJISTE TODOS LOS ZOMBIS!

*La alarma continúa sonando y atrae más enemigos.*

**Nota de secuencia:** esta escena es el detonante de **todas** las oleadas 2–6. No colocarla antes de la oleada 1.

## 7. Oleada 2 — «La build perfecta»

**Enemigos:** zombis policías, corredores y zombis con protección.  
**Mecánica principal:** activar la línea de defensa de Jhony: trampas, barricadas y zonas de fuego.

**Desarrollo de gameplay:**

- Horda desde dos accesos; policías y protegidos avanzan frente a corredores.
- Las trampas automáticas de la base causan daño de área con enfriamiento y avisos visuales. Evitar fuego amigo.
- Jhony apunta desde una posición defensiva central.
- Las defensas sirven como demostración del esfuerzo/obsesión de Jhony; los enemigos no deben desaparecer sin que el jugador participe.

### Antes de empezar

**Jhony:** Escuchen. Vamos a hacer una cosa. Yo cubro la entrada, ustedes limpian los costados.

**Negro:** Dale.

**Jhony:** No se manden solos.

**Negro:** Dale.

**Jhony:** Y no toquen las trampas.

**Negro:** Dale, Jhony.

**Solago:** No escuchó una mierda.

**Negro:** Sí escuché.

**Solago:** ¿Qué dijo?

**Negro:** Que hay que matar zombis.

**Jhony:** ...

### Durante la oleada

*Se activa una de las trampas de Jhony y elimina varios enemigos.*

**Papasito:** Epa, esa trampa está buena.

**Jhony:** Es una build que vi en una guía.

**Negro:** ¿No podés jugar sin mirar guías?

**Jhony:** ¿Qué tiene de malo mirar una guía?

**Negro:** Nada, pregunto.

**Jhony:** Vos tenés dos mil horas y no sabés ni poner una puerta.

**Negro:** Bueno, pará.

### Final de oleada

**Solago:** Igual, che, funciona bien todo esto.

**Jhony:** Obvio que funciona.

**Negro:** Para mí le falta una pileta.

**Jhony:** ¿Una qué?

**Negro:** Una pileta. Para el verano.

**Jhony:** Estamos en un apocalipsis zombi.

**Negro:** ¿Y? Hace calor igual.

## 8. Oleada 3 — «El depósito»

**Minijefe:** El Bombero.  
**Enemigos:** zombis comunes, trabajadores y bombero blindado.  
**Objetivo:** eliminar al minijefe y despejar la zona del depósito.

**Desarrollo de gameplay:**

- Enemigos atacan el acceso al depósito. Al llegar al umbral de la fase se muestra cinemática y aparece el Bombero.
- **El Bombero:** se desplaza despacio, telegrafía una embestida recta, golpea al final y queda brevemente expuesto. Su choque contra una barricada causa la destrucción visual del acceso.
- Comunes y trabajadores sirven de escolta, sin tapar la lectura de la embestida.
- Muerte del minijefe: detener sus ataques, limpiar mobs remanentes y pasar a escena de depósito dañado.
- Marcar `warehouseDamaged=true`.

### Cinemática del minijefe

**Jhony:** No, no, no. ¡Al depósito no!

**Solago:** ¿Qué tenés ahí?

**Jhony:** ¡TODAS MIS COSAS!

**Negro:** Pero tenés como cuarenta cajas.

**Jhony:** ¡POR ESO!

*Se rompe una pared y aparece un enorme zombi bombero blindado, seguido de una horda.*

**Negro:** Uh, mirá ese gordo.

**Jhony:** ¡A ese hay que bajarlo rápido!

**Solago:** ¡No le hacemos una mierda!

**Jhony:** ¡PÉGUENLE POR ATRÁS!

### Final de oleada

*El bombero cae y el depósito queda parcialmente destruido.*

**Jhony:** Me rompieron el depósito...

**Papasito:** Por lo menos salvamos bastante.

**Jhony:** Tenía todo ordenado.

**Negro:** Bueno, después te ayudamos a ordenar.

**Jhony:** Vos no tocás una sola caja más.

**Negro:** Bueno, che. Qué carácter.

## 9. Oleada 4 — «¡ERA UN CÍRCULO!»

**Enemigos:** corredores, policías y militares.  
**Mecánica principal:** enemigos rodean la base y aparecen por accesos laterales; mantener rutas de escape y lectura clara.

**Desarrollo de gameplay:**

- Jhony marca un sector de control en el mapa para justificar su estrategia.
- Los spawn se reparten por lados distintos y presionan al jugador para que rote por el terreno.
- Militares funcionan como anclas lentas; corredores obligan a desplazarse.
- El chiste de Veigar pertenece al diálogo; **no** hace falta implementar un círculo que encierre físicamente a jugadores.

### Antes de la oleada

*Jhony dibuja en el suelo un plan para defender la base.*

**Jhony:** Miren. Los vamos a hacer pasar por acá, después los encerramos en este sector.

**Papasito:** Como la cárcel esa del LoL.

**Jhony:** ¿Cuál?

**Papasito:** La de Veigar.

**Jhony:** Ah, sí.

**Papasito:** La línea esa que pusiste una vez.

*Jhony lo mira.*

**Jhony:** ¿Qué línea?

**Papasito:** Esa que tiraste y nos dejó encerrados.

**Jhony:** Era un círculo.

**Papasito:** Sí, pero parecía una línea.

**Jhony:** ¡ERA UN CÍRCULO, PAPASITO!

**Negro:** JAJAJA, otra vez con el círculo.

**Papasito:** Bueno, pero yo la vi como una línea.

**Jhony:** ¡PERO SI TE RODEABA ENTERO!

**Solago:** Bueno, ¿vamos a defender o no?

**Jhony:** ¡SÍ, PERO QUE ENTIENDA QUE ERA UN CÍRCULO!

### Durante la oleada

**Papasito:** ¡Jhony, están entrando por el costado!

**Jhony:** ¡Ya los vi!

**Negro:** ¡Hacé un círculo!

**Jhony:** ¡CERRÁ EL CULO, NEGRO!

### Final de oleada

*El grupo termina defendiendo el área. Jhony todavía está caliente.*

**Negro:** Bueno, ahora sí, ¿explicás lo del círculo?

**Jhony:** No voy a explicar una mierda.

**Papasito:** Pero si era fácil de explicar.

**Jhony:** ...

**Jhony:** ¡CALLATE, PAPASITO!

## 10. Oleada 5 — «Dos mil horas a la basura»

**Enemigos:** horda mixta, corredores, militares y blindados.  
**Mecánica principal:** progresivo colapso del perímetro, menos zonas seguras.

**Desarrollo de gameplay:**

- Al comenzar, una sección de muralla se rompe mediante evento de cinemática.
- Nuevos puntos de spawn aparecen cerca de cultivos, galpón y patio.
- Blindados obligan a rodear y reposicionarse; corredores penalizan quedarse inmóvil.
- Mostrar destrucción progresiva con swaps de tiles/sprites, no exigir simulación estructural avanzada.
- Marcar `basePerimeterBreached=true`.

### Cinemática previa

*Una sección de la muralla cae. Los zombis comienzan a entrar a los cultivos y al interior de la base.*

**Jhony:** No, boludo...

**Solago:** Se cayó toda esa parte.

**Jhony:** Me llevó una banda de tiempo levantar esa pared.

**Papasito:** Podemos arreglarla después.

**Jhony:** ¡Primero hay que sacar todos estos zombis!

**Negro:** Para mí tenías que hacerla de piedra.

**Jhony:** ...

**Negro:** Digo, para que aguante.

**Jhony:** ¿Vos me estás enseñando a construir una base?

**Negro:** No, yo te digo nomás.

**Jhony:** ¡VOS NO SABÉS NI COCINAR UN HUEVO EN ESTE JUEGO!

### Durante la oleada

**Jhony:** ¡Cuiden los cultivos!

**Solago:** ¡Hay demasiados!

**Warrior:** Ura, ya están entrando por atrás.

**Jhony:** ¡NEGRO, VENÍ A AYUDAR!

**Negro:** ¡Estoy ocupado!

**Jhony:** ¡¿CON QUÉ?!

**Negro:** ¡ME ESTOY CURANDO!

### Final de oleada

*Los últimos zombis caen. La base está muy dañada.*

**Jhony:** Me hicieron mierda todo.

**Papasito:** Ya casi terminamos, Jhony.

**Jhony:** No. Escuchen.

*Se oye un motor a la distancia.*

**Solago:** ¿Qué es eso?

**Jhony:** ...

**Jhony:** No puede ser.

## 11. Oleada 6 — «La última horda»

**Jefe/evento:** La Horda del Camión.  
**Enemigos:** comunes, corredores, militares, blindados y grupos de refuerzo.  
**Objetivo:** abrirse paso hasta el camión, detener la bocina y acabar con los enemigos restantes.

### Diseño del jefe

- Un camión abandonado queda rodeado/empujado por zombis y con bocina trabada. **No** es un vehículo manejado por zombis ni necesita simulación física realista.
- **Fase 1 — La carretera:** camino hasta el camión bloqueado por hordas; foco en moverse y despejar.
- **Fase 2 — La bocina:** blindados protegen un punto interactivo/objetivo destructible visible junto al camión. El jugador debe alcanzarlo y desactivar/romper la bocina (elegir implementación compatible con controles existentes).
- **Fase 3 — Último empuje:** una vez apagada la bocina no aparecen nuevos refuerzos; eliminar los zombis que quedan para completar.
- Usar un indicador visual claro cuando el camión está por atraer otro refuerzo. No obligar a una mecánica de interacción ajena al survivor si el proyecto no tiene botón de interactuar: puede ser un objetivo al que se le hace daño.
- `truckHornActive=false` al completar fase 2.

### Cinemática del jefe

*Un camión abandonado se desplaza por la carretera, empujado por una enorme concentración de zombis. Su bocina queda trabada y atrae a todos los infectados de la zona.*

*Se ve un camión rodeado de una horda gigantesca. Su bocina no deja de sonar.*

**Solago:** ¿Y ahora?

**Jhony:** Hay que llegar hasta el camión y apagar esa bocina.

**Negro:** ¿Y no podemos esperar que se queden sin nafta?

**Jhony:** ¡LA BOCINA NO ESTÁ SONANDO POR LA NAFTA!

**Negro:** Bueno, preguntaba.

### Durante el combate

**Jhony:** ¡YA CASI LLEGAMOS!

**Papasito:** ¡Son demasiados!

**Jhony:** ¡NO PAREN!

**Negro:** ¡ME ESTOY QUEDANDO SIN VIDA!

**Jhony:** ¡CURATE!

**Negro:** ¡NO TENGO NADA!

**Jhony:** ¡¿CÓMO QUE NO TENÉS NADA?!

*La bocina finalmente se apaga.*

*La horda deja de recibir refuerzos y los últimos enemigos caen.*

## 12. Cinemática final — «¿Una partida?»

*El grupo vuelve caminando a la base. Está medio destruida.*

**Jhony:** ...

**Solago:** Bueno, por lo menos seguimos vivos.

**Jhony:** Mirá cómo quedó todo.

**Papasito:** Se puede reparar.

**Jhony:** Sí, ya sé.

**Negro:** Bueno, te ayudamos a arreglar.

**Jhony:** No.

**Negro:** ¿Por?

**Jhony:** Porque la van a romper más.

**Negro:** Qué mala onda, boludo.

*Se abre el portal. Aparece Maxi.*

**Maxi:** ¿Terminaron?

**Jhony:** ¿Y vos?

**Maxi:** Qué.

**Jhony:** ¿No podías mandarlos a otro lado?

**Maxi:** Vine a buscarte.

**Jhony:** Bueno, ya me encontraron.

**Maxi:** ¿Volvés?

**Jhony:** No sé.

**Negro:** Dale, Jhony. Ya está.

**Jhony:** Estaba re tranquilo acá, boludo.

**Solago:** Sí, ya vimos.

**Jhony:** Tenía todo armado, nadie me jodía...

**Negro:** Y bueno, pero estabas jugando solo.

**Jhony:** ¿Y?

**Negro:** Nada, que es medio embolante.

**Jhony:** ...

**Papasito:** Vamos, Jhony. Después podés volver a terminar la base.

*Jhony mira lo que queda de su construcción.*

**Jhony:** ¿Y qué están jugando ahora?

**Solago:** Nada todavía.

**Negro:** Podemos jugar un LoL.

**Jhony:** Ni en pedo.

**Negro:** Bueno, listo.

*Jhony se queda callado unos segundos.*

**Jhony:** ¿Una sola?

**Negro:** JAJAJA, sabía.

**Jhony:** ¡CERRÁ EL CULO, NEGRO!

*Jhony camina hacia el portal.*

**Jhony:** Igual, si van a jugar como el orto, me voy.

**Negro:** Sí, sí. Dale.

*Todos atraviesan el portal y regresan al Discord.*

## 13. Escena postcréditos — «Una más»

*Pantalla de Discord. Todos conectados al canal de voz.*

**Jhony:** Bueno, la última y me voy a dormir.

**Negro:** Dale.

*Pasan unos segundos.*

**Jhony:** ¡NEGRO, ¿QUÉ MIERDA ESTÁS HACIENDO?!

**Negro:** ¡PARÁ, BOLUDO!

**Jhony:** ¡TE DIJE QUE NO TE MANDES SOLO!

**Solago:** JAJAJAJAJA.

**Jhony:** ¡Y VOS DE QUÉ TE REÍS SI VAS 0/8!

*Pantalla negra.*

*Se escucha a Jhony.*

**Jhony:** Bueno... ¿otra?

**FIN DEL EPÍLOGO DE JHONY**

---

## 14. Tabla rápida de implementación

| Etapa | Activación | Enemigos / evento | Resultado |
|---|---|---|---|
| Inicio | epílogo Papafrita terminado | cinemática Discord | portal a Project Zomboid |
| Llegada | entrada al mapa | carrera cinemática hacia base | diálogo de Jhony |
| Oleada 1 | «¡ME TRAJERON TODA LA PUTA CIUDAD!» | comunes, corredores, trabajadores | puerta dañada; diálogo de la base; alarma |
| Oleada 2 | alarma del auto | policías, corredores, protegidos; trampas | presentación de build |
| Oleada 3 | siguiente oleada | trabajadores, comunes, **Bombero** | depósito dañado |
| Oleada 4 | siguiente oleada | corredores, policías, militares; rodeo | discusión del círculo |
| Oleada 5 | siguiente oleada | horda mixta, militares, blindados | caída de muralla; base casi perdida |
| Oleada 6 | bocina del camión | horda masiva y objetivo del camión | bocina apagada; victoria |
| Cierre | oleada 6 ganada | cinemática final | Jhony regresa al Discord |
| Postcréditos | regreso completado | voces en Discord | fin |

## 15. Recursos / arte / sonido necesarios

**Reutilizar:** personajes y retratos existentes, tiles y zombis de Project Zomboid Acto 1, UI de cinemáticas, sistema de oleadas y tienda, sistema de portal, sistema de diálogos durante combate.

**Añadir o adaptar:**

- Variante de fondo/base fortificada con: puerta, barricadas, muro, depósito, cultivos, galpón, cajas, auto y calle.
- NPC aliado Jhony (usar retrato aprobado y adaptar sprite de mundo si falta).
- Zombis policías, trabajadores, protegidos, militares, blindados y bombero (preferentemente variantes de sprites existentes).
- Jefe/evento del camión con un estado visual de bocina activa/apagada.
- Estados visuales de puerta, depósito y muralla dañados; explosión/impactos simples.
- Audio: pasos de horda, alarma de auto, trampas, derrumbe, embestida del bombero y bocina del camión. **El sonido de alarma debe quedar claramente separado del sonido de bocina del jefe.**
- Evitar exceso de detalle y perspectiva compleja; conservar pixel art minimalista y fondos más planos.

## 16. Criterios de aceptación

- [ ] El epílogo se habilita tras completar campaña y epílogo de Papafrita conforme al flujo postgame establecido.
- [ ] El diálogo inicial reconoce que Papafrita **volvió expulsado por Maxi**, no que permanece en Monster Hunter.
- [ ] Maxi dice que Jhony no mira mensajes, aparenta traerlo y manda al grupo mediante portal.
- [ ] Los protagonistas **corren hasta Jhony sin una oleada previa**.
- [ ] Jhony grita «¡ME TRAJERON TODA LA PUTA CIUDAD!» y eso inicia exactamente la oleada 1.
- [ ] Después de la oleada 1 se habla de la base/cajas y **recién entonces** el Negro activa la alarma.
- [ ] La alarma desencadena las oleadas 2–6; el Bombero está en la 3 y el camión en la 6.
- [ ] Jhony aparece como aliado, no como enemigo ni como personaje jugable obligatorio.
- [ ] Diálogos correctos en sus tres contextos: cinemáticas, overlays en combate y cierres.
- [ ] Jhony **cruza el portal con el grupo** y vuelve al Discord al terminar.
- [ ] Los postcréditos terminan con Jhony diciendo «Bueno... ¿otra?».
- [ ] No se cambia el texto de los diálogos sin una aprobación específica.

## 17. Pendientes de balance, no bloqueantes

- Elegir cantidades/spawn/HP/daño de cada enemigo según la curva de dificultad del juego.
- Decidir si el minijefe Bombero entra a mitad de oleada o desde su inicio, conservando su cinemática.
- Decidir interacción de bocina: ataque automático a objetivo o botón de interactuar existente.
- Reutilizar sistema de tienda y progresión ya implementado; no inventar economía especial de este epílogo.
