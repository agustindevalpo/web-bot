import {
  buildHero,
  buildAbout,
  buildServicios,
  buildContacto,
  buildFooter,
} from '@/components/templates/servicios/sections'
import { SiteConfigDTO } from '@/application/dtos/SiteConfigDTO'
import { Estilo } from '@/domain/value-objects/Estilo'

function configCompleto(overrides: Partial<SiteConfigDTO> = {}): SiteConfigDTO {
  return {
    nombre: 'Clínica Dental Sonrisas',
    rubro: 'dentista',
    descripcion: 'Atención dental integral para toda la familia.',
    sobreNosotros: 'Más de 15 años cuidando la sonrisa de Valparaíso.',
    servicios: ['Ortodoncia', 'Blanqueamiento', 'Implantes'],
    ciudad: 'Valparaíso',
    contacto: { telefono: '+56 9 8765 4321', email: 'contacto@sonrisas.cl' },
    redes: { instagram: '@sonrisas', facebook: 'Clínica Dental Sonrisas' },
    estilo: Estilo.CALIDO,
    highlight: 'Primera consulta sin costo.',
    imagenes: ['https://images.unsplash.com/hero-dental.jpg', 'https://images.unsplash.com/extra.jpg'],
    colores: { primario: '#0B3D91', secundario: '#1E5FCC', acento: '#4FD1C5', texto: '#ffffff' },
    ...overrides,
  }
}

// Mismo hard constraint que en landing (D4, tests/e2e/steps/sitio-por-subdominio.steps.ts):
// el fixture del e2e crea sitios con configJson = { nombre: 'Sitio E2E' }.
function configSoloNombre(): SiteConfigDTO {
  return { nombre: 'Sitio E2E' } as SiteConfigDTO
}

describe('servicios/sections — buildHero', () => {
  it('arma el hero completo desde un config lleno', () => {
    const hero = buildHero(configCompleto())

    expect(hero.nombre).toBe('Clínica Dental Sonrisas')
    expect(hero.descripcion).toBe('Atención dental integral para toda la familia.')
    expect(hero.rubro).toBe('DENTISTA')
    expect(hero.imagenHero).toBe('https://images.unsplash.com/hero-dental.jpg')
    expect(hero.whatsappUrl).toBe('https://wa.me/56987654321')
    expect(hero.telUrl).toBe('tel:+56 9 8765 4321')
    expect(hero.telefonoDisplay).toBe('+56 9 8765 4321')
    expect(hero.highlight).toBe('Primera consulta sin costo.')
  })

  it('degrada con un config que solo trae { nombre } — sin lanzar', () => {
    expect(() => buildHero(configSoloNombre())).not.toThrow()
    const hero = buildHero(configSoloNombre())

    expect(hero.nombre).toBe('Sitio E2E')
    expect(hero.descripcion).toBeNull()
    expect(hero.rubro).toBeNull()
    expect(hero.imagenHero).toBeNull()
    expect(hero.whatsappUrl).toBeNull()
    expect(hero.telUrl).toBeNull()
    expect(hero.highlight).toBeNull()
  })

  it('no muestra el badge de rubro cuando rubro es "demo"', () => {
    expect(buildHero(configCompleto({ rubro: 'demo' })).rubro).toBeNull()
  })
})

describe('servicios/sections — buildAbout', () => {
  it('usa sobreNosotros cuando está presente', () => {
    expect(buildAbout(configCompleto())).toEqual({
      texto: 'Más de 15 años cuidando la sonrisa de Valparaíso.',
    })
  })

  it('cae a descripcion cuando sobreNosotros está ausente', () => {
    expect(buildAbout(configCompleto({ sobreNosotros: undefined }))).toEqual({
      texto: 'Atención dental integral para toda la familia.',
    })
  })

  it('retorna null (oculta la sección) cuando ni sobreNosotros ni descripcion existen', () => {
    expect(buildAbout(configSoloNombre())).toBeNull()
  })
})

describe('servicios/sections — buildServicios', () => {
  it('usa la etiqueta "Servicios" (identidad del template)', () => {
    expect(buildServicios(configCompleto())?.etiqueta).toBe('Servicios')
  })

  it('numera los servicios del config en orden', () => {
    expect(buildServicios(configCompleto())?.items).toEqual([
      { numero: 1, texto: 'Ortodoncia' },
      { numero: 2, texto: 'Blanqueamiento' },
      { numero: 3, texto: 'Implantes' },
    ])
  })

  it('retorna null cuando no hay servicios (config { nombre } only)', () => {
    expect(buildServicios(configSoloNombre())).toBeNull()
  })
})

describe('servicios/sections — buildContacto (defaults del formulario + CTA de reserva)', () => {
  it('con formulario ausente, el form queda habilitado por defecto apuntando a contacto.email', () => {
    const contacto = buildContacto(configCompleto())

    expect(contacto.formularioHabilitado).toBe(true)
    expect(contacto.mailtoUrl).toBe(`mailto:${encodeURIComponent('contacto@sonrisas.cl')}`)
    expect(contacto.telefono).toBe('+56 9 8765 4321')
    expect(contacto.email).toBe('contacto@sonrisas.cl')
  })

  it('respeta un destinatarioEmail explícito del formulario', () => {
    const contacto = buildContacto(
      configCompleto({
        contacto: {
          telefono: '+56 9 8765 4321',
          email: 'contacto@sonrisas.cl',
          formulario: { habilitado: true, destinatarioEmail: 'reservas@sonrisas.cl' },
        },
      }),
    )

    expect(contacto.mailtoUrl).toBe(`mailto:${encodeURIComponent('reservas@sonrisas.cl')}`)
  })

  it('respeta formulario.habilitado === false', () => {
    const contacto = buildContacto(
      configCompleto({
        contacto: { telefono: '+56 9 8765 4321', email: 'contacto@sonrisas.cl', formulario: { habilitado: false } },
      }),
    )

    expect(contacto.formularioHabilitado).toBe(false)
  })

  it('arma la URL de WhatsApp para el CTA de reserva desde el teléfono', () => {
    expect(buildContacto(configCompleto()).whatsappUrl).toBe('https://wa.me/56987654321')
  })

  it('degrada con un config que solo trae { nombre } — sin lanzar, formulario igual habilitado', () => {
    expect(() => buildContacto(configSoloNombre())).not.toThrow()
    const contacto = buildContacto(configSoloNombre())
    expect(contacto.formularioHabilitado).toBe(true)
    expect(contacto.telefono).toBeNull()
    expect(contacto.email).toBeNull()
    expect(contacto.mailtoUrl).toBeNull()
    expect(contacto.whatsappUrl).toBeNull()
  })
})

describe('servicios/sections — buildFooter', () => {
  it('arma el footer desde un config lleno', () => {
    const footer = buildFooter(configCompleto())

    expect(footer.ciudad).toBe('Valparaíso')
    expect(footer.telefono).toBe('+56 9 8765 4321')
    expect(footer.email).toBe('contacto@sonrisas.cl')
    expect(footer.instagramUrl).toBe('https://instagram.com/sonrisas')
    expect(footer.instagramHandle).toBe('@sonrisas')
    expect(footer.facebook).toBe('Clínica Dental Sonrisas')
  })

  it('degrada con un config que solo trae { nombre } — sin lanzar', () => {
    expect(() => buildFooter(configSoloNombre())).not.toThrow()
    const footer = buildFooter(configSoloNombre())
    expect(footer.ciudad).toBeNull()
    expect(footer.telefono).toBeNull()
    expect(footer.email).toBeNull()
    expect(footer.instagramUrl).toBeNull()
    expect(footer.facebook).toBeNull()
  })
})
