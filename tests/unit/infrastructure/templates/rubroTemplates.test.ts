import { RUBRO_TEMPLATES, TEMPLATE_FALLBACK } from '@/infrastructure/templates/rubroTemplates'
import { Template } from '@/domain/value-objects/Template'

describe('RUBRO_TEMPLATES', () => {
  const casosEsperados: Array<[string, Template]> = [
    ['panaderia', Template.RESTAURANTE],
    ['restaurante', Template.RESTAURANTE],
    ['peluqueria', Template.SERVICIOS],
    ['dentista', Template.SERVICIOS],
    ['yoga', Template.SERVICIOS],
    ['veterinaria', Template.SERVICIOS],
    ['ferreteria', Template.TIENDA],
    ['tienda', Template.TIENDA],
    ['consultora', Template.LANDING],
    ['taller', Template.PORTFOLIO],
  ]

  it.each(casosEsperados)('mapea el rubro "%s" a Template.%s', (rubro, templateEsperado) => {
    expect(RUBRO_TEMPLATES[rubro]).toBe(templateEsperado)
  })

  it('define exactamente los 10 rubros conocidos, ninguno de más ni de menos', () => {
    expect(Object.keys(RUBRO_TEMPLATES).sort()).toEqual(casosEsperados.map(([rubro]) => rubro).sort())
  })
})

describe('TEMPLATE_FALLBACK', () => {
  it('es Template.LANDING', () => {
    expect(TEMPLATE_FALLBACK).toBe(Template.LANDING)
  })
})
