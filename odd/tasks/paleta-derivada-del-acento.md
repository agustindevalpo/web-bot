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
- [ ] **T3 — Dejar de persistir los tres.** `RUBRO_DEFAULTS` y su duplicado a mano en
      `prisma/seed-demo.ts` pasan a un solo color por rubro; `resolverColores`,
      `SiteConfigDTO` y los dos servicios de chat acompañan. Ruta: delegada (writer).
- [ ] **T4 — Documentación.** D-31 pasa de PENDIENTE a decidida en `docs/DECISIONES.md`;
      `docs/ESTADO.md` solo si el cambio invalida algo que afirma; jornada en
      `docs/BITACORA.md`. Ruta: inline o delegada según tamaño.

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

## Próximo paso

T3 (dejar de persistir los tres) en una rama encadenada sobre ésta, y después T4 (docs).
