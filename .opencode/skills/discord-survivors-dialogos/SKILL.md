---
name: discord-survivors-dialogos
description: Revisar, escribir y corregir diálogos de Discord Survivors respetando voces, chistes internos, continuidad, ritmo de cinemáticas y oleadas. Usar al tocar cualquier acto, epílogo o DLC del juego.
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
