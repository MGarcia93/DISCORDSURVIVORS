# Discord Survivors — Estadísticas core

## Objetivo

Definir las seis estadísticas comunes del sistema de combate mediante una **entidad neutral de referencia**. Los personajes, enemigos y jefes **no definen valores absolutos**: expresan cada estadística como un **porcentaje sobre esta tabla**, y el core (`src/stats.mjs`) resuelve esos porcentajes en los valores absolutos que consume el motor.

## Valores base (entidad neutral)

| Estadística | Valor base | Descripción |
|---|---:|---|
| **Vida** | **100** | Puntos de daño que puede soportar una entidad antes de morir. |
| **Defensa** | **10** | Puntos de mitigación: cada punto bloquea el 5% del daño recibido, hasta un tope de 75%. |
| **Ataque** | **10** | Puntos de daño de referencia, utilizados para calcular el daño de ataques y habilidades. |
| **Velocidad de ataque** | **1** | Frecuencia base de **1 ataque por segundo**, antes de modificaciones. |
| **Distancia de ataque** | **100** | Alcance base en unidades del mundo, **medido desde el borde de colisión** de la entidad. |
| **Velocidad de movimiento** | **5** | Desplazamiento base de **5 unidades por segundo**. |

## Conversión de unidades

- 1 unidad del mundo equivale a `UNIT_PX = WORLD_SCALE` píxeles del motor (1.1). Así los valores ya calibrados en píxeles del juego se expresan como porcentajes limpios sobre la tabla.

## Resolución (fórmulas del core)

Dado un porcentaje `P` sobre cada estadística:

- **Vida**: hp = `P × 100 / 100` puntos. Ej.: 150% → 150 hp.
- **Defensa**: puntos = `P × 10 / 100`; mitigación = `min(75%, puntos × 5%)`. Ej.: 40% → 4 puntos → 20% de reducción de daño; 300% o más llega al tope de 75%.
- **Ataque**: daño = `P × 10 / 100`. Ej.: 300% → 30 de daño.
- **Velocidad de ataque**: intervalo entre ataques = `100 / P`. Ej.: 222.22% ≈ 0.45 s entre ataques.
- **Distancia de ataque**: alcance = `P × 100 / 100 × UNIT_PX` píxeles escalados. `Infinity` (o `null`) significa alcance ilimitado (auto-aim a distancia).
- **Velocidad de movimiento**: px/s = `P × 5 / 100 × UNIT_PX`. Ej.: 3300% → 165 px/s.

## Criterios generales

- Las **fichas de entidad** (personajes en `src/characters/`, enemigos en `src/enemies.mjs`) declaran las seis estadísticas como porcentajes; los valores absolutos se derivan siempre en `src/stats.mjs`, nunca a mano.
- Las estadísticas por ola (curvas de enemigos) se declaran como funciones del número de ola que devuelven el porcentaje de esa ola.
- El **tamaño de colisión** (radios, `hitRadius`) no integra la tabla de estadísticas: se declara aparte, en píxeles sin escalar, porque la distancia de ataque es independiente del tamaño de la entidad.
- Las habilidades, armas y estados temporales modifican o utilizan los valores **ya resueltos**; no forman parte de esta tabla ni de las fórmulas de conversión.
- La economía (botín, costos de tienda) queda fuera del core de estadísticas.
- Los valores base deben poder ajustarse desde una configuración común (`BASE_STATS`) para facilitar el balance: cambiar la tabla o las constantes del core reescala todas las fichas a la vez.
