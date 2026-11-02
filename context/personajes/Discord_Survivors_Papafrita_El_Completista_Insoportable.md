# Discord Survivors — Papafrita, «El Completista Insoportable»

**Estado narrativo actual:** NPC / cameo. No es uno de los cuatro personajes jugables de la historia principal.  
**Estado del kit:** propuesta de diseño **para una posible versión jugable futura**. No altera el canon de los cinco actos.  
**Clase propuesta:** Atacante a distancia / Coleccionista / Daño en área.  
**Dificultad:** Media-alta (potencial ofensivo condicionado por las mejoras reunidas).  
**Identidad:** mata hablando; se obsesiona con completar una colección de mejoras, incluso si la partida ya estaría ganada.  
**Referencias jugables:** *Brotato* y *Vampire Survivors*, con una identidad propia y humor interno del Discord.

---

## 1. Concepto y lore

Papafrita habla demasiado. Muchísimo. Se mete a Discord, empieza a explicar un juego, una build o cualquier cosa que nadie le preguntó y, cuando uno cree que terminó, todavía le quedan veinte minutos más. A veces, en medio de su interminable monólogo, se lo escucha hablando con su señora o su hermana de fondo.

Es jodón y bardea especialmente a **Maxi Negro** y **Solago**. Es amante de los videojuegos *single player*: desaparece varios días para jugar solo, se pasa los mismos títulos más de una vez y hasta los compra en distintas consolas o plataformas. Es de los que venían de consolas y ahora juegan en PC. Es fanático de *Monster Hunter*, le gustan los videojuegos relacionados con *Dungeons & Dragons* y **ama a los animales**.

Por más que amenace constantemente con irse a jugar sus *single player*, **no puede admitir que le gusta jugar con el Negro**. Se viven bardeando, pero siempre termina volviendo a jugar con él.

También es capaz de acordar una sesión de juego con los amigos y dejar a todos plantados porque le salió pesca u otro plan. En *League of Legends* dice haber llegado a Esmeralda, aunque sus partidas con el grupo no ayudan demasiado a demostrarlo. Cuando juega ADC, o cualquier otro rol, puede volver a base para comprar un ítem que no necesita cuando ya podrían terminar: **prefiere completar la build antes que ganar**.

**Frase representativa:** «Para esto me voy a jugar un single player».  
**Remate recurrente del Negro:** «¡ANDÁ A JUGAR TUS SINGLE PLAYER, PAPAFRITA!».

**No caracterizarlo como alguien que odia a las personas.** Le encanta joder y discutir con sus amigos; el contraste está en que presume de jugar solo, pero disfruta la compañía del Negro.

## 2. Apariencia y presentación

- Seguir el **splash pixel art de Papafrita ya definido**: apariencia caricaturesca, simple y coherente con los otros personajes.
- Referencia visual a su fanatismo por *Monster Hunter*: armadura inspirada en una **armadura de insecto**, sin copiar recursos del juego original.
- **No agregar anteojos** si no están en su diseño aprobado.
- En combate, su arma **no es una lanza, espada ni glaive**: su voz es su ataque.
- Las ondas de voz deben ser legibles a escala de sprite; pequeños globos de diálogo o líneas pixeladas pueden acompañarlas sin tapar la pantalla.
- Animaciones de charla exagerada, gestos con las manos, pausa para «escuchar» el silencio y continuación inmediata del monólogo.

## 3. Estadísticas iniciales propuestas

Usar exclusivamente el sistema común de seis estadísticas de *Discord Survivors*.

| Estadística | Orientación de balance |
|---|---|
| Vida | Algo por debajo de la media |
| Defensa | Algo por debajo de la media |
| Ataque | Normal |
| Distancia de ataque | Por encima de la media |
| Velocidad de ataque | Por encima de la media |
| Velocidad de movimiento | Normal |

- No usar estadísticas separadas de «daño melee» y «daño a distancia»: **Ataque es una estadística única**.
- Las cantidades, radios y tiempos definidos abajo son referencias de diseño para ajustar en pruebas.

## 4. Kit de habilidades

### 4.1 Ataque básico — «No te callás más»

Papafrita **habla y lanza una onda sonora** hacia el enemigo válido más cercano. No sostiene armas físicas.

- Ataque automático de **distancia media**.
- La onda es frontal, con un ancho definido, y puede **atravesar a varios enemigos**.
- Daño base moderado, cadencia relativamente alta.
- Dirección y área claras, animación corta que no entorpezca el movimiento.
- Las mejoras pueden ensanchar la onda, repetirla, añadir ecos o afectar a otros objetivos, pero esos efectos **no existen de base**.

### 4.2 Pasiva exclusiva — «Me falta un ítem»

Papafrita es un coleccionista obsesivo. **Colecciona tipos diferentes de sus seis mejoras exclusivas**.

**Regla imprescindible:** la pasiva cuenta **mejoras únicas**, no copias ni niveles.

- Si compra «¿Y sabés qué más?» tres veces y no tiene otra mejora exclusiva: **1/6** de colección.
- Si tiene tres mejoras exclusivas distintas, independientemente del nivel de cada una: **3/6** de colección.
- Cada mejora exclusiva puede alcanzar **nivel I, II o III** por obtención repetida.
- La colección se reinicia al comenzar cada partida.

**Bonificaciones por hitos:**

| Tipos exclusivos distintos | Beneficio de colección |
|---|---|
| **2/6** | Las ondas básicas pueden atravesar **1 enemigo adicional**. |
| **4/6** | Cada **5 ataques básicos**, lanza automáticamente **una onda secundaria** hacia otro enemigo. |
| **6/6** | **Colección completa:** cada **3 ataques básicos**, genera **dos ecos cortos** hacia objetivos cercanos adicionales. |

Las bonificaciones de 2/6 y 4/6 se mantienen al llegar a 6/6. Los ecos de colección no vuelven a disparar otros ecos, para evitar cadenas infinitas.

**Objetivo:** completar los seis tipos de mejora debe ser **difícil, pero posible y nunca obligatorio** para superar una partida.

### 4.3 Habilidad especial — «Monólogo interminable»

Cada cierto tiempo, Papafrita empieza un monólogo todavía más largo y aparece un **globo de diálogo enorme sobre una zona del campo**.

- El globo permanece unos segundos.
- Los enemigos dentro reciben **daño periódico**.
- Enemigos normales cercanos pueden dirigirse brevemente hacia la zona, como si fueran obligados a escucharlo.
- El jugador conserva el control de Papafrita y su ataque básico sigue funcionando.
- Los jefes no pierden el control de movimiento por el globo; pueden recibir daño.
- La mejora **«Todavía no terminé»** modifica el final del globo, pero no está incluida de base.

**Diferencia con el ataque básico:** el ataque básico es un **proyectil lineal**; el especial es una **zona persistente**.

### 4.4 Definitiva — «AHORA SÍ COMPLETÉ LA BUILD»

Papafrita, convencido de que por fin tiene todo lo necesario, inicia un monólogo descontrolado. Durante una ventana breve:

- Dispara **ondas de voz hacia varias direcciones**.
- La habilidad «Monólogo interminable» genera **globos adicionales** en zonas distintas.
- Las **mejoras exclusivas que realmente posee** se potencian temporalmente, respetando sus niveles.
- El efecto escala con la cantidad de tipos coleccionados, pero **puede activarse sin tener 6/6**.
- No activa gratuitamente las mejoras exclusivas que el jugador todavía no encontró.

**Frase:** «Listo, ahora sí puedo pegar».  
**Respuesta posible del Negro:** «¡PERO SI YA TERMINÓ LA PARTIDA, PELOTUDO!».

---

## 5. Las seis mejoras exclusivas por nivel

Cada mejora es una **opción adquirible** en las subidas de nivel o en la tienda entre oleadas. Su nivel sube al obtener **otra copia de ese mismo tipo**. Tener cualquier nivel de una mejora aporta **una sola pieza** a «Me falta un ítem».

### 5.1 «¿Y sabés qué más?» — Ampliación progresiva de ondas

**Lore:** «Nadie le preguntó. Igual siguió hablando.»

Las ondas del ataque básico **crecen de ancho cada vez que atraviesan un enemigo**. Cuanta más gente «lo escucha», más grande se vuelve la charla.

- **Nivel I:** la onda se ensancha ligeramente tras cada enemigo atravesado, hasta un límite pequeño.
- **Nivel II:** aumenta el crecimiento y el límite máximo de ancho.
- **Nivel III:** la onda puede terminar siendo enorme después de atravesar suficientes enemigos.

**Identidad mecánica:** ensanchar una misma onda; **no** duplicarla ni hacerla rebotar.

### 5.2 «Lo compré en otra consola» — Repetición contra otro objetivo

**Lore:** «Ya lo tenía en PlayStation. Lo compró en PC para pasárselo otra vez.»

Repite periódicamente un ataque básico, pero lo dirige hacia **otro enemigo cercano**.

- **Nivel I:** cada **6 ataques básicos**, dispara una copia hacia un objetivo secundario.
- **Nivel II:** se activa cada **5 ataques básicos**.
- **Nivel III:** se activa cada **4 ataques básicos** y prioriza un enemigo todavía no golpeado.

**Identidad mecánica:** duplicación periódica hacia un **nuevo objetivo**; no rebote, no eco diferido. Una copia no puede volver a generar otra copia.

### 5.3 «Todavía no terminé» — Estallido del monólogo

**Lore:** «El Negro se fue hace veinte minutos. Papafrita todavía está explicando.»

Modifica la **habilidad especial**: al desaparecer el globo de «Monólogo interminable», libera una descarga de voz.

- **Nivel I:** el globo termina con **una explosión de área pequeña**.
- **Nivel II:** la explosión tiene **más radio** y alcanza a más enemigos.
- **Nivel III:** además de la explosión inicial, libera **un anillo expansivo** que golpea enemigos más alejados.

**Identidad mecánica:** remate de la **zona persistente**; no es un segundo ataque básico.

### 5.4 «Me salió pesca» — Escape y señuelo

**Lore:** «Habían quedado para jugar a las nueve. Nunca especificó de qué día.»

Si Papafrita queda rodeado por suficientes enemigos, **desaparece y reaparece a una distancia corta en un lugar seguro**. Deja atrás un señuelo con un globo de diálogo que atrae momentáneamente a enemigos normales.

- **Nivel I:** desplazamiento corto y señuelo breve, con enfriamiento prolongado.
- **Nivel II:** el señuelo dura más y el enfriamiento se reduce.
- **Nivel III:** al reaparecer emite una onda corta que daña a los enemigos inmediatos.

**Identidad mecánica:** **supervivencia y reposicionamiento**, no ataque de voz directo constante. No teletransportar dentro de peligros ni interrumpir escenas. Los jefes ignoran la atracción del señuelo.

### 5.5 «El único que me banca» — Compañero animal

**Lore:** «Dice que prefiere jugar solo. Después se queda esperando que aparezca el Negro.»

Aparece **un compañero animal** que ataca automáticamente a objetivos distintos de los que está golpeando Papafrita. Hace referencia a su amor por los animales y a su gusto por los compañeros de *Monster Hunter*.

- **Nivel I:** un compañero ataca periódicamente a **un enemigo secundario**.
- **Nivel II:** puede encadenar un ataque hacia **un segundo enemigo**.
- **Nivel III:** el último ataque produce un **pequeño golpe de área**.

**Identidad mecánica:** **un solo compañero de apoyo**, no una legión de invocaciones como el «Modo Otaku» del Negro. No copiar directamente a los Palico de *Monster Hunter*.

### 5.6 «Edición definitiva» — Eco diferido de la voz

**Lore:** «Ya tenía todas las versiones del juego. Le faltaba la que venía con una boludez extra.»

Cada cierto número de ataques básicos aparece **un eco más débil, con un pequeño retraso, siguiendo la misma trayectoria del ataque original**.

- **Nivel I:** genera un eco cada **6 ataques básicos**.
- **Nivel II:** genera un eco cada **5 ataques básicos**.
- **Nivel III:** genera un eco cada **4 ataques básicos**, con mayor ancho.

**Identidad mecánica:** repetición **diferida en la misma dirección**; se diferencia de «Lo compré en otra consola», que dispara una copia **inmediata hacia otro objetivo**. Los ecos no generan otros ecos.

Durante la definitiva, los ecos pueden potenciarse temporalmente de acuerdo con el nivel comprado.

---

## 6. Reglas del sistema de progresión

### 6.1 Obtención y repetición

1. Las seis mejoras exclusivas pueden ofrecerse tanto al **subir de nivel** como en la **tienda entre oleadas**.
2. Cada tipo tiene **máximo nivel III**; se obtiene una copia para I, otra para II y otra para III.
3. Al alcanzar nivel III, ese tipo **deja de ofrecerse** como compra/mejora de nivel.
4. Las mejoras exclusivas deben tener **aparición moderadamente poco frecuente** respecto de las comunes. No garantizar las seis en cada partida.
5. Las copias de una mejora **no incrementan** el progreso de colección.
6. El avance 2/6, 4/6 y 6/6 depende de las **seis identidades distintas** y se recalcula a partir de ellas.
7. Todas las mejoras tienen valor individual, incluso si el jugador nunca llega a completar 6/6.

### 6.2 Ejemplos de colección

| Mejoras poseídas | Copias totales | Colección |
|---|---:|---:|
| «¿Y sabés qué más?» III | 3 | **1/6** |
| «¿Y sabés qué más?» III + «Me salió pesca» I | 4 | **2/6** |
| Cuatro mejoras distintas, de niveles mixtos | Variable | **4/6** |
| Las seis mejoras distintas, aunque sean nivel I | 6 | **6/6** |

### 6.3 Combinaciones sin duplicar funciones

- **Ondas más anchas + duplicación:** «¿Y sabés qué más?» amplía el área del proyectil original; «Lo compré en otra consola» lo vuelve a lanzar hacia un enemigo diferente.
- **Monólogo + estallido:** «Todavía no terminé» remata el área persistente cuando desaparece, no antes.
- **Reposicionamiento + monólogo:** «Me salió pesca» ayuda a agrupar enemigos y escapar, mientras el especial castiga las zonas con muchos enemigos.
- **Colección completa + definitiva:** al llegar a 6/6 se generan ecos adicionales por la pasiva; la definitiva los potencia sin disparar recursiones infinitas.
- **Animal + voz:** el compañero presiona objetivos secundarios; Papafrita sigue siendo principalmente un **atacante de voz**, no un invocador.

**Para el agente:** limitar los efectos que crean proyectiles entre sí. Las ondas clonadas, los ecos y las ondas secundarias de la pasiva **no deben generar nuevas copias de sí mismas**, salvo una sinergia futura explícitamente diseñada y balanceada.

## 7. Frases, diálogos y humor interno

Las frases siguientes son **propuestas basadas en las anécdotas del grupo**, no transcripciones literales salvo las expresiones ya proporcionadas.

| Situación | Frase o remate |
|---|---|
| Selección | «Bueno, pero escuchen una cosa...» |
| Ataque básico | «Y otra cosa...» |
| Comprar una mejora exclusiva | «Uh, esta me faltaba.» |
| Conseguir una segunda copia | «La tengo, pero me falta mejorarla.» |
| «¿Y sabés qué más?» | «¿Y sabés qué más?» |
| Completar 6/6 | «Ahora sí, tengo todo.» |
| Definitiva | «Listo, ahora sí puedo pegar.» |
| Dejar plantado al grupo | «Y... me salió pesca.» |
| Recordar el LoL | «Pará que vuelvo a base, me falta un ítem.» |
| Presumir rango | «Yo llegué a Esmeralda.» |
| Discusión con el Negro | «Para esto me voy a jugar un single player.» |
| Respuesta del Negro | «¡ANDÁ A JUGAR TUS SINGLE PLAYER, PAPAFRITA!» |
| Vuelve a Discord | «Che, ¿a qué hora entran?» |

**Dinámica con Maxi Negro:** lo bardea, discute y amenaza con irse, pero **no admite que le gusta jugar con él**. No tratar su afición por los juegos de un jugador como odio hacia otras personas.

**Dinámica con Solago:** lo carga y lo interrumpe; Solago se vuelve otra víctima de su interminable charla.

**Ruido de fondo:** puede escucharse a Papafrita conversando con su señora o hermana en mitad de una llamada. Usar como detalle ocasional, no como efecto permanente que vuelva ilegible el audio del combate.

## 8. Encaje en la historia actual (no modificar)

- Papafrita **no se une al grupo** durante los cinco actos actuales y **no figura entre los personajes jugables** confirmados: Maxi Negro, Solago, Papasito y Warrior.
- En el tramo vinculado a **Conan Exiles / el mundo de Monster Hunter descartado**, el Administrador reproduce su **monólogo interminable**.
- Los personajes reaccionan con una **mueca de asco y agotamiento**, inspirada en el efecto cómico de Excalibur de *Soul Eater*.
- **El Administrador también hace esa mueca y descarta el mundo de Monster Hunter.** No convertir la escena en el desbloqueo de Papafrita.
- El splash de Papafrita ya definido se usa para esa presentación. El kit de este documento se reserva para un hipotético modo o desbloqueo futuro.

## 9. Identidad frente a los otros personajes

| Personaje | Estilo de combate |
|---|---|
| Maxi Negro | Tanque sedentario, waifu invocada y sillón defensivo con daño de área |
| Solago | Mordidas a corto alcance, defensa al reírse y Stand de tijeras |
| Papasito | Ladrillazos y economía por venta de pertenencias |
| Warrior | Humo, hongos y control de masas |
| Jhony (kit futuro propuesto) | Botellazos, Tilt y furia berserker |
| **Papafrita (kit futuro propuesto)** | **Ondas de voz, monólogo de zona y colección de mejoras únicas** |

Papafrita **no compite por tener el mejor daño inmediato**: se obsesiona con completar una colección que vuelve su ataque cada vez más molesto, ancho y numeroso. La broma debe sentirse en el combate, pero sus mejoras tienen que ser divertidas incluso si no se obtiene el conjunto entero.

## 10. Instrucciones para el agente de desarrollo

**Conservar obligatoriamente:**

- El **ataque básico de voz a distancia**. No usar lanza, glaive ni armas físicas como ataque principal.
- La **pasiva de coleccionista** con seis tipos de mejoras exclusivas.
- El conteo de **tipos únicos**, independientemente de si una mejora está en I, II o III.
- La posibilidad de repetir/mejorar una misma exclusiva hasta **nivel III** sin avanzar la colección con esas copias.
- Las recompensas de colección al reunir **2, 4 y 6 tipos distintos**.
- «¿Y sabés qué más?» debe **ensanchar una misma onda por enemigo atravesado**, con lore exacto: «Nadie le preguntó. Igual siguió hablando.»
- Las seis mejoras deben ofrecer **mecánicas distintas**, sin duplicar innecesariamente habilidades ya presentes.
- La definitiva potencia lo **realmente obtenido**, no regala habilidades ausentes.
- La personalidad: hablador insoportable, cargoso con Negro y Solago, coleccionista de videojuegos y builds, fan de Monster Hunter, amante de los animales, impuntual por pesca y amante de los single player que **no reconoce que disfruta jugar con el Negro**.
- **No escribir que odia a la gente**.
- Mantener su estado como **NPC/cameo** hasta decisión posterior; no alterar la estructura de los actos.

**Pendientes de balance y producción:** daño de cada onda, número base de enemigos atravesados, radios, tiempo de vida de globos, enfriamientos, umbrales de la huida, rareza de ofertas, alcance de los ecos, estética y animaciones definitivas.

> Este documento fija el concepto creativo y las interacciones entre habilidades. Los números de frecuencia, duración, alcance y daño pueden ajustarse durante el desarrollo sin cambiar la identidad del personaje.
