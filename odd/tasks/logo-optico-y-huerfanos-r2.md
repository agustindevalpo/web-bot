# Feature: optical logo sizing and R2 orphan cleanup

**Objective:** a client's logo looks equally present whatever its proportions, without layout
shift, and replaced or removed images stop piling up in Cloudflare R2.

**Problem:**
- The LANDING header renders the logo at a fixed 44px height with `width:auto` and a
  180px/130px max-width (`src/components/templates/landing/Landing.module.css:44`,
  `landing/index.tsx:234-237`). A wide logo looks large, a narrow vertical one looks tiny
  (ESTADO.md:121). `next/image` gets a hard-coded 180x44 hint, so a logo whose real ratio is not
  4:1 shifts the layout on load.
- No image dimensions are stored: `SiteConfigDTO.logo` is a plain URL string and
  `SubirImagenSitioUseCase` reads no width/height.
- Replaced files are never deleted (D-42): `IAlmacenamientoArchivos` has no delete operation.

**Why:** both are items of the Bloques batch that do not depend on the designer. The template
redesign itself (S2-S6) waits for a Bloques handoff per template (Agustín, 2026-10-03); the brief
for the designer agent is written separately.

**Decisions (2026-10-03):**
- Logo base height stays **44px desktop / 34px mobile** (Agustín's choice in PR #45, 2026-09-27),
  not the 36px of `handoff_bloques/README.md:247-260`. Optical sizing scales around that base.
- Logo sizing now follows the designer's rule T3 (handoff_bloquesV2 brief, 2026-10-03): constant
  area, heights clamp(28..60) desktop / clamp(22..46) mobile with the width cap (180/140px) folded
  into the formula, replacing the earlier sqrt(4/r) scale and the 240px/46px tweak. r < 1.6 shows
  the business name beside the logo; r >= 1.6 hides it (alt keeps it).
- Dimensions are stored in a **parallel optional field** (`logoDimensiones?: { ancho, alto }`) so
  `logo` stays a string and every existing `configJson` keeps parsing. Logos uploaded before this
  change have no dimensions and keep today's rendering until re-uploaded.
- Orphan policy: **delete on replace/remove, best-effort**. Only objects whose URL starts with
  `R2_PUBLIC_URL` and whose key lives under `sitios/<sitioId>/` are ever deleted; external URLs
  (Unsplash) are never touched. A failed delete is logged and never fails the save.

**Scope:** T1 optical logo (dimensions at upload + rendering in LANDING). T2 delete operation on the
storage port + cleanup when an image is replaced via upload or removed via the JSON editor.
**Out of scope:** logo in the 4 non-LANDING templates (waits for the Bloques handoff), photo
dimensions, periodic sweep of pre-existing orphans, client self-service upload.

**TDD:** off (same as previous ODD docs). **Checks:** `npx tsc --noEmit`, `npm run lint`,
`npm run test:unit`, `npm run build`, visual check of LANDING with a wide and a narrow logo.
**Branch:** `feat/logo-optico-y-huerfanos-r2` (from `develop` `9d04f51`).
**Delivery:** forecast ~450 authored lines in total, over the ~400 budget, so one commit per task
and one PR per task to `develop` (T1 and T2 are independent). Review: RDD clone-local off.

## Tasks

- [x] **T1 — Optical logo sizing.** Route: delegated (writer trigger: DTO, parser, use case,
  template, CSS and tests). Read width/height from the image header at upload (JPEG/PNG/WebP),
  store `logoDimensiones`, render the logo with real `width`/`height` and a height derived from
  its aspect ratio around the 44/34px base, clamped. Fallback to today's rendering when
  dimensions are missing.
- [x] **T2 — R2 orphan cleanup.** Route: delegated (port, R2 and Noop adapters, use case, admin
  JSON save, tests). Add `eliminar` to `IAlmacenamientoArchivos`; delete the previous object when
  an upload replaces the logo or `imagenes[0]`, and delete owned objects that disappear from
  `configJson` when it is saved from the JSON editor.

## Progress

- 2026-10-03: document created; branch created from `develop` `9d04f51`.

- 2026-10-03: T1 done (delegated writer). Header parser `src/domain/imagen/dimensionesImagen.ts`,
  scale `shared/logoOptico.ts` (clamp(sqrt(4/ratio), 0.75, 1.5)), `logoDimensiones` stored at upload.
  tsc, lint, test:unit (961), build green. Commit `4f32a14` on `feat/logo-optico-y-huerfanos-r2`.

- 2026-10-03: T2 done (delegated writer), branch `feat/limpieza-huerfanos-r2` stacked on T1. Port gains
  `eliminar` + `urlPublicaBase`; pure ownership helper `domain/imagen/imagenesPropias.ts`; best-effort
  cleanup after the DB write in upload and JSON save; stale `logoDimensiones` dropped. tsc, lint,
  test:unit (998), build green. Commit `a8b22e2`.

- 2026-10-03: parent review of T2 found an upload replacing the logo/hero would delete a URL still
  referenced elsewhere in the config (e.g. also in the gallery). Fixed inline in `200f7a4` with a
  test; tsc + test:unit (999) green. Delivery: PR 1 = T1 to `develop`, PR 2 = T2 stacked on PR 1.

- 2026-10-03: Chrome check (local next dev + local Postgres, 1036px and 390px). 4:1 unchanged (176x44),
  vertical 30x66 desktop. Two limits found and fixed with Agustin's OK in `c4d8c9a` (on T1 branch;
  T2 rebased on it): desktop max-width 180 -> 240px (a 8:1 logo was capped at 22px tall) and mobile
  height capped at 46px (51px touched the 52px row edge).

- 2026-10-03: T3 applied (delegated writer): `altosLogo`/`esLogotipo` in `shared/logoOptico.ts`,
  `--logo-alto`/`--logo-alto-movil`, name hidden for logotypes. Commit: see git log.

- 2026-10-03: Chrome check of T3 (`b63809b`, local next dev + local Postgres). Heights match the designer
  table at 1000px and 390px. Found on mobile: square isotype + name at 16px pushed "Hablemos" to its own
  row (header 97 -> 149px); also a 41-character name did it even with the monogram (pre-existing in
  production). Fixed: mobile name at 12.5px (handoff 5a) and `.marca` shrinks so the name wraps to two
  lines inside the 52px row. All 7 test sites: 78px desktop / 97px mobile.

## Next step

Push and open the two PRs
(Agustín authorizes push).
