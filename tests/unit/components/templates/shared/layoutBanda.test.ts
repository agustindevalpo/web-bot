import fs from 'node:fs'
import path from 'node:path'
import { layoutBanda, MAX_ITEMS_BANDA } from '@/components/templates/shared/layoutBanda'

describe('shared/bandaDatos — layoutBanda', () => {
  it.each([
    [1, 'una'],
    [2, 'dos'],
    [3, 'tres'],
  ])('%i ítems -> %s', (cantidad, esperado) => {
    expect(layoutBanda(cantidad)).toBe(esperado)
  })

  it.each([0, 4, -1, 1.5, Number.NaN])('%p ítems -> no se renderiza', (cantidad) => {
    expect(layoutBanda(cantidad)).toBeNull()
  })

  it('el tope coincide con el handoff (3)', () => {
    expect(MAX_ITEMS_BANDA).toBe(3)
  })
})

describe('shared/BandaDatos.module.css — valores del handoff', () => {
  const css = fs.readFileSync(path.join(process.cwd(), 'src/components/templates/shared/BandaDatos.module.css'), 'utf8')

  it.each([
    ['fondo --ink', /background:\s*#101218/],
    ['padding de cifras 76px 96px', /\.cifras\s*\{\s*padding:\s*76px 96px/],
    ['padding de horarios 72px 96px', /\.horarios\s*\{\s*padding:\s*72px 96px/],
    ['separador', /border-left:\s*1px solid rgba\(255, 255, 255, 0\.16\)/],
    ['separación 72px', /padding-left:\s*72px/],
    ['valor en cyan, nunca el acento', /color:\s*var\(--wb-color-highlight, #15defa\)/],
    ['glosa al 62%', /color:\s*rgba\(255, 255, 255, 0\.62\)/],
    ['padding móvil de cifras 44px 24px', /padding:\s*44px 24px/],
  ])('%s', (_nombre, patron) => {
    expect(css).toMatch(patron)
  })

  it('no usa el acento del cliente sobre --ink (T2)', () => {
    expect(css).not.toMatch(/var\(--acento/)
  })
})
