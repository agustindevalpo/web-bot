# paleta-derivada-del-acento

**Objetivo.** Resolver D-31: dejar `--acento` como el único color por cliente que se
persiste, y derivar `primario`, `secundario` y `texto` de él con la maquinaria OKLCH
que ya existe (D-25).

**Ruta:** ODD (organic). Elegida por Agustín el 2026-09-19 por sobre un ciclo SDD.
**Rama base:** `develop`. **Rama de trabajo:** `feature/paleta-derivada-del-acento`.
**RDD:** `on` (decidido por config global).
**TDD:** off — no hay señal de TDD en el proyecto (sin config de gentle-ai, sin marca en
`.claude/` ni en `package.json`; los ciclos SDD previos registraron modo "Standard").
Corren chequeos funcionales ordinarios, no ciclo RED/GREEN.
**Runner:** `npm run test:unit` (Jest 30 + ts-jest), `npx tsc --noEmit`, `npm run lint`.

## Problema

`src/components/templates/shared/palette.ts:10-20` inyecta cuatro variables CSS por sitio
(`--primario`, `--secundario`, `--acento`, `--texto`) leídas de `configJson.colores`. El
handoff de diseño construye las seis plantillas nuevas alrededor de **una sola**:
`--acento`; todo lo demás es neutro estructural fijo
(`docs/design_handoff_plantillas_webbot/README.md:50-72`). D-27 ya resolvió de dónde sale
el acento; D-31 quedó pendiente sobre los otros tres, y bloquea S1.

Evidencia del mapeo del 2026-09-19 (observación Engram #744):

- `palette.ts` es el **único** embudo: ninguna plantilla lee `config.colores.x` por nombre.
- Usos vivos: `--texto` 39, `--acento` 36, `--primario` 23, `--secundario` 2.
- El cliente **nunca elige** `primario`/`secundario`/`texto`: `resolverColores`
  (`src/infrastructure/demo/rubroDefaults.ts:154-161`) solo pisa `.acento`; los otros tres
  pasan intactos desde la tabla por rubro.
- No hay validación runtime de `colores` (solo la interfaz TS `SiteConfigDTO.ts:24-29`).
- No hay precedente de backfill: las tres migraciones son solo DDL.

## Decisión de producto (tomada, 2026-09-19)

Camino **(3)** de D-31: derivar los tres del acento y dejar de persistirlos.
Consecuencia aceptada por Agustín: **los sitios ya publicados cambian de aspecto** el día
del despliegue, porque sus tres colores guardados dejan de leerse. No hay migración de
datos: toda fila existente ya tiene `acento`, que es el único insumo.

### Conflicto detectado en el handoff (se resuelve a favor de D-27)

El handoff dice dos veces que el acento sale de `configJson.colores.primario`
(`README.md:31` y `README.md:80`). Está **desactualizado**: D-27 estableció que el acento
por cliente es `colores.acento`, derivado del estilo en OKLCH. Con D-31 resuelta por el
camino (3), `acento` pasa a ser el único color persistido, así que la línea del handoff
queda obsoleta por construcción. No se sigue.

## Alcance autorizado

`src/domain/color/`, `src/components/templates/shared/palette.ts`,
`src/infrastructure/demo/rubroDefaults.ts`, `prisma/seed-demo.ts`,
`src/application/dtos/SiteConfigDTO.ts`, los dos servicios de chat, sus tests, y
`docs/DECISIONES.md` / `docs/ESTADO.md` / `docs/BITACORA.md`.

**Fuera de alcance:** tocar las plantillas (eso es S1 y siguientes), borrar los campos
huérfanos de las filas existentes en la BD, y cualquier cambio de schema Prisma.

## Regla de derivación (propuesta técnica)

Módulo nuevo y puro sobre las primitivas de `src/domain/color/contraste.ts`:

- `primario` = el acento con `L` bajada a ~0.22 en OKLCH, mapeado a gamut.
  Precedente del propio handoff: el footer oscuro de SERVICIOS es "el acento con `L`
  bajada a ~0.22" (`README.md:237`).
- `secundario` = el acento con `L` intermedia (~0.45), entre `primario` y el acento.
- `texto` = blanco o negro, el que gane `razonContraste` contra `primario` (objetivo 4.5).

Convención obligatoria del módulo: puro, sin excepciones, igual que `contraste.ts` y
`acentoPorEstilo.ts`.

## Tareas

- [x] **T1 — Módulo de derivación.** `src/domain/color/paletaDerivada.ts` (81 líneas) +
      `tests/unit/domain/color/paletaDerivada.test.ts` (109 líneas). Ruta: delegada
      (writer; disparador: 2+ archivos no triviales). Commit `a4e8ad6`.
      Constantes: `L_PRIMARIO = 0.22` (citada del handoff `README.md:237`),
      `L_SECUNDARIO = 0.45` (decisión de este ciclo, sin precedente textual).
- [x] **T2 — `palette.ts` deriva en vez de leer.** Sigue emitiendo las cuatro variables
      CSS (las plantillas actuales las necesitan: 64 usos entre las tres), pero las tres
      salen de la derivación sobre `colores.acento`. Fallback a `PALETA_DEFAULT.acento`.
      Ruta: delegada (writer, junto a T1). Commit `a4e8ad6`.
- [x] **T3 — Dejar de persistir los tres.** `RUBRO_DEFAULTS` y su duplicado a mano en
      `prisma/seed-demo.ts` pasan a un solo color por rubro; `resolverColores`,
      `SiteConfigDTO` y los dos servicios de chat acompañan. Sin migración: las filas
      existentes conservan los tres campos viejos como huérfanos inertes. Ruta: delegada
      (writer). Commit `625f8ab`.
- [x] **T4 — Documentación.** D-31 pasa de PENDIENTE a RESUELTA (reemplazada por D-32) en
      `docs/DECISIONES.md`, con la entrada D-32 nueva al final del archivo. `docs/ESTADO.md`
      **no se regeneró**: nada de lo desplegado cambia, porque nada de este ciclo llegó a
      `develop` ni a `main`. Jornada agregada en `docs/BITACORA.md`. Este propio documento
      actualizado con T3, T5, T6 y el cierre de Progreso/Próximo paso. Ruta: inline (esta
      sesión). Sin commit todavía — la rama de trabajo se deja tal como está, sin commitear
      por instrucción explícita de esta tarea.
- [x] **T5 — Primera ronda de hallazgos (dos revisiones de confiabilidad).** Seis
      hallazgos: el objetivo de 4.5:1 pasa de comentario a garantía en código
      (`clampAcento` reajusta `primario` si hace falta), `--acento` deja de emitirse crudo
      con un hex de entrada inválido, tests dejan de autoconfirmarse (golden values para
      los 11 acentos reales + barrido de 720 casos), invariante de tono parametrizada sobre
      distancia angular real. No estaba prevista al crear este documento — surgió de la
      revisión adversarial, no del plan original. Ruta: delegada (writer). Commit `6a4c1bc`.
- [x] **T6 — Segunda ronda de hallazgos (tercera revisión de confiabilidad).** Cuatro
      hallazgos: `resolverPrimarioYTexto` y `ganadorDeContraste` exportados y probados
      directamente; documentado en código que la rama de reparación de contraste es
      código muerto contra el objetivo de producción (punto de equilibrio WCAG ~4.583:1,
      por encima de 4.5) y se conserva a propósito; `dentista`/`yoga` dejan de estar
      *skipped* y su deriva de tono (1.2231°/1.4089°) queda fijada como cota superior por
      rubro; dos casos nuevos de forma vieja en `palette.test.ts`. Tampoco prevista al
      crear este documento. Ruta: delegada (writer). Commit `93c9690`.

## Criterios de aceptación

1. Un sitio cuyo `configJson.colores` tenga **solo** `acento` se renderiza con las cuatro
   variables CSS pobladas y legibles.
2. Un sitio con los cuatro colores viejos guardados ignora los tres viejos y deriva.
3. `texto` cumple 4.5:1 contra `primario` para todo acento de la tabla por rubro.
4. `npm run test:unit`, `npx tsc --noEmit` y `npm run lint` en verde.

## Chequeos aplicables

`npx tsc --noEmit` · `npm run lint` · `npm run test:unit`

## Entrega

Pronóstico al crear este documento: **~500 líneas** autoradas (altas + bajas, sin
generados). Supera el presupuesto de ~400 por PR, así que corresponde encadenar.
Estrategia de entrega: `ask-on-risk` → cadena **`feature-branch-chain`** (elegida por
Agustín el 2026-09-19): cada PR apunta a la rama del anterior y solo el último entra a
`develop`. Es la práctica ya establecida en el repo (WB-22, demo-lead-capture).
Corte natural: PR1 = T1 + T2 (comportamiento), PR2 = T3 + T4 (contrato y docs).

## Progreso

- 2026-09-19 — Exploración read-only completa (Engram #744). Decisión de producto tomada
  (camino 3). Documento creado. Sin escrituras de código todavía.
- 2026-09-19 — Rama `feature/paleta-derivada-del-acento` creada desde `develop` `963a63e`.
  Cadena elegida: `feature-branch-chain`.
- 2026-09-19 — **T1 + T2 cerradas**, commit `a4e8ad6` (PR1). Verificación observada por el
  writer y re-corrida por el orquestador como spot check:
  `npx tsc --noEmit`: limpio · `npm run lint`: 0 errores, 21 warnings preexistentes y
  ajenos a los archivos tocados · `npm run test:unit`: **762/762 en 61 suites** (venía de
  695, +67 tests nuevos).
  Evaluación RDD de ese commit contra `963a63e`:
  `risk: medium` (`executable_change` en `palette.ts`), 5 paths / 372 líneas,
  `review_due: false` por `under_budget`. Queda pendiente dentro del slice: se revisa
  cuando un commit posterior cruce el presupuesto.
  Hallazgo del readback: los **11 rubros ya tenían `texto: '#ffffff'`**, y la derivación
  contra un `primario` de L 0.22 también da blanco — o sea que la variable más usada de
  las tres (39 usos) **no cambia en ningún sitio publicado**. El cambio visual real se
  concentra en `--primario` y `--secundario`, que pasan a ser tintes del acento.
- 2026-09-19 — Rama `feature/paleta-contrato-un-color` creada, encadenada sobre
  `feature/paleta-derivada-del-acento` (PR2 de la cadena). **T3 cerrada**, commit
  `625f8ab`: `configJson.colores` queda reducido al acento; sin migración de datos.
- 2026-09-19/20 — Tres revisiones adversariales de confiabilidad corrieron sobre el
  código de T1-T3, aprobadas y con acuse de recibo. **T5 cerrada** (seis hallazgos de las
  dos primeras), commit `6a4c1bc`. **T6 cerrada** (cuatro hallazgos de la tercera), commit
  `93c9690`. Estado final de la rama: **796 tests / 61 suites / 0 skipped**,
  `npx tsc --noEmit` limpio, `npm run lint` con 0 errores y los mismos 21 warnings
  preexistentes de `develop`. Deriva de tono conocida en `dentista` (1.2231°) y `yoga`
  (1.4089°) queda pinneada como cota superior por rubro, no resuelta.
- 2026-09-20 — **T4 cerrada**: `docs/DECISIONES.md` (D-31 → RESUELTA, D-32 nueva),
  `docs/BITACORA.md` (jornada agregada) y este documento actualizados.
  `docs/ESTADO.md` se evaluó y **no se regeneró**: nada de lo que afirma quedó
  invalidado porque nada de este ciclo se mergeó — `develop` y `main` siguen en
  `963a63e`. Cambio de documentación sin commitear, por instrucción explícita de la
  tarea que lo pidió. Commit `b92ab20`.
- 2026-09-20 — **T7 — Cuarta revisión** (aprobada y acusada). Dos warnings. Arreglado
  `R3-001`: `derivarPaletaDesdeAcento` reenviaba el acento crudo, así que un hex válido
  pero no canónico (`#FF8C00`, `#f80`) salía con otra convención de formato que los tres
  derivados. Nada se veía mal —CSS no distingue mayúsculas en hex—, pero la coherencia
  que el módulo declara era falsa. Ahora las cuatro salen de `linealAHex`, y el fallback
  también. Commit `9e29f2f`. **812 tests**, cero skipped.

## Deuda menor conocida (decidida, no olvidada)

- `R3-002` — el barrido de 720 casos en `tests/unit/domain/color/paletaDerivada.test.ts`
  acumula incumplimientos en un array y compara al final, en vez de asertar por caso. Si
  alguna combinación lanzara, el barrido se corta en el primer error duro en vez de
  reportar el conjunto completo, que es lo que el patrón promete. No se arregló: es
  ergonomía de test, no corrección. Se corta acá a propósito — cuatro vueltas de revisión
  y los hallazgos ya son pulido.

## Próximo paso

Abrir los PRs de la cadena (`feature-branch-chain`): PR1 = T1+T2 sobre `develop`, PR2 =
T3+T5+T6 sobre PR1. Mergear en orden. Recién ahí S1 (LANDING) queda desbloqueado de
verdad — hoy sigue desbloqueado solo *en código*, no en producción.
