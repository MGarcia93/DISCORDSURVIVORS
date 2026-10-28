# Discord Survivors — Objetos y progresión

> Diseño acordado de objetos, progresión por experiencia y tienda. Incluye una propuesta técnica basada en el proyecto actual; este documento no implica que los sistemas ya estén implementados.

## 1. Principios

- El juego ya tiene implementados el combate, daño, movimiento, estadísticas y compra de mejoras al finalizar cada oleada.
- Los **objetos son genéricos**: cualquier personaje puede equiparlos, en cualquier acto.
- Los objetos hacen referencias a anécdotas internas del Discord y modifican estadísticas existentes.
- Se mantienen únicamente estas seis estadísticas:
  1. Vida
  2. Defensa
  3. Ataque
  4. Distancia de ataque
  5. Velocidad de ataque
  6. Velocidad de movimiento
- **Ataque** es una sola estadística: no hay ataque cuerpo a cuerpo ni ataque a distancia como estadísticas independientes.
- Las cifras exactas, rarezas, precios y límites de objetos quedan pendientes de balanceo.

## 2. Catálogo de objetos

| Objeto | Efecto propuesto | Lore |
|---|---|---|
| **Tijera** | + Ataque | «Cuenta la leyenda que una asesina utilizó estas tijeras para apuñalar a alguien por la espalda. Algunos dicen que fue un accidente. Fuente: Solago.» |
| **Lejía** | + Vida | «Dicen que cura cualquier enfermedad. El primero que lo comprobó no sobrevivió para confirmarlo.» |
| **Zapatilla** | + Ataque | «Cuenta la leyenda que esta zapatilla fue utilizada para aplastar una cabeza. Por alguna razón, al Negro le trae malos recuerdos.» |
| **Antidepresivos** | + Defensa | «No solucionan tus problemas, pero al menos evitás explotar antes de terminar la partida.» |
| **Teléfono de Extorsión** | + Velocidad de movimiento | «Se dice que cierto sujeto recibe llamadas de extorsión constantemente. Desde entonces, cada vez que suena el teléfono, sale corriendo.» |
| **Hongos Mágicos** | + Velocidad de ataque | «Warrior asegura que con esto anda más rápido. Nadie tuvo los huevos de explicarle que lleva tres horas mirando una pared.» |
| **Alcohol** | + Ataque / − Defensa | «Te vuelve más agresivo e intolerante. También te hace tanto daño que terminás considerando volver al LoL. Y eso ya es tocar fondo.» |
| **Gallina** | + Distancia de ataque *(provisional)* | «Cuenta la leyenda que alguien pasó horas cuidando de esta gallina, hasta que otro llegó y le pegó un saque. Por alguna razón, al Negro todavía le cuesta hablar del tema.» |

**Nota de diseño:** la estadística asignada a **Gallina** se propuso para completar la cobertura de las seis estadísticas, pero puede revisarse si no resulta apropiada al balance. Los nombres y el lore corresponden a las versiones conversadas.

## 3. Progresión híbrida — acordada

### 3.1. Durante la oleada

- El jugador elimina enemigos y obtiene **experiencia (XP)**, independiente del dinero.
- Al alcanzar el umbral de XP, **acumula un nivel pendiente**.
- El combate **no se interrumpe** para seleccionar recompensas: la elección se realiza al finalizar la oleada.
- El dinero o recurso usado por la tienda sigue siendo independiente de la XP.
- **Ritmo de progresión acordado:** los primeros niveles pueden obtenerse rápidamente, pero los posteriores requieren más XP. Los niveles obtenidos dependen de cuánto mate el jugador y de la XP configurada para esas bajas, no de una cuota por oleada. No se adopta un objetivo uniforme de 2–3 niveles por oleada: el usuario lo considera excesivo fuera de los primeros niveles. Una oleada puede dar varios niveles, uno o ninguno según la XP ganada y los umbrales; no se impone un tope de niveles por oleada ni se reduce la recompensa por matar más. Los umbrales y recompensas concretos quedan pendientes de balance.

### 3.2. Al finalizar la oleada

Flujo acordado de progresión:

1. **Subida de nivel:** por cada nivel obtenido durante la oleada, el jugador elige **una de tres mejoras**, que pueden ser de estadísticas o de habilidades propias del personaje.
2. **Tienda:** muestra **cuatro objetos aleatorios**. El jugador decide cuáles comprar con el dinero disponible, o no compra y ahorra.
3. **Siguiente oleada:** comienza con las estadísticas y objetos actualizados.

Si el jugador no ganó niveles en la oleada, pasa directamente a la tienda.

**Última oleada — excepción acordada:** al completar la última oleada del mapa, la partida pasa directamente al flujo de victoria, sin abrir selección de mejoras ni tienda. Los niveles pendientes no generan elecciones después de terminar la partida. Esta excepción no elimina las escenas de cierre ni los desbloqueos existentes asociados a la victoria.

**Distribución acordada de las tres opciones por nivel:** una mejora propia del personaje y dos mejoras de estadísticas comunes, elegidas aleatoriamente entre las opciones elegibles de cada grupo. Si no hay ninguna mejora propia elegible, se ofrecen tres mejoras comunes. Reservar una opción propia no garantiza una habilidad concreta ni la concede automáticamente. Si un grupo no tiene suficientes opciones, se muestran únicamente las disponibles según esta distribución, sin rellenar con repetidas ni con mejoras fuera de sus requisitos.

**Agotamiento de mejoras:** si quedan menos de tres opciones elegibles, se muestran menos. Si no queda ninguna, se informa al jugador y se permite resolver la elección pendiente sin recompensa y continuar. El nivel ganado se conserva; no se exceden rangos máximos ni se bloquea la partida.

**Repeticiones acordadas para las elecciones de nivel:** una misma mejora no puede aparecer dos veces en una selección. Puede volver a aparecer en selecciones de niveles posteriores mientras tenga rangos pendientes y siga siendo elegible. Al alcanzar su rango máximo, deja de ofrecerse. Esta regla no decide si la tienda admite objetos duplicados.

**Sin reroll en la primera versión:** no se pueden regenerar las opciones de nivel ni las ofertas de tienda. Actualizar su presentación tampoco cambia las opciones ya generadas. El reroll queda fuera del alcance inicial; incorporarlo después requerirá una decisión explícita.

### 3.3. Diferencia entre niveles y objetos

| Fuente | Qué concede | Cuándo |
|---|---|---|
| **Nivel por XP** | Mejoras de las seis estadísticas y habilidades propias del personaje | Selección al terminar la oleada |
| **Tienda** | Objetos con efectos de estadísticas y descripciones de lore | Compra al terminar la oleada |

La idea es **reutilizar el sistema de mejoras ya implementado**, separando las recompensas por nivel de los objetos comprados. No se reemplaza el combate ni el cálculo de daño existentes.

### 3.4. Habilidades elegibles, nunca automáticas

- Alcanzar un nivel requerido permite que una habilidad **aparezca entre las opciones**; no la concede.
- La habilidad solo se obtiene al elegirla. Esto también se aplica a sus mejoras posteriores.
- Las mejoras avanzadas requieren haber elegido su mejora base.
- Las elecciones deben permitir especializaciones diferentes, no garantizar que el personaje termine con todas sus habilidades mejoradas.
- **Maxi Negro empieza sin rebote.** El rebote puede entrar en el conjunto de opciones a partir de un nivel que queda pendiente de balance.
- Esto no decide retirar las demás habilidades básicas actuales: cualquier otro cambio del kit inicial debe definirse expresamente.

## 4. Caminos de mejora por personaje — acordados

Los siguientes efectos son el catálogo de diseño aprobado. Su magnitud, nivel mínimo, cantidad de rangos y combinaciones exactas quedan pendientes de balance. No son efectos que se obtengan todos al elegir un camino.

| Personaje | Camino | Opciones de mejora |
|---|---|---|
| **Maxi Negro** | Tanque sedentario | Regeneración que comienza antes al quedarse quieto; escudo temporal después de permanecer quieto; pulsos del sillón más amplios. |
| | Invocación | Mayor duración de la waifu; ataques más frecuentes; ataques que atraviesan un enemigo. |
| | Rebote | Habilitar un primer rebote; después, ofrecer otro salto con daño reducido por salto. |
| **Solago** | Mordidas | Golpear varios enemigos en un arco; segunda mordida más débil; empuje para abrir una salida. |
| | Contraataque | Recibir un golpe durante Sonrisa blindada prepara una mordida potenciada, con enfriamiento. |
| | La Patrona | Mayor duración; tijeretazos más amplios; remate final al desaparecer. |
| **Warrior** | Hongos | Explosiones mayores; un hongo adicional más débil; pequeña zona de esporas al impactar. |
| | Confusión | Aplicar acumulaciones más rápido; matar a un enemigo confundido propaga una acumulación a enemigos cercanos. |
| | Humo | Nubes más duraderas; dejar humo al desplazarse; potenciar el daño de hongos contra enemigos dentro del humo. |
| **Papazito** | Ladrillos | Atravesar un enemigo; fragmentación al impactar; dos ladrillos en abanico con menor daño individual. |
| | Economía | Mejor precio de venta de pertenencias; reducir una penalización de venta; potenciar el siguiente ataque después de vender. |
| | Pánico | Las bajas prolongan brevemente el pánico, con duración máxima; ráfaga al activarse La seña. |

### Límites de diseño

- Rebotes, propagación, duración de efectos y acumulaciones deben tener límites configurables.
- Warrior no puede mantener permanentemente controlados a los jefes.
- Papazito no puede generar dinero o ventas infinitos; mejorar sus ventas no repone automáticamente las pertenencias.
- Se mantienen las **seis estadísticas comunes**. Duración, cantidad de proyectiles, propagación y otros parámetros particulares son efectos de habilidades, no nuevas estadísticas generales.

### Referencias de diseño

- [Brotato — personajes](https://brotato.wiki.spellsandguns.com/Characters): referencia para identidades jugables diferenciadas.
- [20 Minutes Till Dawn — mejoras](https://20-minutes-till-dawn.fandom.com/wiki/Upgrades): referencia para cadenas de mejoras.
- Estas referencias inspiran el diseño; no implican copiar sus cifras ni sus reglas de obtención.

### Curva inicial de XP — aprobada como punto de partida, todavía no implementada

La [wiki de experiencia de Brotato](https://brotato.wiki.spellsandguns.com/Experience) describe costes de nivel con crecimiento cuadrático y elecciones al terminar la oleada. La [wiki de niveles de Vampire Survivors](https://vampire.survivors.wiki/w/Level_up) describe requisitos crecientes por tramos y selección durante la partida. Se toma el principio de requisitos crecientes, no sus cifras ni su relación entre XP y moneda: aquí oro y XP siguen separados.

**Configuración inicial aprobada para probar:** comenzar en nivel 1, otorgar 1 XP por zombi o corredor derrotado y calcular el coste del siguiente nivel como `10 × nivelActual²`. El factor 10, el exponente 2 y las recompensas por tipo de enemigo deben ser configurables. La recompensa de jefes se fijará junto con su balance; el jefe final no abre elecciones por la excepción de victoria.

| Subida | XP de esa subida | XP acumulada desde el inicio |
|---|---:|---:|
| 1 → 2 | 10 | 10 |
| 2 → 3 | 40 | 50 |
| 3 → 4 | 90 | 140 |
| 4 → 5 | 160 | 300 |
| 5 → 6 | 250 | 550 |

La XP sobrante se conserva entre niveles y oleadas. Por ejemplo, 100 bajas de enemigos de 1 XP dejan al jugador en nivel 3 con 50 XP hacia el siguiente; 150 bajas acumuladas lo dejan en nivel 4 con 10 XP sobrantes. Son ejemplos de la configuración inicial aprobada, no niveles garantizados por oleada.

**Contraste con el mapa actual:** el motor contiene tres oleadas de aparición de enemigos de 60 segundos y una cuarta de jefe. Una reproducción aislada del temporizador de aparición a pasos de 0,05 s, sin muertes del jugador ni presión del límite de enemigos vivos, calcula aproximadamente 98, 112 y 130 apariciones en las tres primeras oleadas. Son apariciones teóricas, no bajas observadas ni una simulación de combate. Si se eliminaran todos esos enemigos con 1 XP por baja, la propuesta daría dos subidas en la primera oleada, una en la segunda y una en la tercera. Con menos bajas, llegarían menos niveles o se obtendrían más tarde.

**Implicación para habilidades:** este mapa corto ofrece pocas elecciones antes del jefe. Los niveles mínimos de las primeras mejoras propias deben ajustarse a esa duración; no ubicar todo el desarrollo en niveles que el mapa actual no permite alcanzar. Las cadenas completas podrán requerir revisar el ritmo si se amplía la duración de la partida.

Esta curva está aprobada como configuración inicial para probar, no como balance definitivo validado. Antes de considerarla estable, contrastar bajas reales por personaje, elecciones disponibles y potencia obtenida, especialmente al retirar el rebote inicial del Negro. No cambiar la generación de enemigos ni reducir la XP ganada para forzar un número de niveles por oleada.

## 5. Tienda y economía — acordadas

- La tienda presenta **cuatro objetos aleatorios** al finalizar la oleada.
- Las cuatro ofertas son de **objetos distintos dentro de la misma tienda**. Un objeto puede reaparecer en tiendas de oleadas posteriores y acumularse hasta el límite configurable de ese objeto. Al alcanzar ese límite, deja de ser elegible.
- Si quedan menos de cuatro objetos elegibles, la tienda muestra solo los disponibles, sin rellenar con repetidos. Si no queda ninguno, permite continuar sin comprar. Las cuatro ofertas son el tamaño objetivo cuando hay suficiente catálogo elegible, no una obligación de inventar opciones.
- Cada objeto tiene su propio precio: no todos cuestan lo mismo.
- El precio debe corresponder al efecto y potencia del objeto; los valores todavía no están fijados.
- El jugador puede comprar objetos baratos, elegir uno caro o guardar dinero para otra tienda.
- **Una o dos compras por oleada normal es una referencia de balance, no un límite de compras.** Según precios, dinero ahorrado y efectos económicos, podrían comprarse más o menos.
- El objetivo es que comprar todas las ofertas no sea la situación habitual, no impedir que alguna vez sea posible.
- La XP no se gasta en la tienda y las compras no consumen niveles pendientes.

### Balance fácil de ajustar

Los valores deben poder modificarse desde una configuración de balance identificable, sin cambiar la lógica que ejecuta las reglas.

| Área | Parámetros ajustables |
|---|---|
| Ingresos | Oro por tipo de enemigo y bonificaciones de cierre de oleada. |
| Precios | Precio propio de cada objeto y, si se adopta, escalado entre oleadas. |
| Experiencia | XP por tipo de enemigo y curva de XP necesaria para subir de nivel. |
| Recompensas | Magnitud de cada mejora de estadística o habilidad. |
| Elegibilidad | Nivel mínimo, prerrequisitos y rangos máximos de las mejoras. |
| Límites | Rebotes, propagación, duraciones y acumulaciones de efectos. |

No basta con reducir el oro: también deben evaluarse los precios, el poder obtenido por nivel y la economía particular de Papazito. Los ajustes se validarán jugando y mediante pruebas reproducibles; no hay cifras finales acordadas.

### Agregar objetos sin programar sus estadísticas — requisito acordado

Agregar un objeto que modifique las seis estadísticas comunes debe requerir **una entrada en el catálogo**, no una función nueva ni cambios en el motor, la tienda o cada personaje. La entrada define identificador, nombre, lore, precio y modificadores; el sistema calcula el resultado y genera el texto de sus efectos a partir de esos mismos datos.

Ejemplo de formato **propuesto**, con valores ilustrativos, no de balance definitivo:

```js
{
  id: 'alcohol',
  name: 'Alcohol',
  price: 30,
  lore: 'Te vuelve más agresivo e intolerante.',
  modifiers: [
    { stat: 'attack', operation: 'percent', value: 10 },
    { stat: 'defense', operation: 'flat', value: -1 },
  ],
}
```

En ese ejemplo, el autor declara **+10% de Ataque y −1 punto de Defensa**. No calcula daño por golpe, mitigación ni intervalos de disparo. El lore abreviado del ejemplo no reemplaza el catálogo aprobado de la sección 2.

| Dato del autor | Responsabilidad del sistema |
|---|---|
| `life`, `defense`, `attack`, `attackDistance`, `attackSpeed`, `moveSpeed` | Reconocer únicamente las seis estadísticas comunes y sus unidades. |
| Modificador `flat` | Interpretar puntos de la estadística, nunca píxeles, mitigación interna o segundos entre ataques. |
| Modificador `percent` | Interpretar una bonificación relativa explícita; no confundirla con los porcentajes sobre `BASE_STATS` de las fichas. |
| Velocidad de ataque positiva | Aumentar ataques por segundo y convertir el resultado a intervalo internamente. No exigir al autor calcular una reducción de recarga. |
| Uno o varios modificadores | Combinar beneficios y penalizaciones, aplicar límites y mostrar el efecto real sobre el personaje. |
| Nombre, precio y lore | Incluir el objeto en el catálogo disponible para la tienda mediante el registro compartido. |

**Cálculo compartido propuesto:** conservar los valores base del personaje y los modificadores de cada fuente —objetos, niveles y efectos temporales— por separado; derivar de ellos las estadísticas efectivas. No multiplicar y sobrescribir permanentemente el resultado cada vez que se compra algo, porque mezcla fuentes y dificulta explicar o recalcular la build.

**Regla de composición acordada para los modificadores de estadísticas de objetos y niveles:** `(base + suma de puntos) × (1 + suma de porcentajes / 100)`, seguida de límites y conversión a las unidades del motor. Los porcentajes se suman entre sí, no se multiplican de manera compuesta. Por ejemplo, Ataque base 10, +2 puntos y dos mejoras de +10% darían 14,4, independientemente del orden de adquisición. La migración de las mejoras actuales, que incluyen multiplicaciones acumulativas, debe hacerse explícitamente y con pruebas; la aprobación de esta fórmula no cambia automáticamente las reglas particulares de habilidades temporales.

El cálculo debe reutilizar y adaptar las conversiones de `src/stats.mjs`, no crear una fórmula de daño o defensa paralela. Los efectos temporales deben poder expirar sin borrar bonificaciones de objetos o niveles. Los redondeos, los alcances ilimitados y las reglas particulares de activación o expiración de efectos temporales se resolverán expresamente antes de implementar el cálculo.

**Aumento de vida máxima — regla acordada:** cuando un objeto o mejora de nivel aumenta la vida máxima efectiva, la vida actual aumenta en la misma cantidad, sin superar la nueva máxima ni curar al personaje por completo. Por ejemplo, una mejora de +20 de vida máxima transforma **60/100 en 80/120**. Se aplica el incremento efectivo después del cálculo de estadísticas y sus límites, una sola vez al adquirir la mejora; recalcular o mostrar las estadísticas no vuelve a curar. La regla no decide cómo tratar la activación o expiración de efectos temporales.

**Reducción de vida máxima — regla acordada:** una penalización que reduce la vida máxima solo recorta la vida actual si supera la nueva máxima: `vidaActual = min(vidaActual, nuevaVidaMaxima)`. Por ejemplo, −20 de vida máxima transforma **60/100 en 60/80** y **90/100 en 80/80**. No se resta además la penalización de la vida actual ni se mantiene automáticamente el porcentaje de vida anterior. Las reglas particulares de activación o expiración de efectos temporales siguen pendientes.

**Validación de autoría:** rechazar identificadores duplicados, estadísticas u operaciones desconocidas y números inválidos con mensajes que identifiquen el objeto y el campo. Las descripciones mecánicas y la vista previa deben coincidir con lo aplicado, incluidos los límites; el lore se escribe por separado.

**Límite de la facilidad de extensión:** un objeto nuevo con efectos estadísticos ya soportados solo necesita datos. Una mecánica nueva —por ejemplo, una reacción especial al recibir daño— puede requerir implementar y probar un efecto reutilizable; no se promete que cualquier comportamiento imaginable se resuelva solo con números.

### Agregar mejoras de nivel con datos — requisito acordado

La misma facilidad de autoría se aplica a las **mejoras comunes y propias de cada personaje**. Agregar una opción que use estadísticas o efectos ya soportados debe requerir una entrada de catálogo, sin cambiar el motor, la pantalla de selección ni escribir una función por mejora.

El autor define nombre, destinatario —todos los personajes o uno concreto—, nivel mínimo, prerrequisitos, rangos máximos y lo que concede cada rango. Los valores se editan en los datos de esa mejora; no se reparten entre la interfaz y el combate. El sistema resuelve elegibilidad, cálculo, límites y descripción mecánica.

Ejemplo **propuesto**, con cifras ilustrativas y sin asignar una mejora nueva al diseño aprobado:

```js
{
  id: 'steady_attack',
  name: 'Steady Attack',
  characters: 'all',
  minLevel: 3,
  requires: [],
  ranks: [
    { modifiers: [{ stat: 'attack', operation: 'percent', value: 5 }] },
    { modifiers: [{ stat: 'attack', operation: 'percent', value: 5 }] },
  ],
}
```

Cada rango del ejemplo concede su propio +5% de Ataque al elegirlo; hay dos rangos como máximo. El nivel mínimo solo habilita su aparición. El formato, los nombres y las cifras son una ilustración técnica, no una recompensa nueva ya acordada.

| Tipo de mejora | Cómo se declara | Qué resuelve el sistema |
|---|---|---|
| Estadística común | Los mismos modificadores de estadísticas usados por los objetos. | Cálculo y descripción coherentes entre niveles y tienda, manteniendo separadas sus fuentes. |
| Estadística exclusiva | Modificadores y personaje destinatario. | Solo ofrecerla al personaje indicado. |
| Habilidad existente | Referencia a un efecto reutilizable y sus parámetros, por ejemplo cantidad de rebotes o duración de la waifu. | Aplicar el efecto al elegir el rango y respetar límites. |
| Mejora avanzada | Referencia al identificador y rango requerido de una mejora anterior. | No ofrecerla antes de cumplir el prerrequisito. |

**Registro compartido, no pantallas especiales:** la selección de nivel consulta los catálogos comunes y de la ficha del personaje. Una nueva entrada válida participa en la generación de opciones sin añadir condiciones por nombre en la interfaz. Las mejoras gratuitas no llevan precio ni consumen oro; compartir el formato de efectos con los objetos no mezcla los dos sistemas.

**Validación de autoría:** informar identificadores duplicados, personajes o efectos desconocidos, prerrequisitos inexistentes o cíclicos, rangos inválidos y parámetros incompatibles. Un error de datos debe identificar la mejora y el campo, no aparecer como una opción que luego falla silenciosamente.

**Límite de extensión:** una mejora que ajusta un efecto existente solo requiere datos. Una idea que introduce una mecánica nueva puede necesitar un efecto reutilizable nuevo y sus pruebas; después otras mejoras podrán referenciarlo sin repetir su implementación. No introducir código ejecutable arbitrario en el catálogo para simular esta facilidad.

## 6. Integración técnica propuesta — no implementada

### Base actual observada

| Pieza existente | Responsabilidad actual | Cómo aprovecharla |
|---|---|---|
| `src/engine.mjs` | `createRun`, compra con `chooseUpgrade`, cambio de oleada con `startNextWave` y entrega de monedas con `awardCoins`. | Añadir progresión de la partida y separar elegir una recompensa de comprar un objeto. |
| `src/enemies.mjs` | Tipos de enemigo y recompensas `bounty`, consultadas mediante `enemyBounty`. | Asociar recompensas de oro y XP a una configuración explícita. |
| `src/characters/*.mjs` | Fichas con estadísticas, ataques, pasivas, especiales y hooks como `initPlayer`, `onKill` y `onCoinsGained`. | Definir mejoras propias en las fichas y reutilizar sus hooks, sin un bloque central de condiciones por nombre de personaje. |
| `src/game/overlays.mjs` y `src/game/hud.mjs` | Presentación de tienda, menús e información de partida. | Mostrar elecciones pendientes, cuatro ofertas, precios, XP y efectos obtenidos. |
| `src/app.mjs` | Eventos de interfaz y coordinación del motor y la narrativa. | Enrutar las nuevas acciones sin aplicar reglas económicas desde el DOM. |
| `src/narrative/director.mjs` y `src/narrative/host.mjs` | Coordinación de escenas alrededor de las oleadas; el director observa fases `shop` y `won`. | Mantener el orden narrativo y evitar que la nueva selección de niveles omita o repita escenas. |
| `src/progression.mjs` | Desbloqueos de personajes persistidos y reacción a `waveCleared`. | Mantener separado el desbloqueo permanente de la XP y la build de la partida. |

Actualmente las mejoras de tienda se definen en `UPGRADES`, dentro del motor, y se aplican al comprar. La propuesta requiere separar esos dos conceptos, no cambiar solamente el texto de las tarjetas.

### Separación de responsabilidades propuesta

1. **Configuración de balance:** concentrar ingresos, precios, curva de XP y cantidades de mejoras. Los valores particulares pueden agruparse por personaje u objeto; no duplicar números entre motor, interfaz y descripciones.
2. **Progresión de partida:** guardar XP, nivel, elecciones pendientes y mejoras elegidas en el estado de la partida. Procesar varias subidas cuando una recompensa de XP supere varios umbrales. No añadir progresión permanente entre partidas.
3. **Catálogos separados con efectos compartidos:** distinguir mejoras comunes, mejoras propias del personaje y objetos comprables. Usar entradas declarativas y un registro de efectos reutilizables para permitir nuevas opciones sin modificar el motor ni sus pantallas. Reutilizar las reglas de estadísticas existentes sin mezclar costes con recompensas gratuitas de nivel.
4. **Ofertas y elecciones:** generar opciones con el generador aleatorio que ya recibe `createRun`; guardar las ofertas y no regenerarlas al dibujar la interfaz. Filtrar por nivel, prerrequisitos y máximos antes de ofrecer una mejora.
5. **Aplicación en el motor:** validar las elecciones y compras contra las opciones realmente ofrecidas, comprobar recursos y aplicar cada efecto una sola vez. La interfaz muestra el resultado, no decide su validez.
6. **Cierre de oleada coordinado:** resolver escenas, niveles pendientes y tienda sin iniciar la siguiente oleada antes de terminar las elecciones. Antes de introducir una fase nueva, adaptar y probar el contrato que hoy observa la narrativa.

Los nombres y ubicaciones exactas de los módulos nuevos se decidirán al implementar. No se necesita incorporar dependencias ni un paso de compilación.

### Cuidados específicos del proyecto

- **Oro y XP tienen causas distintas:** una venta de Papazito o una bonificación de supervivencia no debe convertirse en una baja ni conceder XP por pasar por una función de ingresos.
- **Papazito ya tiene deuda y liquidación de ventas:** conservar el inventario ficticio separado de los objetos comprados y considerar el pago de deuda al ajustar sus ganancias. No usar los objetos de combate como pertenencias vendibles.
- **Eventos existentes:** conservar los desbloqueos basados en `waveCleared` y evitar emitir el cierre varias veces por pasar por selección de nivel y tienda.
- **Final de partida:** el director también observa `won`. Respetar la regla acordada de victoria directa tras la última oleada, sin tienda ni selección de niveles pendientes, conservando escenas de cierre y desbloqueos.
- **Combate compartido:** no modificar la fórmula general de daño ni retirar habilidades iniciales adicionales como consecuencia indirecta de parametrizar efectos.

### Secuencia de implementación recomendada

| Paso | Entrega coherente | Verificación principal |
|---|---|---|
| 1 | Extraer parámetros de balance conservando inicialmente el comportamiento actual. | Comparar resultados y mantener pruebas existentes en verde. |
| 1a | Definir los catálogos declarativos de objetos y mejoras de nivel, el registro de efectos y el cálculo compartido de modificadores. | Añadir un objeto y una mejora común o de personaje solo con datos; comprobar elegibilidad, rangos, unidades, composición, límites y texto sin alterar involuntariamente las mejoras existentes. |
| 2 | Incorporar XP por bajas y elecciones al terminar la oleada, con mejoras comunes. | Umbrales múltiples, consumo de elecciones, ausencia de interrupciones y convivencia con narrativa. |
| 3 | Sustituir las ofertas actuales por cuatro objetos aleatorios con precios individuales. | Oferta estable, rechazo de compras inválidas, descuento correcto y ahorro. |
| 4 | Incorporar las cadenas propias de cada personaje y retirar el rebote inicial del Negro. | Prerrequisitos, nivel mínimo, límites y efectos seleccionados; sin obtención automática. |
| 5 | Ajustar economía, curva de XP y potencia con partidas reproducibles. | Registrar bajas, oro obtenido y gastado, compras y niveles por oleada, incluyendo Papazito. |

La secuencia no fija valores de balance definitivos. La implementación fue autorizada posteriormente y se sigue en `../odd/tasks/item-level-progression.md`; los apartados marcados como propuestas o decisiones pendientes no se consideran aprobados por esa autorización.

### Comprobaciones previstas al implementar

- Usar `node --test tests/*.test.mjs` y `node --check` para cada archivo JavaScript modificado, conforme a `AGENTS.md`.
- Añadir pruebas deterministas que fallen antes del cambio para cada regla implementada; usar el generador aleatorio inyectable del motor.
- Comprobar que una acción rechazada no cambia monedas, XP, inventario ni elecciones pendientes.
- Comprobar que un objeto estadístico nuevo funciona con una sola entrada de catálogo; cubrir beneficios y penalizaciones, acumulación y expiración de efectos, conversiones y coincidencia entre descripción, vista previa y resultado.
- Comprobar que aumentar la vida máxima suma su incremento efectivo a la vida actual una sola vez: +20 transforma 60/100 en 80/120, sin curación completa ni curación adicional al recalcular o mostrar estadísticas.
- Comprobar que una reducción de vida máxima solo limita la vida actual al nuevo máximo: −20 transforma 60/100 en 60/80 y 90/100 en 80/80, sin descontar vida adicional.
- Comprobar que una mejora común y otra exclusiva se incorporan solo con datos, sin cambiar la selección ni el motor; cubrir rangos, nivel mínimo, prerrequisitos y rechazo de referencias inválidas o cíclicas.
- Cubrir bajas obtenidas por diferentes fuentes de daño, varias subidas en una oleada, ausencia de niveles pendientes y ausencia de mejoras elegibles.
- Comprobar que una habilidad disponible por nivel no se obtiene sin elegirla, y que una mejora avanzada no aparece sin su base.
- Cubrir la interacción con escenas, inicio de la siguiente oleada, desbloqueos y economía de Papazito.
- Comprobar que la última oleada lleva al flujo de victoria sin tienda ni selección de mejoras, incluso con niveles pendientes, conservando las escenas de cierre y los desbloqueos existentes.
- Realizar una comprobación visual sobre HTTP de las pantallas y controles; las pruebas de motor no prueban por sí solas la interacción del navegador.

## 7. Decisiones pendientes

| Tema | Qué falta decidir |
|---|---|
| Niveles | Validar jugando la curva inicial aprobada —1 XP por zombi/corredor, coste `10 × nivelActual²` desde nivel 1— y definir nivel mínimo y rangos de cada mejora. Conservar la XP sobrante y no mantener una cuota de niveles por oleada. |
| Recompensas | Valores y probabilidades dentro de cada grupo; la distribución ya está acordada: una propia y dos comunes, o tres comunes si no hay ninguna propia elegible. |
| Selección | Sin decisiones de flujo pendientes: no hay reroll inicial ni repetidas en una selección; se permite reaparecer hasta el rango máximo. Si faltan opciones, se muestran menos; sin ninguna, se informa y se permite continuar sin recompensa, conservando el nivel ganado. |
| Objetos | Valores de los límites por objeto, límite total de inventario si lo hubiera y rarezas. Ya está acordado: ofertas distintas en cada tienda, acumulación en oleadas posteriores hasta el límite de cada objeto y menos ofertas si no hay suficientes elegibles; una tienda vacía permite continuar. |
| Economía | Precios, oro por enemigo y por cierre, y si los precios escalan entre oleadas. |
| Cálculo de estadísticas | Redondeos, límites, alcance ilimitado y tratamiento de efectos temporales. Ya están acordados la composición de puntos y porcentajes de objetos y niveles, el aumento de vida actual por el incremento efectivo de vida máxima al adquirir una mejora y el recorte de vida actual solo cuando excede la máxima reducida. |
| Gallina | Confirmar o revisar la asignación provisional de Distancia de ataque. |
| Fin de mapa | Sin decisión de flujo pendiente: victoria directa tras la última oleada, sin tienda ni selección de mejoras pendientes; conservar escenas de cierre y desbloqueos. |

## 8. Alcance y estado

**Acordado:** XP por bajas, elecciones al finalizar la oleada, una de tres opciones por nivel, habilidades propias siempre seleccionables, cuatro ofertas de tienda, precios individuales, posibilidad de ahorrar, balance configurable, caminos de mejora descritos en este documento y autoría sencilla mediante datos de objetos y mejoras de nivel, con cálculo automático para efectos ya soportados.

**Propuesta técnica:** integración incremental sobre el motor, fichas, interfaz y coordinación narrativa existentes. No es una implementación realizada ni un contrato nuevo ya publicado.

**No incluido:** cifras finales de balance, catálogo completo de armas, rediseño de enemigos y progresión permanente entre partidas. La implementación requiere resolver las decisiones pendientes que afecten a cada entrega.
