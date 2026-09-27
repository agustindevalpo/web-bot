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
> **Última regeneración:** 2026-09-27 · `main` = `7306c62` · `develop` = `4270079`
> (mismo árbol; `main` suma solo el commit de release)

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
  renovación anual con 30 días de gracia. Precios finales con IVA incluido (D-39). Incluye
  un dominio `.cl`/`.com` estándar hasta `TOPE_DOMINIO_ANUAL` ($15.000/año), siempre a
  nombre del cliente; uno premium paga la diferencia (D-41). Sin derecho a retracto,
  con garantía de publicación en 10 días (D-39).
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
| Imágenes de clientes | Cloudflare R2 (bucket `webbot-media`, público en `media.devalpo.cl`) vía `@aws-sdk/client-s3` |
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
├── application/      DTOs, mappers, 14 casos de uso (*.usecase.ts), puertos I*Service
├── infrastructure/   adaptadores: db (Prisma), auth, claude, demo, email, cloudflare,
│                     notifications, payments, railway, routing, storage, templates
├── app/              rutas del App Router (capa delgada: llama casos de uso)
├── components/       los 5 templates de sitio + shared/ + registry/resolver
└── proxy.ts          entrada multitenant (Next 16 renombró middleware.ts → proxy.ts)
```

- **Composition root:** `src/infrastructure/container.ts`, DI manual. Repositorios y
  casos de uso se instancian ahí de forma *eager*; `getChatServiceReal()`,
  `getCustomHostnameService()` y `getAlmacenamientoArchivos()` son perezosos y
  memoizados porque leen variables de entorno que pueden faltar.
- **Imágenes:** `SubirImagenSitioUseCase` acepta JPEG/PNG/WebP de hasta 5 MB
  (validados por sus primeros bytes), los sube a R2 y escribe la URL en `configJson`:
  `logo`, `imagenes[0]` (la foto principal de todas las plantillas) o al final de
  `imagenes` (galería). No existe un campo `imagenHero` (D-42).
- **Enrutado:** `src/proxy.ts` es un adaptador delgado sobre `resolverDestino()`
  (`src/infrastructure/routing/resolverDestino.ts`, pura y testeada). Clasifica el host
  en `app` / `subdominio` / `dominioPropio` y reescribe a `/sites/[subdominio]` o
  `/sites/custom/[host]`.
- **Templates:** `rubroTemplates.ts` mapea los 10 rubros a 5 `Template`; `resolver.ts`
  (puro) y `registry.ts` (JSX) están separados; fallback a `LANDING`, que es lo que recibe
  el rubro neutro `otro` cuando la deducción local no reconoce el negocio (D-28).
  `components/templates/shared/` reúne lo que las plantillas comparten al migrar al
  rediseño: `SeccionesSPA.tsx`/`scrollspy.ts`/`navScroll.ts` (shell de scroll largo con
  nav de anclas; en móvil, fila de secciones deslizable y pegada arriba, sin hamburguesa),
  `Monograma.tsx`/`iniciales.ts` (marca cuando no hay logo, D-37) y `servicios.ts`
  (normaliza `servicios: string | {nombre, descripcion?}`, D-35) — hoy **solo `LANDING`
  las consume**; las otras cuatro plantillas siguen sin migrar.
- **Paleta:** `configJson.colores` guarda **solo** `acento` (D-32) — `primario`,
  `secundario` y `texto` ya no se persisten, se derivan al renderizar con
  `derivarPaletaDesdeAcento()` (`src/domain/color/paletaDerivada.ts`) y
  `palette.ts` sigue emitiendo las cuatro variables CSS que las 5 plantillas vivas
  consumen.
- **Persistencia:** esquema en `src/infrastructure/db/prisma/schema.prisma`, 3
  migraciones en `prisma/migrations/`; ni D-32 ni el ciclo de LANDING-Bloques agregaron
  ninguna — ambos extienden tipos de TypeScript sobre el mismo `configJson: Json`.

## 4. Qué está en producción, qué no

**En producción (`main` = `7306c62`, desplegado el 2026-09-27):**
capacidad de generar un sitio real por chat demo con gate de lead (nombre + correo antes
de revelar el sitio) · 5 templates de sitio elegidos por rubro · dominios propios vía
Cloudflare · panel `/admin` para pausar, reactivar, asignar dominio, editar `configJson`
y confirmar pago · cobro por link de Mercado Pago con activación manual · metadata y
Open Graph propios por sitio (no la copia de la landing comercial) · paleta de cada sitio
derivada de un único acento en OKLCH, con `primario`/`secundario`/`texto` calculados en
cada render en vez de leídos de la base (D-32) · acento derivado del estilo que el
cliente elige en el chat (D-27) · deducción de rubro sobre descripción y servicios, con
fallback neutro y pregunta guiada si no alcanza (D-28) · opciones del chat clicables
(D-29) · login que precarga el correo de quien ya dejó el lead (D-30) · **S1 del
rediseño**: `LANDING` como página de scroll largo con nav de anclas (D-33), monograma de
marca (D-37), descripción por servicio (D-35), formulario de contacto que nunca descarta
un envío en silencio, y navegación móvil con header pegado y footer centrado (PR #41) ·
**páginas legales** `/terminos` y `/privacidad`, e identificación del proveedor (razón
social, RUT, domicilio) en el footer de la landing (PR #42) · **subida de logo, foto
principal y galería desde `/admin` a Cloudflare R2** (PR #44, D-42; probado en vivo en
`test.sitios.devalpo.cl`) · logo del header de `LANDING` con alto fijo y ancho según su
proporción (PR #45; los logos verticales quedan angostos).
Las otras 4 plantillas siguen con el diseño anterior y no muestran el logo.

`develop` y `main` tienen el mismo árbol: no hay nada mergeado esperando deploy.

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
- Bloque legal dentro de los sitios de clientes (términos, razón social, RUT): no existe;
  la landing ya no lo promete (D-40). Va con la tanda de Bloques.
- Captura de contenido adicional para el rediseño: el logo y las fotos ya se cargan a
  mano desde `/admin` (D-42), pero el cliente no puede subirlos él mismo y el chat
  todavía no pide la descripción por servicio (D-36).

## 5. Bloqueado, y en qué exactamente

| Qué | Bloqueado en |
|---|---|
| Vender a tráfico frío con tranquilidad | Que un abogado revise `/terminos` y `/privacidad`: son un borrador fundado en las leyes 19.496 y 19.628, sin revisión profesional. |
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
npm run test:unit          # Jest — 69 suites / 925 tests en verde
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
  medido en el navegador. Con la ventana maximizada, `resize_window` no cambia el
  viewport: el móvil se mide dentro de un `<iframe>` de 390px del mismo origen.
- `overflow-x: hidden` en `html` y `body` a la vez convierte al `body` en contenedor de
  scroll y **mata todo `position: sticky`** (se pega a una caja que no se mueve). Por eso
  `globals.css` usa `overflow-x: clip`. Ningún test unitario lo ve.
- `docs/historico/` es archivo muerto por diseño: describe el proyecto de agosto de 2026
  (suscripciones, N8N, Python, equipo de tres). Nunca citarlo como fuente de un hecho
  actual.
- `R2_PUBLIC_URL` se lee en `next.config.ts` al compilar y arrancar: si cambia, hay que
  volver a desplegar o `next/image` rechaza las fotos subidas. Si no es una URL
  `http(s)` absoluta, el panel queda en "almacenamiento no configurado". `R2_ACCOUNT_ID`
  son 32 caracteres hexadecimales; cualquier otra cosa hace fallar toda subida.
- El panel `/admin` lee `ADMIN_SECRET`, no `ADMIN_PASSWORD`. Ese nombre viejo estuvo en
  `.env.example` hasta el 2026-09-12 sin que ningún módulo lo leyera, y es el tipo de
  variable fantasma que hace perder una tarde: se carga, no pasa nada, y no hay error.
- Las credenciales del motor de pagos (`FLOW_*`, `MP_ACCESS_TOKEN`, `PAYPAL_*`) ya no
  figuran en `.env.example`: vuelven cuando ese microservicio esté desplegado.
- Filas de `Sitio` escritas antes del 2026-09-20 conservan `primario`, `secundario` y
  `texto` en su `configJson.colores` (D-32): son campos huérfanos, nadie los borra ni
  los reescribe, y ningún código los lee — no confundirlos con el dato vigente.
