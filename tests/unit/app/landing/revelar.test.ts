import { REVEAL_ESCALON_MS, revelarSeccion } from '@/app/_landing/revelar'

function crearElemento() {
  const propiedades: Record<string, string> = {}
  const atributos: Record<string, string> = {}
  return {
    propiedades,
    atributos,
    setAttribute: (nombre: string, valor: string) => {
      atributos[nombre] = valor
    },
    style: {
      setProperty: (nombre: string, valor: string) => {
        propiedades[nombre] = valor
      },
    },
  }
}

describe('revelarSeccion', () => {
  it('activa cada [data-r] con un retraso escalonado de 90 ms, en orden', () => {
    const elementos = [crearElemento(), crearElemento(), crearElemento()]
    const seccion = { querySelectorAll: jest.fn(() => elementos) }

    revelarSeccion(seccion)

    expect(seccion.querySelectorAll).toHaveBeenCalledWith('[data-r]')
    expect(REVEAL_ESCALON_MS).toBe(90)
    expect(elementos.map((el) => el.propiedades['--r-delay'])).toEqual(['0ms', '90ms', '180ms'])
    for (const el of elementos) expect(el.atributos['data-rv']).toBe('')
  })

  it('no falla en una sección sin elementos marcados', () => {
    expect(() => revelarSeccion({ querySelectorAll: () => [] })).not.toThrow()
  })
})
