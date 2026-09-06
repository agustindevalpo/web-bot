import {
  CUPOS_PROMO,
  CUPOS_VENDIDOS,
  PRECIO_MULTIPAGINA,
  PRECIO_PROMO,
  PRECIO_SITIO,
  RENOVACION_ANUAL,
  estadoPromo,
  formatCLP,
} from '@/app/_landing/precios'

describe('constantes de precio', () => {
  it('define los montos vigentes de la fábrica de sitios', () => {
    expect(PRECIO_SITIO).toBe(149990)
    expect(PRECIO_PROMO).toBe(119990)
    expect(CUPOS_PROMO).toBe(10)
    expect(CUPOS_VENDIDOS).toBe(0)
    expect(PRECIO_MULTIPAGINA).toBe(249990)
    expect(RENOVACION_ANUAL).toBe(39990)
  })
})

describe('formatCLP', () => {
  it('formatea el precio del sitio con separador de miles', () => {
    expect(formatCLP(149990)).toBe('$149.990')
  })

  it('formatea el precio promocional', () => {
    expect(formatCLP(119990)).toBe('$119.990')
  })

  it('formatea el precio multipágina', () => {
    expect(formatCLP(249990)).toBe('$249.990')
  })

  it('formatea la renovación anual', () => {
    expect(formatCLP(39990)).toBe('$39.990')
  })

  it('formatea cero sin separador', () => {
    expect(formatCLP(0)).toBe('$0')
  })

  it('formatea un valor negativo con el signo antes del símbolo', () => {
    expect(formatCLP(-1000)).toBe('-$1.000')
  })

  it('no produce espacios de ancho fijo (NBSP) ni depende de Intl', () => {
    const resultado = formatCLP(149990)
    expect(resultado).not.toMatch(/ /)
    expect(resultado.length).toBe([...resultado].length)
  })
})

describe('estadoPromo', () => {
  it('usa CUPOS_VENDIDOS por defecto cuando no se pasa argumento', () => {
    expect(estadoPromo()).toEqual({ activa: true, restantes: 10, agotada: false })
  })

  it('con 7 vendidos quedan 3 cupos y la promo sigue activa', () => {
    expect(estadoPromo(7)).toEqual({ activa: true, restantes: 3, agotada: false })
  })

  it('con 9 vendidos queda 1 cupo y la promo sigue activa', () => {
    expect(estadoPromo(9)).toEqual({ activa: true, restantes: 1, agotada: false })
  })

  it('con 10 vendidos (todo el cupo) la promo queda agotada', () => {
    expect(estadoPromo(10)).toEqual({ activa: false, restantes: 0, agotada: true })
  })

  it('con más ventas que cupos, restantes se satura en 0 y sigue agotada', () => {
    expect(estadoPromo(11)).toEqual({ activa: false, restantes: 0, agotada: true })
  })
})
