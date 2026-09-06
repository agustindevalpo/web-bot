# Worker de dominios propios (WB-26)

Fallback origin de Cloudflare for SaaS en la zona `devalpo.cl`. Reenvía cada
petición de un dominio de cliente (`panaderia.cl`) al host wildcard de Railway
(`custom.sitios.devalpo.cl`) con las cabeceras `X-Forwarded-Host` y
`X-WebBot-Worker-Secret`, que `src/proxy.ts` usa para resolver el sitio.

Este paquete es independiente del proyecto Next: tiene su propio
`package.json` y `tsconfig.json`, y el `tsconfig.json`, ESLint y Jest de la raíz
lo excluyen. El runbook completo (DNS, Cloudflare for SaaS, alta de cada
cliente) está en `docs/DOMINIO_PROPIO.md`.

## Requisitos

- Cuenta de Cloudflare con la zona `devalpo.cl` activa y Cloudflare for SaaS
  habilitado.
- Node 20+.

## Despliegue

```bash
cd infra/cloudflare/worker
npm install
npx wrangler login
npx wrangler secret put WORKER_SHARED_SECRET   # mismo valor que en Railway
npm run deploy
```

Después del primer deploy, asignar la ruta `*/*` de la zona `devalpo.cl` al
Worker (dashboard: Workers Routes, o descomentar `routes` en `wrangler.toml`
y volver a desplegar).

## Desarrollo local

```bash
npm run dev
```

`wrangler dev` levanta el Worker en `localhost:8787`. Como el host local no
termina en `devalpo.cl`, cualquier petición se reenvía a `ORIGIN_HOST` con
`X-Forwarded-Host: localhost:8787`; para probar un dominio concreto es más
directo usar `curl` contra Next con la cabecera puesta a mano (ver
`docs/DOMINIO_PROPIO.md`, sección "Pruebas locales").
