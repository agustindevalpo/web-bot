# nav-movil-seccionesspa

**Objective:** make section navigation work on mobile (<768px) in the `SeccionesSPA` shell, per the Bloques handoff.

**Problem:** first rendered look at S1 on mobile (2026-09-26, demo-consultora at 390px) found the header `.nav` collapsed to 0px wide (flex item with `overflow-x: auto` gets automatic min-width 0), so the four anchor links render off-screen and mobile users cannot navigate between sections. The `Hablemos` CTA is also clipped at the right edge. Separately, React warns about a missing `key` in children passed to `SeccionesSPA`.

**Why now:** S1 is on `develop` and not yet in `main`; shipping it would ship a site with no mobile navigation.

**Authoritative spec:** `docs/design_handoff_plantillas_webbot/handoff_bloques/README.md` §"Nav — fila horizontal con scroll. Sin hamburguesa." (lines 293-305). It supersedes the older `README.md:164` (hamburger). No hamburger.

**Scope:** `src/components/templates/shared/SeccionesSPA.{tsx,module.css}`, the source of the missing-key warning, and tests. Out of scope: the rest of the Bloques redesign.

**TDD:** off — no TDD signal in the project (same as previous ODD docs). Ordinary functional checks.
**Checks:** `npm run test:unit`, `npx tsc --noEmit`, `npm run lint`, visual check at 390px in the browser.
**Branch:** `fix/nav-movil-seccionesspa` (from `develop` `99e16b9`).

## Tasks

- [x] **T1** — Mobile nav row per Bloques spec: two-row header on mobile (brand + CTA, then scrollable nav row), nav never collapses, active item underlined, sticky shows only the 44px row with shadow, active item kept visible by scrolling inside the row only. Route: delegated (writer trigger: 2+ non-trivial files).
- [x] **T2** — Fix missing `key` warning in `SeccionesSPA` children. Route: same writer.
- [x] **T3** — Visual verification at 390px and desktop in the browser. Route: inline (orchestrator). `resize_window` does not change the viewport (maximized window), so mobile was checked inside a 390×844 same-origin iframe.
- [x] **T4** (found by T3) — Sticky header never stuck, on desktop or mobile: `overflow-x: hidden` on html+body made body a scroll container. Fixed with `overflow-x: clip` in `globals.css`. Route: inline (one mechanical line).
- [x] **T5** (found by T3) — Mobile row 1 measured 51px instead of 38px, so 13px of the brand peeked under the pinned nav: `Monograma` variants' `font` shorthand reset `line-height` to `normal`. Fixed with `/1` in each shorthand. Route: inline (mechanical).

## Acceptance

- At 390px all four nav links are reachable (visible or by horizontal swipe of the row), tapping one jumps to its section.
- No element of the header overflows the viewport; `Hablemos` fully visible.
- Desktop (≥768px) header unchanged.
- No React key warning in the dev console.

## Progress

- 2026-09-26 — diagnosis done, doc created.
- 2026-09-26 — T2 done (route: delegated writer). Root cause found via the
  Next.js dev overlay (not guesswork): the warning pointed at the `pie`
  slot, owned by `SitioCliente` — `pie` is a Server Component element
  passed as a prop and rendered as one of several direct siblings of
  `SeccionesSPA`'s shell `div` (`header`, `main`, `pie`, the end-of-page
  sentinel), unlike `marca`/`accionHeader`, which are each the sole child
  of their own wrapper `div` and never hit this. Fixed by wrapping it in a
  keyed `Fragment` in `SeccionesSPA.tsx` (the `<>...</>` shorthand doesn't
  accept `key`). Both existing `.map()` calls in the file already had
  `key={seccion.id}` — they were never the cause.
  Commit: `99e9820` — `fix(templates): missing key in SeccionesSPA's pie slot`.
  Checks: `tsc --noEmit` clean, `npm run lint` clean (only pre-existing
  unrelated warnings), `npm run test:unit` 880/880 passing.
- 2026-09-26 — T1 done (route: delegated writer). Mobile header becomes two
  rows purely with CSS `order`/`flex-wrap` (no `SeccionesSPA.tsx` markup
  restructuring for `marca`/`nav`/`accion`, which stay the same three
  direct children of `.header` in document order): row 1 = marca (order 1)
  + accion (order 2), row 2 = nav (order 3, `flex-basis: 100%` forces the
  line break). `.nav` also gets `min-width: 0` (the original defect: an
  `overflow-x: auto` flex item's automatic `min-width: auto` let it
  collapse to 0 when squeezed). Sticky-with-shadow uses the header's own
  `position: sticky; top: calc(-1 * fila1-alto)` plus a 1px sentinel +
  IntersectionObserver (imperative `data-pegado` attribute, no React state)
  — same idiom already used by the file's end-of-page sentinel. Active-item
  scroll-into-view is a new pure helper, `shared/navScroll.ts`
  (`calcularScrollNavHorizontal`), unit-tested like `scrollspy.ts`, called
  from a `useEffect` keyed on `activaId` that uses `nav.scrollTo` (never
  `scrollIntoView`, which would scroll the document). `ALTO_HEADER_PX`
  split into `ALTO_HEADER_DESKTOP_PX`/`ALTO_HEADER_MOBIL_PX`, read via
  `matchMedia('(max-width: 767px)')` once at effect-mount time, feeding the
  scrollspy's `rootMargin`. `Landing.module.css`'s `.botonHablemos` gets a
  small mobile padding/font reduction as extra safety margin for row 1.
  Commit: `b6cd28c` — `fix(templates): mobile nav row in SeccionesSPA per Bloques handoff`.
  Checks: `tsc --noEmit` clean, `npm run lint` clean, `npm run test:unit`
  880/880 passing (876 baseline + 4 new in `navScroll.test.ts`).
  T3 (visual check at 390px) is NOT covered by these checks — see the note
  on T3 above.
- 2026-09-26 — T3 done by orchestrator. Found T4 and T5 (both pre-existing,
  both invisible to unit tests). Commits: `4eb59d0` (globals clip),
  `700f9ec` (Monograma line-height). Evidence after fixes, demo-consultora:
  desktop header 78px, `top: 0` when scrolled to 1500; mobile 390px header
  83px (82 + 1px border), all four links visible without swiping, Hablemos
  fully visible, scrolled to 1500 → header `top: -38`, nav `top: 0`, shadow
  on, active item follows the section (Nosotros), `scrollWidth` 375, no key
  warning in the dev overlay. Anchor jump verified: `#servicios` lands at
  78px (right under the header). Note: a hidden (background) Chrome tab does
  not fire IntersectionObserver or smooth scroll — test with a visible tab.
  Checks: `tsc --noEmit` clean, lint 0 errors (21 pre-existing warnings),
  `test:unit` 880/880.
- 2026-09-26 — T6 (Agustín's feedback): `Hablemos` clipped at the top on
  mobile (top edge y = -4px) because the CTA is an inline `<a>` whose
  vertical padding doesn't count toward the line box. `.accion` now
  centers with flex, and row 1 goes 38 → 52px (CSS var + `ALTO_FILA1_MOBIL_PX`)
  so the button has 10px above and below. Deliberate deviation from the
  Bloques 82px total (now 96px + 1px border): the user asked for the air.
  Logo stays left (Agustín agreed after reviewing `handoff_bloques/README.md:140`).
  Evidence: mobile button 11..43 (center 27 = brand center 27), stuck header
  top -52 / nav top 0; desktop unchanged at 78px. Shadow not re-observed
  (background tab), logic unchanged. Commit `cdc1ceb`. Checks: tsc clean,
  lint 0 errors, test:unit 880/880.
- 2026-09-26 — T7 (Agustín's feedback): LANDING footer centered on mobile
  (the Bloques handoff doesn't fix mobile footer alignment). Bottom padding
  84px so the floating WhatsApp button (y 770..818) clears the credit line
  (ends y 759). Every line centered at x≈187 in a 375 viewport; desktop
  unchanged (76px). CSS-only change; no tests touch it.
- Next: push the branch and open a PR to `develop` (user's decision).
