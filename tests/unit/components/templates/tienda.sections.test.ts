import {
  buildHero,
  buildAbout,
  buildProductos,
  buildContacto,
  buildFooter,
} from '@/components/templates/tienda/sections'
import { SiteConfigDTO } from '@/application/dtos/SiteConfigDTO'
import { Estilo } from '@/domain/value-objects/Estilo'

function configCompleto(overrides: Partial<SiteConfigDTO> = {}): SiteConfigDTO {
  return {
    nombre: 'Tienda La Bodega',
    rubro: 'tienda',
    descripcion: 'Productos de barrio para el hogar y la despensa.',
    sobreNosotros: 'Familia bodeguera del cerro desde 1998, vendiendo lo esencial.',
    servicios: ['Detergente ecológico', 'Set de velas aromáticas', 'Café de origen'],
    ciudad: 'Valparaíso',
    contacto: { telefono: '+56 9 5555 8888', email: 'ventas@labodega.cl' },
    redes: { instagram: '@labodega', facebook: 'Tienda La Bodega' },
    estilo: Estilo.MODERNO,
    highlight: 'Despacho gratis sobre $20.000.',
    imagenes: [
      'https://images.unsplash.com/banner-bodega.jpg',
      'https://images.unsplash.com/producto1.jpg',
      'https://images.unsplash.com/producto2.jpg',
      'https://images.unsplash.com/producto3.jpg',
    ],
    colores: { primario: '#1B4332', secundario: '#2D6A4F', acento: '#D9A441', texto: '#ffffff' },
    ...overrides,
  }
}

// Mismo hard constraint que en los otros templates (D4, tests/e2e/steps/sitio-por-subdominio.steps.ts):
// el fixture del e2e crea sitios con configJson = { nombre: 'Sitio E2E' }.
function configSoloNombre(): SiteConfigDTO {
  return { nombre: 'Sitio E2E' } as SiteConfigDTO
}

describe('tienda/sections — buildHero', () => {
  it('arma el hero/banner completo desde un config lleno', () => {
    const hero = buildHero(configCompleto())

    expect(hero.nombre).toBe('Tienda La Bodega')
    expect(hero.descripcion).toBe('Productos de barrio para el hogar y la despensa.')
    expect(hero.rubro).toBe('TIENDA')
    expect(hero.imagenHero).toBe('https://images.unsplash.com/banner-bodega.jpg')
    expect(hero.whatsappUrl).toBe('https://wa.me/56955558888')
    expect(hero.telUrl).toBe('tel:+56 9 5555 8888')
    expect(hero.telefonoDisplay).toBe('+56 9 5555 8888')
    expect(hero.highlight).toBe('Despacho gratis sobre $20.000.')
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

describe('tienda/sections — buildAbout', () => {
  it('usa sobreNosotros cuando está presente', () => {
    expect(buildAbout(configCompleto())).toEqual({
      texto: 'Familia bodeguera del cerro desde 1998, vendiendo lo esencial.',
    })
  })

  it('cae a descripcion cuando sobreNosotros está ausente', () => {
    expect(buildAbout(configCompleto({ sobreNosotros: undefined }))).toEqual({
      texto: 'Productos de barrio para el hogar y la despensa.',
    })
  })

  it('retorna null (oculta la sección) cuando ni sobreNosotros ni descripcion existen', () => {
    expect(buildAbout(configSoloNombre())).toBeNull()
  })
})

describe('tienda/sections — buildProductos (grid 3-up con CTA de WhatsApp por card)', () => {
  it('usa la etiqueta "Productos" (identidad del template)', () => {
    expect(buildProductos(configCompleto())?.etiqueta).toBe('Productos')
  })

  it('excluye la primera imagen (usada en el banner) y empareja el resto con servicios, cada item con su propia whatsappUrl', () => {
    const whatsappEsperado = 'https://wa.me/56955558888'

    expect(buildProductos(configCompleto())?.items).toEqual([
      { imagen: 'https://images.unsplash.com/producto1.jpg', texto: 'Detergente ecológico', whatsappUrl: whatsappEsperado },
      { imagen: 'https://images.unsplash.com/producto2.jpg', texto: 'Set de velas aromáticas', whatsappUrl: whatsappEsperado },
      { imagen: 'https://images.unsplash.com/producto3.jpg', texto: 'Café de origen', whatsappUrl: whatsappEsperado },
    ])
  })

  it('incluye imágenes de producto sin texto cuando hay más imágenes que servicios', () => {
    const items = buildProductos(
      configCompleto({ servicios: ['Detergente ecológico'] }),
    )?.items

    expect(items).toEqual([
      { imagen: 'https://images.unsplash.com/producto1.jpg', texto: 'Detergente ecológico', whatsappUrl: 'https://wa.me/56955558888' },
      { imagen: 'https://images.unsplash.com/producto2.jpg', texto: null, whatsappUrl: 'https://wa.me/56955558888' },
      { imagen: 'https://images.unsplash.com/producto3.jpg', texto: null, whatsappUrl: 'https://wa.me/56955558888' },
    ])
  })

  it('whatsappUrl de cada card es null cuando el config no trae teléfono', () => {
    const contactoSinTelefono = { telefono: '', email: 'ventas@labodega.cl' }
    const items = buildProductos(configCompleto({ contacto: contactoSinTelefono }))?.items

    expect(items?.every((item) => item.whatsappUrl === null)).toBe(true)
  })

  it('retorna null cuando solo queda la imagen del banner (sin imágenes de producto)', () => {
    expect(buildProductos(configCompleto({ imagenes: ['https://images.unsplash.com/banner-bodega.jpg'] }))).toBeNull()
  })

  it('retorna null cuando no hay imágenes en absoluto (config { nombre } only)', () => {
    expect(buildProductos(configSoloNombre())).toBeNull()
  })
})

describe('tienda/sections — buildContacto (defaults del formulario + datos de la barra sticky)', () => {
  it('con formulario ausente, el form queda habilitado por defecto apuntando a contacto.email, y expone whatsappUrl para la barra sticky', () => {
    const contacto = buildContacto(configCompleto())

    expect(contacto.formularioHabilitado).toBe(true)
    expect(contacto.mailtoUrl).toBe(`mailto:${encodeURIComponent('ventas@labodega.cl')}`)
    expect(contacto.telefono).toBe('+56 9 5555 8888')
    expect(contacto.email).toBe('ventas@labodega.cl')
    expect(contacto.whatsappUrl).toBe('https://wa.me/56955558888')
  })

  it('respeta un destinatarioEmail explícito del formulario', () => {
    const contacto = buildContacto(
      configCompleto({
        contacto: {
          telefono: '+56 9 5555 8888',
          email: 'ventas@labodega.cl',
          formulario: { habilitado: true, destinatarioEmail: 'admin@labodega.cl' },
        },
      }),
    )

    expect(contacto.mailtoUrl).toBe(`mailto:${encodeURIComponent('admin@labodega.cl')}`)
  })

  it('respeta formulario.habilitado === false', () => {
    const contacto = buildContacto(
      configCompleto({
        contacto: { telefono: '+56 9 5555 8888', email: 'ventas@labodega.cl', formulario: { habilitado: false } },
      }),
    )

    expect(contacto.formularioHabilitado).toBe(false)
  })

  it('degrada con un config que solo trae { nombre } — sin lanzar, formulario igual habilitado, sin whatsappUrl', () => {
    expect(() => buildContacto(configSoloNombre())).not.toThrow()
    const contacto = buildContacto(configSoloNombre())
    expect(contacto.formularioHabilitado).toBe(true)
    expect(contacto.telefono).toBeNull()
    expect(contacto.email).toBeNull()
    expect(contacto.mailtoUrl).toBeNull()
    expect(contacto.whatsappUrl).toBeNull()
  })
})

describe('tienda/sections — buildFooter', () => {
  it('arma el footer desde un config lleno', () => {
    const footer = buildFooter(configCompleto())

    expect(footer.ciudad).toBe('Valparaíso')
    expect(footer.telefono).toBe('+56 9 5555 8888')
    expect(footer.email).toBe('ventas@labodega.cl')
    expect(footer.instagramUrl).toBe('https://instagram.com/labodega')
    expect(footer.instagramHandle).toBe('@labodega')
    expect(footer.facebook).toBe('Tienda La Bodega')
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
