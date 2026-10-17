# Feature: S4 RESTAURANTE in Bloques

**Objective:** the RESTAURANTE template (restaurante, panadería) is rebuilt on the Bloques base that LANDING
and SERVICIOS already use, following the designer's S4 chapter. The chat also captures an optional address
for every site.

**Problem:** RESTAURANTE still renders the pre-Bloques design (`src/components/templates/restaurante/`:
dark `#171310` background, Instrument Serif, gradient over the hero photo, old gallery). The DTO has no
address, so no site can show where the business is.

**Why:** two rubros land on this template, and every newly delivered site has no photos, which is exactly
the case the old design handles worst.

**Spec precedence:** `docs/design_handoff_plantillas_webbot/handoff_bloques_v2/04-RESTAURANTE.md` (its
"Resolución de las ambigüedades" section first) > `03-CHAT-Y-MOMENTO-2.md` > `01-RESPUESTAS-…` >
`00-DECISIONES-TRANSVERSALES.md` > `handoff_bloques/README.md`. Prototype:
`handoff_bloques_v2/S4 Restaurante - Bloques.dc.html` (Claude Design project
`6b6d0664-fe8b-4d6c-9c13-996324a27b53`, three data states).

**Decisions (Agustín, 2026-10-17):**
- P1: `contacto.direccion?` (one line, max 60 chars) is approved for **all** templates and captured as an
  **optional** field in the chat's data step (`LeadForm`, before payment). Not in momento 2, not admin-only.
- P2: RESTAURANTE never uses a stock photo in the hero. Without an own `imagenes[0]`, the hero is the
  typographic one.
- P3: option (a). For rubro `panaderia` the form becomes an order ("Tu nombre", "¿Qué quieres encargar?",
  "¿Para cuándo?"); copy "Encargar por WhatsApp" / "Haz tu encargo"; message
  "Hola, soy {nombre}. Quiero encargar {pedido} para {cuándo}." The header and hero CTAs follow the same verb.

**What RESTAURANTE reuses (shared since LANDING U1-U11 and S2):** `SeccionesSPA` header + floating WhatsApp,
`Monograma`, `logoOptico`, `HeroBloques` (photo variant), `rubroVisible`, `BandaDatos`
(`variante="horarios"`), `BloqueNosotros`, `ContactoDatos`, `FooterBloques`, the own-photo filter from
`servicios/datosLugar.ts`, palette `{ bloques: true }`.

**Scope:** tasks below. **Out of scope:** the momento 2 task "Tu carta" (capture of `menu`, new progress
weights for RESTAURANTE); admin editing of `menu`; PORTFOLIO / TIENDA / PROFESIONAL; the spec's own
"Fuera de alcance" list (menú del día block, availability, delivery, map, "abierto ahora").

**TDD:** off (same as S2). **Checks per task:** `npx tsc --noEmit`, `npx eslint src tests`,
`npm run test:unit`, `npm run build`, Chrome at 1280px and 390px with full, minimal and minimal + logo
RESTAURANTE fixtures (plus a panadería fixture for R4).
**Delivery:** one PR per task to `develop` (same strategy as S2); merged after checks + Chrome (Agustín's
standing OK covers the Bloques unit PRs; production only moves on an explicit release).

## Tasks

- [x] **R1 — Address in the data step.** `contacto.direccion?` in `SiteConfigDTO` and its validation
  (trimmed, max 60, empty → absent); optional "Dirección de tu local" field in `LeadForm`; the lead route
  persists it into the site config; `ContactoDatos` shows an address card when present (all templates).
  Route: delegated (2+ non-trivial files).
- [x] **R2 — Carta model.** `menu?` type in the DTO + pure `normalizarCarta(menu, servicios)` in the
  application layer, with one test per row of the spec's "Casos intermedios" table (max 8 dishes in reading
  order, max 3 categories, uncategorised group first, menu replaces servicios, price printed as-is,
  "menú del día" note rule). Route: delegated.
- [x] **R3 — RESTAURANTE on the Bloques shell.** Rewrite `templates/restaurante/`: header "Reservar mesa",
  `HeroRestaurante` (photo form via `HeroBloques` only with an own photo; typographic form with the
  Dónde / Reservas / La carta row), horarios band, `Carta` (guides form and large form, footer note + WhatsApp
  link), "El local" (2+ own photos), Nosotros, contact section, `FooterBloques` with the horarios gloss.
  Nav Inicio · Carta · Nosotros · Reservas. Remove the old template code and CSS. Route: delegated.
- [x] **R4 — FormReserva.** Client form that builds the WhatsApp message, with every state in the spec
  (rest, focus, errors after first submit, sent box, blocked window, no phone → email fallback) and the
  panadería order variant (P3). Route: delegated.
- [x] **R5 — Polish and docs.** Spec audit against the prototype, motion contract, dead CSS/exports;
  `docs/ESTADO.md` and `docs/DECISIONES.md` (P1-P3). Route: inline or delegated depending on findings.

## Progress

- 2026-10-17: designer handoff imported (`04-RESTAURANTE.md` + prototype into `handoff_bloques_v2/`);
  P1-P3 resolved with Agustín; branch `feat/restaurante-bloques` from develop `4c4ef02`.

- 2026-10-17: R1 done (`e372cfa`, delegated writer). `contacto.direccion?` in the DTO; `datosLead.ts` trims, empty → absent, max 60; optional LeadForm field after telefono; lead route and use case merge it into `contacto` of the site `configJson` (JSON column, no migration; never overwrites an existing value, no key when blank); `ContactoDatos` shows a full-width "Dirección" card without link. Checks: tsc, eslint (0 errors), test:unit 1406 passed, build OK.

- 2026-10-17: R2 done (`638c076`, delegated writer). `menu?` in the DTO; pure `normalizarCarta(menu, servicios)` in `src/application/shared/carta.ts` returns `{conPrecios, grupos, totalPlatos, hayCategorias, columnasSinCategorias, notaMenuDelDia} | null` (caps 8 dishes / 3 categories, uncategorised group first, menu replaces servicios, column split 5 / 6-8 as data). 27 tests in `tests/unit/application/shared/carta.test.ts`. Checks: tsc, eslint (0 errors), test:unit 1433 passed, build OK.

- 2026-10-17: R3 done (`0abfb51`, delegated writer). `templates/restaurante/` rebuilt on the Bloques shell: `HeroRestaurante` (photo form via `HeroBloques` only with an own `imagenes[0]`, otherwise typographic with the Dónde/Reservas/La carta row), `Carta` (guides + large forms), "El local" via `buildLugar(..., { titulo, minimo: 2, altoDosPx: 520 })`, `BloqueNosotros`, Reservas section (`SeccionContacto` with `eyebrow`, `ContactoDatos`), `FooterBloques`. Shared additions (all backwards compatible): `SeccionesSPA.seccionOcultaFlotante` (RESTAURANTE passes `reservas`), `SeccionContacto.eyebrow`, `HeroBloques` Cta `interno`, `BandaDatos` "Cerrado" style, `glosaPie` skips "Cerrado" and drops hours with 4+ entries (now also true for SERVICIOS), `Lugar` `altoDosPx`. Fixtures: `prisma/fixturesRestaurante.ts` + `npm run db:seed-fixtures-restaurante` (sites `dev-restaurante-completo|minimo|minimo-logo`, `dev-panaderia`, URL `/sites/<subdominio>`; no own photos, so photo hero and "El local" need R2). Checks: tsc, eslint (0 errors), test:unit 1501 passed, build OK. Chrome pass not done by the writer.

- 2026-10-17: R4 done (`248d0a5`, delegated writer). Client `restaurante/FormReserva.tsx` (+ CSS module) with pure logic in `reservaLogica.ts` (validation, message, `wa.me` via shared `buildWhatsAppUrlConMensaje`, blocked-window result); validation only after first submit (derived errors, focus to first invalid, `role="alert"`, `aria-invalid/describedby`), sent box `role="status"` with "Abrir WhatsApp" link when `window.open` returns null, editing hides the box, panadería order variant (P3, copy in `copy.ts`). `SeccionContacto` gained optional `tituloId` (H2 id, other templates unchanged); `index.tsx` mounts the form only when the phone has digits, otherwise `copy.sinTelefono`. Tests in `tests/unit/components/templates/restaurante.reserva.test.ts` (Jest env is `node`, so behaviour is pinned through the pure helpers + static markup; no click-through). Checks: tsc, eslint (0 errors), test:unit 1517 passed, build OK. Chrome pass not done by the writer.

- 2026-10-17: R5 done (code `e174596`, docs in the next commit; inline). Fixed: hero photo 680px desktop / 220px mobile via optional `HeroBloques.altoFoto` (defaults 720 / 280 keep LANDING and SERVICIOS identical); Reservas cards via `ContactoDatos variante="reserva"` (address full width, "WhatsApp" + "Correo" in `1fr 1fr`, WhatsApp card links to wa.me); footer gloss "de" + lowercase from the second entry via `glosaPie` option `conPreposicion` (RESTAURANTE only, only when the range starts with a digit). Verified, no change: no-phone section ("Escríbenos para reservar." + email card, hero buttons "Escríbenos" -> mailto, header CTA stays `#reservas`). Not fixed: horarios band keeps S2 measures (44px range, 72px gap/padding, day below the range) while the S4 prototype uses 40px / 64px / 56px with the day above; the shared `BandaDatos` would need a layout variant, S2 spec itself says 44. `docs/ESTADO.md` not regenerated: it describes `main`/`develop` and this branch is not merged; regenerate when RESTAURANTE reaches develop. `docs/DECISIONES.md`: D-43 (address), D-44 (no stock hero), D-45 (panadería order form). Checks: tsc, eslint (0 errors), test:unit 1519 passed, build OK. Chrome pass not done.

## Next step

Chrome pass at 1280px and 390px on the local fixtures (`npm run db:seed-fixtures-restaurante`: completo, minimo, minimo-logo, panaderia; includes the FormReserva states), then PRs to develop (one per task, same strategy as S2). Regenerate `docs/ESTADO.md` once RESTAURANTE is in develop.
