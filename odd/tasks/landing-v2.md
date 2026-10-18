# Landing v2 (webbot.devalpo.cl redesign)

**Objective:** rebuild the commercial landing `/` to match the high-fidelity handoff in
`docs/design_handoff_landing_v2/` (README + prototype `WebBot Landing v2.dc.html`), keeping
every current text, price and link.

**Problem / why:** Agustín (2026-10-18) judged the v2 design much better than the current
landing; the landing is the entry point of the funnel he wants to sell from in November.

## Scope

Header (sticky, shrinks on scroll) · Hero · Benefits strip (new marquee) · Ejemplos · Cómo
funciona · Precio · Por qué Devalpo · FAQ · CTA final · Footer · Mobile fixed CTA (new).
Reveal-on-scroll animations, `prefers-reduced-motion`, responsive at 390/768/1024/1280.

**Out of scope:** chat, client templates, `/terminos`, `/privacidad`, page metadata, prices.

## Decisions

- **Hero shows the three real demo sites, not the prototype's fictional businesses**
  (Agustín, 2026-10-18). The prototype rotates "Cocinería Doña Rosa / donarosa.cl",
  "Almacén Las Lomas", "Clínica Dental Sonríe" with a green "online" dot. With zero sales that
  reads as fake clients and contradicts "Sitios que ya están publicados". Keep the animated
  browser window, but the three slides are `demo-restaurante`, `demo-tienda`, `demo-dentista`,
  with their real business names (from the demo seed) and real URLs
  `demo-*.sitios.devalpo.cl`.
- **Texts, prices and links stay as they are today** (handoff README §Overview): copy from
  `src/app/_landing/copy.ts`, prices and promo state from `precios.ts` (including the
  "cupos agotados" variant), examples from `ejemplos.ts`, FAQ answers from the current site
  (the prototype's FAQ answers 2–6 are drafts, README §8). Footer keeps the e-mail
  (README §10 notes it was missing from the prototype).
- Handoff files arrived with swapped names (`support.js` was the prototype HTML,
  `WebBot Landing v2.dc.html` was the README, plus an identical duplicate
  `support (1).js`, same SHA-1). Renamed into `docs/design_handoff_landing_v2/`; the duplicate
  was removed. The prototype's real runtime is not included, so it does not open in a
  browser: read values from its inline styles.

## Method and checks

**TDD:** off (project convention, same as `restaurante-bloques`). **RDD:** off
(`gentle-ai review mode status`: clone-local off).
**Checks per task:** `npx tsc --noEmit`, `npx eslint src tests`, `npm run test:unit`,
`npm run build`, then Chrome at 1280 px and 390 px (iframe method, see trampas in ESTADO).
**Delivery:** one PR per task to `develop`, branches `feat/landing-v2-0N-*`, each cut from the
previous task's branch. Merge only with Agustín's OK (the standing merge OK of
`landing-geometria-bloques` does not extend to this feature). Release to `main` only on his
explicit request.

## Tasks

- [x] **L1 — Foundation, header, hero, benefits strip.** Done in `97cbe04`
  (+2215/−316 incl. ~730 lines of handoff files). Real demos: El Rincón del Sabor, Boutique
  Luna Nueva, Clínica Dental Sonrisas (`prisma/seed-demo.ts`). Checks: tsc 0 errors, eslint
  0 errors (22 pre-existing warnings), test:unit 103 suites / 1580 tests, build OK; Chrome
  1280 px and 390 px: URL bar and active slide switch together, header compacts at scroll,
  no horizontal scroll at 390 px, no console errors. Exceeds the ~400-line heuristic because
  the hero visual (window, three mini-sites, chat card) is mostly CSS. Left for L4: unused
  `public/demo-restaurante-poster.png` and `scripts/capturar-posters.ts`.
  Original scope: Design tokens, reveal-on-scroll
  hook, reduced motion, sticky header that shrinks at `scrollY > 12` and hides the nav under
  900 px, hero (pill, H1 with animated cyan underline, CTAs, ticks, browser window with the
  three real demos rotating every 4.2 s, floating chat card), navy marquee strip. Also commits
  the handoff folder and this document. Route: delegated writer (2+ non-trivial files).
- [x] **L2 — Ejemplos and Cómo funciona.** Done in `9b169ed` (+610/−157) and `204a729`.
  Example previews reuse the real demo mockups (`MaquetaSitio`). Checks: tsc 0 errors, eslint
  0 errors, test:unit 104 suites / 1587 tests, build OK. Chrome at 390, 768 and 1024 px
  (L1 + L2): no horizontal overflow at any width, nav hidden under 900 px, H1 42→65 px.
  Found and fixed: the sticky left column of Cómo funciona stayed sticky when the grid
  stacked, covering steps 2–3 on mobile; now two columns and sticky only from 1000 px
  (`204a729`, tsc/eslint/build re-run). Known, matches prototype: at 768 px the example grid
  is 2 + 1 cards.
  Original scope: Example cards with hover, sticky left column,
  vertical rail filled by scroll progress, step circles and their UI illustrations.
  Route: delegated writer.
- [x] **L3 — Precio, Por qué Devalpo, FAQ.** Done in `54c2348` (+697/−274, mostly CSS for
  three sections) and `58dfe0e`. Price view derived from `precios.ts` by `vistaPrecio.ts`;
  accordion in `FaqAcordeon.tsx` (only client component; first item server-rendered open);
  `LandingFAQ.tsx` deleted. Bento, price block and FAQ use explicit breakpoints (900/860 px),
  no sticky. Checks: tsc 0 errors, eslint 0 errors (22 known warnings), test:unit 106 suites /
  1595 tests, build OK. Chrome 390/768/1024/1280: no horizontal overflow; FAQ opens only the
  clicked item and toggles closed; agotados variant verified by temporarily setting
  `CUPOS_VENDIDOS = 10` (normal price, no tag, no strike-through; reverted to 0). Found and
  fixed: the FAQ phone number wrapped at 390 px (`58dfe0e`).
  Original scope: Navy price block driven by `precios.ts`
  (promo and agotados), extra price cards, bento grid, accordion (one open, first open by
  default, `grid-template-rows` animation, `aria-expanded`). Route: delegated writer.
- [ ] **L4 — CTA final, footer, mobile fixed CTA, cleanup, docs.** Remove dead CSS and
  components, update `docs/ESTADO.md` if it names the old landing, e2e `landing.feature`
  still green. Route: delegated writer.

## Acceptance criteria

- Every text, price, link and anchor of the current landing is still present and correct.
- Visually matches the prototype at 1280 and 390 px; no horizontal scroll at 390 px.
- With `prefers-reduced-motion: reduce`, no animation runs and all content is visible.
- Intervals and listeners are cleaned up on unmount; scroll work uses `requestAnimationFrame`.
- All checks above pass.

## Progress

_Next step:_ L4. Push and PRs of L1–L3 pending Agustín's OK.
