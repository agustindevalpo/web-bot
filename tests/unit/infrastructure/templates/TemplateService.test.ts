import { TemplateService } from '@/infrastructure/templates/TemplateService'
import { Template } from '@/domain/value-objects/Template'
import { SiteConfigDTO } from '@/application/dtos/SiteConfigDTO'
import { Estilo } from '@/domain/value-objects/Estilo'

function configConRubro(rubro: string): SiteConfigDTO {
  return {
    nombre: 'Negocio de prueba',
    rubro,
    descripcion: '',
    servicios: [],
    ciudad: '',
    contacto: { telefono: '', email: '' },
    redes: {},
    estilo: Estilo.MODERNO,
    highlight: '',
  }
}

describe('TemplateService — seleccionarTemplate', () => {
  const service = new TemplateService()

  const rubrosConocidos: Array<[string, Template]> = [
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

  describe.each(rubrosConocidos)('rubro "%s"', (rubro, templateEsperado) => {
    it(`retorna Template.${templateEsperado}`, () => {
      expect(service.seleccionarTemplate(configConRubro(rubro))).toBe(templateEsperado)
    })
  })

  it('retorna LANDING cuando el rubro es desconocido', () => {
    expect(service.seleccionarTemplate(configConRubro('astronauta-espacial'))).toBe(Template.LANDING)
  })

  it('retorna LANDING cuando el rubro viene vacío', () => {
    expect(service.seleccionarTemplate(configConRubro(''))).toBe(Template.LANDING)
  })

  it('retorna LANDING cuando el rubro es undefined', () => {
    const config = configConRubro('panaderia')
    // @ts-expect-error — ejercita el caso rubro ausente/malformado desde el exterior (DB/JSON no confiable)
    delete config.rubro
    expect(service.seleccionarTemplate(config)).toBe(Template.LANDING)
  })
})

describe('TemplateService — generarConfig', () => {
  it('lanza not_implemented (Tarea 3.2, fuera de alcance de este cambio)', async () => {
    const service = new TemplateService()
    await expect(service.generarConfig(Template.LANDING, configConRubro('panaderia'))).rejects.toThrow(
      /not_implemented/,
    )
  })
})
