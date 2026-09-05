import { resolverTemplateDemo } from '../../../prisma/seedDemoTemplates'
import { RUBRO_TEMPLATES, TEMPLATE_FALLBACK } from '@/infrastructure/templates/rubroTemplates'
import { Template } from '@/domain/value-objects/Template'

// WB-22 Slice 5, tarea 6.1 — módulo puro sin dependencias de Prisma para que
// prisma/seed-demo.ts pueda testearse sin importar el script completo (que
// ejecuta main() al cargarse). Verifica el Requirement "Demo Reassignment":
// consultora→LANDING y taller→PORTFOLIO reemplazan la asignación temporal a
// SERVICIOS, y los otros 8 rubros demo siguen resolviendo por el único mapa
// (Requirement "Single Selection Code Path").
describe('resolverTemplateDemo', () => {
  it('reasigna demo-consultora a Template.LANDING (ya no SERVICIOS)', () => {
    expect(resolverTemplateDemo('consultora')).toBe(Template.LANDING)
  })

  it('reasigna demo-taller a Template.PORTFOLIO (ya no SERVICIOS)', () => {
    expect(resolverTemplateDemo('taller')).toBe(Template.PORTFOLIO)
  })

  const rubrosNoReasignados = ['panaderia', 'restaurante', 'peluqueria', 'dentista', 'yoga', 'veterinaria', 'ferreteria', 'tienda']

  it.each(rubrosNoReasignados)('mantiene el Template vigente para el rubro demo "%s" (sin override)', (rubro) => {
    expect(resolverTemplateDemo(rubro)).toBe(RUBRO_TEMPLATES[rubro])
  })

  it('cae a TEMPLATE_FALLBACK para un rubro desconocido', () => {
    expect(resolverTemplateDemo('rubro-inexistente')).toBe(TEMPLATE_FALLBACK)
  })
})
