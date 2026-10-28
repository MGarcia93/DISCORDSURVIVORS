# Personaje 1: Maxi Negro — El Tanque Sedentario

**Juego:** Discord Survivors  
**Tipo:** Personaje inicial, disponible desde el comienzo  
**Clase:** Tanque / Supervivencia  
**Dificultad:** Fácil  
**Estilo:** Resiste grandes cantidades de daño, recupera vida al quedarse quieto y utiliza ataques automáticos para no tener que esforzarse.

## 1. Descripción y lore

Maxi Negro es el integrante del Discord al que todos cargan por vago, otaku y por tener unos kilos de más. Según sus amigos, bañarse es una misión secundaria que nunca completa.

Mientras los demás discuten qué jugar, él ya está pensando en sentarse, mirar monas chinas y hacer el mínimo esfuerzo posible. Paradójicamente, cuando el mundo se llena de monstruos, termina siendo uno de los más difíciles de matar.

**Su filosofía:** «Si puedo ganar sin levantarme, mejor».

El humor del personaje es caricaturesco, ácido y basado en bromas internas del grupo.

## 2. Apariencia

- Complexión robusta y caricaturesca.
- Aspecto de jugador sedentario y fan del anime.
- Expresiones de sueño, desgano y fastidio cuando tiene que moverse.
- Un sillón exageradamente cómodo como elemento visual característico de su definitiva.
- Una invocación de estilo anime (waifu) para su habilidad especial.
- Animaciones que transmitan que cualquier esfuerzo le da paja.

## 3. Estadísticas iniciales

Usa exclusivamente las seis estadísticas comunes definidas en `discord_survivors_estadisticas_base.md`.

| Estadística | Valor de Maxi Negro |
|---|---:|
| Vida | 150 |
| Defensa | 12 |
| Ataque | 10 |
| Velocidad de ataque | 1 |
| Distancia de ataque | 100 |
| Velocidad de movimiento | 3.75 |

Estos valores son iniciales y ajustables durante el balance. La distancia de ataque se mide desde el borde del personaje, según las reglas generales del juego.

## 4. Habilidades

### Pasiva — Sedentarismo extremo

Si Maxi Negro permanece quieto durante **2 segundos**, comienza a regenerar vida mientras siga sin desplazarse.

- La regeneración se interrumpe cuando vuelve a moverse.
- Recibir daño no debería cancelar por sí solo la regeneración, salvo que el balance posterior lo requiera.
- La cantidad recuperada por segundo queda pendiente de balance.

**Idea jugable:** premia encontrar una buena posición y resistir, en lugar de correr permanentemente.

### Habilidad especial — Modo Otaku

Maxi Negro invoca una **waifu que ataca automáticamente a los enemigos**.

- La invocación busca enemigos dentro de su alcance.
- Ataca sin que el jugador tenga que apuntar manualmente.
- Su duración, cadencia y daño se ajustarán durante el balance.
- Debe ser visualmente exagerada y claramente reconocible como una invocación otaku.

**Importante:** esta habilidad es parte central del personaje y no debe reemplazarse por otra.

### Habilidad definitiva — Me da paja

Maxi Negro **se sienta en un sillón**, obtiene un aumento enorme de defensa y causa **daño en área** a los enemigos que lo rodean.

- Durante el efecto permanece sentado y no puede desplazarse, o su movimiento queda bloqueado temporalmente.
- Obtiene una gran bonificación temporal a su estadística de Defensa.
- Genera pulsos de daño alrededor del sillón.
- Al finalizar se levanta a desgano y recupera el control normal.
- La duración, defensa adicional y daño por pulso quedan sujetos a balance.

**Importante:** el sillón, la defensa elevada y el daño en área son los tres elementos imprescindibles de esta habilidad.

## 5. Identidad jugable

Maxi Negro debe ser el personaje más accesible para aprender a jugar:

- **Fortalezas:** mucha vida, defensa elevada y supervivencia quedándose quieto.
- **Debilidad:** velocidad de movimiento reducida; le cuesta escapar cuando está rodeado.
- **Estrategia:** posicionarse bien, resistir y dejar que sus ataques automáticos hagan el trabajo.
- **Diferenciación:** no es un personaje rápido ni de grandes combos manuales, sino un tanque deliberadamente cómodo y pasivo.

Su resistencia no debe convertirlo en invulnerable: las oleadas, los jefes y las zonas peligrosas tienen que obligarlo a moverse ocasionalmente.

## 6. Frases y humor interno (propuestas)

| Situación | Frase |
|---|---|
| Al seleccionarlo | «¿No puede jugar otro por mí?» |
| Al empezar una oleada | «Qué paja, boludo». |
| Al invocar la waifu | «Ahora sí se puso bueno». |
| Al activar el sillón | «Me da paja». |
| Al tener que moverse | «¿En serio tengo que levantarme?» |
| Al morir | «Murió haciendo lo que amaba: el mínimo esfuerzo posible». |

Las frases son propuestas creativas y pueden reemplazarse por citas reales del Discord.

## 7. Alcance de esta ficha

Esta ficha define **concepto, personalidad y mecánicas del personaje**, no arquitectura, motor de juego ni implementación técnica.

Las únicas estadísticas principales son **Vida, Defensa, Ataque, Velocidad de ataque, Distancia de ataque y Velocidad de movimiento**. La regeneración de la pasiva y las bonificaciones de las habilidades se tratan como efectos, no como nuevas estadísticas principales.
