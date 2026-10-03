import { escalaLogo, comoDimensionesLogo } from '@/components/templates/shared/logoOptico'

describe('escalaLogo', () => {
  it('es 1 para la caja de referencia 4:1', () => {
    expect(escalaLogo({ ancho: 400, alto: 100 })).toBe(1)
  })

  it('un logo cuadrado o vertical sube hasta el tope 1.5', () => {
    expect(escalaLogo({ ancho: 100, alto: 100 })).toBe(1.5)
    expect(escalaLogo({ ancho: 40, alto: 200 })).toBe(1.5)
  })

  it('un logo muy ancho baja hasta el piso 0.75', () => {
    expect(escalaLogo({ ancho: 1000, alto: 50 })).toBe(0.75)
  })

  it('interpola entre los topes (raíz cuadrada de 4/proporción)', () => {
    expect(escalaLogo({ ancho: 300, alto: 100 })).toBeCloseTo(Math.sqrt(4 / 3), 3)
    expect(escalaLogo({ ancho: 600, alto: 100 })).toBeCloseTo(Math.sqrt(4 / 6), 3)
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
