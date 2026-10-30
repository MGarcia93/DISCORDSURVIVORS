---
name: discord-survivors-dialogos
description: Revisar, escribir y corregir diálogos de Discord Survivors respetando voces, chistes internos, continuidad, ritmo de cinemáticas, movimiento de escena y oleadas. Usar al tocar cualquier acto, epílogo o DLC del juego.
---

# Skill: diálogos y continuidad de Discord Survivors

## Fuente de verdad

Leer **obligatoriamente** [references/personajes-y-dialogos.md](references/personajes-y-dialogos.md) antes de escribir o retocar diálogos. Leer además el archivo específico del acto solicitado y, si está disponible, el guion consolidado aprobado de ese acto. **El texto aprobado y el canon tienen prioridad sobre improvisaciones.** Ante contradicciones, indicar exactamente el conflicto, no decidir silenciosamente.

## Flujo al corregir un acto ya implementado

1. Localizar archivos narrativos, diálogos, disparadores de oleada y referencias del acto. Identificar IDs, claves de localización, eventos y estados; **no modificarlos sin necesidad**.
2. Levantar un mapa pequeño de escenas: personajes presentes, relaciones entre ellos, orden cronológico, antecedentes, objetivos y desbloqueos. Aplicar «Dinámicas entre personajes» de la biblia, no solo las voces individuales.
3. Comparar cada línea con la biblia: voz, chiste, enojo, contexto y contradicciones. Marcar «conservar», «ajustar» o «eliminar».
4. Identificar qué acción, frase o antecedente de la escena justifica el cambio. Si no hay una oportunidad natural, conservar. No fabricar preguntas para insertar remates ni demostrar rasgos por obligación. Reescribir solo lo necesario, preservando estructura, IDs y gameplay.
5. Revisar continuidad entre escenas: la pregunta tiene respuesta, la cargada surge de algo, los personajes saben solo lo que deberían saber y cada oleada acerca al siguiente objetivo.
6. Comprobar que los diálogos durante gameplay sean breves y no tapen UI/combate; que cinemáticas contengan discusiones extensas.
7. Entregar **diff o lista concreta de cambios** por archivo, más alertas de canon. No declarar pruebas técnicas si no se ejecutaron.

## Cinemáticas con movimiento (mapa largo)

Cuando el guion dice que alguien **corre, persigue, huye, avanza, sigue un rastro o se
aleja**, la escena necesita que ese recorrido se vea. Una animación de caminar con el
actor quieto no cuenta: si el texto dramático depende de la distancia, el actor tiene
que cambiar de posición.

La mecánica disponible:

- `stage.size: [ancho, alto]` da un mundo mayor que el viewport fijo 1144×748.
  Enteros, mínimo 1144×748, máximo 4096×4096. Sin ese campo, la escena sigue
  siendo del tamaño de la pantalla.
- Puntos, actores, props y destinos de cámara usan **coordenadas del mundo**, no de
  pantalla. El fondo se pinta una sola vez al tamaño del mundo.
- Un recorrido corto y finito se arma con `move` + `camera` en `parallel`, con el
  mismo destino y duración.
- Un recorrido que debe durar **mientras el jugador lee** usa `dialogue` con
  `staging: "<accion>"`. El módulo hermano de la escena exporta esa acción con el
  contrato de extensión (`validate`/`start`, y el `tick`/`skip` que devuelve `start`,
  más `cancel` opcional). Ese `tick` corre con cada línea todavía abierta, pero
  **no decide cuándo termina el diálogo**: el avance sigue siendo manual.
- `layout: "stage"` cambia los retratos grandes por un panel compacto de subtítulos
  para que los cuerpos se vean moverse. Sin ese campo, el diálogo conserva el
  formato de retratos y oculta a quien habla, como siempre.
- La acción de staging es **solo presentación**: no hace daño, no avanza la oleada,
  no escribe progreso y no toca la partida. En `skip`, `cancel` y al terminar debe
  soltar animaciones, destello y cámara.
- Si el jugador tarda en leer, el recorrido no puede quedar clavado contra el borde:
  conviene un bucle de ida y vuelta que también haga girar a los actores.
- La cámara se mantiene dentro del mundo y acompaña el centro de los que huyen, con
  zoom 1 para conservar la escala de los sprites.

Cuándo **no** usarlo: discusiones quietas, loot, reacciones después de un jefe o
cualquier charla donde moverse distraiga. Ahí alcanza con escenografía y objetos
propios.

Referencia implementada: Acto 2, `act-02-maiden` — mapa de 3432×748, Negro y Solago
huyendo, Doncella persiguiendo, panel compacto y cámara que sigue. Se revisa en
`?dev=narrative` → «Acto 2: Te vino a buscar tu jermu». La escena de Jhony
(`act-01-jhony`) muestra el recorrido corto con `move` + `camera`.

## Aprobación visual antes de los tests

El trabajo visual de cinemáticas (escenario nuevo, recorrido, encuadre, movimiento
de cámara o cambio de formato de diálogo) sigue este orden:

1. Implementar la escena y su escenografía. **No escribir tests todavía.**
2. Mostrar qué cambió y cómo verlo en `?dev=narrative`, sin cambiar diálogos, IDs,
   efectos ni bindings.
3. **Esperar la aprobación explícita del usuario.**
4. Recién con la aprobación, escribir los tests de regresión y correr la suite.

No declarar terminada una escena visual sin esa aprobación ni presentar tests como
si fueran la entrega. Si el usuario pide ajustes, cambiar la presentación primero y
volver a mostrar antes de testear.

## Estilo y límites

- Humor adulto, negro y de doble sentido, con contexto y límites de canon; no suavizar los intercambios aprobados ni añadir crueldad por cuota. Aplicar los ejemplos de «Tono y contexto» de la biblia sin forzar palabras para provocar remates.
- El Negro desvía conversaciones serias para cargar a sus amigos; le encanta molestar, pero si lo cargan demasiado se enoja y responde mal incluso a preguntas normales. No confundirlo con Papasito, que también puede cerrarse y no contestar. Aplicar los ejemplos y límites de la referencia, sin forzar el mismo intercambio en cada escena.
- Evitar modismos intercambiables: Papasito paraguayo educado; Warrior jujeño «ura»; Negro argentino disperso; Maxi programador seco; Papafrita expansivo; Solago reactivo.
- No explotar la discapacidad de Warrior como remate, ni inventar fonética de su habla.
- Warrior puede aceptar un plan, lanzarse antes de tiempo y culpar al compañero llamándolo «manco» cuando sale mal. Usar ese contraste y su expresión frecuente con contexto, no como insulto automático en cada línea.
- El remate sobre los padres del Negro queda únicamente en su intercambio existente del postgame de Papafrita: no repetirlo, trasladarlo ni inventar variantes. Sus padres fallecieron, no lo abandonaron.
- No usar «anamencua» en boca de Papasito.
- Mantener el orden y los desbloqueos de los actos.

## Entrada esperada del usuario

Archivo(s) o carpeta del acto; objetivo concreto (ej.: «ajustar voces sin cambiar mecánicas»). Si pide trabajar todo el repositorio, revisar primero con búsquedas y aplicar cambios mínimos en los archivos que correspondan. Si falta información, avanzar con lo verificable y marcar los puntos inciertos.

## Resultado

Archivos actualizados y resumen conciso de cambios, con ejemplos de antes/después si sirven. No inventar diálogos nuevos solo para cumplir cuotas de chistes.
