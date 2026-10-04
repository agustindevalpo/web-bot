# Feature: S2 SERVICIOS in Bloques

**Objective:** the SERVICIOS template (peluquería, dentista, yoga, veterinaria) is rebuilt on the Bloques
base that LANDING already uses, following the designer's S2 chapter.

**Problem:** SERVICIOS still renders the pre-Bloques design (`src/components/templates/servicios/`:
tab-era layout, no logo, no Nosotros block, `mailto:` form, old `shared/Footer.tsx`).

**Why:** four of the ten rubros land on this template; it is the second most used after LANDING.

**Spec precedence:** `docs/design_handoff_plantillas_webbot/handoff_bloques_v2/01-RESPUESTAS-UN-SERVICIO-Y-HEADER-MOVIL.md`
> `handoff_bloques_v2/02-SERVICIOS.md` > `handoff_bloques_v2/00-DECISIONES-TRANSVERSALES.md` >
`handoff_bloques/README.md`. Prototype: Claude Design project `6b6d0664-fe8b-4d6c-9c13-996324a27b53`,
`S2 Servicios - Bloques.dc.html` (three data states).

**What SERVICIOS reuses from LANDING (shared since U1-U11):** `SeccionesSPA` header + floating WhatsApp,
`Monograma`, `logoOptico`, `displayHero`, `rubroVisible`, `BandaDatos` (`variante="horarios"`),
`BloqueNosotros`, `SeccionContacto` + `FormularioContacto` (`servicios` select) + `ContactoDatos`,
`FooterBloques`, palette `{ bloques: true }`.

**What is new for S2:**
- Header CTA "Agenda tu hora"; hero primary button "Agenda por WhatsApp".
- Banda de horarios (1–3 entries; more than 3 → no band, horarios only in the contact card).
- Lista de servicios with prices (`precioDesde`), H2 "Servicios y precios" / "Nuestros servicios",
  "Agendar →" when a row has no price; single service → one row without the number column (01-RESPUESTAS).
- "El lugar": `imagenes[1..]`, 0 / 1 / 2 / 3+ layouts, **own photos only** (T9: never stock).
- Nav: Inicio · Servicios · Nosotros · Contacto ("El lugar" is not in the nav).

**Decisions (2026-10-03):**
- "Own photo" = URL under `R2_PUBLIC_URL` (`domain/imagen/imagenesPropias.ts` already decides
  ownership for R2 cleanup). Stock photos are Unsplash URLs, so "El lugar" never shows on demo sites.
- The hero is extracted from LANDING into a shared component first, so both templates render the same one.

**Scope:** tasks below. **Out of scope:** RESTAURANTE / PORTFOLIO / TIENDA / PROFESIONAL, chat capture of
`precioDesde` / `horarios` (momento 2), price lists over 8 items, "abierto ahora".

**TDD:** off. **Checks per task:** `npx tsc --noEmit`, `npx eslint src tests`, `npm run test:unit`,
`npm run build`, Chrome at 1280px and 390px with full, minimal and single-service SERVICIOS fixtures.
**Delivery:** one PR per task straight to `develop` (same strategy as LANDING Bloques); merged after checks
+ Chrome (Agustín's standing OK covers the Bloques unit PRs; production only moves on an explicit release).

## Tasks

- [x] **S2-1 — Shared hero.** Move the LANDING hero into `shared/` (props: eyebrow, nombre, descripcion,
  foto, primary/secondary CTA labels and hrefs). LANDING renders identically. Route: delegated.
- [x] **S2-2 — SERVICIOS on the Bloques shell.** Rewrite `templates/servicios/` composing the shared pieces
  (header with "Agenda tu hora", hero with "Agenda por WhatsApp", horarios band, Nosotros, contact with the
  services `<select>`, footer), palette `{ bloques: true }`, plus the new price list. Remove the old
  template code and its CSS. Route: delegated.
- [x] **S2-3 — El lugar.** Own-photo filter + 0/1/2/3+ layouts, desktop and mobile. Route: delegated.
- [ ] **S2-4 — Polish.** Chrome pass on fixtures, motion contract, dead CSS; docs.

## Progress

- 2026-10-03: document created after LANDING Bloques U1-U11 merged (develop `5a429fa`).
- 2026-10-03: S2-1 done — `shared/HeroBloques.tsx` + CSS extracted; LANDING renders it unchanged. tsc, eslint, 1142 unit tests and build green.
- 2026-10-03: S2-2 done (resumed run after a cut-off writer) — SERVICIOS composes the shared Bloques pieces + `ListaServicios`; old template code/CSS removed; tests rewritten.
- 2026-10-03: S2-3 done — `servicios/datosLugar.ts` (pure filter + layout) + `Lugar.tsx`; own = under `<R2 base>/sitios/<any id>/` (`esImagenPropia`, template has no site id); base from `getAlmacenamientoArchivos().urlPublicaBase()`; rendered inside the "Servicios" fragment (not a nav item).

## Next step

S2-4.
