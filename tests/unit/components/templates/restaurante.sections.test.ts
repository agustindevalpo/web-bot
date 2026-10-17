import {
  buildAccionesHero,
  buildCarta,
  buildDatosHero,
  buildLocal,
  fotoHeroPropia,
  textoPlatos,
  ubicacionLocal,
} from '@/components/templates/restaurante/sections'
import { copyReserva, esPanaderia } from '@/components/templates/restaurante/copy'
import { SiteConfigDTO } from '@/application/dtos/SiteConfigDTO'

const BASE = 'https://media.devalpo.cl'
const propia = (n: number) => `${BASE}/sitios/abc123/foto-${n}.jpg`
const BANCO = 'https://images.unsplash.com/photo-1?w=1600'

function config(overrides: Record<string, unknown> = {}): SiteConfigDTO {
  return {
    nombre: 'El Fogón',
    rubro: 'restaurante',
    ciudad: 'Valparaíso',
    contacto: { telefono: '+56 9 5555 1234', email: 'reservas@elfogon.cl' },
    servicios: ['Congrio frito', 'Pastel de choclo'],
    ...overrides,
  } as unknown as SiteConfigDTO
}

describe('restaurante/copy', () => {
  it.each([
    ['restaurante', false],
    ['panaderia', true],
    [' Panaderia ', true],
    [undefined, false],
    [42, false],
  ])('esPanaderia(%j) → %s', (rubro, esperado) => {
    expect(esPanaderia(rubro)).toBe(esperado)
  })

  it('restaurante: copy de reserva', () => {
    const copy = copyReserva('restaurante')
    expect(copy).toMatchObject({
      etiquetaNav: 'Reservas',
      ctaHeader: 'Reservar mesa',
      ctaHeroPrimario: 'Reservar por WhatsApp',
      eyebrow: 'Reservas',
      titulo: 'Reserva tu mesa',
      parrafo: 'Cuéntanos para cuántas personas y cuándo. Te respondemos por WhatsApp para confirmar.',
    })
  })

  it('panadería (P3): copy de encargo', () => {
    const copy = copyReserva('panaderia')
    expect(copy).toMatchObject({
      esEncargo: true,
      etiquetaNav: 'Encargos',
      ctaHeader: 'Hacer un encargo',
      ctaHeroPrimario: 'Encargar por WhatsApp',
      eyebrow: 'Encargos',
      titulo: 'Haz tu encargo',
      parrafo: 'Cuéntanos qué quieres encargar y para cuándo. Te respondemos por WhatsApp para confirmar.',
    })
  })
})

describe('restaurante/sections — buildCarta', () => {
  it('sin menu ni servicios → null (sin sección ni "Carta" en el nav)', () => {
    expect(buildCarta({ nombre: 'X' } as SiteConfigDTO)).toBeNull()
    expect(buildCarta(config({ servicios: [] }))).toBeNull()
  })

  it('sin precios: forma grande, H2 "Lo que preparamos", sin nota', () => {
    const carta = buildCarta(config())
    expect(carta).toMatchObject({ eyebrow: 'La carta', titulo: 'Lo que preparamos', forma: 'grande', totalPlatos: 2, nota: null })
  })

  it('con algún precio: forma con guías, H2 "Nuestra carta" y nota de precios referenciales', () => {
    const carta = buildCarta(config({ menu: [{ items: [{ nombre: 'Congrio', precio: '$11.900' }, { nombre: 'Pastel' }] }] }))
    expect(carta?.forma).toBe('guias')
    expect(carta?.titulo).toBe('Nuestra carta')
    expect(carta?.nota).toBe('Precios referenciales. Algunos platos varían según el día; confírmalos al reservar.')
  })

  it('"menú del día" sin precios agrega su nota; sin ese plato no hay nota', () => {
    const con = buildCarta(config({ servicios: ['Menú del día', 'Postre'] }))
    expect(con?.nota).toBe('Pregunta por el menú del día al reservar.')
    expect(buildCarta(config())?.nota).toBeNull()
  })

  it('el enlace abre WhatsApp con la consulta de la carta; sin teléfono no hay enlace', () => {
    expect(buildCarta(config())?.enlaceWhatsapp).toBe(
      `https://wa.me/56955551234?text=${encodeURIComponent('Hola, quiero hacer una consulta sobre la carta.')}`,
    )
    expect(buildCarta(config({ contacto: { email: 'a@b.cl' } }))?.enlaceWhatsapp).toBeNull()
  })
})

describe('restaurante/sections — fotoHeroPropia (P2)', () => {
  it('imagenes[0] propia → la foto', () => {
    expect(fotoHeroPropia([propia(0), propia(1)], BASE)).toBe(propia(0))
  })

  it('imagenes[0] de banco → null (hero tipográfico), aunque haya fotos propias después', () => {
    expect(fotoHeroPropia([BANCO, propia(1)], BASE)).toBeNull()
  })

  it.each([
    ['sin imágenes', []],
    ['imagenes ausente', undefined],
    ['valor raro', [42]],
  ])('%s → null', (_nombre, imagenes) => {
    expect(fotoHeroPropia(imagenes, BASE)).toBeNull()
  })

  it('sin base pública (R2 sin configurar) nunca hay foto propia', () => {
    expect(fotoHeroPropia([propia(0)], null)).toBeNull()
  })
})

describe('restaurante/sections — buildDatosHero', () => {
  const copy = copyReserva('restaurante')
  const carta = (cfg: SiteConfigDTO) => buildCarta(cfg)

  it('tres celdas: Dónde (ciudad), Reservas (teléfono) y La carta', () => {
    const cfg = config()
    expect(buildDatosHero(cfg, carta(cfg), copy)).toEqual([
      { rotulo: 'Dónde', valor: 'Valparaíso' },
      { rotulo: 'Reservas', valor: '+56 9 5555 1234' },
      { rotulo: 'La carta', valor: '2 platos' },
    ])
  })

  it('"Dónde" prefiere la dirección a la ciudad', () => {
    const cfg = config({ contacto: { telefono: '+56 9 1', direccion: 'Av. Libertad 1200' } })
    expect(buildDatosHero(cfg, carta(cfg), copy)[0]).toEqual({ rotulo: 'Dónde', valor: 'Av. Libertad 1200' })
  })

  it('sin teléfono no hay celda "Reservas"; sin carta no hay celda "La carta"', () => {
    const sinTelefono = config({ contacto: { email: 'a@b.cl' } })
    expect(buildDatosHero(sinTelefono, carta(sinTelefono), copy).map((d) => d.rotulo)).toEqual(['Dónde', 'La carta'])

    const sinCarta = config({ servicios: [] })
    expect(buildDatosHero(sinCarta, carta(sinCarta), copy).map((d) => d.rotulo)).toEqual(['Dónde', 'Reservas'])
  })

  it('un solo plato se escribe en singular', () => {
    expect(textoPlatos(1)).toBe('1 plato')
    expect(textoPlatos(5)).toBe('5 platos')
  })

  it('no inventa datos: sin nada que mostrar la lista queda vacía', () => {
    expect(buildDatosHero({ nombre: 'X' } as SiteConfigDTO, null, copy)).toEqual([])
  })

  it('panadería rotula la celda del teléfono como "Encargos"', () => {
    const cfg = config({ rubro: 'panaderia' })
    expect(buildDatosHero(cfg, null, copyReserva('panaderia')).map((d) => d.rotulo)).toEqual(['Dónde', 'Encargos'])
  })
})

describe('restaurante/sections — buildAccionesHero', () => {
  const copy = copyReserva('restaurante')

  it('con teléfono: "Reservar por WhatsApp" → #reservas y "Ver la carta" → #carta', () => {
    const cfg = config()
    expect(buildAccionesHero(cfg, buildCarta(cfg), copy)).toEqual({
      primaria: { texto: 'Reservar por WhatsApp', href: '#reservas', interno: true },
      secundaria: { texto: 'Ver la carta', href: '#carta', interno: true },
    })
  })

  it('sin carta se omite el botón secundario', () => {
    expect(buildAccionesHero(config({ servicios: [] }), null, copy).secundaria).toBeNull()
  })

  it('sin teléfono: "Escríbenos" con mailto:', () => {
    const cfg = config({ contacto: { email: 'reservas@elfogon.cl' } })
    expect(buildAccionesHero(cfg, null, copy).primaria).toEqual({
      texto: 'Escríbenos',
      href: 'mailto:reservas%40elfogon.cl',
      interno: true,
    })
  })

  it('sin teléfono ni correo no hay botón primario', () => {
    expect(buildAccionesHero({ nombre: 'X' } as SiteConfigDTO, null, copy).primaria).toBeNull()
  })

  it('panadería: "Encargar por WhatsApp"', () => {
    expect(buildAccionesHero(config(), null, copyReserva('panaderia')).primaria?.texto).toBe('Encargar por WhatsApp')
  })
})

describe('restaurante/sections — buildLocal ("El local")', () => {
  const con = (imagenes: unknown) => config({ imagenes: imagenes as never, ciudad: 'Valparaíso' })

  it.each([
    ['sin fotos', [propia(0)]],
    ['una sola foto propia en imagenes[1..]', [propia(0), propia(1)]],
    ['dos fotos de banco', [propia(0), BANCO, BANCO]],
  ])('%s → no se renderiza', (_nombre, imagenes) => {
    expect(buildLocal(con(imagenes), BASE)).toBeNull()
  })

  it('2 fotos propias → dos, filas de 520px, título "El local" y ciudad', () => {
    const local = buildLocal(con([propia(0), propia(1), propia(2)]), BASE)
    expect(local).toMatchObject({ titulo: 'El local', ciudad: 'Valparaíso', disposicion: 'dos', altoDosPx: 520 })
    expect(local?.fotos.map((foto) => foto.alt)).toEqual(['El Fogón — el local 1', 'El Fogón — el local 2'])
  })

  it('3 o más → tres, solo las 3 primeras de imagenes[1..]', () => {
    const local = buildLocal(con([propia(0), propia(1), propia(2), propia(3), propia(4)]), BASE)
    expect(local?.disposicion).toBe('tres')
    expect(local?.fotos.map((foto) => foto.src)).toEqual([propia(1), propia(2), propia(3)])
  })

  it('el banco entre las propias no cuenta y no se usa', () => {
    expect(buildLocal(con([propia(0), propia(1), BANCO]), BASE)).toBeNull()
  })

  it('sin base pública → null', () => {
    expect(buildLocal(con([propia(0), propia(1), propia(2)]), null)).toBeNull()
  })
})

describe('restaurante/sections — ubicacionLocal', () => {
  it.each([
    [true, true, 'carta'],
    [false, true, 'inicio'],
    [true, false, null],
    [false, false, null],
  ])('hayCarta=%s, hayLocal=%s → %s', (hayCarta, hayLocal, esperado) => {
    expect(ubicacionLocal(hayCarta, hayLocal)).toBe(esperado)
  })
})

describe('buildCarta — carta en PDF (R6)', () => {
  const pdf = `${BASE}/sitios/abc123/carta-1.pdf`

  it('enlaza un PDF propio', () => {
    expect(buildCarta(config({ cartaPdf: pdf }), BASE)?.enlacePdf).toBe(pdf)
  })

  it.each([
    ['sin cartaPdf', undefined],
    ['URL externa', 'https://ejemplo.cl/carta.pdf'],
    ['propio pero no PDF', `${BASE}/sitios/abc123/foto-1.jpg`],
  ])('no enlaza: %s', (_nombre, cartaPdf) => {
    expect(buildCarta(config({ cartaPdf }), BASE)?.enlacePdf).toBeNull()
  })

  it('sin base pública (storage no configurado) no enlaza', () => {
    expect(buildCarta(config({ cartaPdf: pdf }))?.enlacePdf).toBeNull()
  })

  it('sin platos no resucita la sección aunque haya PDF', () => {
    expect(buildCarta(config({ servicios: [], cartaPdf: pdf }), BASE)).toBeNull()
  })
})
