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

function restaurarEnv(nombre: string, valor: string | undefined): void {
  if (valor === undefined) delete process.env[nombre]
  else process.env[nombre] = valor
}

describe('DemoCTA — render (R10/S10.1)', () => {
  const appUrlOriginal = process.env.NEXT_PUBLIC_APP_URL
  const linkPagoOriginal = process.env.MERCADOPAGO_LINK_URL

  afterEach(() => {
    restaurarEnv('NEXT_PUBLIC_APP_URL', appUrlOriginal)
    restaurarEnv('MERCADOPAGO_LINK_URL', linkPagoOriginal)
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

  describe('CTA "Quiero mi sitio real" — link de pago (WB-43)', () => {
    it('apunta al link de Mercado Pago en pestaña nueva cuando MERCADOPAGO_LINK_URL está configurada', () => {
      process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'
      process.env.MERCADOPAGO_LINK_URL = 'https://mpago.la/abc123'
      const DemoCTA = requerirDemoCTAFresco()

      const markup = renderToStaticMarkup(React.createElement(DemoCTA, { subdominioDemo: 'demo-e2e' }))

      expect(markup).toMatch(
        /<a href="https:\/\/mpago\.la\/abc123"[^>]*target="_blank"[^>]*rel="noopener noreferrer"[^>]*>Quiero mi sitio real/,
      )
      expect(markup).not.toContain('href="/login"')
      expect(markup).toContain('Pago único por Mercado Pago')
    })

    it('cae a /login sin target=_blank cuando MERCADOPAGO_LINK_URL no está configurada', () => {
      process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'
      delete process.env.MERCADOPAGO_LINK_URL
      const DemoCTA = requerirDemoCTAFresco()

      const markup = renderToStaticMarkup(React.createElement(DemoCTA, { subdominioDemo: 'demo-e2e' }))

      expect(markup).toMatch(/<a href="\/login"[^>]*>Quiero mi sitio real/)
      expect(markup).not.toMatch(/<a href="\/login"[^>]*target="_blank"/)
      expect(markup).not.toContain('Pago único por Mercado Pago')
      expect(markup).toContain('Sin contratos ni permanencia mínima.')
    })
  })
})
