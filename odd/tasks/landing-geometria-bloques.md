# Feature: Bloques geometry in LANDING (shared base for S2-S6)

**Objective:** LANDING looks like the Bloques spec (air, scale, tracking, accent block) and the pieces
the other five templates reuse (header, data band, Nosotros, contact, footer, monogram) exist as shared
components.

**Problem:** S1 shipped only the Bloques shell (long scroll, anchor nav, monogram slot). The geometry
is missing: `Landing.module.css` keeps 56px/44px section padding, Instrument Serif headings, a 78px
header, stats inside the hero, a services card grid, a Nosotros photo grid and a contact map
(gap analysis 2026-10-03, Engram `discovery` "LANDING NO tiene la geometría Bloques").

**Why:** D-38 chose Bloques because the geometry is what makes a site with little material look
expensive. S2 SERVICIOS (designer chapter `handoff_bloques_v2/02-SERVICIOS.md`) inherits everything
from LANDING-Bloques, so this is its prerequisite.

**Spec precedence:** `docs/design_handoff_plantillas_webbot/handoff_bloques_v2/00-DECISIONES-TRANSVERSALES.md`
(T1-T10, C1-C9) > `handoff_bloques/README.md` > `handoff_bloques_v2/02-SERVICIOS.md` (only to know
what must be shared).

**Defaults taken (2026-10-03, reversible):**
- Nosotros copy follows the designer's prototypes: eyebrow "Nosotros", H2 `{nombre} en {ciudad}`.
- `clampAcento` stays in `src/domain/color/contraste.ts`; `shared/palette.ts` re-exports and applies it
  for every template (T2 intent without moving domain logic into a component folder).
- No `logoRatio` field: `logoDimensiones` already stores width and height (T3 is implemented).
- C2 answer: stock photos are Unsplash URLs and own photos live under `R2_PUBLIC_URL`
  (`domain/imagen/imagenesPropias.ts` already tells them apart), so no `/banco/` prefix is needed.
- Footer logo (U9): "80% of the header" means 80% of the header LOGO height from `altosLogo()`
  (`round(escritorio*0.8)` / `round(movil*0.8)`; the S2 prototype draws a 132x44 header logo as 106x35).
  No dimensions: 35px high, auto width, max 180px.
- New DTO fields are optional and read defensively at the `sections.ts` boundary: `servicios[].foto`,
  `sobreNosotrosPartes`, `highlightAutor`, `legal`, `horarios`.

**Questions for the designer (do not block U1-U5):**
- Single service: README says the section is not rendered and the service is "absorbed into the hero
  as a third line", but T1 says the nav always has 4 labels. Until answered: render one band.
- Mobile header 82px at rest (C6): 82 = 38px row + 44px nav, but today's row holds the 46px
  "Hablemos" button. The 5a mockup shows no button in that row. Needed before U3 mobile.
  U3 keeps today's mobile heights, 52px row 1 + 44px nav (96px at rest, 44px stuck), because the 82px
  target leaves no room for "Hablemos". Pending designer answer.

**Scope:** U1-U10 below, LANDING only plus new shared components. **Out of scope:** S2-S6 templates,
chat redesign / momento 2 capture (fields are rendered when present but nothing fills them yet),
client self-upload, legal T&C pages for Webpay clients.

**TDD:** off (same as previous ODD docs). **Checks per unit:** `npx tsc --noEmit`,
`npx eslint src tests` (repo `npm run lint` currently trips on the untracked designer `support.js`),
`npm run test:unit`, `npm run build`, visual check in Chrome at 1280px and 390px with a full and a
minimal site.
**Branch:** one branch per unit from `develop`. **Delivery:** forecast ~3.5-4k authored lines, well over
the ~400 budget. Chain strategy (Agustín, 2026-10-03): **stacked directly to `develop`**, one PR per
unit, merged as each one is ready; production only moves on an explicit release. Review: RDD clone-local off.

## Tasks

- [x] **U1 — Foundations.** DTO fields above + defensive readers/helpers (`shared/servicios.ts`),
  `palette.ts` clamp for all templates. No visual change. SHARED.
- [x] **U2 — Monogram + font (T1, T4).** Monograma reduced to Sans pesado 36/34/26; Instrument Serif
  removed from LANDING and `Monograma.module.css`; headings Montserrat 800 with Bloques tracking. SHARED.
- [x] **U3 — Header (C6).** 96px desktop, gutter 96, nav gap 42, "Hablemos" pill; mobile rest/stuck
  heights; CSS vars and the JS constants in `SeccionesSPA.tsx` changed together, with a test. SHARED.
- [x] **U4 — Hero.** 3-tier display scale by `nombre.length` (pure, tested), 150px padding, 720px photo
  with `24px 0 0 24px` radius, eyebrow pill, mobile photo-above-title. SHARED helper `shared/displayHero.ts`.
- [x] **U5 — Data band.** `BandaDatos` on `--ink` (0/1/2/3 degradation); `destacados` leave the hero.
  SHARED (horarios in S2, credenciales in S6).
- [x] **U6 — Service bands.** Header + bands form A (giant number) / B (`servicios[].foto`),
  white/`#F2F1ED` alternation; remove card grid and CTA cell; update unit tests and the e2e H2.
- [x] **U7 — Nosotros block.** Full-bleed accent, cards from `sobreNosotrosPartes`, degradation chain,
  never null, C3 highlight quote with `highlightAutor`; delete the photo grid. SHARED.
- [x] **U8 — Contact (C1).** No map; right column = horarios card (if any) + phone/email cards;
  `FormularioContacto` gets an optional `servicios` prop for S2. SHARED.
- [x] **U9 — Footer (T3, T7).** `FooterBloques`: columns, logo on white plate, legal line, >=66% white
  micro-text. Old `shared/Footer.tsx` stays for the not-yet-migrated templates. SHARED.
- [ ] **U10 — Motion + mobile polish.** Threshold .12, 80ms cascade, reduced motion, remaining mobile
  values, dead CSS removal.

## Progress

- 2026-10-03: gap analysis done (delegated read-only mapper); document created.
- 2026-10-03: U1 done on `feat/bloques-u1-fundaciones`: DTO fields, `shared/contenido.ts` + `fotoDeServicio`/`precioDeServicio`, clamp moved into `buildPaletteStyle` (LANDING colors unchanged; other templates now clamp `--acento`), `--acento-07/18/28/hover` exposed. tsc, eslint, 1066 unit tests, build green.

- 2026-10-03: parent review of U1 found that clamping the accent for every template darkened the
  CTA background of RESTAURANTE and PORTFOLIO, which still draw dark `--primario` text on it (and
  RESTAURANTE draws accent text on black): #FFD000 became #8f7400 under #221a00 text. Fixed: the clamp is
  opt-in, `buildPaletteStyle(config, { bloques: true })`, LANDING passes it, each template turns it on
  when it migrates to Bloques. Pre-U1 default-accent tests restored.
- 2026-10-03: U2 done on `feat/bloques-u2-monograma-fuente`: `Monograma` is Sans pesado only (`tamano` prop: `cabecera` 36px / 26px under 768px, `pie` 34px), Instrument Serif and `shared/fuentes.ts` deleted, LANDING headings Montserrat 800 with tracking -.048/-.042/-.03em, sizes unchanged. tsc, eslint (0 errors), 1067 unit tests, build green.
- 2026-10-03: U3 done on `feat/bloques-u3-header`: header 96px (`--wb-spa-header-alto` + JS constants moved to `shared/headerGeometria.ts`, pinned by a test that reads the CSS), gutter 96px, nav gap 42px, hover color-only, active item `--ink`, `--line-soft` border, LANDING "Hablemos" accent pill with `--acento-hover`; mobile gutter 24px (nav bleed follows), row heights unchanged. tsc, eslint (0 errors), 1070 unit tests, build green.
- 2026-10-03: U4 done on `feat/bloques-u4-hero`: `shared/displayHero.ts` (`tramoDisplay(nombre)` -> grande/medio/chico, 104/78/56px), hero grid 1fr 1fr with 150px padding, 96px gutter, 720px photo `24px 0 0 24px`, eyebrow pill, 18px/1.85 paragraph, two pill buttons (primary `--acento-hover`, secondary border+4% tint, no transform), mobile photo above title via `order`, 44px display, stacked 46px buttons. Stats row and highlight card removed from the hero: **until U5/U7, `destacados` and `highlight` are temporarily absent from LANDING on develop** (data reachable via `buildDestacados`/`buildHighlight` in `landing/sections.ts`). No-photo hero is single column.

- 2026-10-03: U5 done on `feat/bloques-u5-banda-datos`: `shared/BandaDatos.tsx` (+ `.module.css`, Server Component; props `items`, `rotulo?`, `variante: 'cifras' | 'horarios'`) and pure `shared/layoutBanda.ts` (`layoutBanda(n)` -> una/dos/tres/null, pinned with a CSS-values test). `--ink` #101218, 76px/72px 96px padding, value cyan via `--wb-color-highlight`, mobile stacked (44px 24px) or horarios row form. LANDING renders it inside the `inicio` section right after the hero from `buildDestacados` (no nav anchor); `destacados` are back on the page. tsc, eslint (0 errors), 1108 unit tests, build green. Helper file is `layoutBanda.ts`, not `bandaDatos.ts`: it collided in casing with `BandaDatos.tsx` on Windows.
- 2026-10-03: U6 done on `feat/bloques-u6-bandas-servicio`: `buildServicios` now returns `{ etiqueta, enlaceTexto, bandas: ServicioBanda[] }` (`numero, nombre, descripcion, foto, whatsappUrl` with the service name prefilled; no trim, no CTA cell, no `ctaSpan`). One full-bleed band per service, `.85fr 1.15fr`, white / `#F2F1ED` alternation by background colour with the visual cell always on the left (README: alternation moved from the photo side to the background colour; mobile always stacks visual-on-top), form A giant `aria-hidden` number in `--acento-18` on the opposite background, form B `next/image` fill from `fotoDeServicio` only (never `imagenes[]`), 15px real number above the title, link with `--acento-28` underline. H2 kept as "Qué ofrecemos" (e2e). Single service still renders one band (designer question open). tsc, eslint (0 errors), 1104 unit tests, build green.
- 2026-10-03: U7 done on `feat/bloques-u7-nosotros`: `shared/BloqueNosotros.tsx` (+ `.module.css`, Server Component) fed by pure `shared/nosotros.ts` (`construirNosotros(config, frase)`, `layoutNosotros(n)` -> columna/fila/dos). Full-bleed `--acento`, 150px 96px, all text #FFF (alpha only on card backgrounds and the quote rule). Paragraph = `sobreNosotros` else `descripcion`; H2 `{nombre} en {ciudad}`; cards title-only from `comoPartesNosotros`; C3 quote from `buildHighlight` + `comoAutorHighlight` (**highlight is back on develop**). Never null, so "Nosotros" is always in the nav. LANDING's photo grid, its CSS and the fixed "Quiénes somos" H2 are deleted (`imagenes[1..]` no longer shown there); `buildNosotros` rewritten with its tests. e2e did not pin the old H2 or the grid. tsc, eslint (0 errors), 1112 unit tests, build green.
- 2026-10-03: U8 done on `feat/bloques-u8-contacto`: shared `SeccionContacto` (140px 96px, 1fr 1fr, gap 96px; H2 800 56px; mobile 44px 24px, H2 34px), `FormularioContacto` moved to `shared/` with optional `servicios` prop (select + "¿Qué día te acomoda?", S2 message) and `Contacto.module.css` (1.5px #E2E0EC fields, 12px radius, focus border + 12% accent halo, accent pill with `--acento-hover`, >=52px touch on mobile), `ContactoDatos` (horarios card only if `comoHorarios` non-empty + phone/email cards as tel:/mailto:, stacked on mobile, `overflow-wrap: anywhere`), pure `contactoEnvio.ts` (both message builders + `resolverEnvioContacto(telefono, mensaje, abrir)`) and `vistaContacto.ts` (visibility helper; not `contactoDatos.ts`, casing collision with `ContactoDatos.tsx`). Map placeholder, pin and old contact CSS deleted from LANDING; `buildContacto` now carries `horarios`; added intro paragraph "Cuéntanos qué necesitas y te respondemos por WhatsApp." (shown only with the form). tsc, eslint (0 errors), 1119 unit tests, build green. Not visually checked in Chrome.
- 2026-10-03: U9 done on `feat/bloques-u9-footer`: shared `FooterBloques` (+ `.module.css`, Server Component; props `config`, `secciones` = the same list the nav gets, `anio`) fed by pure `shared/pieBloques.ts` (`construirPie`, `altosLogoPie`, `glosaPie`, `lineaLegal`; not `footerBloques.ts`, casing collision on Windows). `#101218`, 100px 96px 44px, grid 1.4fr 1fr 1fr; logo always on a white plate (no radius), 80% of header logo height, logotype hides the name, no logo -> `Monograma tamano="pie"` + name; glosa `{Rubro} en {ciudad}.` + horarios as text; Secciones/Contacto columns (tel:, mailto: via `buildMailtoUrl`, Instagram via `buildInstagramUrl`), legal line from `comoLegal` (T7), all micro-text >= .66 white; mobile single column, plate 10px 13px, monogram stays 34px (API has no mobile 28px). LANDING's inline footer, `buildFooter` and its CSS/tests deleted; `shared/Footer.tsx` untouched. tsc, eslint (0 errors), 1130 unit tests, build green. Not visually checked in Chrome.

## Next step

U10 (Motion + mobile polish) on a new branch stacked on U9.
