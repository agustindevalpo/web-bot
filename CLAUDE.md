@AGENTS.md

## Documentación viva (OBLIGATORIO)

Este proyecto mantiene tres documentos con roles que **no se pisan**. Confundirlos es lo
que dejó la documentación congelada un mes entero (ver `docs/DECISIONES.md`, D-19).

| Documento | Responde | Forma | Se escribe |
|---|---|---|---|
| `docs/ESTADO.md` | ¿Qué **es** WebBot hoy? | Se **reemplaza completo**. Tope: dos pantallas | Al cerrar un ciclo, o cuando un cambio invalida algo que afirma |
| `docs/DECISIONES.md` | ¿**Por qué** es así? | **Append-only**, estilo ADR numerado | Al cerrar un ciclo que tomó decisiones vigentes |
| `docs/BITACORA.md` | ¿Qué **pasó**? | Cronológico, crece sin límite | Al cerrar una jornada de trabajo |

La fuente de verdad son los artefactos SDD en Engram (proyecto `web-bot`). Estos archivos
son su reflejo: ante una discrepancia, gana Engram.

### Cierre de ciclo SDD: la documentación es parte del `done`

**Un ciclo SDD no está cerrado hasta que la documentación refleja lo que el ciclo cambió.**
`sdd-archive` no puede reportar `done` sin haber hecho los tres puntos de abajo, y el
orquestador no acepta su resultado sin verificarlos.

1. **`docs/DECISIONES.md`** — agregar al final una entrada por cada decisión que quede
   **vigente** y no esté ya registrada. Si el ciclo revierte o reemplaza una decisión
   anterior, marcar la vieja como reemplazada y apuntar a la nueva; **nunca borrarla**.
   Formato y reglas en la cabecera de ese archivo. Sin `archivo:línea`, SHA de commit o
   clave de tópico de Engram, la entrada no entra: es una opinión, no un registro.

2. **`docs/ESTADO.md`** — regenerarlo si el ciclo cambió algo que ese archivo afirma:
   stack, versiones, arquitectura, qué está en producción, qué está bloqueado y en qué, o
   las trampas conocidas. Se **reemplaza entero**, no se le agrega. Actualizar la línea
   `Última regeneración` con la fecha y los SHA de `main` y `develop`.

3. **Declarar explícitamente si no hubo nada que actualizar.** El silencio no cuenta como
   "no aplicaba": un ciclo que no explica por qué no tocó la documentación se lee igual
   que uno que se olvidó. Decirlo en una línea en el informe de archivo.

**El orquestador, antes de dar el ciclo por cerrado:** verifica que las entradas nuevas de
`DECISIONES.md` citen evidencia que exista de verdad, que `ESTADO.md` no haya crecido más
allá de dos pantallas, y que sus enlaces internos resuelvan.

### Cambios fuera de un ciclo SDD

La misma regla vale para trabajo directo, sin ciclo. Si un cambio invalida una afirmación
de `ESTADO.md` —se desbloqueó algo, cambió una versión, se descubrió una trampa nueva,
algo llegó a producción— ese archivo se actualiza en el mismo commit o PR que el cambio.
No en "la próxima sesión": así fue como se pudrió la vez anterior.

### Qué NO va en cada archivo

- `ESTADO.md` no lleva historia, ni "decidimos que…", ni trabajo futuro. Si crece más allá
  de dos pantallas, el exceso pertenece a `BITACORA.md`.
- `DECISIONES.md` no lleva estado ni progreso: solo la decisión, su porqué y qué obliga.
- `docs/historico/` es archivo muerto. Nunca se cita como fuente de un hecho actual.
