import type { Metadata } from 'next'
import { renderizarSitio } from '@/app/sites/renderizarSitio'
import { buscarSitioPorSubdominio } from '@/app/sites/buscarSitio'
import { construirMetadataSitio } from '@/app/sites/metadataSitio'
import { construirUrlSitioSubdominio } from '@/app/sites/urlSitio'
import { SiteConfigDTO } from '@/application/dtos/SiteConfigDTO'

// Mismo default que `urlPreviewDesdeEnv` (admin/_lib/urlPreview.ts) — la
// app entera asume este dominio base cuando la variable no está seteada.
const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'sitios.devalpo.cl'

type Props = { params: Promise<{ subdominio: string }> }

// `buscarSitioPorSubdominio` está en `cache()` (Decisión D-B): esta función
// y el export default de más abajo comparten la misma identidad exportada
// desde `buscarSitio.ts`, así una sola visita a la página dispara una única
// consulta a Prisma en vez de dos.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { subdominio } = await params
  const sitio = await buscarSitioPorSubdominio(subdominio)

  // Sin datos que exponer: se devuelve metadata vacía y se deja que el
  // 404 lo resuelva `renderizarSitio` en el export default, sin duplicar
  // esa decisión acá (Requirement "No Metadata Leak for Unavailable Sites").
  if (!sitio || !sitio.estaActivo()) return {}

  const config = sitio.configJson as unknown as SiteConfigDTO
  const urlAbsoluta = construirUrlSitioSubdominio(subdominio, BASE_DOMAIN)
  return construirMetadataSitio(config, urlAbsoluta)
}

// Dispatcher delgado (Decisión D1/D2 en design.md) — solo resuelve el Sitio
// por subdominio; el 404 y la elección de template viven en renderizarSitio,
// compartido con la ruta de dominio propio (/sites/custom/[host], WB-26).
export default async function SitioCliente({ params }: Props) {
  const { subdominio } = await params

  const sitio = await buscarSitioPorSubdominio(subdominio)

  return renderizarSitio(sitio)
}
