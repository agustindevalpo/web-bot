import { readFileSync } from 'fs'
import { join } from 'path'
import {
  ALTO_FILA1_MOBIL_PX,
  ALTO_HEADER_DESKTOP_PX,
  ALTO_HEADER_MOBIL_PX,
} from '@/components/templates/shared/headerGeometria'

// Las constantes JS DEBEN calzar con las custom properties de
// SeccionesSPA.module.css: el scrollspy usa las JS, el scroll-margin-top usa
// las CSS. Si divergen, la sección activa y el salto de ancla se desfasan.
const css = readFileSync(join(process.cwd(), 'src/components/templates/shared/SeccionesSPA.module.css'), 'utf8')

function px(prop: string, bloque: string): number {
  const m = new RegExp(`${prop}:\\s*(\\d+)px`).exec(bloque)
  if (!m) throw new Error(`No se encontró ${prop} en el CSS`)
  return Number(m[1])
}

const [cssBase, cssMovil] = css.split('@media (max-width: 767px)')

describe('headerGeometria vs SeccionesSPA.module.css', () => {
  it('pins the documented values', () => {
    expect([ALTO_HEADER_DESKTOP_PX, ALTO_HEADER_MOBIL_PX, ALTO_FILA1_MOBIL_PX]).toEqual([96, 44, 52])
  })

  it('desktop header height matches --wb-spa-header-alto', () => {
    expect(px('--wb-spa-header-alto', cssBase)).toBe(ALTO_HEADER_DESKTOP_PX)
  })

  it('mobile pinned height and row 1 match the CSS', () => {
    expect(px('--wb-spa-header-alto', cssMovil)).toBe(ALTO_HEADER_MOBIL_PX)
    expect(px('--wb-spa-header-fila1-alto', cssMovil)).toBe(ALTO_FILA1_MOBIL_PX)
  })
})
