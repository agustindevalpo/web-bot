import { Template } from '@/domain/value-objects/Template'
import { TemplateComponent } from '@/components/templates/shared/types'
import Landing from '@/components/templates/landing'

// Registry presentacional (Decisión D2) — mapea cada Template a su
// componente. Importa JSX + CSS Modules, por eso vive separado del
// resolver.ts puro (no se puede testear en el proyecto Jest unit, que no
// mapea CSS/JSX; cubierto por e2e). Los 4 templates que faltan (SERVICIOS,
// PORTFOLIO, RESTAURANTE, TIENDA) apuntan a Landing temporalmente — cada
// slice siguiente reemplaza una entrada (ver Migration/Rollout en design.md).
export const REGISTRY: Record<Template, TemplateComponent> = {
  [Template.LANDING]: Landing,
  [Template.SERVICIOS]: Landing,
  [Template.PORTFOLIO]: Landing,
  [Template.RESTAURANTE]: Landing,
  [Template.TIENDA]: Landing,
}
