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
devuelven el porcentaje de esa ola, igual que hoy — salvo **vida**, que es un
único valor por ficha: el escalón de su acto, escrito a mano.

La ficha es la **única** dueña de las seis estadísticas. Una ola dice quién
aparece y con qué frecuencia, nunca cuánto aguanta ni cuánto pega.

La campaña es **una sola escalera**: el cuerpo base del acto 1 es la referencia
(zombie 46 de vida / 12 de daño) y cada acto suma 25% compuesto sobre la base
—57/16, 72/20, 90/24, 112/29—, horneado en las fichas de ese acto. Los demás
bichos de cada acto se montan proporcionales a ese base, así que dentro de un
acto la proporcionalidad se mantiene.

Un acto que use un cuerpo de **otro** escalón (el acto 5 recicla todo el elenco
anterior) lo declara una vez en `statMultipliers`, y ese es el único lugar donde
se permite un multiplicador:

```js
statMultipliers: {
  zombie: { life: 2.44, attack: 2.44 },
  archer: { life: 1.25, attack: 1.25 },
}
```

El multiplicador se aplica **por enemigo y por estadística**, sobre el porcentaje
autorado, antes de cualquier resolver: `1` es el nivel neutral, y una estadística
o un cuerpo que no aparezcan ahí conservan la ficha tal cual. Los actos 1 a 4 no
declaran multiplicadores. Sumar una tabla de vida o daño a una ola es un error de
validación, no una alternativa.

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
genérica de desplazamiento y ataque. Lo que el motor tiene que saber hacer es
**elegir** entre esas acciones; cuáles son, lo define cada ficha.

Lo que se reutiliza es **el selector**, no las habilidades. Cada enemigo define
las suyas en su propia ficha; el motor resuelve una sola vez cómo se elige.

- La ficha declara sus acciones: clave, **peso de probabilidad**, **recarga** y
  qué hace cada una. El ataque básico es una acción más.
- Cuando el enemigo está en alcance y su reloj de ataque se abre, el motor
  **elige al azar entre las acciones disponibles** (las que no están en recarga)
  según sus pesos, ejecuta la elegida y le pone su recarga.
- Si una acción tiene recarga pero no peso, compite igual que las demás.
- **Ningún enemigo hereda las habilidades de otro.** Si dos jefes invocan, cada
  uno escribe su invocación en su ficha; lo compartido es el reloj y la tirada,
  no el efecto.

Así, sumar un ataque a un jefe es autoría de datos en su archivo, y el motor no
crece con cada enemigo nuevo.

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
| Aparición y peso en el mix | `src/waves.mjs` (`WAVES`) |
| Nivel de un acto sobre las fichas | `statMultipliers` en `src/campaign/act-0N-*.mjs` |
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
| Jefe / semi jefe | 120-240 | el detalle del cast: cara construida, costuras, bolsillos, dedos, cordones, tornillos, y **masas con esquinas escalonadas** |
| Personajes jugables | 30-87 | la referencia más rica |

La razón del corte no es ahorrar trabajo, es **jerarquía de lectura**: puede
haber quince enemigos en pantalla y uno solo jugador. Si los comunes tuvieran el
detalle del cast, el jugador competiría con la horda para encontrarse a sí mismo.
El jefe está solo en pantalla, así que ahí sí se paga el detalle.

El sombreado va **en escalones, nunca en un bloque de un solo corte**: un torso
con una franja dura se lee como cartel, no como volumen. La luz entra desde la
izquierda y cae en dos pasos hacia la derecha.

Y ninguna masa se dibuja como una caja de borde duro: el contorno escalona una o
dos unidades en las esquinas (`roundedMass` en `src/sprites.mjs`). Es lo que
separa "sprite del cast" de "rectángulo con relleno", y es lo que más se nota
cuando falta.

**Todos comparten la escala del cast.** El tamaño se expresa en la silueta, no
en la escala: un enemigo común nunca se dibuja más grande que el jugador. El
brute es el más pesado y queda una cabeza por encima del caminante y por debajo
del jugador; para que se lea como muro alcanza con el ancho y los hombros.

**El id de un jefe es su nombre, nunca `boss`.** Cada acto tiene el suyo
(`alarmZombie` en el 1, y los demás cuando existan), y lo que lo marca como jefe
es el campo `boss: true` de su ficha: eso es lo que el motor consulta para el
control de masas reducido, la barra de vida de jefe y el cierre de la partida.
La oleada toma el kind de `BALANCE.waves.bossKind`.

**El jefe del mundo 1 ya tiene su arte**: el *Zombi de la Alarma*, un infectado
hinchado tipo Boomer que arrastra una alarma de seguridad con baliza y anillos de
sonido. Sus dos ataques declarados en el guion — invocación y ondas — siguen
pendientes: son catálogo de patrones, no ficha.

## Decisiones abiertas

- Estructura de seis oleadas: el motor corre cuatro y la sexta debe cerrar con el
  jefe del acto.
- El balance de las dos habilidades del jefe: cuántos zombis por invocación y
  cuánto daña la onda.
## Implementado

- **Selector de acciones**: cuando el reloj de ataque se abre, el motor tira
  entre las acciones de la ficha según su peso y les paga la recarga. Sin
  acciones declaradas, el enemigo hace el ataque básico como siempre.
- **Primitivas que las habilidades reciben**: `spawnEnemy` (invocar) y
  `shockwave` (anillo que crece y golpea una vez al pasar).
- **Jefe del mundo 1 — `alarmZombie`** (El Zombi de la Alarma): `swipe`
  (peso 3), `summon` (peso 1, recarga 9 s, y la cantidad crece con
  `run.elapsed`) y `wave` (peso 2, recarga 6 s, 18 de daño).


- **`maiden` — La Doncella de la Niebla** (acto 2, minijefe de la oleada 5):
  `swipe` (peso 3), `summon` (peso 1, recarga 9 s: tres caminantes) y `wail`
  (peso 2, recarga 6 s: anillo de área de 20). Lleva `boss: true` porque un
  minijefe es un jefe que no cierra la partida.
- **`yorick` — el enterrador** (acto 2, jefe de la oleada 6): `swipe`,
  `summon` (tres caminantes, recarga 10 s), `wall` (recarga 14 s) y `maiden`
  (una sola vez, cuando está por debajo de la mitad de su vida).

### Primitivas nuevas: muro de tierra y acciones por fase

- **`ctx.prison({ x, y, radius, ttl })`** levanta un anillo de tierra alrededor
  del jugador. **Sólo frena al jugador**: los enemigos lo cruzan. Es una trampa,
  no un refugio; el radio se mide desde el centro y el jugador queda sujeto a
  `radio − su radio de colisión`. El anillo expira con su `ttl`.
- **`action.when(run, enemy)`** condiciona una acción a un estado. Sin esto, una
  habilidad bloqueada se elegiría igual y gastaría el turno del jefe. Yorick usa
  `when` para que la Doncella no se invoque antes de tiempo.

- **`brute`** — el resistente que la oleada 3 del acto 1 pedía. Ficha genérica:
  vida `120 + 12 × ola`, defensa 60%, ataque 300%, una velocidad de ataque de una
  por segundo, distancia de ataque 0 y velocidad `400 + 30 × ola`. Radio 22,
  recompensa 5. Aparece en la oleada 3 con un peso de 0.2 en el mix.
### Acto 3 — Diablo

- **Siete fichas nuevas:** `skeleton` y `lesserDemon` (comunes),
  `shaman` (a distancia, proyectil `hex`), `burningElite` (común con una habilidad
  propia: `swipe` y `flames`), `batSwarm` (la corte de Lord Zir), `lordZir`
  (minijefe: `swipe`, `rise` y `wings`) y `lilith` (jefe: `swipe`, `claw`,
  `nova`, `dive` y `enrage`).
  Ningún jefe del acto comparte habilidad con otro.
- **Primitivas nuevas del motor**, pedidas por el guion y no por un enemigo: la
  carga (`enemy.chargeTtl` + `enemy.chargeBoost`: multiplicador temporal que el
  motor expira solo) y el daño propio de una acción melee (`damage` en la acción,
  que reemplaza al daño de contacto de la ficha).

### Acto 4 — Conan Exiles

- **Seis fichas nuevas:** `barbarian` (común genérico del desierto), `slaver`
  (red: acción propia con `range` que usa `ctx.prison` para sujetar al jugador),
  `archer` (a distancia, proyectil `arrow`), `alchemist` (proyectil `flask` y
  `spores` con `ctx.shockwave`), `lotusAlchemist` (minijefe: `swipe`, `lotus`,
  `visions`, `spores` y `overdose`) y `taskmaster` (jefe: `swipe`, `chains`,
  `whip`, `guards`, `wheel` y `rage`).
  Ningún jefe del acto comparte habilidad con otro: la sobredosis del alquimista
  acelera su cadencia, la furia del capataz cambia armadura por velocidad.
- **Nada nuevo en el motor.** El acto usa el selector de acciones, `ctx.prison`,
  `ctx.shockwave` y `ctx.spawnEnemy` que ya existían; lo único que se sumó son
  tres dibujos de proyectil en `src/sprites.mjs`: `arrow`, `net` y `flask`.

### Acto 6 — Epílogo de Papafrita (Monster Hunter)

- **Nueve fichas nuevas:** `jagras`, `vespoid`, `kestodon` (carga telegrafiada),
  `mernos` (se abalanza), `hornetaur` (el muro, 40% de mitigación),
  `greatJagras` (élite: se traga un Jagras y rueda), `kuluYaKu` (minijefe: la
  roca le da 0.75 de defensa hasta que la rompe al 75% de vida), `pukeiPukei`
  (minijefe: lengua, escupe veneno y vacía el saco al 50%) y `rathalos` (jefe:
  escupe fuego a distancia, ruge, se enoja al 66% y arde al 33%).
- **Élite contra común:** la regla de altura del jugador mide a los cuerpos
  comunes. Un élite (hoy `greatJagras`) puede pasar esa altura y se lee por la
  melena, la panza y el ancho; lo que nunca hace es cerrar la oleada, porque eso
  es del jefe y lo marca `boss: true`.
- **Primitiva nueva del motor: `ctx.enemyShot({ x, y, device, damage, speed })`.**
  Un enemigo que ataca a distancia sin volver toda su ficha a distancia. La
  ficha dice qué sale de su boca y cuánto pega; el motor apunta al jugador y
  posee el proyectil. Hacía falta porque `attackDistance` es una sola por ficha:
  subirla convertía también el mordisco en proyectil.
- **Dos dibujos de proyectil nuevos:** `fireball` (Rathalos) y `venom`
  (Pukei-Pukei).

- **Actor de escena:** los dos jefes tienen actor de cinemática (`src/npcs/`)
  y retratos, así que hablan en diálogo como los jefes de los actos 2 y 3. El
  cadáver del Capataz en la escena de derrota sigue siendo un actor `enemy` con
  `state: "dead"`: un muerto no habla.
