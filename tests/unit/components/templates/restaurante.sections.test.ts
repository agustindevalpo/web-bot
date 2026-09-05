import {
  buildHero,
  buildAbout,
  buildMenu,
  buildGaleria,
  buildContacto,
  buildFooter,
} from '@/components/templates/restaurante/sections'
import { SiteConfigDTO } from '@/application/dtos/SiteConfigDTO'
import { Estilo } from '@/domain/value-objects/Estilo'

function configCompleto(overrides: Partial<SiteConfigDTO> = {}): SiteConfigDTO {
  return {
    nombre: 'Restaurante El Fogón',
    rubro: 'restaurante',
    descripcion: 'Cocina de mar y campo en el corazón de Valparaíso.',
    sobreNosotros: 'Desde 2010 servimos recetas de familia junto al puerto.',
    servicios: ['Congrio frito', 'Chupe de mariscos', 'Pastel de choclo'],
    ciudad: 'Valparaíso',
    contacto: { telefono: '+56 9 5555 1234', email: 'reservas@elfogon.cl' },
    redes: { instagram: '@elfogon', facebook: 'Restaurante El Fogón' },
    estilo: Estilo.CALIDO,
    highlight: 'Reserva tu mesa con vista al mar.',
    imagenes: [
      'https://images.unsplash.com/hero-fogon.jpg',
      'https://images.unsplash.com/plato1.jpg',
      'https://images.unsplash.com/plato2.jpg',
    ],
    colores: { primario: '#3B1F0B', secundario: '#7A3E1D', acento: '#E8A33D', texto: '#ffffff' },
    ...overrides,
  }
}

// Mismo hard constraint que en landing/servicios (D4, tests/e2e/steps/sitio-por-subdominio.steps.ts):
// el fixture del e2e crea sitios con configJson = { nombre: 'Sitio E2E' }.
function configSoloNombre(): SiteConfigDTO {
  return { nombre: 'Sitio E2E' } as SiteConfigDTO
}

describe('restaurante/sections — buildHero', () => {
  it('arma el hero completo desde un config lleno', () => {
    const hero = buildHero(configCompleto())

    expect(hero.nombre).toBe('Restaurante El Fogón')
    expect(hero.descripcion).toBe('Cocina de mar y campo en el corazón de Valparaíso.')
    expect(hero.rubro).toBe('RESTAURANTE')
    expect(hero.imagenHero).toBe('https://images.unsplash.com/hero-fogon.jpg')
    expect(hero.whatsappUrl).toBe('https://wa.me/56955551234')
    expect(hero.telUrl).toBe('tel:+56 9 5555 1234')
    expect(hero.telefonoDisplay).toBe('+56 9 5555 1234')
    expect(hero.highlight).toBe('Reserva tu mesa con vista al mar.')
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

describe('restaurante/sections — buildAbout', () => {
  it('usa sobreNosotros cuando está presente', () => {
    expect(buildAbout(configCompleto())).toEqual({
      texto: 'Desde 2010 servimos recetas de familia junto al puerto.',
    })
  })

  it('cae a descripcion cuando sobreNosotros está ausente', () => {
    expect(buildAbout(configCompleto({ sobreNosotros: undefined }))).toEqual({
      texto: 'Cocina de mar y campo en el corazón de Valparaíso.',
    })
  })

  it('retorna null (oculta la sección) cuando ni sobreNosotros ni descripcion existen', () => {
    expect(buildAbout(configSoloNombre())).toBeNull()
  })
})

describe('restaurante/sections — buildMenu', () => {
  it('usa la etiqueta "Menú" (identidad del template)', () => {
    expect(buildMenu(configCompleto())?.etiqueta).toBe('Menú')
  })

  it('lista los platos del config en orden, para el layout de dos columnas', () => {
    expect(buildMenu(configCompleto())?.items).toEqual(['Congrio frito', 'Chupe de mariscos', 'Pastel de choclo'])
  })

  it('retorna null cuando no hay platos (config { nombre } only)', () => {
    expect(buildMenu(configSoloNombre())).toBeNull()
  })
})

describe('restaurante/sections — buildGaleria (franja cálida)', () => {
  it('excluye la primera imagen (usada en el hero) y deja el resto para la franja', () => {
    expect(buildGaleria(configCompleto())).toEqual({
      imagenes: ['https://images.unsplash.com/plato1.jpg', 'https://images.unsplash.com/plato2.jpg'],
    })
  })

  it('retorna null cuando no hay imágenes de galería (config { nombre } only)', () => {
    expect(buildGaleria(configSoloNombre())).toBeNull()
  })
})

describe('restaurante/sections — buildContacto (defaults del formulario)', () => {
  it('con formulario ausente, el form queda habilitado por defecto apuntando a contacto.email', () => {
    const contacto = buildContacto(configCompleto())

    expect(contacto.formularioHabilitado).toBe(true)
    expect(contacto.mailtoUrl).toBe(`mailto:${encodeURIComponent('reservas@elfogon.cl')}`)
    expect(contacto.telefono).toBe('+56 9 5555 1234')
    expect(contacto.email).toBe('reservas@elfogon.cl')
  })

  it('respeta un destinatarioEmail explícito del formulario', () => {
    const contacto = buildContacto(
      configCompleto({
        contacto: {
          telefono: '+56 9 5555 1234',
          email: 'reservas@elfogon.cl',
          formulario: { habilitado: true, destinatarioEmail: 'admin@elfogon.cl' },
        },
      }),
    )

    expect(contacto.mailtoUrl).toBe(`mailto:${encodeURIComponent('admin@elfogon.cl')}`)
  })

  it('respeta formulario.habilitado === false', () => {
    const contacto = buildContacto(
      configCompleto({
        contacto: { telefono: '+56 9 5555 1234', email: 'reservas@elfogon.cl', formulario: { habilitado: false } },
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

describe('restaurante/sections — buildFooter', () => {
  it('arma el footer desde un config lleno', () => {
    const footer = buildFooter(configCompleto())

    expect(footer.ciudad).toBe('Valparaíso')
    expect(footer.telefono).toBe('+56 9 5555 1234')
    expect(footer.email).toBe('reservas@elfogon.cl')
    expect(footer.instagramUrl).toBe('https://instagram.com/elfogon')
    expect(footer.instagramHandle).toBe('@elfogon')
    expect(footer.facebook).toBe('Restaurante El Fogón')
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
