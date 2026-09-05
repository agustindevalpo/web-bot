import {
  buildHero,
  buildAbout,
  buildServicios,
  buildGaleria,
  buildContacto,
  buildFooter,
} from '@/components/templates/landing/sections'
import { SiteConfigDTO } from '@/application/dtos/SiteConfigDTO'
import { Estilo } from '@/domain/value-objects/Estilo'

function configCompleto(overrides: Partial<SiteConfigDTO> = {}): SiteConfigDTO {
  return {
    nombre: 'Panadería El Trigal',
    rubro: 'panaderia',
    descripcion: 'Pan artesanal con más de 20 años de tradición.',
    sobreNosotros: 'Nacimos en 2003 con un horno a leña y mucho cariño.',
    servicios: ['Pan artesanal', 'Tortas', 'Hallullas'],
    ciudad: 'Viña del Mar',
    contacto: { telefono: '+56 9 1234 5678', email: 'contacto@eltrigal.cl' },
    redes: { instagram: '@eltrigal', facebook: 'Panadería El Trigal' },
    estilo: Estilo.CALIDO,
    highlight: 'Horneamos tres veces al día.',
    imagenes: ['https://images.unsplash.com/hero.jpg', 'https://images.unsplash.com/galeria1.jpg'],
    colores: { primario: '#8B4513', secundario: '#D2691E', acento: '#FF8C00', texto: '#ffffff' },
    ...overrides,
  }
}

// El fixture del e2e existente (tests/e2e/steps/sitio-por-subdominio.steps.ts)
// crea sitios con configJson = { nombre: 'Sitio E2E' } — ningún builder debe
// lanzar ni asumir la presencia de otros campos (Hard constraint, design.md D4).
function configSoloNombre(): SiteConfigDTO {
  return { nombre: 'Sitio E2E' } as SiteConfigDTO
}

describe('landing/sections — buildHero', () => {
  it('arma el hero completo desde un config lleno', () => {
    const hero = buildHero(configCompleto())

    expect(hero.nombre).toBe('Panadería El Trigal')
    expect(hero.descripcion).toBe('Pan artesanal con más de 20 años de tradición.')
    expect(hero.rubro).toBe('PANADERIA')
    expect(hero.imagenHero).toBe('https://images.unsplash.com/hero.jpg')
    expect(hero.whatsappUrl).toBe('https://wa.me/56912345678')
    expect(hero.telUrl).toBe('tel:+56 9 1234 5678')
    expect(hero.telefonoDisplay).toBe('+56 9 1234 5678')
    expect(hero.highlight).toBe('Horneamos tres veces al día.')
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

describe('landing/sections — buildAbout', () => {
  it('usa sobreNosotros cuando está presente', () => {
    expect(buildAbout(configCompleto())).toEqual({ texto: 'Nacimos en 2003 con un horno a leña y mucho cariño.' })
  })

  it('cae a descripcion cuando sobreNosotros está ausente', () => {
    expect(buildAbout(configCompleto({ sobreNosotros: undefined }))).toEqual({
      texto: 'Pan artesanal con más de 20 años de tradición.',
    })
  })

  it('retorna null (oculta la sección) cuando ni sobreNosotros ni descripcion existen', () => {
    expect(buildAbout(configSoloNombre())).toBeNull()
  })
})

describe('landing/sections — buildServicios', () => {
  it('usa la etiqueta "Qué ofrecemos" para LANDING', () => {
    expect(buildServicios(configCompleto())?.etiqueta).toBe('Qué ofrecemos')
  })

  it('lista los servicios del config', () => {
    expect(buildServicios(configCompleto())?.items).toEqual(['Pan artesanal', 'Tortas', 'Hallullas'])
  })

  it('retorna null cuando no hay servicios (config { nombre } only)', () => {
    expect(buildServicios(configSoloNombre())).toBeNull()
  })
})

describe('landing/sections — buildGaleria', () => {
  it('excluye la primera imagen (usada en el hero) y deja el resto', () => {
    expect(buildGaleria(configCompleto())).toEqual({ imagenes: ['https://images.unsplash.com/galeria1.jpg'] })
  })

  it('retorna null cuando no hay imágenes de galería (config { nombre } only)', () => {
    expect(buildGaleria(configSoloNombre())).toBeNull()
  })
})

describe('landing/sections — buildContacto (defaults del formulario)', () => {
  it('con formulario ausente, el form queda habilitado por defecto apuntando a contacto.email', () => {
    const contacto = buildContacto(configCompleto())

    expect(contacto.formularioHabilitado).toBe(true)
    expect(contacto.mailtoUrl).toBe(`mailto:${encodeURIComponent('contacto@eltrigal.cl')}`)
    expect(contacto.telefono).toBe('+56 9 1234 5678')
    expect(contacto.email).toBe('contacto@eltrigal.cl')
  })

  it('respeta un destinatarioEmail explícito del formulario', () => {
    const contacto = buildContacto(
      configCompleto({
        contacto: {
          telefono: '+56 9 1234 5678',
          email: 'contacto@eltrigal.cl',
          formulario: { habilitado: true, destinatarioEmail: 'ventas@eltrigal.cl' },
        },
      }),
    )

    expect(contacto.mailtoUrl).toBe(`mailto:${encodeURIComponent('ventas@eltrigal.cl')}`)
  })

  it('respeta formulario.habilitado === false', () => {
    const contacto = buildContacto(
      configCompleto({
        contacto: { telefono: '+56 9 1234 5678', email: 'contacto@eltrigal.cl', formulario: { habilitado: false } },
      }),
    )

    expect(contacto.formularioHabilitado).toBe(false)
  })

  it('degrada con un config que solo trae { nombre } — sin lanzar, formulario igual habilitado', () => {
    expect(() => buildContacto(configSoloNombre())).not.toThrow()
    const contacto = buildContacto(configSoloNombre())
    expect(contacto.formularioHabilitado).toBe(true)
    expect(contacto.telefono).toBeNull()
    expect(contacto.email).toBeNull()
    expect(contacto.mailtoUrl).toBeNull()
  })
})

describe('landing/sections — buildFooter', () => {
  it('arma el footer desde un config lleno', () => {
    const footer = buildFooter(configCompleto())

    expect(footer.ciudad).toBe('Viña del Mar')
    expect(footer.telefono).toBe('+56 9 1234 5678')
    expect(footer.email).toBe('contacto@eltrigal.cl')
    expect(footer.instagramUrl).toBe('https://instagram.com/eltrigal')
    expect(footer.instagramHandle).toBe('@eltrigal')
    expect(footer.facebook).toBe('Panadería El Trigal')
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
