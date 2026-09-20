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
> **Última regeneración:** 2026-09-20 · `main` = `ed2788e` · `develop` = `f669651`

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
| Tests | Jest 30 + ts-jest (unit) y Cucumber 13 + **Playwright** (e2e) |
| Deploy | Railway, plan Hobby, un solo servicio multitenant, auto-deploy desde `main` |

No hay N8N, ni Python, ni Selenium: cero referencias en `src/`.

## 3. Arquitectura

Hexagonal por capas, con nombres de dominio en español (`Cliente`, `Sitio`, `Pago`,
`Sesion`, `TokenAcceso`).

```
src/
├── domain/           entidades, value objects, excepciones, puertos I*Repository,
│                     color/ (OKLCH: contraste, derivación del acento por estilo,
│                     y derivación de primario/secundario/texto desde el acento)
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
  (puro) y `registry.ts` (JSX) están separados; fallback a `LANDING`, que es lo que recibe
  el rubro neutro `otro` cuando la deducción local no reconoce el negocio (D-28).
- **Paleta:** `configJson.colores` guarda **solo** `acento` (D-32) — `primario`,
  `secundario` y `texto` ya no se persisten, se derivan al renderizar con
  `derivarPaletaDesdeAcento()` (`src/domain/color/paletaDerivada.ts`) y
  `palette.ts` sigue emitiendo las cuatro variables CSS que las 5 plantillas vivas
  consumen.
- **Persistencia:** esquema en `src/infrastructure/db/prisma/schema.prisma`, 3
  migraciones en `prisma/migrations/`; D-32 no agregó ninguna.

## 4. Qué está en producción, qué no

**En producción (`main` = `ed2788e`, desplegado y verificado en vivo el 2026-09-20):**
landing con precio único y promo · chat demo que genera un `Sitio` real · gate de lead
(nombre + correo antes de revelar el sitio) · los 5 templates · dominios propios vía
Cloudflare · panel `/admin` (pausar, reactivar, asignar dominio, editar `configJson`,
confirmar pago y activar) · link de pago de Mercado Pago · metadata y Open Graph
propios por sitio · **fundaciones del rediseño de plantillas** (tokens estructurales,
motion.css, clamp de contraste en OKLCH, SeccionesSPA — S0a y S0b de D-23, sin plantilla
visible todavía) · **acento derivado del estilo que el cliente elige** (D-27) ·
**deducción de rubro sobre descripción y servicios, con fallback neutro y pregunta guiada**
(D-28) · **opciones del chat clicables** (D-29) · **login que precarga el correo de la
demo** (D-30) · **paleta de cada sitio derivada de un único acento** — `primario`,
`secundario` y `texto` dejaron de persistirse y se calculan del acento en cada render
(D-32); efecto visible: los sitios ya publicados cambiaron de `--primario`/`--secundario`,
verificado en vivo (`demo-veterinaria` y `demo-tienda` sirven la paleta derivada).

**En `develop`, sin adelanto sobre producción:** `develop` = `f669651` es el mismo
contenido que `main`; `ed2788e` solo agrega el commit de release. S1 (LANDING) del
rediseño de plantillas queda **desbloqueado** por D-32, pero no arrancado.

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

**Sandbox de pagos** (D-22): `npm run dev:sandbox` arma lo de arriba solo, contra su
propio contenedor (puerto 5435) y con el link de pruebas de Mercado Pago ya puesto.

**Tests:**

```bash
npm run test:unit          # Jest — 61 suites / 812 tests en verde
npm run test:coverage       # umbrales: 70 branches / 80 functions / 80 lines / 80 statements
npm run test:e2e            # Cucumber + Playwright; necesita `npm run dev` y una BD con datos
npm run test:all            # jest + cucumber
npx tsc --noEmit             # no hay script de typecheck; se corre directo
npm run lint
```

No existe un script `test` a secas.

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
  actual.
- El panel `/admin` lee `ADMIN_SECRET`, no `ADMIN_PASSWORD`. Ese nombre viejo estuvo en
  `.env.example` hasta el 2026-09-12 sin que ningún módulo lo leyera, y es el tipo de
  variable fantasma que hace perder una tarde: se carga, no pasa nada, y no hay error.
- Las credenciales del motor de pagos (`FLOW_*`, `MP_ACCESS_TOKEN`, `PAYPAL_*`) ya no
  figuran en `.env.example`: vuelven cuando ese microservicio esté desplegado.
- Filas de `Sitio` escritas antes del 2026-09-20 conservan `primario`, `secundario` y
  `texto` en su `configJson.colores` (D-32): son campos huérfanos, nadie los borra ni
  los reescribe, y ningún código los lee — no confundirlos con el dato vigente.
