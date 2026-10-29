# Discord Survivors — Enemigos

## Objetivo

Definir cómo se authora un enemigo: qué declara su ficha, cómo se comporta y qué
hay que tocar para sumar uno nuevo. La meta es que agregar un enemigo sea
**autoría de datos** (ficha, ola, dibujo) y que el motor solo cambie cuando se
pide un comportamiento nuevo.

Este documento extiende el contrato de estadísticas de
`context/discord_survivors_estadisticas_base.md`: las fórmulas de conversión y la
entidad neutral viven ahí y no se repiten acá.

## La ficha: las mismas seis estadísticas para todos

Todo enemigo declara las **seis** estadísticas de la entidad neutral como
porcentajes, sin importar si es cuerpo a cuerpo o a distancia:

| Estadística | Qué significa para un enemigo |
|---|---|
| Vida | Puntos de daño que absorbe antes de morir. |
| Defensa | Mitigación del daño que recibe, con el mismo tope de 75%. |
| Ataque | Daño de su golpe. |
| Velocidad de ataque | Frecuencia de sus golpes: intervalo = `100 / P` segundos. |
| Distancia de ataque | Alcance medido desde su borde de colisión. Decide a qué distancia deja de caminar. |
| Velocidad de movimiento | Desplazamiento en px/s escalados. |

Fuera de la tabla quedan solo dos datos de ficha, porque no son estadísticas de
combate: `radius` (tamaño de colisión, en píxeles sin escalar) y `bounty`
(economía).

Los valores por ola se siguen declarando como funciones del número de ola que
devuelven el porcentaje de esa ola, igual que hoy.

## Comportamiento genérico: uno solo, para todos

La regla base es una y se aplica a todo enemigo, incluidos los que ya existen:

1. Se desplaza hacia el jugador.
2. Si la distancia **medida desde los bordes de colisión** es mayor que su
   distancia de ataque, sigue caminando.
3. Si ya está dentro de su alcance, **se detiene** y decide qué acción ejecutar
   entre las que puede hacer (ver abajo).
4. Los enemigos cuerpo a cuerpo declaran distancia de ataque de contacto; los
   enemigos a distancia declaran un alcance mayor. **El motor no cambia entre
   uno y otro: cambia la ficha.**

Los estados que ya existen (aturdimiento, confusión, humo) siguen frenando o
anulando el desplazamiento, y no reemplazan esta regla.

### Decidir la acción dentro del alcance

Estar en alcance no significa golpear sin más: el enemigo **decide qué acción
ejecutar** entre las que puede hacer.

- Cada acción se declara con un **peso de probabilidad**, con un **tiempo de
  recarga**, o con los dos: la probabilidad decide cuál sale, la recarga decide
  cuándo puede volver a salir.
- El **ataque básico es una acción más**. Los enemigos genéricos solo tienen esa,
  así que su cadencia queda fijada por la velocidad de ataque.
- Un enemigo con varias acciones —un jefe, un semi jefe, o cualquiera que haya
  pedido algo específico— elige entre ellas por peso, y la que está en recarga no
  se repite hasta que pase.
- El jugador conserva su inmunidad de 0.65 s como **piso de seguridad**: la
  decisión de atacar es de la ficha, pero nunca recibe dos golpes separados por
  menos que eso. Así la cadencia se siente sin que diez enemigos encima lo
  aplasten en un solo frame.

## Comportamiento específico: se pregunta, no se asume

El comportamiento genérico es el piso, no el techo. La regla de proceso para
sumar enemigos es:

- **Cada vez que se va a agregar un enemigo nuevo, preguntar si lleva algo
  específico.** Si no lleva nada, el enemigo es ficha, ola y dibujo: no se toca
  el motor.
- Si pide algo específico, eso define el alcance del trabajo y se documenta acá
  antes de implementarlo, porque deja de ser autoría de datos.

### Jefes y semi jefes

**Los jefes y semi jefes tendrán ataques especiales.** No son enemigos genéricos
con más vida: su comportamiento incluye ataques propios, además de la regla
genérica de desplazamiento y ataque. Ese es el caso que siempre justifica tocar
el motor, y por eso se diseña aparte.

Para que eso sea barato de hacer, el motor no debe conocer enemigos: debe
conocer **patrones de ataque reutilizables**. La ficha declara qué patrón usa y
con qué números; sumar un jefe nuevo es elegir del catálogo, no agregar ramas.

- Cada patrón es una pieza con su aviso previo (telegrafiado), duración, daño y
  recarga, y sirve para cualquier enemigo que lo declare.
- La ficha declara el patrón junto al resto de sus datos: no hay código por
  enemigo.
- Si un jefe pide un patrón que todavía no existe, se implementa **una vez** como
  patrón y queda disponible para todos los que vengan después.

Candidatos para el primer catálogo: estallido radial, embestida, invocación,
disparo dirigido y zona persistente.

### Minijefes por mundo

La guía general dice que **algunos** mundos tienen minijefe en la oleada 5. No es
obligatorio para todos:

- **Mundo 1 (Project Zomboid): sin minijefe.** La oleada 5 es una horda y la 6
  cierra con el jefe. La ausencia es una decisión, no un olvido: el mundo 1 es el
  tutorial.
- Los actos 2, 3 y 4 ya tienen minijefe declarado en la guía (Doncella de la
  Niebla, Goblin de las Señas, Alquimista del Loto).

## La cadencia de ataque la manda la ficha

Decisión: el ritmo del **ataque básico** lo fija la **velocidad de ataque**, no
la inmunidad del jugador. Un enemigo que declara un intervalo más corto pega más
seguido, y eso es una decisión de balance de su ficha, no un efecto accidental
del motor. Para las demás acciones el ritmo lo fijan su probabilidad y su
recarga.

## Dónde vive cada pieza

| Pieza | Archivo |
|---|---|
| Ficha de un enemigo | `src/enemies/<kind>.mjs`, un archivo por enemigo |
| Registro y resolución de porcentajes | `src/enemies/index.mjs` |
| Aparición, peso en el mix y vida por ola | `src/waves.mjs` (`WAVES`) |
| Receta de dibujo de cada cuerpo | `src/sprites.mjs` (`drawZombie`, `drawRunner`, `drawBrute`, `drawAdministrator`) |
| Props del jugador en el canvas | `src/game/renderer.mjs` (`FIGURE_DRAWERS`) |
| Comportamiento genérico | `src/engine.mjs` (`step`) |

Cada ficha se compone igual que un personaje jugable: declara su tabla, su
cuerpo, su recompensa y su `draw`. Sumar un enemigo es un archivo nuevo y una
línea en el registro, nunca una rama nueva en el renderer.

## Estilo visual: dos niveles, una sola estética

El mundo tiene un idioma de dibujo y dos densidades. Medido en rectángulos por
sprite:

| | rectángulos | qué lleva |
|---|---:|---|
| Enemigo común | ~30 | contorno de tinta cerrado, cuatro tonos en escalón (luz, base, medio, oscuro), brillo solo en zapatillas y manos |
| Jefe / semi jefe | 60-90 | el detalle del cast: cara, pliegues, heridas, varios tonos por material |
| Personajes jugables | 30-87 | la referencia más rica |

La razón del corte no es ahorrar trabajo, es **jerarquía de lectura**: puede
haber quince enemigos en pantalla y uno solo jugador. Si los comunes tuvieran el
detalle del cast, el jugador competiría con la horda para encontrarse a sí mismo.
El jefe está solo en pantalla, así que ahí sí se paga el detalle.

El sombreado va **en escalones, nunca en un bloque de un solo corte**: un torso
con una franja dura se lee como cartel, no como volumen. La luz entra desde la
izquierda y cae en dos pasos hacia la derecha.

**Todos comparten la escala del cast.** El tamaño se expresa en la silueta, no
en la escala: un enemigo común nunca se dibuja más grande que el jugador. El
brute es el más pesado y queda una cabeza por encima del caminante y por debajo
del jugador; para que se lea como muro alcanza con el ancho y los hombros.

**Los jefes de cada acto todavía usan arte prestado.** El del mundo 1 no es el
Administrador: ese es el jefe final del acto 5. Se reemplaza cuando exista el
skill de creación de enemigos.

## Decisiones abiertas

- Estructura de seis oleadas: el motor corre cuatro y la sexta debe cerrar con el
  jefe del acto.
- El jefe del mundo 1: su dibujo propio (hoy usa el del Administrador) y sus dos
  ataques declarados en el guion, invocación y ondas de sonido.
- Umbral a partir del cual un enemigo se considera "a distancia" y cómo golpea a
  esa distancia.

## Implementado

- **`brute`** — el resistente que la oleada 3 del acto 1 pedía. Ficha genérica:
  vida `120 + 12 × ola`, defensa 60%, ataque 300%, una velocidad de ataque de una
  por segundo, distancia de ataque 0 y velocidad `400 + 30 × ola`. Radio 22,
  recompensa 5. Aparece en la oleada 3 con un peso de 0.2 en el mix.
- Umbral a partir del cual un enemigo se considera "a distancia" y cómo golpea a
  esa distancia.
