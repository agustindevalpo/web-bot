import { altosLogo, esLogotipo, comoDimensionesLogo } from '@/components/templates/shared/logoOptico'

describe('altosLogo (regla T3)', () => {
  it.each([
    ['6:1', 600, 100, 30, 23],
    ['4:1', 400, 100, 38, 29],
    ['3:1', 300, 100, 44, 34],
    ['2:1', 200, 100, 54, 42],
    ['1:1', 100, 100, 60, 46],
    ['1:2', 100, 200, 60, 46],
  ])('%s', (_n, ancho, alto, escritorio, movil) => {
    expect(altosLogo({ ancho, alto })).toEqual({ escritorio, movil })
  })

  it('el ancho resultante respeta los topes de 180px / 140px', () => {
    const { escritorio, movil } = altosLogo({ ancho: 600, alto: 100 })
    expect(escritorio * 6).toBeLessThanOrEqual(180)
    expect(movil * 6).toBeLessThanOrEqual(140)
  })

  it('un logo extremadamente ancho limita por ancho aun bajo el piso', () => {
    expect(altosLogo({ ancho: 1000, alto: 50 })).toEqual({ escritorio: 9, movil: 7 })
  })
})

describe('esLogotipo', () => {
  it('r < 1.6 es isotipo; r >= 1.6 es logotipo', () => {
    expect(esLogotipo({ ancho: 159, alto: 100 })).toBe(false)
    expect(esLogotipo({ ancho: 160, alto: 100 })).toBe(true)
    expect(esLogotipo({ ancho: 100, alto: 100 })).toBe(false)
  })
})

describe('comoDimensionesLogo', () => {
  it('acepta enteros positivos', () => {
    expect(comoDimensionesLogo({ ancho: 10, alto: 5 })).toEqual({ ancho: 10, alto: 5 })
  })

  it.each([null, undefined, 'x', 5, [], {}, { ancho: 0, alto: 1 }, { ancho: 1.5, alto: 1 }, { ancho: '1', alto: 1 }])(
    'descarta %p',
    (valor) => {
      expect(comoDimensionesLogo(valor)).toBeNull()
    },
  )
})
