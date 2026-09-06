// Clasificación pura del host de una petición entrante (WB-26, dominio propio
// por sitio). No importa nada de Next para que sea testeable en el proyecto
// `unit` de Jest y para que src/proxy.ts quede como un adaptador delgado.
//
// Flujo de dominio propio: `panaderia.cl` → Cloudflare for SaaS → Worker
// (infra/cloudflare/worker) → `custom.sitios.devalpo.cl` (Railway) con las
// cabeceras `X-WebBot-Forwarded-Host: panaderia.cl` y `X-WebBot-Worker-Secret`.
// Aquí se decide si esa cabecera es confiable y a qué ruta interna se
// reescribe la petición.

export type Destino =
  | { tipo: 'app' }
  | { tipo: 'subdominio'; subdominio: string; rutaInterna: string }
  | { tipo: 'dominioPropio'; dominio: string; rutaInterna: string }

export interface EntradaDestino {
  /** Cabecera `Host` tal como llega (puede traer puerto o mayúsculas). */
  host: string | null | undefined
  /** Cabecera `X-WebBot-Forwarded-Host` que agrega el Worker de Cloudflare. */
  forwardedHost?: string | null
  /** Cabecera `X-WebBot-Worker-Secret` que agrega el Worker. */
  secretRecibido?: string | null
  /** `WORKER_SHARED_SECRET` del entorno. Vacío/undefined = no se exige. */
  secretEsperado?: string | null
  /** Dominio base de los subdominios (`sitios.devalpo.cl`). */
  baseDomain: string
  /** Dominio de la app principal (`webbot.devalpo.cl`). */
  appDomain: string
  /** Path original de la petición; se conserva en la ruta interna. */
  pathname?: string
}

/**
 * Normaliza un host para comparaciones y búsquedas en BD: minúsculas, sin
 * espacios y sin `:puerto`. NO quita el prefijo `www.` — esa decisión la toma
 * la página (ver `variantesDominio`), porque `www.panaderia.cl` y
 * `panaderia.cl` pueden estar registrados como dominios distintos.
 */
export function normalizarHost(host: string): string {
  return host.trim().toLowerCase().replace(/:\d+$/, '')
}

/**
 * Variantes con las que se intenta ubicar un Sitio por dominio propio, en
 * orden: el dominio tal cual y, si empieza con `www.`, también sin él.
 */
export function variantesDominio(dominio: string): string[] {
  const normalizado = normalizarHost(dominio)
  if (normalizado.startsWith('www.') && normalizado.length > 'www.'.length) {
    return [normalizado, normalizado.slice('www.'.length)]
  }
  return [normalizado]
}

function cabeceraConfiable(entrada: EntradaDestino): boolean {
  const forwarded = entrada.forwardedHost?.trim()
  if (!forwarded) return false

  const esperado = entrada.secretEsperado?.trim()
  // Sin secreto configurado (dev local, e2e) la cabecera se acepta tal cual.
  if (!esperado) return true

  // Con secreto configurado, solo se acepta si coincide exactamente. Si no,
  // la cabecera se ignora por completo y se siguen las reglas normales.
  return entrada.secretRecibido === esperado
}

/**
 * Decide a qué destino interno corresponde una petición.
 *
 * Reglas, en orden:
 *  (a) `X-WebBot-Forwarded-Host` confiable → ese host reemplaza al `Host` real y
 *      pasa por las mismas reglas de abajo. Para un dominio de cliente
 *      real siempre termina en `dominioPropio`; el paso por (b) y (c)
 *      evita que una cabecera legítima convierta a la app o a un
 *      subdominio propio en una búsqueda por dominio propio.
 *  (b) `appDomain`, `localhost*` y `*.up.railway.app` → `app` (sin rewrite).
 *  (c) `*.{baseDomain}` → `subdominio`.
 *  (d) cualquier otro host → `dominioPropio` con el host normalizado
 *      (fallback histórico de src/proxy.ts, se conserva).
 */
export function resolverDestino(entrada: EntradaDestino): Destino {
  const pathname = entrada.pathname ?? '/'
  const hostEfectivo = cabeceraConfiable(entrada)
    ? normalizarHost(entrada.forwardedHost as string)
    : normalizarHost(entrada.host ?? '')

  const appDomain = normalizarHost(entrada.appDomain)
  const baseDomain = normalizarHost(entrada.baseDomain)

  if (
    hostEfectivo === appDomain ||
    hostEfectivo.startsWith('localhost') ||
    hostEfectivo.endsWith('.up.railway.app')
  ) {
    return { tipo: 'app' }
  }

  const sufijoBase = `.${baseDomain}`
  if (baseDomain && hostEfectivo.endsWith(sufijoBase)) {
    const subdominio = hostEfectivo.slice(0, -sufijoBase.length)
    return { tipo: 'subdominio', subdominio, rutaInterna: `/sites/${subdominio}${pathname}` }
  }

  return {
    tipo: 'dominioPropio',
    dominio: hostEfectivo,
    rutaInterna: `/sites/custom/${hostEfectivo}${pathname}`,
  }
}
