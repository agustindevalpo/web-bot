import { notFound } from 'next/navigation'
import { sitioRepo } from '@/infrastructure/container'
import { SiteConfigDTO } from '@/application/dtos/SiteConfigDTO'
import { resolverTemplate } from '@/components/templates/resolver'
import { REGISTRY } from '@/components/templates/registry'

// Dispatcher delgado (Decisión D1/D2 en design.md) — toda la lógica de
// layout vive en cada template + sus sections.ts. El fallback de
// resolverTemplate garantiza que ningún Sitio existente deja de renderizar
// aunque su `template` sea desconocido o legado (Requirement "Template
// Registry Resolves Every Value").
export default async function SitioCliente({
  params,
}: {
  params: Promise<{ subdominio: string }>
}) {
  const { subdominio } = await params

  const sitio = await sitioRepo.findBySubdominio(subdominio)

  if (!sitio || !sitio.estaActivo()) return notFound()

  const config = sitio.configJson as unknown as SiteConfigDTO
  const componente = resolverTemplate(REGISTRY, sitio.template)

  // Invocación directa (no JSX) — `componente` se resuelve dinámicamente
  // desde el registry en tiempo de ejecución, así que no es un componente
  // "creado durante el render" en el sentido que vigila react-hooks: es una
  // referencia estable a uno de los 5 componentes ya definidos.
  return await componente({ config })
}
