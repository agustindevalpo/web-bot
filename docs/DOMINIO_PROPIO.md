# Dominio propio por sitio (WB-26)

Runbook para servir un sitio de WebBot desde el dominio del cliente
(`panaderia.cl`) en vez de `panaderia.sitios.devalpo.cl`.

## Cómo funciona

```
visitante ─▶ panaderia.cl (CNAME → dominios.devalpo.cl)
          ─▶ Cloudflare for SaaS (termina TLS con certificado del cliente)
          ─▶ Worker webbot-dominio-propio-worker (fallback origin, ruta */*)
                agrega X-WebBot-Forwarded-Host: panaderia.cl
                agrega X-WebBot-Worker-Secret: <WORKER_SHARED_SECRET>
          ─▶ https://custom.sitios.devalpo.cl (wildcard de Railway)
          ─▶ src/proxy.ts valida el secreto y reescribe a /sites/custom/panaderia.cl
          ─▶ src/app/sites/custom/[host]/page.tsx → sitioRepo.findByDominioPropio
```

Piezas en el repo:

| Pieza | Archivo |
| --- | --- |
| Clasificación del host (pura, con tests) | `src/infrastructure/routing/resolverDestino.ts` |
| Adaptador de Next | `src/proxy.ts` |
| Página de dominio propio | `src/app/sites/custom/[host]/page.tsx` |
| Worker de Cloudflare | `infra/cloudflare/worker/` |
| Variable de entorno | `WORKER_SHARED_SECRET` (Railway y `wrangler secret`) |

Sin `WORKER_SHARED_SECRET` configurado, `src/proxy.ts` acepta cualquier
`X-WebBot-Forwarded-Host`. Eso es lo esperado en dev local y en el e2e; en Railway
el secreto DEBE estar configurado, si no cualquier cliente podría forzar la
búsqueda de un dominio arbitrario (no expone datos de otro sitio, pero
permitiría servir el sitio de un cliente bajo un host ajeno).

## 1. Configuración inicial de Cloudflare (una sola vez)

### 1.1 Agregar la zona `devalpo.cl`

1. Cloudflare → Add a site → `devalpo.cl` (plan Free sirve).
2. Cloudflare importa los registros DNS automáticamente. **Antes de tocar los
   nameservers**, comparar uno a uno con los registros actuales en Bluehost
   (donde hoy vive el DNS, ver `docs/BITACORA.md`): A/AAAA del apex
   (WordPress), MX, TXT (SPF/DKIM/DMARC), `webbot`, `sitios`, etc. Agregar a
   mano lo que falte.
3. Dejar **DNS-only (nube gris, no proxied)** estos registros:
   - `_acme-challenge.sitios` (TXT/CNAME): Railway lo usa para emitir el
     certificado wildcard de `*.sitios.devalpo.cl`; si Cloudflare lo
     proxiea, la validación ACME falla.
   - `*.sitios` (CNAME al wildcard de Railway): Railway termina TLS para
     los subdominios; no debe pasar por Cloudflare.
   - `webbot` (CNAME a Railway): la app principal sigue igual que hoy.
4. Cambiar los nameservers en NIC.cl a los que indique Cloudflare y esperar
   a que la zona quede "Active".

### 1.2 Habilitar Cloudflare for SaaS

1. Zona `devalpo.cl` → SSL/TLS → Custom Hostnames → Enable Cloudflare for
   SaaS (Free incluye 100 hostnames).
2. Crear el **fallback origin** sin servidor propio ("originless"):
   - DNS: `clientes` → registro `AAAA` con valor `100::`, **proxied** (nube
     naranja). `100::` es una dirección de descarte; solo sirve para que el
     Worker tenga un origen al que engancharse.
   - Custom Hostnames → Fallback Origin → `clientes.devalpo.cl`.
3. Crear el **CNAME target** que usarán los clientes:
   - DNS: `dominios` → `CNAME` → `clientes.devalpo.cl`, **proxied**.
   - Este es el único valor que se entrega a los clientes:
     `dominios.devalpo.cl`.

### 1.3 Desplegar el Worker

```bash
cd infra/cloudflare/worker
npm install
npx wrangler login
npx wrangler secret put WORKER_SHARED_SECRET   # generar con: openssl rand -hex 32
npm run deploy
```

Luego asignar la ruta `*/*` de la zona `devalpo.cl` al Worker (Workers &
Pages → el Worker → Settings → Triggers → Routes, o descomentar `routes` en
`wrangler.toml` y volver a desplegar). El Worker deja pasar sin tocar todo
host que termine en `devalpo.cl`, así que el WordPress del apex y los
subdominios propios no se ven afectados.

### 1.4 Secreto en Railway

En el servicio `web-bot` de Railway (usar `railway variables`, ver
`docs/BITACORA.md`):

```
WORKER_SHARED_SECRET=<el mismo valor que en wrangler secret put>
```

Redeploy del servicio para que `src/proxy.ts` lo lea.

## 2. Alta de cada cliente

### 2.1 Crear el custom hostname en Cloudflare

Con un API token que tenga permiso `Zone → SSL and Certificates → Edit`
sobre `devalpo.cl`:

```bash
curl -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/custom_hostnames" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"hostname": "www.panaderia.cl", "ssl": {"method": "http", "type": "dv"}}'
```

Repetir con `"hostname": "panaderia.cl"` si el cliente también va a apuntar
el apex (ver 2.3). El certificado se emite solo cuando el DNS del cliente ya
apunta a `dominios.devalpo.cl`; el estado se consulta con
`GET /zones/{zone_id}/custom_hostnames?hostname=www.panaderia.cl`
(`ssl.status` debe llegar a `active`).

### 2.2 Registrar el dominio en el Sitio

Guardar en `Sitio.dominioPropio` el dominio **en minúsculas, sin puerto y
sin `https://`**. Basta con el apex (`panaderia.cl`): la página prueba primero
el host exacto y, si empieza con `www.`, vuelve a buscar sin el prefijo. Si
el cliente solo tendrá `www`, se puede guardar `www.panaderia.cl` igual.

Desde el dominio: `sitio.conectarDominio('panaderia.cl')` +
`sitioRepo.update(...)`. Hasta que exista UI en el panel, hacerlo con un
script puntual o directo en la BD (`UPDATE "Sitio" SET "dominioPropio" =
'panaderia.cl' WHERE subdominio = 'panaderia'`). La columna es `@unique`:
un mismo dominio no puede quedar en dos sitios.

### 2.3 Instrucciones DNS para el cliente

Entregar al cliente exactamente esto:

| Tipo | Nombre | Valor |
| --- | --- | --- |
| CNAME | `www` | `dominios.devalpo.cl` |

Para el apex (`panaderia.cl` sin `www`):

- Si su DNS soporta **CNAME flattening** (Cloudflare, DNSimple, Route 53
  con ALIAS, etc.): agregar `CNAME @ → dominios.devalpo.cl` y crear también
  el custom hostname del apex (2.1).
- Si no lo soporta: recomendar usar `www` como dominio principal y
  configurar en su proveedor una redirección del apex a `https://www.…`.
  Los dominios `.cl` que usan solo el DNS de NIC.cl suelen **no** tener
  flattening ni redirecciones, así que en ese caso es mejor que el cliente
  mueva su DNS a Cloudflare (gratis) o que acepte solo `www`.

Tiempos: propagación DNS hasta 24 h, emisión del certificado unos minutos
después de que Cloudflare vea el CNAME.

### 2.4 Verificación

```bash
curl -sI https://www.panaderia.cl | head -n 5
```

Debe responder `200` con el HTML del sitio. Si responde `404`, revisar en
este orden: `dominioPropio` guardado (2.2), `WORKER_SHARED_SECRET` igual en
Railway y en el Worker (1.3/1.4), ruta `*/*` asignada al Worker.

## 3. Pruebas locales

Con `npm run dev` levantado y `WORKER_SHARED_SECRET` vacío en `.env`
(comportamiento por defecto en local), se simula el Worker a mano:

```bash
curl -s -o /dev/null -w "%{http_code}\n" \
  -H "X-WebBot-Forwarded-Host: panaderia.cl" \
  http://localhost:3000/
```

Con el secreto configurado en `.env`, hay que enviarlo también o el proxy
ignora la cabecera y responde como si fuera `localhost`:

```bash
curl -s -H "X-WebBot-Forwarded-Host: panaderia.cl" \
  -H "X-WebBot-Worker-Secret: $WORKER_SHARED_SECRET" \
  http://localhost:3000/
```

El e2e `tests/e2e/features/sitio_por_dominio_propio.feature` cubre el caso
feliz y el 404 con la misma cabecera.
