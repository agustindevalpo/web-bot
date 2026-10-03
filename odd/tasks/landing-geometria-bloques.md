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
- [ ] **U4 — Hero.** 3-tier display scale by `nombre.length` (pure, tested), 150px padding, 720px photo
  with `24px 0 0 24px` radius, eyebrow pill, mobile photo-above-title.
- [ ] **U5 — Data band.** `BandaDatos` on `--ink` (0/1/2/3 degradation); `destacados` leave the hero.
  SHARED (horarios in S2, credenciales in S6).
- [ ] **U6 — Service bands.** Header + bands form A (giant number) / B (`servicios[].foto`),
  white/`#F2F1ED` alternation; remove card grid and CTA cell; update unit tests and the e2e H2.
- [ ] **U7 — Nosotros block.** Full-bleed accent, cards from `sobreNosotrosPartes`, degradation chain,
  never null, C3 highlight quote with `highlightAutor`; delete the photo grid. SHARED.
- [ ] **U8 — Contact (C1).** No map; right column = horarios card (if any) + phone/email cards;
  `FormularioContacto` gets an optional `servicios` prop for S2. SHARED.
- [ ] **U9 — Footer (T3, T7).** `FooterBloques`: columns, logo on white plate, legal line, >=66% white
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

## Next step

U4 (Hero) on a new branch stacked on U3.
