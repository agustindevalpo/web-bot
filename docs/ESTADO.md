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
> **Última regeneración:** 2026-09-20 · `main` = `23ed10b` · `develop` = `5f0aef8`

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
  para los primeros 10 cupos (0 vendidos hasta hoy), $249.990 multipágina, $39.990
  renovación anual.
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
├── components/       los 5 templates de sitio + shared/ + registry/resolver
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
  `components/templates/shared/` reúne lo que las plantillas comparten al migrar al
  rediseño: `SeccionesSPA.tsx`/`scrollspy.ts` (shell de scroll largo con nav de anclas),
  `Monograma.tsx`/`iniciales.ts` (marca cuando no hay logo, D-37) y `servicios.ts`
  (normaliza `servicios: string | {nombre, descripcion?}`, D-35) — hoy **solo `LANDING`
  las consume, y solo en `develop`**; las otras cuatro plantillas siguen sin migrar.
- **Paleta:** `configJson.colores` guarda **solo** `acento` (D-32) — `primario`,
  `secundario` y `texto` ya no se persisten, se derivan al renderizar con
  `derivarPaletaDesdeAcento()` (`src/domain/color/paletaDerivada.ts`) y
  `palette.ts` sigue emitiendo las cuatro variables CSS que las 5 plantillas vivas
  consumen.
- **Persistencia:** esquema en `src/infrastructure/db/prisma/schema.prisma`, 3
  migraciones en `prisma/migrations/`; ni D-32 ni el ciclo de LANDING-Bloques agregaron
  ninguna — ambos extienden tipos de TypeScript sobre el mismo `configJson: Json`.

## 4. Qué está en producción, qué no

**En producción (`main` = `23ed10b`, desplegado y verificado en vivo el 2026-09-20):**
capacidad de generar un sitio real por chat demo con gate de lead (nombre + correo antes
de revelar el sitio) · 5 templates de sitio elegidos por rubro · dominios propios vía
Cloudflare · panel `/admin` para pausar, reactivar, asignar dominio, editar `configJson`
y confirmar pago · cobro por link de Mercado Pago con activación manual · metadata y
Open Graph propios por sitio (no la copia de la landing comercial) · paleta de cada sitio
derivada de un único acento en OKLCH, con `primario`/`secundario`/`texto` calculados en
cada render en vez de leídos de la base (D-32) · acento derivado del estilo que el
cliente elige en el chat (D-27) · deducción de rubro sobre descripción y servicios, con
fallback neutro y pregunta guiada si no alcanza (D-28) · opciones del chat clicables
(D-29) · login que precarga el correo de quien ya dejó el lead (D-30).

**En `develop`, sin adelanto sobre producción — S1 del rediseño de plantillas
(PRs #37, #38, #39):** `LANDING` reescrita sobre la dirección de diseño "Bloques": scroll
largo con nav de anclas en vez de pestañas (D-33), sistema de monograma de marca (D-37),
descripción por servicio (D-35), formulario de contacto que nunca descarta un envío en
silencio. Nada de esto es visible todavía en ningún sitio real: **`main` sigue sirviendo
la `LANDING` anterior**, sin marca ni scroll largo. Las otras 4 plantillas siguen intactas
en ambas ramas — nadie las tocó.

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
- Captura de contenido adicional para el rediseño (logo, fotos reales, descripción por
  servicio): decidido el momento —texto antes de pagar, material gráfico después (D-36)—
  pero el chat todavía no pide ninguno de los dos.

## 5. Bloqueado, y en qué exactamente

| Qué | Bloqueado en |
|---|---|
| Vender a tráfico frío | Páginas legales inexistentes (Ley 19.496 / expectativas de Mercado Pago). Último bloqueador de venta. |
| Chat real con Claude | Que Agustín cargue `ANTHROPIC_API_KEY` en Railway. |
| Magic link en producción | Cuenta de Resend con dominio verificado. |
| Activación automática por pago | Deploy del motor de pagos de Devalpo. |
| T9 de `site-metadata` | Pegar un link de sitio real en WhatsApp y pasarlo por el Sharing Debugger de Facebook — solo se puede probar en vivo. |
| Limpiar el sitio de prueba `demo-cea59ef1` | Es un `UPDATE` contra la Postgres de producción; falta que Agustín decida corregir o borrar. |
| S2-S6 del rediseño de plantillas | Que S1 (`LANDING`, ya mergeada en `develop`) llegue a `main` primero. |

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
npm run test:unit          # Jest — 63 suites / 876 tests en verde
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
- Una pestaña de Chrome en segundo plano estrangula `IntersectionObserver` y el repintado:
  produce diagnósticos falsos ("el scrollspy no funciona", "la página no scrollea").
  Comprobar `document.visibilityState`/`document.hasFocus()` antes de diagnosticar nada
  medido en el navegador.
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
