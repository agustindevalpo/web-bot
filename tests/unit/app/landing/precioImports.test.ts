import fs from 'node:fs'
import path from 'node:path'

export {}

// Guarda a nivel de fuente (R10/S10.2): tanto page.tsx como DemoCTA.tsx deben
// importar el precio único desde `_landing/precios.ts` — no un tercer literal
// duplicado — y ninguno de los dos debe conservar rastros del plan mensual
// legado (el grid PLANES/COMPARE_* que este slice reemplaza).

const RUTA_PAGE = path.join(process.cwd(), 'src/app/page.tsx')
const RUTA_DEMO_CTA = path.join(process.cwd(), 'src/app/chat/DemoCTA.tsx')

const FRASES_DEL_PLAN_LEGADO = ['Agencia', '/mes', '$29.990']

function leer(ruta: string): string {
  return fs.readFileSync(ruta, 'utf-8')
}

describe('page.tsx y DemoCTA.tsx comparten el módulo de precios (R10)', () => {
  it('page.tsx importa desde _landing/precios', () => {
    const contenido = leer(RUTA_PAGE)
    expect(/from ['"](@\/app\/_landing\/precios|\.\/_landing\/precios)['"]/.test(contenido)).toBe(true)
  })

  it('DemoCTA.tsx importa desde @/app/_landing/precios', () => {
    const contenido = leer(RUTA_DEMO_CTA)
    expect(contenido).toContain("from '@/app/_landing/precios'")
  })

  it.each([
    ['page.tsx', RUTA_PAGE],
    ['DemoCTA.tsx', RUTA_DEMO_CTA],
  ])('%s no contiene frases del plan mensual legado', (_nombre, ruta) => {
    const contenido = leer(ruta)
    for (const frase of FRASES_DEL_PLAN_LEGADO) {
      expect(contenido).not.toContain(frase)
    }
  })
})
