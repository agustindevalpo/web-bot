import { readFileSync } from 'fs'
import { join } from 'path'
import { tramoDisplay, ESCALA_DISPLAY } from '@/components/templates/shared/displayHero'

describe('shared/displayHero — tramoDisplay', () => {
  it.each([
    ['vacío', '', 'grande'],
    ['1 carácter', 'A', 'grande'],
    ['14 caracteres (borde)', 'a'.repeat(14), 'grande'],
    ['15 caracteres (borde)', 'a'.repeat(15), 'medio'],
    ['26 caracteres (borde)', 'a'.repeat(26), 'medio'],
    ['27 caracteres (borde)', 'a'.repeat(27), 'chico'],
    ['60 caracteres', 'a'.repeat(60), 'chico'],
  ])('%s -> %s', (_caso, nombre, tramo) => {
    expect(tramoDisplay(nombre).tramo).toBe(tramo)
  })

  it('recorta espacios antes de medir', () => {
    expect(tramoDisplay(`  ${'a'.repeat(14)}  `).tramo).toBe('grande')
    expect(tramoDisplay(`  ${'a'.repeat(15)}  `).tramo).toBe('medio')
    expect(tramoDisplay('     ').tramo).toBe('grande')
  })

  it('cuenta caracteres de la cadena, no bytes (acentos)', () => {
    expect(tramoDisplay('Panadería El Trigal').tramo).toBe('medio') // 19
  })

  it('expone la tabla del handoff', () => {
    expect(ESCALA_DISPLAY.grande).toEqual({ tramo: 'grande', tamanoPx: 104, alturaLinea: 0.95, trackingEm: -0.048 })
    expect(ESCALA_DISPLAY.medio).toEqual({ tramo: 'medio', tamanoPx: 78, alturaLinea: 1.0, trackingEm: -0.042 })
    expect(ESCALA_DISPLAY.chico).toEqual({ tramo: 'chico', tamanoPx: 56, alturaLinea: 1.06, trackingEm: -0.035 })
  })
})

describe('Landing.module.css — tramos del display', () => {
  // Los valores viven duplicados en el CSS (una clase por tramo): este test los ata.
  const css = readFileSync(join(process.cwd(), 'src/components/templates/landing/Landing.module.css'), 'utf8')

  it.each([
    ['grande', 'tramoGrande', '104px', '0.95', '-0.048em'],
    ['medio', 'tramoMedio', '78px', '1', '-0.042em'],
    ['chico', 'tramoChico', '56px', '1.06', '-0.035em'],
  ] as const)('la clase del tramo %s calza con la tabla', (tramo, clase, tamano, linea, tracking) => {
    const bloque = new RegExp(`\\.${clase}\\s*\\{([^}]*)\\}`).exec(css)?.[1] ?? ''
    const e = ESCALA_DISPLAY[tramo]
    expect(`${e.tamanoPx}px`).toBe(tamano)
    expect(String(e.alturaLinea)).toBe(linea)
    expect(`${e.trackingEm}em`).toBe(tracking)
    expect(bloque).toContain(`font-size: ${tamano}`)
    expect(bloque).toContain(`line-height: ${linea}`)
    expect(bloque).toContain(`letter-spacing: ${tracking}`)
  })
})
