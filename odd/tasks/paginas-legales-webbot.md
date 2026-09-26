# paginas-legales-webbot

**Objective:** publish WebBot's own legal pages (Terms of Service and Privacy Policy) on the commercial landing, and disclose the right-of-withdrawal exclusion next to the payment button.

**Problem:** `docs/ESTADO.md` §5 lists missing legal pages as the last blocker to sell to cold traffic (Ley 19.496, SERNAC e-commerce guidance). WebBot collects name, email and full demo chat content, and sells a one-time service, with no terms, no privacy policy and no seller identification (no business name or RUT anywhere).

**Scope (option A, chosen by Agustín 2026-09-26):** WebBot's own landing only. Out of scope (option B, later, with Bloques): a legal block inside client-site templates. Meanwhile the landing no longer promises that block (`df4af2d`).

**Seller identity (from Agustín):** Devalpo Soluciones Tecnológicas SpA · RUT 77.119.936-4 · Reñaca Norte 265, oficina 510, Viña del Mar · team@devalpo.cl.

**Decision — right of withdrawal (Agustín, 2026-09-26):** excluded (Ley 19.496 art. 3 bis b allows exclusion if disclosed expressly before purchase), because the client sees and approves the finished site before paying. Compensated by Devalpo's own guarantee: full refund if the site is not published on the client's domain within 10 days of payment for reasons attributable to Devalpo. The exclusion must be visible next to the payment button, not only in `/terminos`.

**Facts for the texts (explorer map, 2026-09-26):** data collected = demo chat content (`Sesion.historial`, `datosJson`), lead name + email (`Cliente`), login email (`TokenAcceso`), payment reference entered by admin (`Pago`). Contact forms on client sites only open WhatsApp (no server). Cookies: `webbot_session` (demo, 1 year), `webbot_auth` (30 days, httpOnly), `webbot_admin` (12 h) — all functional; no analytics, no pixels, no localStorage. Processors: Railway (hosting + DB), Resend (email), Cloudflare (custom-domain proxy), Anthropic (only if API key set, only for paying clients). Mercado Pago is an outbound link; WebBot sends it nothing. IPs only in memory for rate limiting (24 h), never persisted. No deletion flow exists: access/deletion requests are handled manually via team@devalpo.cl. Commercial: $149.990 one-page, $119.990 promo (first 10), $249.990 multi-page, $39.990/yr renewal from year 2 (hosting + domain, notified in advance), published within 1 business day after payment, one adjustment round before publishing, content edits during year 1, domain registered in the client's business name.

**Disclaimer:** texts are a well-grounded draft, not legal advice; recommend lawyer review before paid traffic.

**TDD:** off (same as previous ODD docs). **Checks:** `npx tsc --noEmit`, `npm run lint`, `npm run test:unit`, `npm run build`, visual check in the browser.
**Branch:** `feat/paginas-legales-webbot` (from `develop` `4db254e`).

## Tasks

- [x] **T0** — Soften the landing phrase promising legal terms on client sites. Route: inline. Commit `df4af2d`.
- [x] **T1** — `/terminos` page. Route: delegated writer (writer trigger: 2+ non-trivial files). Commit `a8d862d`. Files: `src/app/terminos/page.tsx`, `src/app/_legal/LegalLayout.tsx`, `src/app/_legal/legal.module.css`, `tests/unit/app/legal/terminos.render.test.ts`.
- [x] **T2** — `/privacidad` page. Route: same writer. Commit `7a04821`. File: `src/app/privacidad/page.tsx`.
- [x] **T3** — Landing footer: seller identity (business name, RUT, address) + links to both pages. Route: same writer. Commit `0100598`. Files: `src/app/page.tsx`, `src/app/page.module.css`.
- [x] **T4** — Withdrawal-exclusion notice + terms link next to the payment button (`src/app/chat/DemoCTA.tsx`). Route: same writer. Commit `1793984`. Files: `src/app/chat/DemoCTA.tsx`, `src/app/chat/DemoCTA.module.css`.
- [ ] **T5** — Visual check (desktop + 390px) and docs: `ESTADO.md` (legal pages exist; blocker becomes "lawyer review"), `DECISIONES.md` entry for the withdrawal exclusion. Route: inline (orchestrator).

## Acceptance

- `/terminos` and `/privacidad` render on the app domain, readable on mobile, linked from the landing footer.
- Seller identity visible on the landing and in both pages.
- The payment CTA states, before paying, that the right of withdrawal does not apply, and links to `/terminos`.
- No claim contradicts the landing copy (prices, delivery, renewal).

## Progress

- 2026-09-26 — exploration done, decisions recorded, T0 committed.
- 2026-09-26 — T1-T4 implemented by delegated writer. Verification:
  - `npx tsc --noEmit`: clean, no errors.
  - `npm run lint`: 0 errors, 21 pre-existing warnings (all in `src/infrastructure/**`, unrelated to this change).
  - `npm run test:unit`: 882 passed, 1 failed, 883 total. The 1 failure
    (`copy.test.ts` › `POR_QUE_DEVALPO` › "incluye el gancho legal exacto...")
    is **pre-existing**, introduced by T0 (`df4af2d`) softening the
    "términos y condiciones" phrase that an older test still expects.
    Confirmed via `git stash` + rerun against `df4af2d` alone: same 1
    failure, 879/880 passing there (baseline note said "880 passing";
    actually 879 passing + 1 failing = 880 total). Not touched by T1-T4,
    left for the orchestrator/T5 to decide (fix the assertion or the copy).
  - `npm run build`: succeeds; `/terminos` and `/privacidad` listed as
    static (`○`) routes.
  - `curl` against the running dev server: `/terminos` → 200, `/privacidad`
    → 200; body contains the expected identity/title strings.
- Assumptions made in the legal texts (need Agustín's confirmation):
  - IVA treatment of the prices is not stated anywhere in the landing copy
    or precios.ts, so `/terminos` §3 just says "valores expresados en
    pesos chilenos (CLP)" without asserting IVA is included or not.
  - Renewal non-payment consequence ("el sitio puede pausarse... te
    notificaremos antes") is phrased conservatively; there's no existing
    product behavior document confirming what actually happens if a
    client doesn't renew.
  - IP license language in `/terminos` §9 ("licencia para usar tu sitio
    mientras el servicio esté activo") is a conservative default, not
    backed by an existing contract clause.
  - `/privacidad` §10 (menores de edad) is a standard boilerplate clause;
    there's no evidence WebBot has ever collected minors' data.
  - Disclaimer: these are a well-grounded draft, not legal advice —
    recommend lawyer review before paid traffic (per task doc).
