# Discord Survivors — Jhony, «El Metalero Tilteado»

**Estado en la historia:** NPC del Acto 1 (*Project Zomboid*). **No se une al grupo ni forma parte de los cuatro personajes jugables actuales.**  
**Estado de este kit:** propuesta de diseño para una eventual versión jugable, personaje secreto o contenido futuro. No modifica el canon de los actos.  
**Clase propuesta:** Berserker / Combate cercano / Daño en área / Tryhard  
**Dificultad propuesta:** Media-alta  
**Arma principal:** botella de cerveza  
**Mecánica exclusiva:** Tilt  
**Definitiva:** «ME VI UNA GUÍA»  
**Inspiración jugable:** combates automáticos contra hordas, al estilo *Brotato* y *Vampire Survivors*.  
**Tono:** humor ácido y discusiones reales del Discord.

## 1. Concepto y lore

Jhony es un metalero que toma, fuma y se calienta con una facilidad asombrosa. Normalmente está jugando tranquilo, tomando algo y jodiendo con los demás, pero basta una provocación para que empiece a putear a todo el servidor.

Es especialmente propenso a discutir con **Maxi Negro**, incluso por estupideces. Con **Papasito** es peor: Papasito lo provoca a propósito, insiste con la misma boludez y se hace el distraído cuando Jhony explota.

Tiene **más de 2.000 horas en Project Zomboid** y en cada juego se convierte en un tryhard: busca guías, tutoriales, combinaciones óptimas y builds rotísimas, incluso cuando el resto solo quiere boludear.

También está podrido de *League of Legends*: varios del grupo trollean a propósito, mientras que Jhony, Maxi (el creador del juego) y Papafrita suelen intentar jugar en serio. **La contradicción:** Jhony jura que no vuelve al LoL, pero cuando está tomado es él quien propone jugar una partida. Después termina tilteado y vuelve a prometer que nunca más.

**Frases representativas:**

- «¡ERA UN CÍRCULO, LA CONCHA DE TU MADRE!»
- «¡CERRÁ EL CULO! ¡VOS NO PODÉS HABLAR SI NI LO JUGASTE!»
- «No juego más a esta mierda».

### 1.1 Presencia en la historia: canon que no se altera

- Jhony aparece **al final del Acto 1**, matando zombis en *Project Zomboid*.
- Se pelea con Maxi Negro. El ruido de la discusión atrae más zombis.
- No se une al grupo: **está peleado con el Negro y no quiere volver al LoL**, que es el siguiente mundo.
- No participa como compañero en los actos siguientes. Su presencia puede recordarse mediante audios, referencias o recuerdos, sin cambiar esa decisión.
- Su kit de combate de este documento **no implica desbloqueo durante el Acto 1**.

## 2. Apariencia y personalidad

- Seguir **el splash y diseño de Jhony ya existentes**, sin rediseñarlo ni mezclarlo con otros personajes.
- Pelo largo oscuro peinado hacia atrás, anteojos, barba y un aro en el labio inferior.
- Ropa oscura con detalles negros/rojos, coherente con su estilo metalero; respetar el diseño establecido en sus referencias.
- En la versión jugable propuesta, sostiene una **botella de cerveza** como arma principal.
- En el ataque normal golpea con la botella; en las mejoras puede romperla o arrojar otras botellas.
- Su expresión pasa de seria a completamente tilteada. El Tilt se puede mostrar con cejas tensas, cara roja o pequeñas marcas de furia, sin aumentar demasiado la complejidad del pixel art.
- Mantener la estética de sprites simples y legibles del resto de *Discord Survivors*; no agregar sombras ni detalles desproporcionados.

**Rasgo central:** no debe estar gritando todo el tiempo. Empieza bastante normal, lo provocan y recién entonces explota.

## 3. Estadísticas iniciales propuestas

Usar exclusivamente las **seis estadísticas generales acordadas para el juego**. Los modificadores se aplican sobre los valores base comunes; los números son provisionales para balancear.

| Estadística | Modificador inicial | Intención |
|---|---:|---|
| Vida | +10% | Puede aguantar algunos golpes mientras genera Tilt. |
| Defensa | -10% | Su forma de jugar es arriesgada. |
| Ataque | +15% | Botellazos contundentes. |
| Distancia de ataque | -15% | Debe acercarse a los enemigos. |
| Velocidad de ataque | +5% | Comienza agresivo, sin llegar todavía a la furia máxima. |
| Velocidad de movimiento | Normal | Debe poder reposicionarse entre hordas. |

**Nota:** Ataque es una sola estadística; no separar daño cuerpo a cuerpo y daño a distancia. Los efectos de área y los proyectiles de botellas escalan con Ataque, salvo que se acuerde otro criterio global.

## 4. Kit de habilidades

### 4.1 Ataque básico — «Botellazo»

Jhony golpea automáticamente con una botella de cerveza al enemigo más cercano dentro de su distancia de ataque.

- Golpe corto y relativamente fuerte.
- Empieza impactando a **un enemigo** por ataque.
- Las mejoras pueden agregar proyectiles, fragmentos de vidrio, explosiones y golpes a varios enemigos.
- La botella no se consume con cada ataque: las botellas adicionales y roturas son efectos visuales de habilidades, para no exigir inventario ni recargas.

### 4.2 Pasiva / mecánica exclusiva — «TILT»

Jhony tiene una barra de **0 a 100 puntos de Tilt**. Recibir daño y permanecer bajo presión de enemigos cercanos llenan la barra.

**Al llegar a 100:**

- Activa automáticamente **Furia** durante unos segundos.
- Mientras dura Furia, aumenta **Ataque** y **Velocidad de ataque**, pero reduce **Defensa**.
- La barra se reinicia al terminar Furia; no puede volver a activarse antes de que acabe el estado actual.
- Si se eligió «¡ERA UN CÍRCULO!», la onda circular aparece **al alcanzar 100 de Tilt**, una vez por activación.

**Valores iniciales para probar:** +40% Ataque, +25% Velocidad de ataque, -30% Defensa, 6 segundos de Furia. El ritmo de acumulación y las bonificaciones se ajustarán en pruebas.

**Clave del diseño:** recibir golpes sirve para alimentar la furia, pero nunca debe convertirse en la única forma viable de cargarla. La presión de las hordas también debe contribuir.

### 4.3 Especial — «Un traguito más»

Jhony saca una botella de whisky, toma un trago y entra brevemente en un estado más agresivo.

- Aumenta temporalmente la frecuencia de los botellazos.
- Amplifica la acumulación de Tilt mientras dure el efecto.
- Tiene enfriamiento o activación limitada; **no depende de conseguir el ítem genérico Alcohol**.
- Puede combinarse con Furia, pero sus bonificaciones deben tener un límite para evitar velocidades absurdas.

**Rol:** acelerar su ciclo de riesgo y agresividad. No reemplaza a la pasiva Tilt ni a la definitiva.

### 4.4 Definitiva — «ME VI UNA GUÍA»

Jhony se detiene un instante, revisa una guía y activa **la build más rota que encontró en internet**.

**Durante la definitiva:**

- Gana una fuerte bonificación de Ataque y Velocidad de ataque.
- Sus botellazos pasan temporalmente a **lanzar botellas hacia enemigos cercanos**.
- Las botellas pueden **rebotar entre varios enemigos**.
- Las mejoras exclusivas de botellas, fragmentos y ataques secundarios se combinan con la definitiva; no se sustituyen.
- Termina con un breve retorno a su ritmo habitual. No deja una penalización permanente.

**Valores de referencia:** 10 segundos; +30% Ataque; +50% Velocidad de ataque; hasta 3 objetivos alcanzados mediante rebotes. Ajustar según la cantidad de proyectiles simultáneos.

**Cinemática breve / frase:**

> **Jhony:** «Pará, pará... yo vi una build para esto».  
> **Negro:** «¿ME ESTÁS JODIENDO? ¿TE PUSISTE A MIRAR UNA GUÍA AHORA?»  
> **Jhony:** «Listo. Esta build está ROTÍSIMA».

**Al terminar:** «La nerfearon. Antes pegaba más».

## 5. Mejoras de nivel exclusivas

Estas **seis mejoras** pueden aparecer en las elecciones de subida de nivel de Jhony junto con las mejoras generales. **No son simples +Ataque o +Vida:** cada una añade o transforma un ataque, aumenta el número de objetivos o modifica de manera visible una habilidad.

Cada mejora tiene **una forma inicial y una evolución**. La evolución solo puede aparecer cuando Jhony ya obtuvo su mejora base. Los requisitos exactos de nivel, rareza y coste se ajustarán al sistema general de progresión.

### 5.1 «¡ERA UN CÍRCULO!» — Onda de Tilt

**Desbloqueo:** al alcanzar Tilt máximo, libera una **onda circular** alrededor de Jhony que daña y empuja a varios enemigos.

**Evolución:** después de la onda queda un **círculo en el suelo** que daña durante unos segundos a los enemigos que lo atraviesan.

**Sinergia:** Furia lo activa; el aumento de frecuencia de Tilt permite generar más ondas, respetando el ciclo de la barra.

**Lore:** «Papasito sigue insistiendo en que era una línea».

**Diálogo de primera obtención:**

> **Jhony:** «¡ERA UN CÍRCULO, LA CONCHA DE TU MADRE!»  
> **Papasito (por Discord):** «Para mí era una línea».  
> **Jhony:** «¡PAPASITO, CERRÁ EL ORTO!»

**Referencia real:** Papasito erró la cárcel de Veigar en LoL; Jhony, tomado y tilteado, repetía que era un círculo, mientras Papasito insistía en que era una línea para hacerlo enojar.

### 5.2 «¡CERRÁ EL CULO, SI NI LO JUGASTE!» — Grito

**Desbloqueo:** Jhony lanza periódicamente un **grito frontal** que daña a todos los enemigos en un cono delante suyo.

**Evolución:** el grito se convierte en una **onda de 360°** que alcanza enemigos en todas las direcciones.

**Sinergia:** durante Furia, el grito puede activarse con mayor frecuencia, con un enfriamiento mínimo.

**Lore:** «El Negro cometió el error de opinar sobre un juego que ni había probado».

### 5.3 «BOTELLA ROTA» — Fragmentos de vidrio

**Desbloqueo:** los botellazos desprenden **fragmentos de vidrio** que atraviesan al enemigo golpeado e impactan a otros detrás.

**Evolución:** cada impacto genera **fragmentos adicionales en varias direcciones**, alcanzando grupos más amplios.

**Sinergia:** funciona también con las botellas lanzadas por «ME VI UNA GUÍA».

**Lore:** «No era la primera botella de la noche. Tampoco la última».

### 5.4 «UNA BIRRA MÁS» — Botellas arrojadizas

**Desbloqueo:** cada cierta cantidad de botellazos, Jhony **arroja una botella extra** a un enemigo cercano. La botella estalla al impactar e inflige daño en un área pequeña.

**Evolución:** lanza **varias botellas hacia objetivos distintos**, aumentando su cobertura contra hordas.

**Sinergia:** durante la definitiva, los proyectiles adicionales pueden beneficiarse de rebotes con un límite de impactos por lanzamiento.

**Lore:** «Dijo que era la última. Nadie le creyó».

**Diferencia con el especial:** «Un traguito más» es una activación temporal con whisky; «Una birra más» es una **mejora permanente de su patrón de ataque** durante la partida.

### 5.5 «2.000 HORAS AL PEDO» — Remate de Zomboid

**Desbloqueo:** periódicamente Jhony realiza un **pisotón de remate** sobre un enemigo cercano que tenga poca Vida. Es un ataque secundario automático.

**Evolución:** el pisotón provoca una **onda de impacto pequeña** que también daña a enemigos alrededor del objetivo.

**Sinergia:** los botellazos y fragmentos dejan enemigos debilitados listos para el remate.

**Lore:** «Dos mil horas de Project Zomboid. Algo tenía que aprender».

### 5.6 «LA BUILD ESTÁ ROTÍSIMA» — Combo de definitiva

**Desbloqueo:** al usar «ME VI UNA GUÍA», los ataques secundarios que Jhony ya tenga (gritos, botellas extra, fragmentos, remates) **se activan con mayor frecuencia**.

**Evolución:** durante la definitiva, los botellazos y botellas arrojadas generan **fragmentos adicionales que buscan enemigos próximos**, ampliando el número de objetivos golpeados.

**Sinergia:** recompensa haber conseguido varias mejoras exclusivas; si todavía no tiene ninguna, mantiene un beneficio básico sobre las botellas de la definitiva para que no sea una elección inútil.

**Lore:** «Se vio cuarenta tutoriales para terminar usando una build que encontró otro».

## 6. Progresión y combinaciones

La identidad del personaje surge de **combinar** ataques, no de subir estadísticas aisladas.

| Combinación | Resultado visible |
|---|---|
| Botellazo + Botella Rota | Golpes cercanos que disparan fragmentos contra enemigos detrás. |
| Una Birra Más + Botella Rota | Botellas que explotan y generan daño adicional a otros objetivos. |
| Tilt + ¡ERA UN CÍRCULO! | Al entrar en Furia, despeja el área y puede dejar un círculo dañino. |
| Grito + ¡ERA UN CÍRCULO! | Dos formas diferentes de golpear a grandes grupos a su alrededor. |
| 2.000 Horas al Pedo + Fragmentos | Los golpes debilitan a varios enemigos y los pisotones rematan. |
| ME VI UNA GUÍA + LA BUILD ESTÁ ROTÍSIMA | Ventana corta de proyectiles, rebotes y múltiples ataques secundarios. |

**Reglas de diseño:**

1. Los ataques básicos son automáticos, coherentes con el gameplay de *Brotato*.
2. Las mejoras propias son opciones de nivel, no habilidades desbloqueadas todas desde el inicio.
3. Cada mejora puede evolucionar; ninguna exige equipar un arma adicional en otro slot.
4. Los efectos con muchos impactos deben tener límites de rebote, proyectiles y activaciones para evitar problemas de balance o rendimiento.
5. El estado Tilt debe ser legible mediante barra y animaciones, pero no debe inundar la pantalla con efectos.

## 7. Ítem genérico relacionado — «Alcohol»

El ítem **Alcohol** ya pertenece al catálogo de objetos **genéricos** del juego. Es una referencia directa a Jhony, pero **no es exclusivo de él** y no se exige para utilizar su kit.

- **Efecto general previamente definido:** bonificación ofensiva de Ataque, con tono de agresividad/intolerancia; la penalización concreta, si la hubiera, se balancea en el sistema general de ítems.
- **Lore previamente acordado:** «Te pone más agresivo e intolerante. Dicen que te lastima tanto que te hace querer volver al LoL».

No confundir el ítem Alcohol con el especial «Un traguito más» ni con la mejora «Una Birra Más».

## 8. Frases e interacciones

| Situación | Frase o interacción propuesta |
|---|---|
| Selección (si llega a ser jugable) | «Bueno, pero vamos a jugar en serio». |
| Combate tranquilo | «Estoy jugando tranquilo. No rompan las pelotas». |
| Recibir provocaciones | «¿Me estás tomando de pelotudo?». |
| Tilt máximo | «¡ME TIENEN LOS HUEVOS LLENOS!». |
| Con Maxi Negro | «¡CERRÁ EL CULO! ¡VOS NO PODÉS HABLAR SI NI LO JUGASTE!». |
| Con Papasito | «¡ERA UN CÍRCULO, LA CONCHA DE TU MADRE!». |
| Especial de whisky | «Bueno, un traguito más». |
| Definitiva | «Pará, que vi una guía». |
| Fin de definitiva | «La nerfearon. Antes pegaba más». |
| Mención del LoL | «No juego más a esa mierda». |
| Cuando está tomado | «Che, ¿y si jugamos un LoL?». |
| Muerte | «Desinstalo esta mierda». |

**Interacción opcional de recuerdo del Discord (no implica que Jhony esté presente en el acto):**

> **Jhony:** «¡ERA UN CÍRCULO, PAPASITO!»  
> **Papasito:** «Era una línea».  
> **Jhony:** «¡LA CONCHA DE TU MADRE!»  
> **Negro:** «JAJAJAJA».

**Logros propuestos:**

- **«Era un círculo»**: alcanzar a una cantidad alta de enemigos con una sola onda circular.
- **«Me vi todas las guías»**: activar «ME VI UNA GUÍA» con varias mejoras exclusivas evolucionadas.
- **«No juego más»**: superar una oleada bajo los efectos de Furia cuando Jhony tenía poca Vida.

## 9. Identidad frente a los demás

| Personaje | Estilo distintivo |
|---|---|
| Maxi Negro | Tanque sedentario, invocación de waifu y sillón «Me da paja». |
| Solago | Mordidas de corto alcance, defensa al reírse y Stand de la Patrona con tijeras. |
| Papasito | Ladrillos, economía propia y venta de pertenencias para conseguir dinero con riesgos. |
| Warrior | Humo, hongos y control de masas mediante efectos de estado. |
| **Jhony (concepto futuro)** | **Berserker de botella, Tilt, proyectiles, ataques secundarios y builds rotas.** |

Jhony no debe sentirse como otro tanque ni otro controlador. **Su recompensa es encadenar muchos ataques diferentes cuando está al borde de perder la paciencia**.

## 10. Objetivo del personaje e indicaciones para el agente

La experiencia buscada es la de un metalero tryhard que empieza a los botellazos, se tiltea, revienta grupos de enemigos y usa una build absurdamente optimizada para multiplicar sus ataques durante unos segundos.

**Conservar:**

- La personalidad de Jhony: metalero, toma, fuma, se irrita fácilmente, intenta jugar en serio y estudia builds rotas.
- La provocación deliberada de Papasito y las discusiones habituales con Maxi Negro.
- La anécdota **círculo vs. línea** de la cárcel de Veigar.
- La frase **«¡CERRÁ EL CULO! ¡VOS NO PODÉS HABLAR SI NI LO JUGASTE!»**.
- La contradicción sobre LoL: lo odia, pero cuando toma propone jugarlo.
- La botella de cerveza como arma y el whisky como especial.
- Tilt como mecánica principal y «ME VI UNA GUÍA» como definitiva.
- Las seis mejoras de nivel **con impacto real en ataques y evoluciones**, no solo bonos planos.
- El ítem genérico Alcohol con su lore previamente aprobado.
- La continuidad del Acto 1: Jhony **no se une al grupo**, y este diseño **no lo convierte en un quinto personaje jugable confirmado**.

**Pendiente de balance e implementación:** valores exactos de daño/tiempos, frecuencia del Tilt, requisitos de evolución, rarezas de mejoras, número máximo de proyectiles y condiciones de activación de especial/definitiva.

> Este documento es una **especificación creativa de personaje**, no una arquitectura técnica. Todos los porcentajes, tiempos y combinaciones son parámetros editables de balance, salvo las decisiones de identidad y continuidad indicadas arriba.
