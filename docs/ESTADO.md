# WebBot — Estado actual

> **Qué es este archivo.** La foto de hoy: qué es WebBot, cómo está construido y qué
> funciona. Se **reemplaza completo** en cada regeneración, nunca se le agrega historia.
> La historia va en [`BITACORA.md`](./BITACORA.md); el porqué de cada decisión, en
> [`DECISIONES.md`](./DECISIONES.md).
>
> La fuente de verdad son los artefactos SDD en Engram (proyecto `web-bot`). Este
> archivo es un reflejo de ellos: si se pierde, se regenera. Si contradice a Engram,
> gana Engram.
>
> **Última regeneración:** 2026-09-12 · `main` = `7f88280` · `develop` = `e8eb3cf`

---

## 1. Qué es el producto

Herramienta interna de producción de Devalpo, no un SaaS que se vende por sí solo.
Devalpo ya vendía sitios WordPress a mano; WebBot es la fábrica que hace rentable la
promesa **"tu sitio web en un día, en producción, con tu propio dominio"**.

- **A quién sirve:** PyMEs chilenas captadas por marketing y referidos.
- **Cómo se vende:** **pago único**, no suscripción. Link de Mercado Pago
  (`NEXT_PUBLIC_MERCADOPAGO_LINK_URL`), sin webhook: Agustín confirma el pago a mano
  desde `/admin` y eso activa al cliente.
- **Precios vigentes** (`src/app/_landing/precios.ts`): $149.990 sitio, $119.990 promo
  para los primeros 10 cupos, $249.990 multipágina, $39.990 renovación anual.
- **Embudo:** aviso → landing → chat demo → el visitante deja nombre y correo → se le
  revela su sitio demo → paga → Devalpo le asigna el dominio.
- **Equipo:** Agustín Romero, solo.

## 2. Stack real

| Capa | Qué hay |
|---|---|
| Framework | Next.js **16.3.0** (App Router), React 19.2.8, TypeScript 5 |
| Datos | PostgreSQL + Prisma **7.9.1** con driver adapter `@prisma/adapter-pg` |
| IA | `@anthropic-ai/sdk` 0.120 — modelo por `ANTHROPIC_MODEL` (default `claude-sonnet-4-6`) |
| Auth | Magic link con `jose` (JWT), cookie `webbot_auth`; panel admin con cookie `webbot_admin` |
| Correo | Resend (HTTP) en producción, Gmail SMTP en local, consola sin credenciales |
| Dominios propios | Cloudflare for SaaS + Worker (`infra/cloudflare/worker`) delante de Railway |
| Tests | Jest 30 + ts-jest (unit/integration) y Cucumber 13 + **Playwright** (e2e) |
| Deploy | Railway, plan Hobby, un solo servicio multitenant, auto-deploy desde `main` |

No hay N8N, ni Python, ni Selenium: cero referencias en `src/`.

## 3. Arquitectura

Hexagonal por capas, con nombres de dominio en español (`Cliente`, `Sitio`, `Pago`,
`Sesion`, `TokenAcceso`).

```
src/
├── domain/           entidades, value objects, excepciones, puertos I*Repository
├── application/      DTOs, mappers, 13 casos de uso (*.usecase.ts), puertos I*Service
├── infrastructure/   adaptadores: db (Prisma), auth, claude, demo, email, cloudflare,
│                     notifications, payments, railway, routing, templates
├── app/              rutas del App Router (capa delgada: llama casos de uso)
├── components/       los 5 templates de sitio + registry/resolver
└── proxy.ts          entrada multitenant (Next 16 renombró middleware.ts → proxy.ts)
```

- **Composition root:** `src/infrastructure/container.ts`, DI manual. Repositorios y
  casos de uso se instancian ahí de forma *eager*; `getChatServiceReal()` y
  `getCustomHostnameService()` son perezosos y memoizados porque leen variables de
  entorno que pueden faltar.
- **Enrutado:** `src/proxy.ts` es un adaptador delgado sobre `resolverDestino()`
  (`src/infrastructure/routing/resolverDestino.ts`, pura y testeada). Clasifica el host
  en `app` / `subdominio` / `dominioPropio` y reescribe a `/sites/[subdominio]` o
  `/sites/custom/[host]`.
- **Templates:** `rubroTemplates.ts` mapea los 10 rubros a 5 `Template`; `resolver.ts`
  (puro) y `registry.ts` (JSX) están separados; fallback a `LANDING`.
- **Persistencia:** esquema en `src/infrastructure/db/prisma/schema.prisma`, 3
  migraciones en `prisma/migrations/`.

## 4. Qué está en producción, qué no

**En producción (`main` = `7f88280`, desplegado y verificado en vivo el 2026-09-12):**
landing con precio único y promo · chat demo que genera un `Sitio` real · gate de lead
(nombre + correo antes de revelar el sitio) · los 5 templates · dominios propios vía
Cloudflare · panel `/admin` (pausar, reactivar, asignar dominio, editar `configJson`,
confirmar pago y activar) · link de pago de Mercado Pago · **metadata y Open Graph
propios por sitio**.

**En `develop`, sin adelanto sobre producción:** `develop` = `e8eb3cf` es el mismo
contenido que `main`; `7f88280` solo agrega el commit de release.

**No construido / inerte:**

- Chat real con Claude: el código está completo desde 2026-08-25, pero sin
  `ANTHROPIC_API_KEY` en Railway `getChatServiceReal()` devuelve `null` y `/api/chat`
  responde 503. Todo el tráfico hoy va por `DemoChatService` (guionado).
- Magic link: funciona en código, requiere `RESEND_API_KEY` y un dominio verificado en
  Resend. Sin eso cae a `DevEmailService`.
- `PaymentEngineService`, `RailwayDeployService` y `WhatsAppNotificacionService` son
  stubs que **tiran** al llamarlos. El motor de pagos es un microservicio aparte que no
  está desplegado (la organización tiene restricciones de OAuth App que impiden clonarlo).
- `pausarSitioUC`, `reactivarSitioUC` y `verificarDominioUC` están compuestos en el
  container pero ninguna ruta los consume (verificado por grep).
- Páginas legales (términos, privacidad, bloque legal): no existen.

## 5. Bloqueado, y en qué exactamente

| Qué | Bloqueado en |
|---|---|
| Vender a tráfico frío | Páginas legales inexistentes (Ley 19.496 / expectativas de Mercado Pago). Último bloqueador de venta. |
| Chat real con Claude | Que Agustín cargue `ANTHROPIC_API_KEY` en Railway. |
| Magic link en producción | Cuenta de Resend con dominio verificado. |
| Activación automática por pago | Deploy del motor de pagos de Devalpo. |
| T9 de `site-metadata` | Pegar un link de sitio real en WhatsApp y pasarlo por el Sharing Debugger de Facebook — solo se puede probar en vivo. |
| Limpiar el sitio de prueba `demo-cea59ef1` | Es un `UPDATE` contra la Postgres de producción; falta que Agustín decida corregir o borrar. |

## 6. Cómo correrlo

**Local, sin depender de Railway** (receta verificada el 2026-09-08):

```bash
docker run -d --name webbot-pg -e POSTGRES_PASSWORD=webbot -e POSTGRES_USER=webbot \
  -e POSTGRES_DB=webbot -p 5433:5432 postgres:16-alpine

export DATABASE_URL="postgresql://webbot:webbot@localhost:5433/webbot"
npx prisma migrate deploy   # aplica las 3 migraciones
npm run db:seed-demo         # OBLIGATORIO, ver trampas
npm run dev                   # http://localhost:3000
```

La variable inline gana sobre el `.env` del repo (Next.js no pisa una variable ya
definida en el entorno).

**Tests:**

```bash
npm run test:unit          # Jest — 52 suites / 504 tests en verde
npm run test:integration    # Jest — sin tests propios hoy, solo mocks en tests/integration/mocks
npm run test:coverage       # umbrales: 70 branches / 80 functions / 80 lines / 80 statements
npm run test:e2e            # Cucumber + Playwright; necesita `npm run dev` y una BD con datos
npm run test:all            # jest + cucumber
npx tsc --noEmit             # no hay script de typecheck; se corre directo
npm run lint
```

No existe un script `test` a secas. `supertest` está instalado como dependencia de
desarrollo pero no lo usa ningún test.

## 7. Trampas que costaron tiempo real

- El deploy de Railway **no corre migraciones**: toda release con migración nueva se
  aplica a mano con `npx prisma migrate deploy`.
- Nunca usar `prisma migrate dev` (exige shadow database y no hay staging); usar
  `prisma migrate diff --script` para previsualizar y `migrate deploy` para aplicar.
- Prisma 7 exige driver adapter: un `new PrismaClient()` pelado revienta.
- `npm run db:seed-demo` es precondición de arranque: sin el `Cliente` demo compartido,
  `POST /api/chat/lead` cae con `P2003` en `Sitio_clienteId_fkey` y devuelve un 500 opaco.
- `https://devalpo.cl` **no es WebBot**, es el WordPress de Bluehost: responde 200 en `/`
  y 404 en `/chat`, y se lee como app rota. El origen real es
  `web-bot-production-d190.up.railway.app` o cualquier `*.sitios.devalpo.cl`.
- El SMTP de Gmail está bloqueado en el egress de Railway (puertos 465 y 587); por eso
  producción usa Resend por HTTP.
- El túnel SSH de Railway (`railway connect Postgres --tunnel-only`) no funciona en
  Windows en esta máquina; se usa Public Access de Postgres.
- La acción `computer type` de claude-in-chrome mutila texto con acentos (borra todo lo
  anterior al primer carácter no ASCII); usar `form_input`. Ya dejó datos corruptos en
  `configJson` del sitio `demo-cea59ef1` en producción.
- `docs/historico/` es archivo muerto por diseño: describe el proyecto de agosto de 2026
  (suscripciones, N8N, Python, equipo de tres). Nunca citarlo como fuente de un hecho
  actual. `README.md` y `docs/COMANDOS.md` estaban igual de desactualizados y se
  corrigieron el 2026-09-12 — `COMANDOS.md` llegó a recomendar `prisma migrate dev`, que
  D-17 prohíbe en este proyecto.
- `.env.example` está incompleto: le faltan `ADMIN_SECRET`, `CLOUDFLARE_API_TOKEN`,
  `CLOUDFLARE_ZONE_ID` y `WORKER_SHARED_SECRET`, y conserva variables muertas
  (`N8N_WEBHOOK_URL`, `ADMIN_PASSWORD`, `FLOW_*`, `PAYPAL_*`, `UNSPLASH_ACCESS_KEY`,
  `RAILWAY_*`) que ningún módulo de `src/` lee.
