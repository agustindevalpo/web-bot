import { Template } from '@/domain/value-objects/Template'
import { TemplateComponent } from '@/components/templates/shared/types'
import Landing from '@/components/templates/landing'
import Servicios from '@/components/templates/servicios'
import Restaurante from '@/components/templates/restaurante'
import Portfolio from '@/components/templates/portfolio'
import Tienda from '@/components/templates/tienda'

// Registry presentacional (Decisión D2) — mapea cada Template a su
// componente. Importa JSX + CSS Modules, por eso vive separado del
// resolver.ts puro (no se puede testear en el proyecto Jest unit, que no
// mapea CSS/JSX; cubierto por e2e). Los 5 templates ya tienen su propio
// componente — ninguna entrada apunta a Landing salvo LANDING mismo (ver
// Migration/Rollout en design.md).
export const REGISTRY: Record<Template, TemplateComponent> = {
  [Template.LANDING]: Landing,
  [Template.SERVICIOS]: Servicios,
  [Template.PORTFOLIO]: Portfolio,
  [Template.RESTAURANTE]: Restaurante,
  [Template.TIENDA]: Tienda,
}
