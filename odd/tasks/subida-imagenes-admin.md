# Feature: logo and photo upload from /admin (Cloudflare R2)

**Objective:** a paying client's logo and photos reach their site. Agustín uploads the files the
client sends over WhatsApp from `/admin`; the file is stored in Cloudflare R2 and its public URL is
written into the site's `configJson`.

**Problem:** there is no file storage at all (no S3/R2/blob code, no storage env vars), and
`next.config.ts` only allows `images.unsplash.com` in `remotePatterns`, so even a hand-typed URL is
rejected by `next/image`. Today the only way to change a site's images is the raw JSON textarea in
`src/app/admin/sitios/[id]/page.tsx`, with Unsplash URLs.

**Why:** D-36 (text before payment, graphic material after). Without this, a sold site ships with
stock photos. Client self-service upload comes later on the same storage port.

**Decisions (2026-09-27):**
- Storage: **Cloudflare R2**, public bucket behind a custom domain (proposed `media.devalpo.cl`;
  the `devalpo.cl` zone already lives in Cloudflare). Chosen over Railway Buckets because those are
  private and would need an app proxy route. Engram: `odd/subida-imagenes-admin/decision-storage`.
- Client: `@aws-sdk/client-s3` against the R2 S3-compatible endpoint
  (`https://<account_id>.r2.cloudflarestorage.com`, region `auto`). Server-only.
- Accepted formats: JPEG, PNG, WebP, validated by magic bytes (not the browser MIME). No SVG
  (`next/image` refuses it by default and it can carry script). Max 5 MB per file.
- Object key: `sitios/<sitioId>/<campo>-<uuid>.<ext>`. Replaced files are not deleted (orphans are
  acceptable at this volume; noted as a follow-up).
- Hero photo: there is no `imagenHero` field. Every template that shows a hero photo
  (`tienda`, `servicios`, `landing`, `restaurante` — `src/components/templates/*/sections.ts`)
  derives it from `configJson.imagenes[0]`; none reads a separate key (verified by grep — the
  original premise for this document was wrong). The upload use case's `hero` campo replaces
  index 0 of `imagenes` (or creates `[url]` when empty) instead of writing a key nothing reads.
  No template was touched.
- Without R2 env vars the container returns a Noop adapter that answers `no_configurado`, same lazy
  pattern as `getCustomHostnameService()`; `/admin` shows a clear message instead of failing.
- Env vars: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`,
  `R2_PUBLIC_URL`.

**Scope:** storage port + R2 adapter + Noop; upload use case; `/admin` upload fields for logo, hero
photo and gallery (hero replaces `imagenes[0]`, gallery appends; removal stays in the JSON
textarea); `next.config.ts` remotePatterns from `R2_PUBLIC_URL` and
`experimental.serverActions.bodySizeLimit`; docs.
**Out of scope:** logo in the 4 non-LANDING templates (Bloques), client self-service upload, image
resizing, deleting orphaned objects.

**TDD:** off (same as previous ODD docs). **Checks:** `npx tsc --noEmit`, `npm run lint`,
`npm run test:unit`, `npm run build`, manual upload check in `/admin` once the bucket exists.
**Branch:** `feat/subida-imagenes-admin` (from `develop` `2bd8ed4`).
**Delivery strategy:** `ask-on-risk` → Agustín chose a single PR to `develop`, then release to
`main` (2026-09-27). Review: RDD clone-local off; `review assess` tier medium (`next.config.ts`).

## Tasks

- [x] **T1** — Storage port (`IAlmacenamientoArchivos` in `src/application`), `R2AlmacenamientoArchivos`
  and `NoopAlmacenamientoArchivos` in `src/infrastructure/storage/`, lazy memoized getter in
  `container.ts`, unit tests (adapter with mocked S3 client, container env matrix). Route: delegated
  writer (writer trigger: 2+ non-trivial files). Checks: `tsc`/`lint`/`test:unit` green. Commit:
  `8ecc8ad` — `feat(storage): add R2 file storage port with Noop fallback`.
- [x] **T2** — `SubirImagenSitioUseCase`: validates magic bytes and size, builds the key, uploads, and
  writes the URL into `configJson` (`logo` replaces `configJson.logo`; `hero` replaces
  `imagenes[0]`, or creates `[url]` when empty; `imagenes` appends). Unit tests with
  `MockSitioRepository` and a fake storage. Route: same writer. Checks: `tsc`/`lint`/`test:unit`
  green. Commits: `6586ba2` — `feat(admin): add SubirImagenSitioUseCase for logo/hero/gallery
  uploads`; `a02166c` — `fix(admin): store hero photo as the first gallery image` (correction:
  dropped the `imagenHero` field from `SiteConfigDTO`/`CampoImagenSitio`, see Decisions above).
- [x] **T3** — `/admin/sitios/[id]`: upload form (logo, hero, gallery) + server action behind
  `exigirAdmin`, current-image previews (hero = `imagenes[0]`, gallery = `imagenes.slice(1)`),
  `no_configurado` message; `next.config.ts` remotePatterns + `bodySizeLimit: '6mb'`. Route: same
  writer. Checks: `tsc`/`lint`/`test:unit`/`build` green. Commits: `5caa784` — `feat(admin): add
  logo/hero/gallery upload UI to the site page`; `a02166c` (same correction as T2, UI side).
- [x] **T4** — Docs: `docs/PANEL_INTERNO.md` (env vars + R2 setup steps), `DECISIONES.md` D-42.
  `ESTADO.md` is regenerated in the release commit. Route: inline. `.env.example` NOT edited: the
  tooling is blocked from dotfiles; the five lines are in `PANEL_INTERNO.md` for Agustín to paste.
- [ ] **T5** — Agustín: create bucket, connect `media.devalpo.cl`, create the R2 API token, load env
  vars in Railway; then a real upload check. Route: user.

## Acceptance

- With R2 configured, uploading a JPEG/PNG/WebP ≤ 5 MB from `/admin` makes it appear on the live site.
- A non-image, an SVG or a file over 5 MB is rejected with a clear message and nothing is written.
- Without R2 env vars, `/admin` renders and explains that storage is not configured.
- No secret is logged or rendered.

## Progress

- 2026-09-27: feature document created; branch created.
- 2026-09-27: T1-T3 implemented (delegated writer). All checks green: `tsc --noEmit`, `lint`
  (0 errors, pre-existing warnings only + 3 new `no-img-element` warnings from the preview
  `<img>` tags in T3, decision below), `test:unit` (919 tests), `build`.
- 2026-09-27: implementation flagged that no template reads a separate `imagenHero` field —
  every hero photo comes from `imagenes[0]` (see finding below, now resolved).
- 2026-09-27: **resolved** — coordinator confirmed the finding and corrected the design instead
  of touching templates: the `hero` campo now replaces `imagenes[0]` (or creates `[url]` when
  `imagenes` is empty), `imagenes` keeps appending. Dropped `imagenHero` from `SiteConfigDTO`
  and from `CampoImagenSitio`; admin preview updated (hero = `imagenes[0]`, gallery =
  `imagenes.slice(1)`, with a note that the first photo is the main one). No template file
  touched. Commit `a02166c` — `fix(admin): store hero photo as the first gallery image`.
  Re-verified: `tsc --noEmit` clean, `lint` 0 errors (same pre-existing warnings + 3
  `no-img-element`), `test:unit` 921 tests passed, `build` succeeds.

**Resolution — hero photo is `imagenes[0]`, not a separate field:** the four templates that
show a hero photo (`tienda`, `servicios`, `landing`, `restaurante` —
`src/components/templates/*/sections.ts`) derive it from `configJson.imagenes[0]`; none reads
`imagenHero`. Rather than update four rendering templates (including `restaurante`'s
`buildGaleria`, which assumes `imagenes[0]` is the hero and excludes it from the gallery grid),
the upload use case now writes to `imagenes[0]` directly for the `hero` campo. Templates render
the new hero photo with zero changes on their side. `imagenHero` no longer exists anywhere in
this feature — see the corrected Decisions above and T2/T3 entries.
