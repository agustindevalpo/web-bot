import { normalizarCarta } from '@/application/shared/carta'

const plato = (nombre: string, precio?: string) => (precio === undefined ? { nombre } : { nombre, precio })
const nombres = (c: ReturnType<typeof normalizarCarta>) => c?.grupos.flatMap((g) => g.platos.map((p) => p.nombre))

describe('normalizarCarta: casos intermedios del spec', () => {
  it('menu con precios y sin categorías: forma con guías en 1 o 2 columnas', () => {
    const cinco = normalizarCarta([{ items: ['a', 'b', 'c', 'd', 'e'].map((n) => plato(n, '$1')) }], [])
    expect(cinco?.conPrecios).toBe(true)
    expect(cinco?.columnasSinCategorias?.map((c) => c.length)).toEqual([5])
    const seis = normalizarCarta([{ items: ['a', 'b', 'c', 'd', 'e', 'f'].map((n) => plato(n, '$1')) }], [])
    expect(seis?.columnasSinCategorias?.map((c) => c.length)).toEqual([3, 3])
  })

  it('menu con categorías y sin ningún precio: forma grande con títulos por grupo', () => {
    const c = normalizarCarta(
      [
        { categoria: 'Entradas', items: [plato('Ceviche')] },
        { categoria: 'Fondos', items: [plato('Lomo')] },
      ],
      [],
    )
    expect(c?.conPrecios).toBe(false)
    expect(c?.hayCategorias).toBe(true)
    expect(c?.grupos.map((g) => g.categoria)).toEqual(['Entradas', 'Fondos'])
    expect(c?.columnasSinCategorias).toBeNull()
  })

  it('menu con algunos platos sin precio: forma con guías, esos platos solo con nombre', () => {
    const c = normalizarCarta([{ items: [plato('Pan', '$2.000'), plato('Sopa')] }], [])
    expect(c?.conPrecios).toBe(true)
    expect(c?.grupos[0].platos).toEqual([{ nombre: 'Pan', precio: '$2.000' }, { nombre: 'Sopa' }])
  })

  it('una categoría con un solo plato se muestra igual y no se fusiona', () => {
    const c = normalizarCarta(
      [
        { categoria: 'Entradas', items: [plato('Ceviche', '$1')] },
        { categoria: 'Postres', items: [plato('Flan', '$1')] },
      ],
      [],
    )
    expect(c?.grupos).toHaveLength(2)
    expect(c?.grupos[0].platos).toHaveLength(1)
  })

  it('sin menu y con servicios: usa solo los nombres (string u objeto), sin precios ni categorías', () => {
    const c = normalizarCarta(undefined, ['Empanadas', { nombre: 'Pastel', descripcion: 'Con choclo', precioDesde: '$5' }])
    expect(c).toMatchObject({ conPrecios: false, hayCategorias: false, totalPlatos: 2 })
    expect(nombres(c)).toEqual(['Empanadas', 'Pastel'])
    expect(c?.grupos[0].platos.every((p) => p.precio === undefined)).toBe(true)
  })

  it('sin menu y sin servicios: null', () => {
    expect(normalizarCarta(undefined, [])).toBeNull()
    expect(normalizarCarta([], undefined)).toBeNull()
  })

  it('un solo plato: forma grande con una fila', () => {
    const c = normalizarCarta(undefined, ['Completo'])
    expect(c).toMatchObject({ conPrecios: false, totalPlatos: 1 })
    expect(c?.grupos).toHaveLength(1)
  })
})

describe('normalizarCarta: reglas de menu', () => {
  it('menu con al menos un plato reemplaza a servicios', () => {
    const c = normalizarCarta([{ items: [plato('Lomo')] }], ['Empanadas'])
    expect(nombres(c)).toEqual(['Lomo'])
  })

  it('menu sin platos válidos cae a servicios', () => {
    const c = normalizarCarta([{ items: [plato('  ')] }], ['Empanadas'])
    expect(nombres(c)).toEqual(['Empanadas'])
  })

  it('tope de 8 platos en orden de lectura entre grupos', () => {
    const c = normalizarCarta(
      [
        { categoria: 'A', items: ['1', '2', '3', '4', '5'].map((n) => plato(n)) },
        { categoria: 'B', items: ['6', '7', '8', '9', '10'].map((n) => plato(n)) },
      ],
      [],
    )
    expect(c?.totalPlatos).toBe(8)
    expect(nombres(c)).toEqual(['1', '2', '3', '4', '5', '6', '7', '8'])
  })

  it('un grupo que queda sin platos tras el tope no aparece', () => {
    const c = normalizarCarta(
      [
        { categoria: 'A', items: Array.from({ length: 8 }, (_, i) => plato(`p${i}`)) },
        { categoria: 'B', items: [plato('extra')] },
      ],
      [],
    )
    expect(c?.grupos.map((g) => g.categoria)).toEqual(['A'])
  })

  it('tope de 3 categorías: las siguientes se descartan', () => {
    const c = normalizarCarta(['A', 'B', 'C', 'D'].map((categoria) => ({ categoria, items: [plato(`${categoria}1`)] })), [])
    expect(c?.grupos.map((g) => g.categoria)).toEqual(['A', 'B', 'C'])
  })

  it('conserva el orden guardado, sin ordenar', () => {
    const c = normalizarCarta(
      [
        { categoria: 'Postres', items: [plato('Zeta'), plato('Alfa')] },
        { categoria: 'Entradas', items: [plato('Beta')] },
      ],
      [],
    )
    expect(c?.grupos.map((g) => g.categoria)).toEqual(['Postres', 'Entradas'])
    expect(nombres(c)).toEqual(['Zeta', 'Alfa', 'Beta'])
  })

  it('el grupo sin categoría va primero y sin título', () => {
    const c = normalizarCarta(
      [
        { categoria: 'Fondos', items: [plato('Lomo')] },
        { items: [plato('Pan')] },
      ],
      [],
    )
    expect(c?.grupos[0]).toEqual({ platos: [{ nombre: 'Pan' }] })
    expect(c?.grupos[1].categoria).toBe('Fondos')
  })

  it('descarta nombres en blanco y grupos vacíos; categoría en blanco no cuenta', () => {
    const c = normalizarCarta(
      [
        { categoria: 'Vacía', items: [plato('   ')] },
        { categoria: '  ', items: [plato(' Pan ')] },
      ],
      [],
    )
    expect(c?.grupos).toEqual([{ platos: [{ nombre: 'Pan' }] }])
    expect(c?.hayCategorias).toBe(false)
  })

  it('el precio se imprime tal cual (solo trim); en blanco queda ausente', () => {
    const c = normalizarCarta([{ items: [plato('A', '  $11.900 '), plato('B', '   ')] }], [])
    expect(c?.grupos[0].platos).toEqual([{ nombre: 'A', precio: '$11.900' }, { nombre: 'B' }])
    expect(c?.conPrecios).toBe(true)
  })

  it('solo precios en blanco: sin precios', () => {
    expect(normalizarCarta([{ items: [plato('A', ' ')] }], [])?.conPrecios).toBe(false)
  })

  it('no lanza con datos malformados', () => {
    expect(normalizarCarta('x', 42)).toBeNull()
    expect(normalizarCarta([null, { items: 'x' }, { items: [null, 3] }], [null])).toBeNull()
  })
})

describe('normalizarCarta: nota del menú del día', () => {
  it.each([
    ['con tilde', 'Menú del día'],
    ['sin tilde y en mayúsculas', 'MENU DEL DIA almuerzo'],
  ])('sin precios y %s: true', (_n, nombre) => {
    expect(normalizarCarta(undefined, [nombre])?.notaMenuDelDia).toBe(true)
  })

  it('sin ítem de menú del día: false', () => {
    expect(normalizarCarta(undefined, ['Lomo'])?.notaMenuDelDia).toBe(false)
  })

  it('con precios: false aunque exista el ítem', () => {
    expect(normalizarCarta([{ items: [plato('Menú del día', '$6.000')] }], [])?.notaMenuDelDia).toBe(false)
  })
})

describe('normalizarCarta: columnas sin categorías', () => {
  const con = (n: number) => normalizarCarta([{ items: Array.from({ length: n }, (_, i) => plato(`p${i}`, '$1')) }], [])

  it.each([
    [5, [5]],
    [6, [3, 3]],
    [7, [4, 3]],
    [8, [4, 4]],
  ])('%i platos: columnas %j', (n, esperado) => {
    expect(con(n)?.columnasSinCategorias?.map((c) => c.length)).toEqual(esperado)
  })

  it('con categorías o sin precios no hay reparto', () => {
    expect(normalizarCarta([{ categoria: 'A', items: [plato('x', '$1')] }], [])?.columnasSinCategorias).toBeNull()
    expect(normalizarCarta(undefined, ['a', 'b', 'c', 'd', 'e', 'f'])?.columnasSinCategorias).toBeNull()
  })
})
