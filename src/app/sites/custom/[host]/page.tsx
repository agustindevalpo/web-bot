import type { Metadata } from 'next'
import { renderizarSitio } from '@/app/sites/renderizarSitio'
import { buscarSitioPorDominio, decodificarHost } from '@/app/sites/buscarSitio'
import { construirMetadataSitio } from '@/app/sites/metadataSitio'
import { construirUrlSitioDominioPropio } from '@/app/sites/urlSitio'
import { SiteConfigDTO } from '@/application/dtos/SiteConfigDTO'

type Props = { params: Promise<{ host: string }> }

// `buscarSitioPorDominio` está en `cache()` (Decisión D-B): esta función y
// el export default de más abajo pasan el mismo host ya decodificado a la
// misma identidad exportada desde `buscarSitio.ts`, así una sola visita a
// la página dispara una única consulta a Prisma en vez de dos — pasar
// strings derivados distintos haría fallar la memoización en silencio.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { host } = await params
  const hostDecodificado = decodificarHost(host)
  const sitio = await buscarSitioPorDominio(hostDecodificado)

  // Sin datos que exponer: se devuelve metadata vacía y se deja que el
  // 404 lo resuelva `renderizarSitio` en el export default, sin duplicar
  // esa decisión acá (Requirement "No Metadata Leak for Unavailable Sites").
  if (!sitio || !sitio.estaActivo()) return {}

  const config = sitio.configJson as unknown as SiteConfigDTO
  // `og:url` usa el host servido (parámetro de ruta), nunca `headers()`
  // (Decisión D-C): el header `Host` real es el origen de Railway/Worker,
  // no el dominio del cliente.
  const urlAbsoluta = construirUrlSitioDominioPropio(hostDecodificado)
  return construirMetadataSitio(config, urlAbsoluta)
}

// Ruta interna a la que src/proxy.ts reescribe cualquier host que no sea la
// app ni un subdominio de sitios.devalpo.cl (WB-26, dominio propio). El
// `host` llega tal como lo dejó el proxy (ya normalizado cuando viene del
// Worker) y puede venir URL-encoded por el rewrite.
export default async function SitioDominioPropio({ params }: Props) {
  const { host } = await params

  const sitio = await buscarSitioPorDominio(decodificarHost(host))

  return renderizarSitio(sitio)
}
