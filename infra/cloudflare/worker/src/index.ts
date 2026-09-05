// Worker de Cloudflare para dominios propios de clientes (WB-26).
//
// Es el fallback origin de Cloudflare for SaaS en la zona devalpo.cl: cuando
// un visitante entra a `panaderia.cl` (CNAME → dominios.devalpo.cl),
// Cloudflare termina TLS y ejecuta este Worker, que reenvía la petición al
// host wildcard de Railway (`ORIGIN_HOST`) indicando en `X-Forwarded-Host`
// cuál era el dominio original. `X-WebBot-Worker-Secret` permite que
// src/proxy.ts distinga esta cabecera de una falsificada por un cliente.

export interface Env {
  /** Host de Railway que sirve los sitios (custom.sitios.devalpo.cl). */
  ORIGIN_HOST: string
  /** Secreto compartido con Railway; se carga con `wrangler secret put`. */
  WORKER_SHARED_SECRET?: string
}

// Zona propia: el apex (WordPress) y los subdominios (Railway wildcard,
// _acme-challenge, etc.) no pasan por el reenvío. Los registros DNS-only ni
// siquiera llegan aquí, pero se protege igual por si alguno queda proxied.
const ZONA_PROPIA = 'devalpo.cl'

function esZonaPropia(hostname: string): boolean {
  return hostname === ZONA_PROPIA || hostname.endsWith(`.${ZONA_PROPIA}`)
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    if (esZonaPropia(url.hostname.toLowerCase())) {
      return fetch(request)
    }

    const destino = `https://${env.ORIGIN_HOST}${url.pathname}${url.search}`

    // `new Request(destino, request)` copia método, cabeceras y body. La
    // cabecera `Host` no se puede fijar desde un Worker (la define el runtime
    // a partir de la URL destino), por eso el host original viaja en
    // X-Forwarded-Host.
    const reenvio = new Request(destino, request)
    reenvio.headers.set('X-Forwarded-Host', url.host)

    if (env.WORKER_SHARED_SECRET) {
      reenvio.headers.set('X-WebBot-Worker-Secret', env.WORKER_SHARED_SECRET)
    } else {
      // Sin secreto configurado no se reenvía ninguno que haya puesto el
      // cliente, para no dar a entender autenticidad que no existe.
      reenvio.headers.delete('X-WebBot-Worker-Secret')
    }

    // Las redirecciones del origen se devuelven al navegador tal cual en vez
    // de seguirlas desde el Worker (conservan el Location que emitió Next).
    return fetch(reenvio, { redirect: 'manual' })
  },
} satisfies ExportedHandler<Env>
