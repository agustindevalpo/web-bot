// Resolución del Template para los sitios demo — módulo puro, sin
// dependencias de Prisma, para poder testearlo sin cargar seed-demo.ts (que
// ejecuta main() al importarse). Ver Requirement "Demo Reassignment" en
// spec.md y Decisión D1 en design.md: único mapa rubro→Template del sistema,
// sin overrides locales.
// Import relativo — este módulo corre fuera de Next (sin resolución de "@/",
// igual que seed-demo.ts).
import { RUBRO_TEMPLATES, TEMPLATE_FALLBACK } from '../src/infrastructure/templates/rubroTemplates'
import type { Template } from '../src/domain/value-objects/Template'

export function resolverTemplateDemo(rubro: string): Template {
  return RUBRO_TEMPLATES[rubro] ?? TEMPLATE_FALLBACK
}
