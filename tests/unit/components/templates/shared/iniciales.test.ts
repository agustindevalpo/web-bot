import { obtenerIniciales } from '@/components/templates/shared/iniciales'

describe('obtenerIniciales', () => {
  it('nombre de una sola palabra: las dos primeras letras, en mayúscula', () => {
    expect(obtenerIniciales('Consultora')).toBe('CO')
  })

  it('nombre de dos palabras significativas: la primera letra de cada una', () => {
    expect(obtenerIniciales('Consultora Vega')).toBe('CV')
  })

  it('nombre de más de dos palabras significativas: solo cuenta con las dos primeras', () => {
    expect(obtenerIniciales('Consultora Vega Ingeniería SPA')).toBe('CV')
  })

  it('salta un artículo al inicio y usa las dos palabras significativas siguientes', () => {
    expect(obtenerIniciales('La Consultora Vega')).toBe('CV')
  })

  it('salta artículos y preposiciones intermedios, no solo el primero', () => {
    expect(obtenerIniciales('El Rincón de Ana')).toBe('RA')
  })

  it('salta un artículo de 3 letras (no solo los de 1-2) antes de aplicar la regla de una palabra', () => {
    // "Los" es palabra vacía pese a tener 3 letras — la única palabra
    // significativa que queda es "Andes", así que rige la regla de una sola
    // palabra (dos primeras letras), no "L" + "A".
    expect(obtenerIniciales('Los Andes')).toBe('AN')
  })

  it('nombre compuesto solo por palabras vacías: degrada a las palabras originales sin filtrar', () => {
    expect(obtenerIniciales('El La')).toBe('EL')
  })

  it('una sola palabra vacía como nombre completo: degrada a esa misma palabra', () => {
    expect(obtenerIniciales('El')).toBe('EL')
  })

  it('nombre de una sola letra: devuelve esa letra sola, sin inventar una segunda', () => {
    expect(obtenerIniciales('X')).toBe('X')
  })

  it('conserva los acentos — no los despoja', () => {
    expect(obtenerIniciales('Ávila')).toBe('ÁV')
  })

  it('normaliza entrada en minúsculas a mayúsculas', () => {
    expect(obtenerIniciales('consultora vega')).toBe('CV')
  })

  it('trimea espacios al inicio y al final', () => {
    expect(obtenerIniciales('  Consultora Vega  ')).toBe('CV')
  })

  it('colapsa espacios múltiples entre palabras', () => {
    expect(obtenerIniciales('Consultora    Vega')).toBe('CV')
  })

  it('string vacío devuelve string vacío', () => {
    expect(obtenerIniciales('')).toBe('')
  })

  it('string de solo espacios devuelve string vacío', () => {
    expect(obtenerIniciales('   ')).toBe('')
  })

  it.each([
    ['undefined', undefined],
    ['null', null],
    ['un número', 123],
    ['un objeto', { nombre: 'Vega' }],
    ['un array', ['Vega']],
    ['un booleano', true],
  ])('nunca lanza con entrada no-string (%s) — devuelve string vacío', (_descripcion, entrada) => {
    expect(() => obtenerIniciales(entrada)).not.toThrow()
    expect(obtenerIniciales(entrada)).toBe('')
  })
})
