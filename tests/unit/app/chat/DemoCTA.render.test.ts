import { estadoPromo, formatCLP, PRECIO_PROMO, PRECIO_SITIO } from '@/app/_landing/precios'

// Prueba de render en tiempo de ejecución para DemoCTA (cierra R10/S10.1 —
// ver verify-report obs #304 CRITICAL: ningún test previo montaba el
// componente, solo un guard estático de imports (precioImports.test.ts).
// renderToStaticMarkup alcanza para verificar el HTML producido sin jsdom (los
// efectos de la isla de vista previa no corren en el render de servidor).

type Props = { subdominioDemo: string; nombre: string; template: string | null; avance: number }

// DemoCTA lee el entorno al importarse (link de pago, dominio), así que cada
// render usa un registro de módulos fresco. React y react-dom se cargan dentro
// del mismo registro: la isla de vista previa usa hooks y necesita la misma
// instancia de React que el renderizador.
function renderizarFresco(props: Props, antes?: () => void): string {
  let markup = ''
  jest.isolateModules(() => {
    antes?.()
    /* eslint-disable @typescript-eslint/no-require-imports */
    const React = require('react')
    const { renderToStaticMarkup } = require('react-dom/server')
    const { DemoCTA } = require('@/app/chat/DemoCTA')
    /* eslint-enable @typescript-eslint/no-require-imports */
    markup = renderToStaticMarkup(React.createElement(DemoCTA, props))
  })
  return markup
}

const PROPS: Props = {
  subdominioDemo: 'demo-e2e',
  nombre: 'Peluquería Ana',
  template: 'SERVICIOS',
  avance: 35,
}

const FRASES_PLAN_MENSUAL_LEGADO = ['/mes', 'Agencia', '$29.990', 'Presencia']

function restaurarEnv(nombre: string, valor: string | undefined): void {
  if (valor === undefined) delete process.env[nombre]
  else process.env[nombre] = valor
}

describe('DemoCTA — render (R10/S10.1)', () => {
  const appUrlOriginal = process.env.NEXT_PUBLIC_APP_URL
  const linkPagoOriginal = process.env.NEXT_PUBLIC_MERCADOPAGO_LINK_URL

  afterEach(() => {
    restaurarEnv('NEXT_PUBLIC_APP_URL', appUrlOriginal)
    restaurarEnv('NEXT_PUBLIC_MERCADOPAGO_LINK_URL', linkPagoOriginal)
    jest.dontMock('@/app/_landing/precios')
  })

  it('muestra el precio único y el estado promocional activo (estado por defecto, CUPOS_VENDIDOS=0)', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'
    const promo = estadoPromo()
    expect(promo.agotada).toBe(false)

    const markup = renderizarFresco(PROPS)

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

    const markup = renderizarFresco(PROPS, () => {
      jest.doMock('@/app/_landing/precios', () => {
        const real = jest.requireActual('@/app/_landing/precios')
        return { ...real, estadoPromo: () => real.estadoPromo(real.CUPOS_PROMO) }
      })
    })

    expect(markup).toContain(formatCLP(PRECIO_SITIO))
    expect(markup).toContain('$149.990')
    expect(markup).toContain('Cupos de lanzamiento agotados')
    expect(markup).not.toContain(formatCLP(PRECIO_PROMO))

    for (const frase of FRASES_PLAN_MENSUAL_LEGADO) {
      expect(markup).not.toContain(frase)
    }
  })

  describe('CTA "Quiero mi sitio real" — link de pago (WB-43)', () => {
    it('apunta al link de Mercado Pago en pestaña nueva cuando NEXT_PUBLIC_MERCADOPAGO_LINK_URL está configurada', () => {
      process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'
      process.env.NEXT_PUBLIC_MERCADOPAGO_LINK_URL = 'https://mpago.la/abc123'

      const markup = renderizarFresco(PROPS)

      expect(markup).toMatch(
        /<a href="https:\/\/mpago\.la\/abc123"[^>]*target="_blank"[^>]*rel="noopener noreferrer"[^>]*>Quiero mi sitio real/,
      )
      expect(markup).not.toContain('href="/login"')
      expect(markup).toContain('Pago único por Mercado Pago')
    })

    it('cae a /login?desde=pago sin target=_blank cuando NEXT_PUBLIC_MERCADOPAGO_LINK_URL no está configurada', () => {
      process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'
      delete process.env.NEXT_PUBLIC_MERCADOPAGO_LINK_URL

      const markup = renderizarFresco(PROPS)

      expect(markup).toMatch(/<a href="\/login\?desde=pago"[^>]*>Quiero mi sitio real/)
      expect(markup).not.toMatch(/<a href="\/login\?desde=pago"[^>]*target="_blank"/)
      expect(markup).not.toContain('Pago único por Mercado Pago')
      expect(markup).toContain('Sin contratos ni permanencia mínima.')
    })
  })

  describe('reveal en Bloques (R2, R3)', () => {
    function render(props: Partial<typeof PROPS> = {}): string {
      process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'
      process.env.NEXT_PUBLIC_MERCADOPAGO_LINK_URL = 'https://mpago.la/abc123'
      return renderizarFresco({ ...PROPS, ...props })
    }

    it('titula con el nombre del negocio y enlaza el sitio completo en pestaña nueva', () => {
      const markup = render()
      expect(markup).toContain('Tu sitio</p>')
      expect(markup).toContain('Así se ve Peluquería Ana')
      expect(markup).toMatch(/<a href="http:\/\/localhost:3000\/sites\/demo-e2e"[^>]*target="_blank"[^>]*>Abrir el sitio completo →/)
      expect(markup).toContain('title="Vista previa de tu sitio"')
    })

    it('sin nombre cae a "Así se ve tu sitio"', () => {
      expect(render({ nombre: '  ' })).toContain('Así se ve tu sitio')
    })

    it('ya no usa el estilo navy ni el texto del reveal anterior', () => {
      const markup = render()
      for (const frase of ['Ver sitio completo', 'Este fue un ejemplo', 'Tu sitio propio, listo en 1 día', '📱']) {
        expect(markup).not.toContain(frase)
      }
    })

    it('al 35 % invita a completar el sitio con el botón hacia /chat/completar', () => {
      const markup = render({ avance: 35 })
      expect(markup).toContain('Tu sitio está al 35 %')
      expect(markup).toContain('Logo y fotos: después del pago')
      expect(markup).toContain('Con dos minutos más, tu sitio muestra precios, horarios y quién atiende. Todo es opcional.')
      expect(markup).toMatch(/<a [^>]*href="\/chat\/completar"[^>]*>Completar mi sitio<\/a>/)
      expect(markup).not.toContain('Completaste todo')
    })

    it('la invitación de LANDING (y de las plantillas sin capítulo) no habla de precios ni horarios', () => {
      for (const template of ['LANDING', 'RESTAURANTE', null]) {
        const markup = render({ template })
        expect(markup).toContain('Con dos minutos más, tu sitio describe tus servicios y cuenta quién está detrás. Todo es opcional.')
        expect(markup).not.toContain('precios, horarios')
      }
    })

    it('al 80 % compacta la tarjeta: frase de logro y "Editar respuestas", sin botón de completar', () => {
      const markup = render({ avance: 80 })
      expect(markup).toContain('Tu sitio está al 80 %')
      expect(markup).toContain('Completaste todo lo que se puede antes del pago.')
      expect(markup).toMatch(/<a [^>]*href="\/chat\/completar"[^>]*>Editar respuestas<\/a>/)
      expect(markup).not.toContain('Completar mi sitio')
      expect(markup).not.toContain('Con dos minutos más')
    })

    it('la barra de avance declara el valor y el techo del 20 % final', () => {
      const markup = render({ avance: 55 })
      expect(markup).toContain('role="progressbar"')
      expect(markup).toContain('aria-valuenow="55"')
      expect(markup).toContain('aria-valuetext="55 %. El 20 % final se completa después del pago."')
    })

    it('la caja de pago lleva rótulo, titular, precio, viñetas y botón', () => {
      const markup = render()
      for (const texto of [
        'Tu sitio propio</p>',
        'Listo en 1 día hábil',
        '$119.990',
        'pago único',
        'Tu dominio propio y el sitio publicado',
        'Agregamos tu logo y tus fotos',
        'Sin contratos ni permanencia mínima</li>',
        'Quiero mi sitio real</a>',
      ]) {
        expect(markup).toContain(texto)
      }
    })

    it('el aviso D-39 va completo y ANTES del botón de pago', () => {
      const markup = render()
      const aviso =
        'Al pagar aceptas los <a href="/terminos" target="_blank" rel="noopener noreferrer">Términos y condiciones</a>. ' +
        'Como revisas y apruebas tu sitio antes de pagar, no aplica el derecho a retracto (art. 3 bis, Ley 19.496). ' +
        'Si no lo publicamos en 10 días por causas nuestras, te devolvemos el pago.'
      expect(markup).toContain(aviso)
      expect(markup.indexOf(aviso)).toBeLessThan(markup.indexOf('Quiero mi sitio real'))
    })

    it('el texto bajo el botón conserva el contenido anterior con el link externo', () => {
      const markup = render()
      expect(markup).toContain(
        'Pago único por Mercado Pago. Después del pago te contactamos para activar tu sitio en 1 día. Sin contratos ni permanencia mínima.',
      )
      expect(markup.indexOf('Quiero mi sitio real')).toBeLessThan(markup.indexOf('Pago único por Mercado Pago'))
    })

    it('el pago no depende del avance: el botón está igual al 35 % y al 80 %', () => {
      for (const avance of [35, 80]) {
        expect(render({ avance })).toContain('href="https://mpago.la/abc123"')
      }
    })
  })
})
