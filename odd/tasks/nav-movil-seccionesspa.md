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
- [ ] **T3** — Visual verification at 390px and desktop in the browser. Route: inline (orchestrator). **Not done by the writer**: the sandboxed Chrome automation's `resize_window` did not change the real viewport in this session (`window.innerWidth` stayed 1920 after several resize attempts, including to 800×600) — an environment limitation, not a code issue. The orchestrator needs to do the actual 390px/desktop check.

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
