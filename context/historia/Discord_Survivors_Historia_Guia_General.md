# Discord Survivors — Guía general de la historia

> **Documento índice / visión global.** Este archivo explica la estructura de la campaña sin reemplazar los guiones. **Para implementar escenas, diálogos, encuentros y eventos de un mundo, leer el `.md` de ese acto antes de trabajar en él.**

## 1. Premisa

Un grupo de amigos está en Discord discutiendo qué jugar y nunca logra ponerse de acuerdo. Una entidad llamada **El Administrador del Servidor** los arrastra a una serie de mundos inspirados en los videojuegos que suelen jugar. Para avanzar deben sobrevivir a oleadas, enfrentarse a jefes y encontrar a otros integrantes del grupo.

El tono es de **comedia absurda, insultos y chistes internos**. La historia se descubre mediante escenas breves y diálogos integrados en las partidas, sin convertir el juego estilo *Brotato / Vampire Survivors* en una aventura de exploración guiada.

**Revelación final (spoiler para implementación):** El Administrador es un bot/jefe independiente. **Maxi** (el programador, distinto de **Maxi Negro**) aparece **solo después de derrotar al jefe final** y cuenta que creó la experiencia para entretener al grupo aquella noche en la que no decidían qué jugar.

## 2. Estructura general

- **5 mundos/actos jugables**, en orden fijo para la historia principal.
- **6 oleadas por mundo**; la **sexta** culmina con el jefe del acto. Algunos mundos también tienen un minijefe en la quinta.
- La campaña se divide en partidas por mundo: no es obligatorio recorrer los cinco mundos de una sola vez.
- El personaje inicial es **Maxi Negro**; los demás personajes se desbloquean al **encontrarlos por primera vez** en sus mundos, no necesariamente al vencer al jefe.
- Los desbloqueos de personajes y el progreso de historia se conservan entre partidas.
- Las escenas narrativas completas se muestran en la **primera visita / primer encuentro**; en futuras partidas deben poder saltarse o no volver a repetirse. Los comentarios breves durante el combate pueden repetirse según el diseño.
- La narrativa acompaña al combate, no requiere que el jugador controle manualmente a los personajes durante las escenas: pueden moverse automáticamente y mostrarse diálogos en pantalla con identificación de quién habla (referencia de estilo: *Dave the Diver*).

## 3. Mapa de la campaña

| Acto | Mundo | Tema narrativo | Personaje / encuentro | Clímax |
|---|---|---|---|---|
| **1** | **Project Zomboid** | El grupo cae dentro del primer juego; Maxi Negro intenta sobrevivir | **Maxi Negro** inicia; **Jhony** aparece después del jefe, pero se niega a acompañarlo | **El Zombi de la Alarma** |
| **2** | **League of Legends** | Yorick confunde a Solago con uno de sus caminantes por petiso y dientudo | **Solago** se desbloquea en la oleada 3 | **La Doncella de la Niebla** (mini, oleada 5) y **Yorick** (jefe) |
| **3** | **Diablo** | Papasito ignora los llamados; lo hacen aparecer mencionando a Tomi; cargadas por el loot y la estafa | **Papasito** se desbloquea en la oleada 3 | **El Goblin de las Señas** (mini) y **El Carnicero** (jefe) |
| **4** | **Conan Exiles** | Por un error absurdo sobre Jujuy/Bolivia el bot manda a Warrior a Conan, donde los esclavistas lo capturan | **Warrior** es una sorpresa y se desbloquea en la oleada 3 | **El Alquimista del Loto** (mini) y **El Capataz de la Rueda del Dolor** (jefe) |
| **5** | **Discord Corrupto** | El mundo digital mezcla todo lo anterior; el grupo pelea para salir | Los **cuatro personajes** ya están reunidos | Jefes anteriores corruptos (oleada 5) y **El Administrador del Servidor** (final) |

## 4. Reglas de continuidad importantes

- **Personajes jugables iniciales confirmados:** Maxi Negro, Solago, Papasito y Warrior. **No agregar otros como jugables** sin definirlos antes.
- **«Negro» en los diálogos:** se usa **solo** para dirigirse a Maxi Negro. Ningún otro personaje es «negro»: cuando el destinatario es otro, se lo nombra por su nombre (o por un insulto genérico del grupo).
- **Jhony:** cameo del Acto 1; tiene más de 2.000 horas en Project Zomboid, está cómodo matando zombies y **rechaza unirse**. **Odia el LoL: no lo juega ni sobrio** (lo grita en el epílogo del Acto 1). Solo vuelve al grupo **borracho**.
- **Papafrita:** está en **Monster Hunter**, pero **Monster Hunter NO es un mundo jugable** de esta campaña. Al proponerse ir, todos hacen una mueca de asco exagerada, como ante Excalibur de *Soul Eater*. El Administrador analiza el monólogo de Papafrita, **luego** hace también la mueca y vota con el grupo para omitir ese mundo.
- **Maxi (programador):** NO es Maxi Negro, NO es el jefe final, NO participa en el combate final y NO aparece antes de derrotar al Administrador. Su aparición posterior es el giro de cierre.
- **Warrior:** nunca jugó Conan, por eso sorprende encontrarlo allí. El servidor clasifica erróneamente Jujuy como Bolivia; **Jujuy es Argentina** y la equivocación es del bot. La forma de hablar de Warrior es un rasgo narrativo, **no un poder ni mecánica**. Sus habilidades giran en torno a humo, hongos y control de masas.
- **Papasito:** es paraguayo y **no utiliza «boludo» ni «pelotudo» en sus parlamentos**. Suele no contestar cuando le hablan; los otros lo cargan por la albañilería, no saber guaraní, Tomi, la cariñosa y la estafa.
- **Maxi Negro:** mantener sus habilidades «Modo Otaku» (waifu que ataca automáticamente) y «Me da paja» (sillón defensivo con daño en área).
- **Monopoly** fue descartado y no forma parte de la campaña.

## 5. Cómo contar la historia dentro del juego

Usar eventos narrativos acotados para no interrumpir permanentemente el ritmo survivor:

1. **Entrada al mundo:** presentación breve del lugar y del conflicto.
2. **Oleadas:** pequeñas frases y eventos visuales, sin detener innecesariamente la acción.
3. **Primer encuentro con un personaje:** escena automática corta con diálogos y desbloqueo cuando corresponda.
4. **Minijefe y jefe:** introducción o reacción breve, combate y diálogo de cierre en momentos puntuales.
5. **Epílogo:** transición al siguiente juego y continuidad de la trama.

El texto anterior es una **guía de presentación**, no el guion detallado de cada escena. Conservar el humor y las características de cada integrante tal como están escritos en su acto.

## 6. Archivos fuente: leer solo el acto que se va a implementar

Todos los siguientes archivos Markdown son los **guiones completos aprobados**. Mantenerlos junto a esta guía.

| Si se está trabajando en... | Leer antes de implementar |
|---|---|
| Mundo 1 — Project Zomboid | `Discord_Survivors_Acto_1_Project_Zomboid.md` |
| Mundo 2 — League of Legends | `Discord_Survivors_Acto_2_League_of_Legends.md` |
| Mundo 3 — Diablo | `Discord_Survivors_Acto_3_Diablo.md` |
| Mundo 4 — Conan Exiles | `Discord_Survivors_Acto_4_Conan_Exiles.md` |
| Mundo 5 — Discord Corrupto | `Discord_Survivors_Acto_5_Discord_Corrupto.md` |

### Criterio para agentes / implementación

- **Esta guía** sirve para planificar la campaña, saber qué mundos existen y cuándo se incorporan personajes.
- **El acto correspondiente** es la fuente de verdad para diálogos exactos, orden de escenas, chistes y eventos de combate.
- Si un detalle no está especificado aquí, **no asumir que no existe**: consultar el archivo del acto antes de inventarlo o descartarlo.
- No adelantar revelaciones de actos posteriores. En particular, la identidad del prisionero de Conan es sorpresa y la identidad del programador se revela **después del jefe final**.
- Cambios futuros: actualizar primero el guion detallado del acto afectado y luego esta guía si modifica la visión global.

**Estado:** campaña principal definida; **5 actos aprobados**.
