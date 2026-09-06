import { notFound } from 'next/navigation'
import { Sitio } from '@/domain/entities/Sitio'
import { SiteConfigDTO } from '@/application/dtos/SiteConfigDTO'
import { resolverTemplate } from '@/components/templates/resolver'
import { REGISTRY } from '@/components/templates/registry'

// Paso final compartido por las dos rutas públicas de un sitio
// (/sites/[subdominio] y /sites/custom/[host]): dado un Sitio ya buscado,
// responde 404 si no existe o está pausado y, si no, delega el render al
// template que corresponda. Mantiene el dispatcher delgado (Decisión D1/D2
// en design.md de WB-22): toda la lógica de layout vive en cada template +
// sus sections.ts, y el fallback de resolverTemplate garantiza que ningún
// Sitio existente deja de renderizar aunque su `template` sea desconocido
// o legado (Requirement "Template Registry Resolves Every Value").
export async function renderizarSitio(sitio: Sitio | null) {
  if (!sitio || !sitio.estaActivo()) return notFound()

  const config = sitio.configJson as unknown as SiteConfigDTO
  const componente = resolverTemplate(REGISTRY, sitio.template)

  // Invocación directa (no JSX) — `componente` se resuelve dinámicamente
  // desde el registry en tiempo de ejecución, así que no es un componente
  // "creado durante el render" en el sentido que vigila react-hooks: es una
  // referencia estable a uno de los 5 componentes ya definidos.
  return await componente({ config })
}
