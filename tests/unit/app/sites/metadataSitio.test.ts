import { construirMetadataSitio, construirUrlImagenOg } from '@/app/sites/metadataSitio'
import { SiteConfigDTO } from '@/application/dtos/SiteConfigDTO'
import { Estilo } from '@/domain/value-objects/Estilo'

const URL_ABSOLUTA = 'https://panaderia.sitios.devalpo.cl'
const SUFIJO = 'Conoce nuestros servicios y contáctanos.'

function config(overrides: Partial<SiteConfigDTO> = {}): SiteConfigDTO {
  return {
    nombre: 'Panadería La Espiga',
    rubro: 'Panadería',
    descripcion: 'Pan artesanal todos los días.',
    servicios: [],
    ciudad: 'Providencia',
    contacto: { telefono: '', email: '' },
    redes: {},
    estilo: Estilo.CALIDO,
    highlight: '',
    ...overrides,
  }
}

describe('construirMetadataSitio — título y descripción (Decisión D-D)', () => {
  it.each([
    [
      'todos los campos poblados',
      {},
      'Panadería La Espiga | Panadería en Providencia',
      'Pan artesanal todos los días.',
    ],
    [
      'descripcion vacía → se deriva',
      { descripcion: '' },
      'Panadería La Espiga | Panadería en Providencia',
      `Panadería La Espiga, Panadería en Providencia. ${SUFIJO}`,
    ],
    [
      'descripcion y ciudad vacías → se omite "en {ciudad}"',
      { descripcion: '  ', ciudad: '' },
      'Panadería La Espiga | Panadería',
      `Panadería La Espiga, Panadería. ${SUFIJO}`,
    ],
    [
      'descripcion y rubro vacíos → se omite el rubro',
      { descripcion: '', rubro: '' },
      'Panadería La Espiga | Providencia',
      `Panadería La Espiga, Providencia. ${SUFIJO}`,
    ],
    [
      'descripcion, rubro y ciudad vacíos → solo queda el nombre',
      { descripcion: '', rubro: '', ciudad: '' },
      'Panadería La Espiga',
      `Panadería La Espiga. ${SUFIJO}`,
    ],
    [
      'descripcion y nombre vacíos → se omite el nombre',
      { descripcion: '', nombre: '' },
      'Panadería en Providencia',
      `Panadería en Providencia. ${SUFIJO}`,
    ],
  ])('%s', (_caso, overrides, tituloEsperado, descripcionEsperada) => {
    const metadata = construirMetadataSitio(config(overrides), URL_ABSOLUTA)

    expect(metadata.title).toBe(tituloEsperado)
    expect(metadata.description).toBe(descripcionEsperada)
    expect(metadata.openGraph?.title).toBe(tituloEsperado)
    expect(metadata.openGraph?.description).toBe(descripcionEsperada)
  })

  it('nombre, rubro y ciudad en blanco (con descripcion también vacía) omite título y descripción', () => {
    const metadata = construirMetadataSitio(
      config({ nombre: '  ', rubro: '', ciudad: '', descripcion: '' }),
      URL_ABSOLUTA,
    )

    expect(metadata.title).toBeUndefined()
    expect(metadata.description).toBeUndefined()
    expect(metadata.openGraph?.title).toBeUndefined()
    expect(metadata.openGraph?.description).toBeUndefined()
  })
})

describe('construirMetadataSitio — og:url y og:type', () => {
  it('og:url es siempre la URL absoluta recibida, y og:type es "website"', () => {
    const metadata = construirMetadataSitio(config(), URL_ABSOLUTA)

    expect(metadata.openGraph?.url).toBe(URL_ABSOLUTA)
    // El tipo `OpenGraph` de Next es una unión discriminada por `type`
    // (website | article | ...); acá se afirma la forma concreta que
    // devuelve `construirMetadataSitio` en vez de acceder a `type`
    // directamente sobre la unión completa.
    expect(metadata.openGraph).toMatchObject({ type: 'website' })
  })
})

describe('construirMetadataSitio — og:image (Requirement "Open Graph Image Derivation")', () => {
  it('deriva og:image de la primera imagen cuando imagenes está presente', () => {
    const metadata = construirMetadataSitio(
      config({ imagenes: ['https://images.unsplash.com/photo-1?w=1200'] }),
      URL_ABSOLUTA,
    )

    expect(metadata.openGraph?.images).toEqual([
      'https://images.unsplash.com/photo-1?w=1200&h=630&fit=crop',
    ])
  })

  it('con 3 o más imágenes usa solo la primera (caso panaderia de rubroDefaults.ts)', () => {
    const metadata = construirMetadataSitio(
      config({
        imagenes: [
          'https://images.unsplash.com/photo-1?w=1200',
          'https://images.unsplash.com/photo-2?w=800',
          'https://images.unsplash.com/photo-3?w=800',
        ],
      }),
      URL_ABSOLUTA,
    )

    expect(metadata.openGraph?.images).toEqual([
      'https://images.unsplash.com/photo-1?w=1200&h=630&fit=crop',
    ])
  })

  it.each([
    ['imagenes ausente', undefined],
    ['imagenes vacío', []],
  ])('omite og:image cuando %s', (_caso, imagenes) => {
    const metadata = construirMetadataSitio(config({ imagenes }), URL_ABSOLUTA)

    expect(metadata.openGraph?.images).toBeUndefined()
  })
})

describe('construirUrlImagenOg', () => {
  it.each([
    [
      'URL con query string existente',
      'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1200',
      'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1200&h=630&fit=crop',
    ],
    [
      'URL sin query string',
      'https://images.unsplash.com/photo-1509440159596-0249088772ff',
      'https://images.unsplash.com/photo-1509440159596-0249088772ff?h=630&fit=crop',
    ],
  ])('%s', (_caso, entrada, esperado) => {
    expect(construirUrlImagenOg(entrada)).toBe(esperado)
  })

  it.each([
    ['string vacío', ''],
    ['path relativo sin protocolo', '/sites/imagenes/foto.jpg'],
    ['texto sin forma de URL', 'no-es-una-url'],
  ])('entrada no parseable (%s) devuelve undefined en vez de una URL rota', (_caso, entrada) => {
    expect(construirUrlImagenOg(entrada)).toBeUndefined()
  })
})
