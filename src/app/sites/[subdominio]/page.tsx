import { sitioRepo } from '@/infrastructure/container'
import { renderizarSitio } from '@/app/sites/renderizarSitio'

// Dispatcher delgado (Decisión D1/D2 en design.md) — solo resuelve el Sitio
// por subdominio; el 404 y la elección de template viven en renderizarSitio,
// compartido con la ruta de dominio propio (/sites/custom/[host], WB-26).
export default async function SitioCliente({
  params,
}: {
  params: Promise<{ subdominio: string }>
}) {
  const { subdominio } = await params

  const sitio = await sitioRepo.findBySubdominio(subdominio)

  return renderizarSitio(sitio)
}
