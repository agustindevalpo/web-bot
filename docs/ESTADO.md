# WebBot — Estado actual

> **Qué es este archivo.** La foto de hoy: qué es WebBot, cómo está construido y qué
> funciona. Se **reemplaza completo** en cada regeneración, sin historia. La historia va en
> [`BITACORA.md`](./BITACORA.md); el porqué de cada decisión, en [`DECISIONES.md`](./DECISIONES.md).
> La fuente de verdad son los artefactos SDD en Engram (proyecto `web-bot`); si se
> contradicen, gana Engram.
>
> **Última regeneración:** 2026-10-18 · `main` = `develop` = release `f34b003`

## 1. Qué es el producto

Herramienta interna de producción de Devalpo: la fábrica detrás de **"tu sitio web en un día,
en producción, con tu propio dominio"** para PyMEs chilenas. Equipo: Agustín Romero, solo.

- **Venta:** pago único por link de Mercado Pago (`NEXT_PUBLIC_MERCADOPAGO_LINK_URL`), sin
  webhook: Agustín confirma el pago en `/admin` y eso activa al cliente.
- **Precios** (`src/app/_landing/precios.ts`, con IVA, D-39): $149.990 sitio, $119.990 promo
  (10 cupos, 0 vendidos), $249.990 multipágina, $39.990 renovación anual. Incluye un dominio
  hasta `TOPE_DOMINIO_ANUAL` ($15.000/año), a nombre del cliente (D-41).
- **Embudo:** landing → chat demo de 6 preguntas → nombre, correo, WhatsApp (y dirección
  opcional) → sitio demo con 35 % de avance → opcional `/chat/completar` (hasta 80 %) → pago
  → `/gracias` → Devalpo confirma, carga logo y fotos y asigna el dominio.

## 2. Stack

Next.js **16.3.0** (App Router), React 19.2.8, TypeScript 5 · PostgreSQL + Prisma **7.9.1** con
`@prisma/adapter-pg` · `@anthropic-ai/sdk` 0.120 (`ANTHROPIC_MODEL`, default `claude-sonnet-4-6`)
· auth por magic link (`jose`, cookie `webbot_auth`); admin con cookie `webbot_admin` y
`ADMIN_SECRET` · Resend (producción), Gmail SMTP (local) · dominios propios: Cloudflare for SaaS
+ Worker (`infra/cloudflare/worker`) · imágenes y PDF de clientes en Cloudflare R2 (bucket
`webbot-media`, `media.devalpo.cl`) · Jest 30 + Cucumber 13/Playwright · Railway (Hobby, un
servicio multitenant, auto-deploy desde `main`). No hay N8N, Python ni Selenium.

## 3. Arquitectura

Hexagonal con nombres de dominio en español. `src/`: `domain/` (entidades, puertos, `color/`
OKLCH) · `application/` (DTOs, 18 casos de uso `*.usecase.ts`) · `infrastructure/` (Prisma,
auth, claude, demo, email, cloudflare, storage, routing…) · `app/` (rutas, capa delgada) ·
`components/` (5 templates + `shared/`) · `proxy.ts` (entrada multitenant).

- **Composition root:** `src/infrastructure/container.ts`, DI manual (los servicios que leen
  env son perezosos). **Enrutado:** `proxy.ts` + `resolverDestino()` clasifican el host
  (`app` / `subdominio` / `dominioPropio`) y reescriben a `/sites/[subdominio]` o `/sites/custom/[host]`.
- **Templates:** `rubroTemplates.ts` mapea 16 rubros a 5 `Template`; fallback a `LANDING`
  (rubro `otro`; si el cliente lo escribe, queda en `configJson.rubroDescrito`, D-49)
  (D-28). El rediseño **Bloques** (D-38) vive en `components/templates/shared/` (`SeccionesSPA`,
  `HeroBloques`, `BandaDatos`, `BloqueNosotros`, `SeccionContacto`, `FooterBloques`…; spec en
  `docs/design_handoff_plantillas_webbot/handoff_bloques_v2/`). En Bloques: **`LANDING`,
  `SERVICIOS` y `RESTAURANTE`** (restaurante y panadería). `PORTFOLIO` y `TIENDA` siguen con el
  diseño anterior y no muestran el logo.
- **RESTAURANTE:** carta armada con datos (`normalizarCarta`, máx. 8 platos, D-46), hero con
  foto solo si `imagenes[0]` es propia (D-44), panadería con formulario de encargo (D-45) y
  `FormReserva` que arma el mensaje de WhatsApp. `cartaPdf` opcional (PDF ≤ 10 MB subido desde
  `/admin`) se enlaza como complemento, nunca reemplaza la carta.
- **Imágenes:** `SubirImagenSitioUseCase` (JPEG/PNG/WebP ≤ 5 MB) sube a R2 y escribe en
  `configJson`: `logo`, `imagenes[0]` (foto principal) o la galería (D-42). Las reemplazadas
  se borran de R2 (solo las propias).
- **Paleta y datos:** `configJson.colores` guarda solo `acento` (D-32; el resto se deriva en
  `src/domain/color/paletaDerivada.ts`). Los campos nuevos (`contacto.direccion`, `menu`,
  `cartaPdf`, `horarios`, `legal`…) son opcionales dentro de `configJson: Json`; 3 migraciones.

## 4. Producción y develop

**En producción** (`main`, release 2026-10-18): landing v2 en `/` (handoff
`docs/design_handoff_landing_v2/`, hero con los tres sitios demo reales, D-47; código en
`src/app/_landing/`), chat demo de 6 preguntas, paso de
datos, recuperación del chat sin terminar al recargar `/chat`, reveal con avance, momento 2 en `/chat/completar`, `/gracias`, 5 templates por rubro,
**Bloques en `LANDING`, `SERVICIOS` y `RESTAURANTE`**, dirección opcional (`contacto.direccion`, máx. 60) en el paso de datos, carta PDF opcional desde `/admin`, dominios propios, panel `/admin` (pausar, dominio,
editar `configJson`, confirmar pago, razón social/RUT, subir logo y fotos a R2), metadata y
Open Graph por sitio, páginas legales `/terminos` y `/privacidad`.

**Solo en `develop`:** nada; `develop` y `main` tienen el mismo código.

**Inerte o sin construir:**
- Chat real con Claude: sin `ANTHROPIC_API_KEY` en Railway `/api/chat` responde 503; todo
  va por `DemoChatService` (guionado). Su guion sigue siendo el de 8 preguntas, no el de 6.
- Magic link: requiere `RESEND_API_KEY` y dominio verificado; si no, cae a `DevEmailService`.
- `PaymentEngineService`, `RailwayDeployService`, `WhatsAppNotificacionService` son stubs que
  tiran; el motor de pagos es un microservicio aparte, no desplegado.
- `pausarSitioUC`, `reactivarSitioUC`, `verificarDominioUC` no los consume ninguna ruta.
- El cliente no sube archivos: Devalpo carga logo, fotos y PDF desde `/admin`.

## 5. Bloqueado

| Qué | En qué |
|---|---|
| Vender a tráfico frío | Revisión legal de `/terminos` y `/privacidad` (borrador, leyes 19.496 y 19.628). |
| Chat real con Claude | `ANTHROPIC_API_KEY` en Railway. |
| Magic link en producción | Cuenta de Resend con dominio verificado. |
| Activación automática por pago | Deploy del motor de pagos. |
| Foto de hero, "El local" y PDF de RESTAURANTE | Probarlos con R2 configurado (no verificado en local). |

## 6. Cómo correrlo

```bash
docker run -d --name webbot-pg -e POSTGRES_PASSWORD=webbot -e POSTGRES_USER=webbot \
  -e POSTGRES_DB=webbot -p 5433:5432 postgres:16-alpine
export DATABASE_URL="postgresql://webbot:webbot@localhost:5433/webbot"
npx prisma migrate deploy    # 3 migraciones
npm run db:seed-demo         # OBLIGATORIO (ver trampas)
npm run db:seed-fixtures-restaurante   # sitios /sites/dev-restaurante-*, dev-panaderia
npm run dev                  # http://localhost:3000
```

`npm run dev:sandbox` arma lo mismo con el link de pruebas de Mercado Pago (puerto 5435).
Tests: `npm run test:unit` (106 suites / 1598 tests en verde), `test:coverage` (70/80/80/80),
`test:e2e` (necesita `npm run dev`), `npx tsc --noEmit`, `npx eslint src tests`. No hay
script `test` a secas.

## 7. Trampas

- Railway **no corre migraciones**: `npx prisma migrate deploy` a mano. Nunca `migrate dev`
  (no hay staging); previsualizar con `migrate diff --script`. Prisma 7 exige driver adapter.
- El `.env` local suele apuntar a la Postgres de **producción**. `cucumber-js <archivo>` corre
  igual todas las features (`paths` de `cucumber.js`), y varias crean y borran filas: revisar
  el host antes de cualquier e2e que escriba; para una sola feature, un config temporal con
  `--config`.
- `db:seed-demo` es precondición: sin el `Cliente` demo, `POST /api/chat/lead` cae con `P2003`.
- `https://devalpo.cl` es el WordPress de Bluehost, no WebBot; la app vive en
  `webbot.devalpo.cl`. Cualquier otro host se enruta como sitio de cliente.
- Gmail SMTP está bloqueado en Railway: producción usa Resend por HTTP. El túnel SSH de
  Railway no funciona en Windows; se usa Public Access de Postgres.
- Chrome en segundo plano estrangula `IntersectionObserver`; el móvil se mide en un `<iframe>`
  de 390 px. `overflow-x: hidden` en `html` y `body` mata `position: sticky` (se usa `clip`).
- `tsc --noEmit` no revisa `tests/` (`npm run build` sí); un archivo que difiere solo en
  mayúsculas de otro rompe tsc en Windows. `npm run lint` falla con la carpeta sin versionar
  `handoff_bloquesV2/`.
- `R2_PUBLIC_URL` se lee al compilar: si cambia, redesplegar o `next/image` rechaza las fotos.
  `R2_ACCOUNT_ID` son 32 hex. El panel lee `ADMIN_SECRET`, no `ADMIN_PASSWORD`.
- `docs/historico/` es archivo muerto: nunca se cita como hecho actual.
- Filas de `Sitio` previas al 2026-09-20 conservan `primario`/`secundario`/`texto` huérfanos
  en `configJson.colores` (D-32); ningún código los lee.
