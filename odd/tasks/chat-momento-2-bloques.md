# Feature: S3 chat de onboarding y momento 2 en Bloques

**Objective:** the demo chat asks 6 questions in Bloques style, the data step captures the phone, and a
new "momento 2" lets the visitant fill the fields the Bloques templates already render (service
descriptions and prices, horarios, Nosotros parts, a client quote) before paying.

**Problem:** the chat still asks 8–9 questions in the old navy style (`src/app/chat/page.module.css`,
effective font Arial), the lead form has no phone (`LeadForm.tsx`, `/api/chat/lead` takes only nombre and
email), and nothing fills `precioDesde`, `horarios`, `sobreNosotrosPartes` or `highlightAutor` except the
admin JSON editor. Every delivered site shows the minimal state.

**Why:** D-36 (momento 2 mixto). LANDING and SERVICIOS are already in Bloques in production; this is the
producer their new fields are waiting for.

**Spec:** `docs/design_handoff_plantillas_webbot/handoff_bloques_v2/03-CHAT-Y-MOMENTO-2.md` (screens C1–C3,
R1–R3, M1–M5, G1, E1, E2) + `00-DECISIONES-TRANSVERSALES.md` + `handoff_bloques/README.md`. Prototype in
the Claude Design project `6b6d0664-fe8b-4d6c-9c13-996324a27b53`, `S3 Chat y momento 2 - Bloques.dc.html`.

**Answers to the designer's questions (2026-10-04):**
- P2 · `estilo` already picks the accent (D-27, `src/domain/color/acentoPorEstilo.ts`); the designer
  misread it. Question 6 stays as is.
- P5 · the price includes a standard domain (D-41): the bullet "Tu dominio propio y el sitio publicado" stays.
- P6 · `{precio}` comes from `src/app/_landing/precios.ts` (`estadoPromo`).
- P4 · default: momento 2 closes when Devalpo confirms the payment. The chat session cookie lasts one year
  (`ChatWidget.tsx`), so "sesión vencida" only appears without the cookie.
- P3 · default: `destacados` only from `/admin`.
- P1 · resolved 2026-10-05: WebBot pays with a fixed `mpago.la` link (`NEXT_PUBLIC_MERCADOPAGO_LINK_URL`,
  `src/app/chat/DemoCTA.tsx`), not the Orders API, so `success_url` does not apply. The link accepts a return
  URL in the Mercado Pago panel: Agustín set `https://webbot.devalpo.cl/gracias`. That host was created the
  same day (Railway custom domain on port 8080 + Cloudflare CNAME) and Railway's `NEXT_PUBLIC_APP_DOMAIN` /
  `NEXT_PUBLIC_APP_URL` moved from `panel.sitios.devalpo.cl` / the `up.railway.app` URL to it. `/gracias`
  returns 404 until T6 is released to `main`.
- C5 · `/admin` fields for razón social and RUT: optional, T7, not prioritized yet.

**Risk:** this is the sales funnel. Every change reaches production only on an explicit release.

**Scope:** tasks below. **Out of scope:** client self-upload, in-place editing, live preview while typing,
RESTAURANTE/PORTFOLIO/TIENDA tasks, chat with real Claude, payment webhooks.

**TDD:** off. **Checks per task:** `npx tsc --noEmit`, `npx eslint src tests`, `npm run test:unit`,
`npm run build`, Chrome at 390px and 1280px on a local demo run (local Postgres).
**Delivery:** one PR per task straight to `develop`, merged after checks + Chrome (same strategy as Bloques).

## Tasks

- [x] **T1 — 6-question script.** `DemoChatService`: new questions and closing (no emoji), rubro confirmation
  2a/2b with `RUBRO_FRASE`, `SUGERENCIAS_SERVICIOS` (UI only), remove `contacto`, `redes`, `highlight` from
  the chat. Keep the D-29 parser contract (style labels) and add the 2a labels to it. Route: delegated.
- [x] **T2 — Chat in Bloques.** Restyle `/chat` (C1–C3): active question 24/32px, history at 14px, 6-segment
  progress, option buttons and suggestions, reply bar, 429 card, network-error retry, a11y of (j). Remove
  Inter. Route: delegated.
- [ ] **T3 — Data step with phone (R1).** `LeadForm` with fixed "+56 9" prefix, 8 digits, per-field
  validation and messages; `/api/chat/lead` + use case accept `telefono` and write `contacto` defensively.
- [ ] **T4 — Progress model + reveal (R2, R3, E1).** `calcularAvance` and `TAREAS_POR_PLANTILLA` (pure,
  application layer, tested with the designer's weights); reveal with preview, progress card and payment
  box (D-39 notice verbatim before the button); desktop scaled iframe.
- [ ] **T5 — Momento 2 (`/chat/completar`, M1–M5, E2).** One task per screen, save action with length
  limits and defensive merge, `revalidatePath` + iframe reload, "Así quedó", summary with antesala, skip
  (`momento2Omitidas`), closed and expired states. May split in two PRs.
- [ ] **T6 — `/gracias` (G1).** Static page. Blocked on P1.
- [ ] **T7 — Admin fields for razón social and RUT (C5).** Optional; only if Agustín prioritizes it.

## Progress

- 2026-10-04: designer chapter saved; owner questions answered from code where possible; plan created.
- 2026-10-05: Agustín authorized T1–T7. T6 unblocked (P1 above); T7 is now in scope.
- 2026-10-05 · T1 done (delegated writer, sonnet; trigger: 4+ files). Commit `a84848a`. Copy in
  `src/infrastructure/demo/guionChat.ts`; `sugerenciasServicios(historial)` in `DemoChatService.ts`.
  Checks: tsc clean · eslint 0 errors (22 pre-existing warnings) · 1189/1189 unit tests · build OK ·
  Chrome 390px: full flow with 2a → "No, es otra cosa" → 2b → 6 answers → lead → SERVICIOS preview renders
  without contacto/redes/highlight. Desktop width left to T2 (no layout change in T1). RDD off (clone-local).
  Gaps carried to T2: `/api/chat` must return `sugerencias` for chips; the servicios question carries its
  help line after `\n\n`. Not aligned: real-mode `ClaudeChatService` prompt still has the old 8 questions
  (inert without `ANTHROPIC_API_KEY`).

- 2026-10-05 · T1 merged: PR #65 → `1da99cf`.
- 2026-10-05 · T2 done (delegated writer, sonnet; trigger: 2+ non-trivial files). Commits `3ceb135` (restyle,
  `preguntaActiva.ts`, `/api/chat` returns `sugerencias`, 429 card, retry, a11y) + parent fixes: chips without
  " y " (parseServicios splits on "y") with a test, trailing comma dropped on send, mobile scroll aligns the
  active question's start (2b list hid its prompt). Checks: tsc clean · eslint 0 errors · 1213/1213 · build OK ·
  Chrome 1280px and 390px full flow to the reveal. 429 card covered by render test only (local limit not hit).
  Diff ~+1150/-210, over the 400 heuristic: full CSS rewrite + widget rewrite + tests; one cohesive screen.
  Temporary: LeadForm and DemoCTA wrapped in a navy `.legado` panel until T3/T4. Devalpo WhatsApp in
  `src/app/chat/contactoDevalpo.ts` = the public number in the landing footer (+56 9 7642 4587).
  Follow-up (pre-existing, not in T1–T7): reloading `/chat` mid-flow shows Q1 while the server session keeps
  its step, so the next answer is read against the wrong question. The widget never restores history.

## Next step

T3.
