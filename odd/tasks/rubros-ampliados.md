# Wider business categories in the demo chat

**Objective:** cover more kinds of businesses in the chat's category question, and let a
visitor who fits none describe it in their own words.

**Problem / why:** Agustín (2026-10-25) tried the demo as Devalpo, an IT company. The closest
of the 10 categories (`RUBRO_LABELS`, `src/infrastructure/demo/guionChat.ts:10`) was
"consultora", whose service suggestions are only legal/tax. IT, research and environmental
businesses have no category. "Ninguno de estos" falls to `otro` (LANDING, neutral visuals,
no suggestions) and the visitor's own description is lost.

## Decisions (Agustín, 2026-10-25)

Six new categories, each mapped to an existing template, with its own suggestions, accent
color and stock photos:

| Key (suggested) | Label | Template | Suggestions |
|---|---|---|---|
| `tecnologia` | Tecnología, software o soporte TI | LANDING | Desarrollo de software, Soporte TI, Desarrollo web, Ciberseguridad, Servicios cloud |
| `ingenieria` | Ingeniería, medioambiente o investigación | LANDING | Consultoría ambiental, Estudios de impacto, Proyectos de ingeniería, Investigación aplicada, Capacitaciones |
| `salud` | Salud o terapias (kinesiología, psicología, nutrición) | SERVICIOS | Consulta, Evaluación inicial, Sesiones de terapia, Atención a domicilio, Planes de tratamiento |
| `educacion` | Educación, clases o capacitación | SERVICIOS | Clases particulares, Cursos, Talleres, Preuniversitario, Capacitación para empresas |
| `construccion` | Construcción, remodelación u oficios | PORTFOLIO | Remodelaciones, Gasfitería, Electricidad, Pintura, Instalaciones |
| `creativo` | Fotografía, diseño o eventos | PORTFOLIO | Sesiones de fotos, Diseño gráfico, Producción de eventos, Video, Branding |

- "Ninguno de estos" becomes **"Otro (escríbelo con tus palabras)"**. The visitor's text is
  stored and shown in `/admin`. It keeps the `otro` behavior (LANDING, neutral colors, no
  suggestions).
- Stock photos must be verified to load.

## Scope

Demo chat script and parser (`guionChat.ts`, `DemoChatService.ts`), rubro data
(`rubroDefaults.ts`, `rubroTemplates.ts`, keyword detection), Claude's valid rubros if it
keeps a list, the stored config, `/admin` display, and unit tests. **Out of scope:** new
templates, demo seed sites, landing.

## Method and checks

**TDD:** off (project convention). **RDD:** off (clone-local).
**Checks per task:** `npx tsc --noEmit`, `npx eslint src tests`, `npm run test:unit`,
`npm run build`; Agustín checks the chat in the browser.
**Delivery:** branch `feat/rubros-ampliados` from `develop` (6d8f003), one PR. Merge only with
Agustín's OK.

## Tasks

- [x] **R1 — Six new categories.** Done in `3ab60e3`. Accents tecnologia `#5B46F8`,
  ingenieria `#2E9E5B`, salud `#14B8A6`, educacion `#2F80ED`, construccion `#B45F2B`,
  creativo `#C026D3`; 12 Unsplash photos verified `200 image/jpeg`. Ferretería lost
  `construcción`/`gasfiter`, gained `materiales de construcción`; `ti` matches whole word only.
  Also `rubroVisible.ts` names. Original scope: Labels, phrases, suggestions, accent colors, verified
  stock photos, template mapping, keyword detection (no collisions, e.g. "construcción" vs
  ferretería's "materiales de construcción"), Claude rubro list. Tests. Route: delegated
  writer (2+ non-trivial files).
- [x] **R2 — "Otro (escríbelo)".** Done in `3b9037c`. `rubroDescrito` (max 60, whitespace
  collapsed) stored only when free text falls to `otro`; shown in `/admin`; legacy "Ninguno de
  estos" still accepted. Checks R1+R2: tsc 0, eslint 0 errors, test:unit 107/1700, build OK;
  parent re-ran test:unit (pass). Note: unused `prompts/extractor.prompt.ts` has a stale rubro
  list. Original scope: Free text accepted at the category question, stored in
  the config, visible in `/admin`. Tests. Route: delegated writer, same worker as R1.
- [x] **R3 — Docs and check.** D-49 added, `ESTADO.md` "10 rubros" → 16. Agustín checked
  both chats in the browser on 2026-10-25 (TI detection and free-text Otro in `/admin`): OK.
  D-49 sits after D-47 on this branch; D-48 lives on `feat/momento2-servicios-distinto`, so
  merging both needs reordering at the end of `DECISIONES.md`. Original scope: D-49, `ESTADO.md` (it says "10 rubros"), browser check.
  Route: inline.

## Progress

- 2026-10-25: document created, branch cut. R1 `3ab60e3`, R2 `3b9037c`, R3 docs. Next: push
  and PR (Agustín's call).
