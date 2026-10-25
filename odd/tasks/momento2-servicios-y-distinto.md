# Momento 2: add services and a longer "¿Qué hacen distinto?"

**Objective:** in `/chat/completar`, let the visitor add services beyond the ones typed in
the chat, and give "¿Qué hacen distinto?" room to explain.

**Problem / why:** found by Agustín in the sandbox walkthrough of 2026-10-24
(`docs/BITACORA.md`, "Recorrido completo en el sandbox de pagos"). The servicios task only
shows the chat's services and silently drops extra rows (`aplicarServicios`,
`src/application/shared/momento2.ts:206`); `distinto` is one line capped at 80 characters
(`LIMITES_MOMENTO2.microPregunta`).

## Decisions (Agustín, 2026-10-25)

- **Services cap: 8 in total**, counting the ones from the chat (matches
  `MAX_PLATOS_CARTA`).
- **A new service has a name** (required, max 40), a description, and a price only in
  `SERVICIOS`.
- **Only added services can be removed.** Services from the chat are not removed or
  reordered: PORTFOLIO and TIENDA pair `servicios[i]` with `imagenes[i]` by index.
- PORTFOLIO and TIENDA rendering is out of scope.
- **`distinto`: textarea, cap 240, with a counter** like the frase task. Line breaks are
  collapsed into one paragraph (current `texto()` behavior).
- **Render:** a long `distinto` shows as body text, not as the bold 17px `.tarjetaTitulo`.
- `desde` and `quien` stay single-line, max 80.

## Scope

`src/application/shared/momento2.ts`, `src/app/chat/completar/` (formulario, CamposTarea,
Momento2, CSS), `src/components/templates/shared/BloqueNosotros*` and its data helper, and
their unit tests. **Out of scope:** chat script, admin, PORTFOLIO/TIENDA, avance weights.

## Method and checks

**TDD:** off (project convention, see `odd/tasks/landing-v2.md`). **RDD:** off
(`gentle-ai review mode status`: clone-local off).
**Checks per task:** `npx tsc --noEmit`, `npx eslint src tests`, `npm run test:unit`,
`npm run build`; Chrome at 1280 and 390 px for UI.
**Delivery:** branch `feat/momento2-servicios-distinto` from `develop` (6d8f003), one PR to
`develop`. Forecast ~300–400 authored lines: single PR. Merge only with Agustín's OK.

## Tasks

- [x] **M1 — Add services.** Done in `c3d955e` (+381/−24). Payload
  `{existentes: N, filas}`: server rejects if N ≠ stored length (`valores_invalidos`), cap
  `max(N, 8)`, nameless added row → `servicio_sin_nombre`. Checks: tsc 0, eslint 0 errors,
  test:unit 106/1613, build OK; parent re-ran test:unit (pass). Browser check pending (M3).
  Open: stale-config conflict shows the generic save error.
  Original scope: Name field for new rows, "+ Agregar servicio" up to 8 total,
  remove button only on added rows, validation (name required when the row has content,
  max 40, new error code), `aplicarServicios` appends `{nombre, descripcion, precioDesde?}`
  after the existing entries, avance counts them. Tests updated (incl.
  `momento2.test.ts:198`). Route: delegated writer (2+ non-trivial files).
- [x] **M2 — Longer `distinto`.** Done in `f3c7a11`. `LIMITES_MOMENTO2.distinto = 240`,
  textarea with counter from 180; `esParteLarga` (> 80, `MAX_PARTE_TITULO`) switches the
  card to `.tarjetaTexto` (300, 15px/1.8). Checks: tsc 0, eslint 0 errors, test:unit
  106/1615, build OK; parent re-ran test:unit (pass). Handoff `00-DECISIONES-TRANSVERSALES.md`
  ~l.174 ("una línea cada uno") no longer holds for `distinto`; not edited. Original scope: Own limit 240, textarea + counter, `desde`/`quien`
  unchanged; `BloqueNosotros` renders a long `distinto` as body text. Tests. Route:
  delegated writer (2+ non-trivial files).
- [x] **M3 — Docs and browser check.** D-48 added. Agustín checked `/chat/completar` and
  the preview in the browser on 2026-10-25: add/remove services, nameless-row note, counter
  and long `distinto` card all OK. `ESTADO.md` makes no claim about these limits: unchanged.
  Original scope: D-48 in `DECISIONES.md`, `ESTADO.md` if a claim
  changes, `BITACORA.md`; Chrome check of `/chat/completar` and a site. Route: inline.

## Progress

- 2026-10-25: document created, branch cut. M1 committed (`c3d955e`), M2 (`f3c7a11`), M3 docs. Next: push and PR (Agustín's call).
