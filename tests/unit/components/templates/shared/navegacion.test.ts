import {
  filtrarSecciones,
  estiloCascada,
  PASO_CASCADA_MS,
  UMBRAL_OBSERVER_CASCADA,
  SeccionSPA,
} from '@/components/templates/shared/navegacion'

describe('filtrarSecciones', () => {
  it.each([
    ['contenido null', null, false],
    ['contenido undefined', undefined, false],
    ['contenido string vacío', '', true],
    ['contenido 0', 0, true],
    ['contenido normal', 'texto', true],
  ])('%s → se conserva: %s', (_descripcion, contenido, seConserva) => {
    const entrada: SeccionSPA = { id: 'inicio', etiqueta: 'Inicio', contenido }
    expect(filtrarSecciones([entrada])).toHaveLength(seConserva ? 1 : 0)
  })

  it('descarta solo las entradas con contenido null o undefined, no las demás', () => {
    const entradas: SeccionSPA[] = [
      { id: 'inicio', etiqueta: 'Inicio', contenido: 'hola' },
      { id: 'galeria', etiqueta: 'Galería', contenido: null },
      { id: 'contacto', etiqueta: 'Contacto', contenido: 0 },
      { id: 'trayectoria', etiqueta: 'Trayectoria', contenido: undefined },
    ]

    expect(filtrarSecciones(entradas).map((s) => s.id)).toEqual(['inicio', 'contacto'])
  })

  it('devuelve una lista vacía cuando todas las entradas están ausentes', () => {
    const entradas: SeccionSPA[] = [
      { id: 'a', etiqueta: 'A', contenido: null },
      { id: 'b', etiqueta: 'B', contenido: undefined },
    ]

    expect(filtrarSecciones(entradas)).toEqual([])
  })

  it('preserva el orden original de las entradas conservadas', () => {
    const entradas: SeccionSPA[] = [
      { id: 'inicio', etiqueta: 'Inicio', contenido: 'a' },
      { id: 'servicios', etiqueta: 'Servicios', contenido: null },
      { id: 'nosotros', etiqueta: 'Nosotros', contenido: 'b' },
      { id: 'contacto', etiqueta: 'Contacto', contenido: 'c' },
    ]

    expect(filtrarSecciones(entradas).map((s) => s.id)).toEqual(['inicio', 'nosotros', 'contacto'])
  })
})

describe('estiloCascada', () => {
  it.each([
    [0, '0ms'],
    [1, '80ms'],
    [5, '400ms'],
    [-3, '0ms'],
    [2.9, '160ms'],
  ])('índice %s → --dv-delay: %s', (indice, delayEsperado) => {
    expect(estiloCascada(indice)).toEqual({ '--dv-delay': delayEsperado })
  })
})

describe('contrato de revelado Bloques', () => {
  it('paso de 80ms y threshold 0.12', () => {
    expect(PASO_CASCADA_MS).toBe(80)
    expect(UMBRAL_OBSERVER_CASCADA).toBe(0.12)
  })
})
