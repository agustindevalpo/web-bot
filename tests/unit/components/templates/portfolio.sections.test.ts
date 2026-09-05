import {
  buildHero,
  buildAbout,
  buildTrabajos,
  buildContacto,
  buildFooter,
} from '@/components/templates/portfolio/sections'
import { SiteConfigDTO } from '@/application/dtos/SiteConfigDTO'
import { Estilo } from '@/domain/value-objects/Estilo'

function configCompleto(overrides: Partial<SiteConfigDTO> = {}): SiteConfigDTO {
  return {
    nombre: 'Taller Luz de Puerto',
    rubro: 'taller',
    descripcion: 'Fotografía y diseño editorial desde Valparaíso.',
    sobreNosotros: 'Diez años documentando historias del puerto en imagen y papel.',
    servicios: ['Retratos editoriales', 'Identidad de marca', 'Fotografía de producto'],
    ciudad: 'Valparaíso',
    contacto: { telefono: '+56 9 5555 4321', email: 'hola@luzdepuerto.cl' },
    redes: { instagram: '@luzdepuerto', facebook: 'Taller Luz de Puerto' },
    estilo: Estilo.MODERNO,
    highlight: 'Nuevos cupos para sesiones de primavera.',
    imagenes: [
      'https://images.unsplash.com/trabajo1.jpg',
      'https://images.unsplash.com/trabajo2.jpg',
      'https://images.unsplash.com/trabajo3.jpg',
    ],
    colores: { primario: '#0A0A0A', secundario: '#1F1F1F', acento: '#E8DCC8', texto: '#ffffff' },
    ...overrides,
  }
}

// Mismo hard constraint que en los otros templates (D4, tests/e2e/steps/sitio-por-subdominio.steps.ts):
// el fixture del e2e crea sitios con configJson = { nombre: 'Sitio E2E' }.
function configSoloNombre(): SiteConfigDTO {
  return { nombre: 'Sitio E2E' } as SiteConfigDTO
}

describe('portfolio/sections — buildHero', () => {
  it('arma el hero completo desde un config lleno, sin imagen (hero editorial solo tipografía)', () => {
    const hero = buildHero(configCompleto())

    expect(hero.nombre).toBe('Taller Luz de Puerto')
    expect(hero.descripcion).toBe('Fotografía y diseño editorial desde Valparaíso.')
    expect(hero.rubro).toBe('TALLER')
    expect(hero.whatsappUrl).toBe('https://wa.me/56955554321')
    expect(hero.telUrl).toBe('tel:+56 9 5555 4321')
    expect(hero.telefonoDisplay).toBe('+56 9 5555 4321')
    expect(hero.highlight).toBe('Nuevos cupos para sesiones de primavera.')
  })

  it('degrada con un config que solo trae { nombre } — sin lanzar', () => {
    expect(() => buildHero(configSoloNombre())).not.toThrow()
    const hero = buildHero(configSoloNombre())

    expect(hero.nombre).toBe('Sitio E2E')
    expect(hero.descripcion).toBeNull()
    expect(hero.rubro).toBeNull()
    expect(hero.whatsappUrl).toBeNull()
    expect(hero.telUrl).toBeNull()
    expect(hero.highlight).toBeNull()
  })

  it('no muestra el badge de rubro cuando rubro es "demo"', () => {
    expect(buildHero(configCompleto({ rubro: 'demo' })).rubro).toBeNull()
  })
})

describe('portfolio/sections — buildAbout', () => {
  it('usa sobreNosotros cuando está presente', () => {
    expect(buildAbout(configCompleto())).toEqual({
      texto: 'Diez años documentando historias del puerto en imagen y papel.',
    })
  })

  it('cae a descripcion cuando sobreNosotros está ausente', () => {
    expect(buildAbout(configCompleto({ sobreNosotros: undefined }))).toEqual({
      texto: 'Fotografía y diseño editorial desde Valparaíso.',
    })
  })

  it('retorna null (oculta la sección) cuando ni sobreNosotros ni descripcion existen', () => {
    expect(buildAbout(configSoloNombre())).toBeNull()
  })
})

describe('portfolio/sections — buildTrabajos (grid gallery-first)', () => {
  it('usa la etiqueta "Trabajos" (identidad del template)', () => {
    expect(buildTrabajos(configCompleto())?.etiqueta).toBe('Trabajos')
  })

  it('empareja cada imagen con el texto de servicios en el mismo índice, imagen-primero', () => {
    expect(buildTrabajos(configCompleto())?.items).toEqual([
      { imagen: 'https://images.unsplash.com/trabajo1.jpg', texto: 'Retratos editoriales' },
      { imagen: 'https://images.unsplash.com/trabajo2.jpg', texto: 'Identidad de marca' },
      { imagen: 'https://images.unsplash.com/trabajo3.jpg', texto: 'Fotografía de producto' },
    ])
  })

  it('incluye imágenes sin texto cuando hay más imágenes que servicios', () => {
    const items = buildTrabajos(
      configCompleto({ servicios: ['Retratos editoriales'] }),
    )?.items

    expect(items).toEqual([
      { imagen: 'https://images.unsplash.com/trabajo1.jpg', texto: 'Retratos editoriales' },
      { imagen: 'https://images.unsplash.com/trabajo2.jpg', texto: null },
      { imagen: 'https://images.unsplash.com/trabajo3.jpg', texto: null },
    ])
  })

  it('retorna null cuando no hay imágenes ni servicios (config { nombre } only)', () => {
    expect(buildTrabajos(configSoloNombre())).toBeNull()
  })
})

describe('portfolio/sections — buildContacto (defaults del formulario)', () => {
  it('con formulario ausente, el form queda habilitado por defecto apuntando a contacto.email', () => {
    const contacto = buildContacto(configCompleto())

    expect(contacto.formularioHabilitado).toBe(true)
    expect(contacto.mailtoUrl).toBe(`mailto:${encodeURIComponent('hola@luzdepuerto.cl')}`)
    expect(contacto.telefono).toBe('+56 9 5555 4321')
    expect(contacto.email).toBe('hola@luzdepuerto.cl')
  })

  it('respeta un destinatarioEmail explícito del formulario', () => {
    const contacto = buildContacto(
      configCompleto({
        contacto: {
          telefono: '+56 9 5555 4321',
          email: 'hola@luzdepuerto.cl',
          formulario: { habilitado: true, destinatarioEmail: 'admin@luzdepuerto.cl' },
        },
      }),
    )

    expect(contacto.mailtoUrl).toBe(`mailto:${encodeURIComponent('admin@luzdepuerto.cl')}`)
  })

  it('respeta formulario.habilitado === false', () => {
    const contacto = buildContacto(
      configCompleto({
        contacto: { telefono: '+56 9 5555 4321', email: 'hola@luzdepuerto.cl', formulario: { habilitado: false } },
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

describe('portfolio/sections — buildFooter', () => {
  it('arma el footer desde un config lleno', () => {
    const footer = buildFooter(configCompleto())

    expect(footer.ciudad).toBe('Valparaíso')
    expect(footer.telefono).toBe('+56 9 5555 4321')
    expect(footer.email).toBe('hola@luzdepuerto.cl')
    expect(footer.instagramUrl).toBe('https://instagram.com/luzdepuerto')
    expect(footer.instagramHandle).toBe('@luzdepuerto')
    expect(footer.facebook).toBe('Taller Luz de Puerto')
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
