import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { layoutNosotros } from '@/components/templates/shared/nosotros'

describe('shared/nosotros — layoutNosotros', () => {
  it('0 tarjetas: columna centrada', () => {
    expect(layoutNosotros(0)).toBe('columna')
  })

  it('1 o 2 tarjetas: una columna con las tarjetas en fila', () => {
    expect(layoutNosotros(1)).toBe('fila')
    expect(layoutNosotros(2)).toBe('fila')
  })

  it('3 tarjetas: dos columnas', () => {
    expect(layoutNosotros(3)).toBe('dos')
  })
})

describe('shared/BloqueNosotros.module.css — valores del handoff', () => {
  const css = readFileSync(join(process.cwd(), 'src/components/templates/shared/BloqueNosotros.module.css'), 'utf8')

  it('fondo acento a sangre con padding 150px 96px', () => {
    expect(css).toMatch(/padding:\s*150px 96px/)
    expect(css).toMatch(/background:\s*var\(--acento\)/)
  })

  it('dos columnas 1.2fr 1fr con gap de 96px', () => {
    expect(css).toMatch(/grid-template-columns:\s*1\.2fr 1fr/)
    expect(css).toMatch(/gap:\s*96px/)
  })

  it('el texto nunca lleva alfa (T2): solo el fondo de tarjeta y el filete', () => {
    const colores = css.match(/^\s*color:.*$/gm) ?? []
    expect(colores.length).toBeGreaterThan(0)
    for (const linea of colores) expect(linea).toMatch(/#fff;/)
    expect(css).toMatch(/background:\s*rgba\(255, 255, 255, 0\.14\)/)
  })
})
