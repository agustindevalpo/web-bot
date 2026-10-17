import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import Restaurante from '@/components/templates/restaurante'
import Carta from '@/components/templates/restaurante/Carta'
import HeroRestaurante from '@/components/templates/restaurante/HeroRestaurante'
import { buildCarta } from '@/components/templates/restaurante/sections'
import { SiteConfigDTO } from '@/application/dtos/SiteConfigDTO'

// Render de RESTAURANTE (S4): el entorno de Jest es 'node', así que se verifica
// el HTML. Los CSS Modules devuelven el nombre de clase pedido (styleMock).

const BASE = 'https://media.devalpo.cl'
jest.mock('@/infrastructure/container', () => ({
  getAlmacenamientoArchivos: () => ({ urlPublicaBase: () => 'https://media.devalpo.cl' }),
}))

const propia = (n: number) => `${BASE}/sitios/abc123/foto-${n}.jpg`
const BANCO = 'https://images.unsplash.com/photo-1?w=1600'

const COMPLETO = {
  nombre: 'El Fogón',
  rubro: 'restaurante',
  descripcion: 'Cocina de mar y campo.',
  ciudad: 'Valparaíso',
  contacto: { telefono: '+56 9 5555 1234', email: 'reservas@elfogon.cl', direccion: 'Av. Libertad 1200' },
  menu: [
    { categoria: 'Entradas', items: [{ nombre: 'Ceviche', precio: '$8.900' }] },
    { categoria: 'Fondos', items: [{ nombre: 'Congrio frito', precio: '$11.900' }, { nombre: 'Pastel de choclo' }] },
  ],
  horarios: [
    { dia: 'Martes a sábado', rango: '12:30 a 23:00' },
    { dia: 'Domingo', rango: '12:30 a 17:00' },
  ],
  imagenes: [propia(0), propia(1), propia(2)],
} as unknown as SiteConfigDTO

const MINIMO = {
  nombre: 'La Cazuela',
  rubro: 'restaurante',
  descripcion: 'Comida casera.',
  ciudad: 'Quilpué',
  servicios: ['Cazuela de vacuno', 'Pastel de choclo', 'Empanadas'],
  contacto: { telefono: '+56 9 1111 2222', email: 'hola@lacazuela.cl' },
} as unknown as SiteConfigDTO

async function render(config: SiteConfigDTO): Promise<string> {
  return renderToStaticMarkup(await Restaurante({ config }))
}

const con = (base: SiteConfigDTO, cambios: Record<string, unknown>) => ({ ...base, ...cambios }) as unknown as SiteConfigDTO

function navegacion(markup: string): string[] {
  const nav = markup.match(/<nav class="nav">(.*?)<\/nav>/)?.[1] ?? ''
  return [...nav.matchAll(/<a [^>]*>(.*?)<\/a>/g)].map((m) => m[1])
}

describe('RESTAURANTE — hero', () => {
  it('con foto propia usa la forma con foto (HeroBloques) y no la tipográfica', async () => {
    const markup = await render(COMPLETO)
    expect(markup).toContain('inicioFoto')
    expect(markup).not.toContain('data-datos-hero')
  })

  it('con foto de banco en imagenes[0] (P2) usa la forma tipográfica', async () => {
    const markup = await render(con(COMPLETO, { imagenes: [BANCO, propia(1), propia(2)] }))
    expect(markup).not.toContain('inicioFoto')
    expect(markup).toContain('data-datos-hero="3"')
  })

  it('sin imágenes usa la forma tipográfica con las tres celdas', async () => {
    const markup = await render(MINIMO)
    expect(markup).toContain('data-datos-hero="3"')
    expect(markup).toContain('Dónde')
    expect(markup).toContain('Quilpué')
    expect(markup).toContain('Reservas')
    expect(markup).toContain('+56 9 1111 2222')
    expect(markup).toContain('3 platos')
  })

  it('el botón primario lleva a #reservas en la misma pestaña y el secundario a #carta', async () => {
    const markup = await render(MINIMO)
    expect(markup).toMatch(/<a href="#reservas" class="ctaPrimaria">Reservar por WhatsApp<\/a>/)
    expect(markup).toMatch(/<a href="#carta" class="ctaSecundaria">Ver la carta<\/a>/)
  })

  it('el pill dice "{Rubro} · {ciudad}"', async () => {
    expect(await render(MINIMO)).toContain('Restaurante · Quilpué')
  })

  it('HeroRestaurante: dos celdas fijan dos columnas', () => {
    const markup = renderToStaticMarkup(
      React.createElement(HeroRestaurante, {
        eyebrow: null,
        nombre: 'Casa Sur',
        descripcion: null,
        foto: null,
        datos: [
          { rotulo: 'Dónde', valor: 'Reñaca' },
          { rotulo: 'La carta', valor: '1 plato' },
        ],
        primaria: null,
        secundaria: null,
      }),
    )
    expect(markup).toContain('data-datos-hero="2"')
    expect(markup).toContain('--columnas-datos:2')
    expect(markup).not.toContain('ctaPrimaria')
  })
})

describe('RESTAURANTE — navegación y header', () => {
  it('Inicio · Carta · Nosotros · Reservas; "El local" no está en el nav', async () => {
    const markup = await render(COMPLETO)
    expect(navegacion(markup)).toEqual(['Inicio', 'Carta', 'Nosotros', 'Reservas'])
    expect(markup).toContain('El local')
  })

  it('sin carta, "Carta" sale del nav y no hay sección #carta ni botón "Ver la carta"', async () => {
    const markup = await render(con(MINIMO, { servicios: [] }))
    expect(navegacion(markup)).toEqual(['Inicio', 'Nosotros', 'Reservas'])
    expect(markup).not.toContain('id="carta"')
    expect(markup).not.toContain('Ver la carta')
  })

  it('el CTA del header es "Reservar mesa" y lleva a #reservas', async () => {
    expect(await render(MINIMO)).toMatch(/<a href="#reservas" class="botonReservar">Reservar mesa<\/a>/)
  })

  it('data-template RESTAURANTE', async () => {
    expect(await render(MINIMO)).toContain('data-template="RESTAURANTE"')
  })
})

describe('RESTAURANTE — banda de horarios', () => {
  const horario = (dia: string, rango = '12:00 a 22:00') => ({ dia, rango })

  it.each([
    [0, false],
    [3, true],
    [4, false],
  ])('%i horarios → banda: %s', async (cantidad, hayBanda) => {
    const horarios = ['Lunes', 'Martes', 'Miércoles', 'Jueves'].slice(0, cantidad).map((dia) => horario(dia))
    const markup = await render(con(MINIMO, { horarios }))
    expect(markup.includes('data-banda-datos')).toBe(hayBanda)
  })

  it('con 4 horarios todos quedan en la tarjeta de Reservas', async () => {
    const horarios = ['Lunes', 'Martes', 'Miércoles', 'Jueves'].map((dia) => horario(dia))
    const markup = await render(con(MINIMO, { horarios }))
    expect(markup).toContain('tarjetaHorarios')
    for (const { dia } of horarios) expect(markup).toContain(`<span>${dia}</span>`)
  })

  it('un rango "Cerrado" no usa el estilo de horario', async () => {
    const markup = await render(con(MINIMO, { horarios: [horario('Lunes', 'Cerrado'), horario('Martes')] }))
    expect(markup).toContain('valor cerrado')
    expect(markup.match(/valor cerrado/g)).toHaveLength(1)
  })
})

describe('RESTAURANTE — footer', () => {
  const pie = (markup: string) => markup.match(/<footer.*<\/footer>/)?.[0] ?? ''

  it('glosa "{Rubro} en {ciudad}." con los horarios, sin repetir "Cerrado"', async () => {
    const markup = await render(
      con(MINIMO, {
        horarios: [
          { dia: 'Lunes', rango: 'Cerrado' },
          { dia: 'Martes a sábado', rango: '12:30 a 23:00' },
          { dia: 'Domingo', rango: '12:30 a 17:00' },
        ],
      }),
    )
    expect(pie(markup)).toContain('Restaurante en Quilpué. Martes a sábado 12:30 a 23:00, Domingo 12:30 a 17:00.')
    expect(pie(markup)).not.toContain('Cerrado')
  })

  it('con 4 horarios o más la glosa queda solo con la primera frase', async () => {
    const horarios = ['Lunes', 'Martes', 'Miércoles', 'Jueves'].map((dia) => ({ dia, rango: '12:00 a 22:00' }))
    const markup = pie(await render(con(MINIMO, { horarios })))
    expect(markup).toContain('Restaurante en Quilpué.')
    expect(markup).not.toContain('Miércoles')
  })

  it('línea legal con el nombre del negocio', async () => {
    expect(pie(await render(MINIMO))).toContain(`© ${new Date().getFullYear()} La Cazuela`)
  })
})

describe('RESTAURANTE — carta', () => {
  it('sin precios: forma grande, H2 "Lo que preparamos" y sin guías', async () => {
    const markup = await render(MINIMO)
    expect(markup).toContain('id="carta"')
    expect(markup).toContain('<h2 class="titulo"')
    expect(markup).toContain('Lo que preparamos')
    expect(markup).toContain('platoGrande')
    expect(markup).not.toContain('class="guia"')
  })

  it('con precios y categorías: guías, categorías y precio; el plato sin precio no lleva guía', async () => {
    const markup = await render(COMPLETO)
    expect(markup).toContain('Nuestra carta')
    expect(markup).toContain('<h3 class="categoria">Entradas</h3>')
    expect(markup).toContain('<h3 class="categoria">Fondos</h3>')
    expect(markup).toContain('$11.900')
    // 2 platos con precio → 2 guías; "Pastel de choclo" no suma una.
    expect(markup.match(/class="guia"/g)).toHaveLength(2)
    expect(markup).toContain('aria-hidden="true"')
  })

  it('pie: nota de precios y enlace de WhatsApp', async () => {
    const markup = await render(COMPLETO)
    expect(markup).toContain('Precios referenciales.')
    expect(markup).toContain('Reserva o pide por WhatsApp →')
    expect(markup).toContain(encodeURIComponent('Hola, quiero hacer una consulta sobre la carta.'))
  })

  it('sin teléfono el enlace de la carta no se renderiza', () => {
    const carta = buildCarta({ nombre: 'X', servicios: ['Sopa'] } as SiteConfigDTO)
    const markup = renderToStaticMarkup(React.createElement(Carta, { carta: carta! }))
    expect(markup).not.toContain('Reserva o pide por WhatsApp')
  })

  it('con guías y sin categorías, 6 a 8 platos van en dos columnas', () => {
    const menu = [{ items: Array.from({ length: 7 }, (_, i) => ({ nombre: `Plato ${i + 1}`, precio: `$${i + 1}.000` })) }]
    const carta = buildCarta({ nombre: 'X', menu } as unknown as SiteConfigDTO)!
    const markup = renderToStaticMarkup(React.createElement(Carta, { carta }))
    expect(markup).toContain('dosColumnas')
    expect(markup.match(/<ul class="lista">/g)).toHaveLength(2)
  })

  it('con guías y sin categorías, 5 platos o menos van en una columna', () => {
    const menu = [{ items: Array.from({ length: 5 }, (_, i) => ({ nombre: `Plato ${i + 1}`, precio: `$${i + 1}.000` })) }]
    const carta = buildCarta({ nombre: 'X', menu } as unknown as SiteConfigDTO)!
    const markup = renderToStaticMarkup(React.createElement(Carta, { carta }))
    expect(markup).toContain('unaColumna')
    expect(markup).not.toContain('dosColumnas')
  })

  it('forma grande con categorías: los títulos van arriba de cada grupo', () => {
    const menu = [
      { categoria: 'Entradas', items: [{ nombre: 'Ceviche' }] },
      { categoria: 'Fondos', items: [{ nombre: 'Congrio' }] },
    ]
    const carta = buildCarta({ nombre: 'X', menu } as unknown as SiteConfigDTO)!
    const markup = renderToStaticMarkup(React.createElement(Carta, { carta }))
    expect(markup).toContain('platoGrande')
    expect(markup).toContain('<h3 class="categoria">Entradas</h3>')
  })
})

describe('RESTAURANTE — El local', () => {
  const local = (imagenes: string[]) => con(MINIMO, { imagenes })

  it.each([
    ['0 fotos propias', [propia(0)], false],
    ['1 foto propia', [propia(0), propia(1)], false],
    ['2 fotos propias', [propia(0), propia(1), propia(2)], true],
    ['3 fotos propias', [propia(0), propia(1), propia(2), propia(3)], true],
  ])('%s → se renderiza: %s', async (_nombre, imagenes, esperado) => {
    const markup = await render(local(imagenes))
    expect(markup.includes('>El local<')).toBe(esperado)
  })

  it('con 2 fotos: disposición dos y filas de 520px; con 3: tres', async () => {
    const dos = await render(local([propia(0), propia(1), propia(2)]))
    expect(dos).toContain('galeria dos')
    expect(dos).toContain('--lugar-alto-dos:520px')
    const tres = await render(local([propia(0), propia(1), propia(2), propia(3)]))
    expect(tres).toContain('galeria tres')
  })

  it('El local va después de la carta, dentro de #carta; sin carta, dentro de #inicio', async () => {
    const imagenes = [propia(0), propia(1), propia(2)]
    const conCarta = await render(local(imagenes))
    expect(conCarta.indexOf('>El local<')).toBeGreaterThan(conCarta.indexOf('id="carta"'))
    expect(conCarta.indexOf('>El local<')).toBeLessThan(conCarta.indexOf('id="nosotros"'))

    const sinCarta = await render(con(local(imagenes), { servicios: [] }))
    expect(sinCarta.indexOf('>El local<')).toBeGreaterThan(sinCarta.indexOf('id="inicio"'))
    expect(sinCarta.indexOf('>El local<')).toBeLessThan(sinCarta.indexOf('id="nosotros"'))
  })
})

describe('RESTAURANTE — Nosotros y Reservas', () => {
  it('Nosotros: H2 "{nombre} en {ciudad}"', async () => {
    expect(await render(MINIMO)).toContain('La Cazuela en Quilpué')
  })

  it('Reservas: eyebrow, H2 y tarjetas; horarios y dirección en la columna derecha', async () => {
    const markup = await render(COMPLETO)
    expect(markup).toContain('id="reservas"')
    expect(markup).toContain('Reserva tu mesa')
    expect(markup).toContain('Dirección')
    expect(markup).toContain('Av. Libertad 1200')
    expect(markup).toContain('tarjetaHorarios')
  })

  it('sin teléfono: "Escríbenos para reservar." y botón "Escríbenos" con mailto:', async () => {
    const markup = await render(con(MINIMO, { contacto: { email: 'hola@lacazuela.cl' } }))
    expect(markup).toContain('Escríbenos para reservar.')
    expect(markup).toMatch(/<a href="mailto:hola%40lacazuela\.cl" class="ctaPrimaria">Escríbenos<\/a>/)
    expect(markup).not.toContain('Reservar por WhatsApp')
  })

  it('el botón flotante de WhatsApp existe solo con teléfono', async () => {
    expect(await render(MINIMO)).toContain('aria-label="Escríbenos por WhatsApp"')
    expect(await render(con(MINIMO, { contacto: { email: 'hola@lacazuela.cl' } }))).not.toContain('aria-label="Escríbenos por WhatsApp"')
  })
})

describe('RESTAURANTE — panadería (P3)', () => {
  const PANADERIA = con(MINIMO, { nombre: 'El Trigal', rubro: 'panaderia' })

  it('copy de encargo en header, hero, nav y Reservas; el ancla sigue siendo #reservas', async () => {
    const markup = await render(PANADERIA)
    expect(markup).toMatch(/<a href="#reservas" class="botonReservar">Hacer un encargo<\/a>/)
    expect(markup).toMatch(/<a href="#reservas" class="ctaPrimaria">Encargar por WhatsApp<\/a>/)
    expect(navegacion(markup)).toEqual(['Inicio', 'Carta', 'Nosotros', 'Encargos'])
    expect(markup).toContain('Haz tu encargo')
    expect(markup).toContain('Panadería · Quilpué')
    expect(markup).not.toContain('Reservar mesa')
    expect(markup).not.toContain('Reserva tu mesa')
  })
})
