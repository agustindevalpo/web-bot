import { cache } from 'react'
import { sitioRepo } from '@/infrastructure/container'
import { variantesDominio } from '@/infrastructure/routing/resolverDestino'

// Búsquedas de Sitio compartidas por `generateMetadata` y el export default
// de cada ruta pública (/sites/[subdominio] y /sites/custom/[host]),
// envueltas en `cache()` de React a nivel de módulo (Decisión D-B).
// `cache()` memoiza por identidad de función + argumentos: cada
// `export const` de acá abajo es una única identidad que ambos llamadores
// de su ruta importan, así `generateMetadata` y la página resuelven el
// mismo Sitio con una sola consulta a Prisma en vez de dos. Definir
// `cache(fn)` dentro de cada archivo, o una vez por export, crearía
// identidades distintas que nunca comparten memoización — y la falla es
// silenciosa: el código sigue funcionando, solo duplica la consulta.
// Ambos llamadores deben pasar el mismo argumento (mismo string derivado),
// o la memoización falla igual de silenciosamente.
export const buscarSitioPorSubdominio = cache((subdominio: string) =>
  sitioRepo.findBySubdominio(subdominio),
)

// Se intenta primero el dominio exacto y, si empieza con `www.`, también sin
// el prefijo: el cliente puede haber registrado `panaderia.cl` en el Sitio y
// apuntar solo `www` a Cloudflare (ver docs/DOMINIO_PROPIO.md). Recibe el
// host ya decodificado (ver `decodificarHost`), nunca el crudo del rewrite.
export const buscarSitioPorDominio = cache(async (host: string) => {
  for (const candidato of variantesDominio(host)) {
    const sitio = await sitioRepo.findByDominioPropio(candidato)
    if (sitio) return sitio
  }
  return null
})

/**
 * Decodifica el `host` tal como llega en el parámetro de ruta de
 * `/sites/custom/[host]` — puede venir URL-encoded por el rewrite de
 * `src/proxy.ts`. `generateMetadata` y la página deben pasar el mismo
 * resultado a `buscarSitioPorDominio` para compartir la memoización de
 * `cache()` (mismo argumento, misma identidad).
 */
export function decodificarHost(host: string): string {
  try {
    return decodeURIComponent(host)
  } catch {
    // Secuencia % inválida: se busca con el valor crudo y, si no existe,
    // renderizarSitio responde 404.
    return host
  }
}
