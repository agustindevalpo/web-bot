import { ALTO_CIRCULO_PX, pasoActivo, progresoPasos } from '@/app/_landing/pasos'

describe('progresoPasos', () => {
  // Ventana de 1000 px: el relleno empieza cuando el contenedor cruza y = 600.
  it('es 0 mientras el contenedor aún no llega al 60 % de la ventana', () => {
    expect(progresoPasos(1000, 900, 800)).toBe(0)
    expect(progresoPasos(1000, 600, 800)).toBe(0)
  })

  it('crece linealmente con el scroll', () => {
    const recorrido = 800 - ALTO_CIRCULO_PX
    expect(progresoPasos(1000, 600 - recorrido / 2, 800)).toBeCloseTo(0.5)
  })

  it('se acota a 1 cuando el contenedor ya pasó', () => {
    expect(progresoPasos(1000, -2000, 800)).toBe(1)
  })

  it('es 1 si el contenedor no es más alto que un círculo (sin dividir por cero)', () => {
    expect(progresoPasos(1000, 100, ALTO_CIRCULO_PX)).toBe(1)
    expect(progresoPasos(1000, 100, 0)).toBe(1)
  })
})

describe('pasoActivo', () => {
  it('el primer paso está activo desde progreso 0', () => {
    expect(pasoActivo(0, 0, 3)).toBe(true)
  })

  it('el paso i se enciende al llegar a i/(total-1)', () => {
    expect(pasoActivo(0.49, 1, 3)).toBe(false)
    expect(pasoActivo(0.5, 1, 3)).toBe(true)
    expect(pasoActivo(0.99, 2, 3)).toBe(false)
    expect(pasoActivo(1, 2, 3)).toBe(true)
  })

  it('con un solo paso depende de que haya progreso', () => {
    expect(pasoActivo(0, 0, 1)).toBe(false)
    expect(pasoActivo(0.2, 0, 1)).toBe(true)
  })
})
