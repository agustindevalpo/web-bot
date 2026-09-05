import { buildPaletteStyle } from '@/components/templates/shared/palette'
import { SiteConfigDTO } from '@/application/dtos/SiteConfigDTO'
import { Estilo } from '@/domain/value-objects/Estilo'

function baseConfig(overrides: Partial<SiteConfigDTO> = {}): SiteConfigDTO {
  return {
    nombre: 'Negocio',
    rubro: 'panaderia',
    descripcion: '',
    servicios: [],
    ciudad: '',
    contacto: { telefono: '', email: '' },
    redes: {},
    estilo: Estilo.MODERNO,
    highlight: '',
    ...overrides,
  }
}

describe('buildPaletteStyle', () => {
  it('mapea config.colores a las custom properties --primario/--secundario/--acento/--texto', () => {
    const style = buildPaletteStyle(
      baseConfig({ colores: { primario: '#111111', secundario: '#222222', acento: '#333333', texto: '#444444' } }),
    )

    expect(style).toEqual({
      '--primario': '#111111',
      '--secundario': '#222222',
      '--acento': '#333333',
      '--texto': '#444444',
    })
  })

  it('usa la paleta por defecto cuando config.colores está ausente', () => {
    const style = buildPaletteStyle(baseConfig())

    expect(style).toEqual({
      '--primario': '#080056',
      '--secundario': '#5B46F8',
      '--acento': '#15DEFA',
      '--texto': '#ffffff',
    })
  })
})
