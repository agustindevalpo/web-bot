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
- P1 · Mercado Pago return URL: pending, asked to Agustín. Blocks only T6.
- C5 · `/admin` fields for razón social and RUT: optional, T7, not prioritized yet.

**Risk:** this is the sales funnel. Every change reaches production only on an explicit release.

**Scope:** tasks below. **Out of scope:** client self-upload, in-place editing, live preview while typing,
RESTAURANTE/PORTFOLIO/TIENDA tasks, chat with real Claude, payment webhooks.

**TDD:** off. **Checks per task:** `npx tsc --noEmit`, `npx eslint src tests`, `npm run test:unit`,
`npm run build`, Chrome at 390px and 1280px on a local demo run (local Postgres).
**Delivery:** one PR per task straight to `develop`, merged after checks + Chrome (same strategy as Bloques).

## Tasks

- [ ] **T1 — 6-question script.** `DemoChatService`: new questions and closing (no emoji), rubro confirmation
  2a/2b with `RUBRO_FRASE`, `SUGERENCIAS_SERVICIOS` (UI only), remove `contacto`, `redes`, `highlight` from
  the chat. Keep the D-29 parser contract (style labels) and add the 2a labels to it. Route: delegated.
- [ ] **T2 — Chat in Bloques.** Restyle `/chat` (C1–C3): active question 24/32px, history at 14px, 6-segment
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

## Next step

T1, once Agustín confirms the plan.
