import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { estadoPromo, formatCLP, PRECIO_PROMO, PRECIO_SITIO } from '@/app/_landing/precios'

// Prueba de render en tiempo de ejecución para DemoCTA (cierra R10/S10.1 —
// ver verify-report obs #304 CRITICAL: ningún test previo montaba el
// componente, solo un guard estático de imports (precioImports.test.ts).
// DemoCTA.tsx no usa hooks ni APIs de cliente, así que renderToStaticMarkup
// alcanza para verificar el HTML producido sin necesitar jsdom.

type DemoCTAComponent = (typeof import('@/app/chat/DemoCTA'))['DemoCTA']

const FRASES_PLAN_MENSUAL_LEGADO = ['/mes', 'Agencia', '$29.990', 'Presencia']

function requerirDemoCTAFresco(): DemoCTAComponent {
  let DemoCTA!: DemoCTAComponent
  jest.isolateModules(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    DemoCTA = require('@/app/chat/DemoCTA').DemoCTA
  })
  return DemoCTA
}

describe('DemoCTA — render (R10/S10.1)', () => {
  const appUrlOriginal = process.env.NEXT_PUBLIC_APP_URL

  afterEach(() => {
    process.env.NEXT_PUBLIC_APP_URL = appUrlOriginal
    jest.dontMock('@/app/_landing/precios')
  })

  it('muestra el precio único y el estado promocional activo (estado por defecto, CUPOS_VENDIDOS=0)', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'
    const DemoCTA = requerirDemoCTAFresco()
    const promo = estadoPromo()
    expect(promo.agotada).toBe(false)

    const markup = renderToStaticMarkup(React.createElement(DemoCTA, { subdominioDemo: 'demo-e2e' }))

    expect(markup).toContain(formatCLP(PRECIO_SITIO))
    expect(markup).toContain('$149.990')
    expect(markup).toContain(formatCLP(PRECIO_PROMO))
    expect(markup).toContain(`quedan ${promo.restantes} cupos`)
    expect(markup).toContain('http://localhost:3000/sites/demo-e2e')

    for (const frase of FRASES_PLAN_MENSUAL_LEGADO) {
      expect(markup).not.toContain(frase)
    }
  })

  it('muestra el estado de cupos agotados cuando el módulo de precios reporta agotada=true', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'

    let DemoCTA!: DemoCTAComponent
    jest.isolateModules(() => {
      jest.doMock('@/app/_landing/precios', () => {
        const real = jest.requireActual('@/app/_landing/precios')
        return { ...real, estadoPromo: () => real.estadoPromo(real.CUPOS_PROMO) }
      })
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      DemoCTA = require('@/app/chat/DemoCTA').DemoCTA
    })

    const markup = renderToStaticMarkup(React.createElement(DemoCTA, { subdominioDemo: 'demo-e2e' }))

    expect(markup).toContain(formatCLP(PRECIO_SITIO))
    expect(markup).toContain('$149.990')
    expect(markup).toContain('Cupos de lanzamiento agotados')
    expect(markup).not.toContain(formatCLP(PRECIO_PROMO))

    for (const frase of FRASES_PLAN_MENSUAL_LEGADO) {
      expect(markup).not.toContain(frase)
    }
  })
})
