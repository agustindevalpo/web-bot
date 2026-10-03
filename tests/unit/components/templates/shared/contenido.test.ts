import { comoPartesNosotros, comoAutorHighlight, comoLegal, comoHorarios } from '@/components/templates/shared/contenido'
import { fotoDeServicio, precioDeServicio } from '@/components/templates/shared/servicios'

const NO_OBJETOS: [string, unknown][] = [
  ['undefined', undefined],
  ['null', null],
  ['número', 42],
  ['booleano', true],
  ['string', 'texto'],
  ['array', []],
]

describe('fotoDeServicio / precioDeServicio', () => {
  it('devuelven el campo trimeado del shape objeto', () => {
    const item = { nombre: 'Corte', foto: '  https://x.cl/a.jpg ', precioDesde: ' Desde $25.000 ' }
    expect(fotoDeServicio(item)).toBe('https://x.cl/a.jpg')
    expect(precioDeServicio(item)).toBe('Desde $25.000')
  })

  it.each([
    ['string legado', 'Corte'],
    ['null', null],
    ['undefined', undefined],
    ['número', 5],
    ['array', ['a']],
    ['sin campos', { nombre: 'Corte' }],
    ['vacíos', { nombre: 'Corte', foto: '', precioDesde: '' }],
    ['solo espacios', { nombre: 'Corte', foto: '   ', precioDesde: '\n\t' }],
    ['tipo equivocado', { nombre: 'Corte', foto: 12, precioDesde: { a: 1 } }],
  ])('devuelven null con %s', (_etiqueta, item) => {
    expect(fotoDeServicio(item)).toBeNull()
    expect(precioDeServicio(item)).toBeNull()
  })

  it('cada campo es independiente del otro', () => {
    expect(fotoDeServicio({ nombre: 'a', foto: 'f.jpg' })).toBe('f.jpg')
    expect(precioDeServicio({ nombre: 'a', foto: 'f.jpg' })).toBeNull()
  })
})

describe('comoPartesNosotros', () => {
  it('devuelve las tres partes en orden fijo sin importar el orden del objeto', () => {
    expect(comoPartesNosotros({ distinto: 'c', desde: 'a', quien: 'b' })).toEqual([
      { clave: 'desde', texto: 'a' },
      { clave: 'quien', texto: 'b' },
      { clave: 'distinto', texto: 'c' },
    ])
  })

  it('descarta partes vacías, con espacios o de tipo equivocado y trimea', () => {
    expect(comoPartesNosotros({ desde: '  2015 ', quien: '   ', distinto: 7 })).toEqual([{ clave: 'desde', texto: '2015' }])
  })

  it('ignora claves desconocidas', () => {
    expect(comoPartesNosotros({ otra: 'x', quien: 'b' })).toEqual([{ clave: 'quien', texto: 'b' }])
  })

  it.each(NO_OBJETOS)('devuelve [] con %s', (_etiqueta, valor) => {
    expect(comoPartesNosotros(valor)).toEqual([])
  })

  it('devuelve [] con objeto vacío', () => {
    expect(comoPartesNosotros({})).toEqual([])
  })
})

describe('comoAutorHighlight', () => {
  it('devuelve nombre y cargo trimeados', () => {
    expect(comoAutorHighlight({ nombre: ' Ana ', cargo: ' Dueña ' })).toEqual({ nombre: 'Ana', cargo: 'Dueña' })
  })

  it('cargo ausente, vacío o de tipo equivocado queda en null', () => {
    expect(comoAutorHighlight({ nombre: 'Ana' })).toEqual({ nombre: 'Ana', cargo: null })
    expect(comoAutorHighlight({ nombre: 'Ana', cargo: '  ' })).toEqual({ nombre: 'Ana', cargo: null })
    expect(comoAutorHighlight({ nombre: 'Ana', cargo: 3 })).toEqual({ nombre: 'Ana', cargo: null })
  })

  it('sin nombre válido devuelve null aunque haya cargo', () => {
    expect(comoAutorHighlight({ cargo: 'Dueña' })).toBeNull()
    expect(comoAutorHighlight({ nombre: '', cargo: 'Dueña' })).toBeNull()
    expect(comoAutorHighlight({ nombre: '   ' })).toBeNull()
    expect(comoAutorHighlight({ nombre: 5 })).toBeNull()
  })

  it.each(NO_OBJETOS)('devuelve null con %s', (_etiqueta, valor) => {
    expect(comoAutorHighlight(valor)).toBeNull()
  })
})

describe('comoLegal', () => {
  it('devuelve razón social y RUT trimeados', () => {
    expect(comoLegal({ razonSocial: ' Devalpo SpA ', rut: ' 77.119.936-4 ' })).toEqual({
      razonSocial: 'Devalpo SpA',
      rut: '77.119.936-4',
    })
  })

  it('nunca muestra la mitad: falta, vacío o tipo equivocado en cualquiera da null', () => {
    expect(comoLegal({ razonSocial: 'Devalpo SpA' })).toBeNull()
    expect(comoLegal({ rut: '77.119.936-4' })).toBeNull()
    expect(comoLegal({ razonSocial: 'Devalpo SpA', rut: '   ' })).toBeNull()
    expect(comoLegal({ razonSocial: '', rut: '77.119.936-4' })).toBeNull()
    expect(comoLegal({ razonSocial: 'Devalpo SpA', rut: 77119936 })).toBeNull()
  })

  it.each(NO_OBJETOS)('devuelve null con %s', (_etiqueta, valor) => {
    expect(comoLegal(valor)).toBeNull()
  })
})

describe('comoHorarios', () => {
  it('conserva el orden y trimea, sin tope', () => {
    const entrada = [1, 2, 3, 4, 5].map((n) => ({ dia: ` D${n} `, rango: ` ${n}-${n + 1} ` }))
    const salida = comoHorarios(entrada)
    expect(salida).toHaveLength(5)
    expect(salida[0]).toEqual({ dia: 'D1', rango: '1-2' })
    expect(salida[4]).toEqual({ dia: 'D5', rango: '5-6' })
  })

  it('descarta entradas incompletas, vacías, de tipo equivocado o no-objeto, y conserva las válidas', () => {
    expect(
      comoHorarios([
        { dia: 'Lun', rango: '9-18' },
        { dia: 'Mar' },
        { rango: '9-18' },
        { dia: '  ', rango: '9-18' },
        { dia: 'Mié', rango: '' },
        { dia: 5, rango: '9-18' },
        null,
        'Jue 9-18',
        42,
        [],
        { dia: 'Vie', rango: '9-14' },
      ]),
    ).toEqual([
      { dia: 'Lun', rango: '9-18' },
      { dia: 'Vie', rango: '9-14' },
    ])
  })

  it.each([undefined, null, 'x', 3, {}, { dia: 'Lun', rango: '9' }])('devuelve [] si no es un array (%j)', (valor) => {
    expect(comoHorarios(valor)).toEqual([])
  })

  it('devuelve [] con array vacío', () => {
    expect(comoHorarios([])).toEqual([])
  })
})
