import { bannerPago, clasificarEnlacePago, contrastarModoPago, HREF_PAGO_FALLBACK, resolverEnlacePago } from '@/app/chat/hrefPago'

describe('resolverEnlacePago (WB-43)', () => {
  it('devuelve el link externo cuando la URL es https', () => {
    const url = 'https://mpago.la/abc123'
    expect(resolverEnlacePago(url)).toEqual({ href: url, externo: true })
  })

  it('recorta espacios alrededor de la URL', () => {
    expect(resolverEnlacePago('  https://mpago.la/abc123  ')).toEqual({
      href: 'https://mpago.la/abc123',
      externo: true,
    })
  })

  it.each([
    ['undefined', undefined],
    ['string vacío', ''],
    ['solo espacios', '   '],
    ['http sin TLS', 'http://mpago.la/abc123'],
    ['ruta relativa', '/pagar'],
    ['esquema javascript', 'javascript:alert(1)'],
  ])('cae al fallback de /login cuando la URL es %s', (_caso, url) => {
    expect(resolverEnlacePago(url)).toEqual({ href: HREF_PAGO_FALLBACK, externo: false })
  })

  it('el fallback es /login con el marcador de intención desde=pago', () => {
    expect(HREF_PAGO_FALLBACK).toBe('/login?desde=pago')
  })
})

describe('clasificarEnlacePago (sandbox de pagos, D-22)', () => {
  it.each([
    ['link productivo real (mpago.la)', 'https://mpago.la/311kzcH', 'productivo'],
    [
      'link de sandbox real (checkout v1 redirect + pref_id)',
      'https://www.mercadopago.cl/checkout/v1/redirect?pref_id=3665799261-3c442711-625e-4c66-8c26-f31b3e980801',
      'prueba',
    ],
    ['pref_id en otro host', 'https://ejemplo.com/pagar?pref_id=abc-123', 'prueba'],
    ['ruta de sandbox sin pref_id', 'https://www.mercadopago.cl/checkout/v1/redirect', 'prueba'],
    ['https que no es ni mpago.la ni sandbox', 'https://ejemplo.com/pagina', 'desconocido'],
    ['www.mpago.la también es productivo', 'https://www.mpago.la/abc123', 'productivo'],
    ['string vacío', '', 'productivo'],
    ['undefined', undefined, 'productivo'],
    ['no https', 'http://mpago.la/abc123', 'productivo'],
    ['URL malformada que rompería un parseo naive', 'https://', 'desconocido'],
  ] as const)('%s → %s', (_caso, url, esperado) => {
    expect(clasificarEnlacePago(url).clasificacion).toBe(esperado)
  })
})

// Compartidas por los describe de contraste y de banner: son las mismas cuatro
// formas de URL y duplicarlas invitaría a que se desincronicen.
const URL_PRODUCTIVA = 'https://mpago.la/311kzcH'
const URL_SANDBOX =
  'https://www.mercadopago.cl/checkout/v1/redirect?pref_id=3665799261-3c442711-625e-4c66-8c26-f31b3e980801'
const URL_DESCONOCIDA = 'https://ejemplo.com/pagina'
const URL_VACIA = ''

describe('contrastarModoPago (NEXT_PUBLIC_PAGOS_MODO vs. la URL real, D-22)', () => {
  it.each([
    // declarado === 'produccion'
    ['produccion + link productivo (mpago.la)', 'produccion', URL_PRODUCTIVA, 'coincide-produccion'],
    ['produccion + link de sandbox — discrepancia (dirección 1)', 'produccion', URL_SANDBOX, 'discrepancia'],
    ['produccion + link desconocido', 'produccion', URL_DESCONOCIDA, 'indeterminado'],
    ['produccion + sin link (cae a /login, productivo)', 'produccion', URL_VACIA, 'coincide-produccion'],

    // declarado === 'prueba'
    ['prueba + link productivo (mpago.la) — discrepancia (dirección 2)', 'prueba', URL_PRODUCTIVA, 'discrepancia'],
    ['prueba + link de sandbox', 'prueba', URL_SANDBOX, 'coincide-prueba'],
    ['prueba + link desconocido', 'prueba', URL_DESCONOCIDA, 'indeterminado'],
    ['prueba + sin link (cae a /login, productivo) — discrepancia', 'prueba', URL_VACIA, 'discrepancia'],

    // declarado ausente: siempre sin-declarar, sin importar el link
    ['sin declarar + link productivo', undefined, URL_PRODUCTIVA, 'sin-declarar'],
    ['sin declarar + link de sandbox', undefined, URL_SANDBOX, 'sin-declarar'],
    ['sin declarar + link desconocido', undefined, URL_DESCONOCIDA, 'sin-declarar'],
    ['sin declarar + sin link', undefined, URL_VACIA, 'sin-declarar'],

    // declarado con basura: se trata igual que ausente, nunca como 'produccion'
    ['basura + link productivo', 'yolo', URL_PRODUCTIVA, 'sin-declarar'],
    ['basura + link de sandbox', 'yolo', URL_SANDBOX, 'sin-declarar'],
    ['basura + link desconocido', 'yolo', URL_DESCONOCIDA, 'sin-declarar'],
    ['basura + sin link', 'yolo', URL_VACIA, 'sin-declarar'],
  ] as const)('%s', (_caso, modoDeclarado, url, esperado) => {
    expect(contrastarModoPago(modoDeclarado, clasificarEnlacePago(url))).toBe(esperado)
  })
})

describe('bannerPago (sandbox de pagos, D-22)', () => {
  const banner = (modoDeclarado: string | undefined, url: string | undefined) => {
    const diagnostico = clasificarEnlacePago(url)
    return bannerPago(contrastarModoPago(modoDeclarado, diagnostico), diagnostico)
  }

  it.each([
    // el caso que motiva toda la función: link de pruebas y NADIE declaró el
    // flag. Es el más probable en la práctica —alguien cambia la URL y ni se
    // acuerda de que el flag existe— y exigir la declaración lo dejaría mudo.
    ['sin declarar + link de sandbox AVISA igual', undefined, URL_SANDBOX, 'sandbox'],
    ['basura + link de sandbox AVISA igual', 'yolo', URL_SANDBOX, 'sandbox'],

    // discrepancias: mandan sobre todo lo demás, en ambas direcciones
    ['declaro produccion pero el link es de sandbox', 'produccion', URL_SANDBOX, 'discrepancia'],
    ['declaro prueba pero el link es el real', 'prueba', URL_PRODUCTIVA, 'discrepancia'],

    // coincidencias
    ['declaro prueba y el link es de sandbox', 'prueba', URL_SANDBOX, 'sandbox'],
    ['declaro produccion y el link es el real', 'produccion', URL_PRODUCTIVA, 'ninguno'],

    // sin motivo para alarmar: la tarjeta se ve igual que siempre
    ['sin declarar + link real', undefined, URL_PRODUCTIVA, 'ninguno'],
    ['sin declarar + link desconocido', undefined, URL_DESCONOCIDA, 'ninguno'],
    ['sin declarar + sin link', undefined, URL_VACIA, 'ninguno'],
    ['declaro produccion + link desconocido', 'produccion', URL_DESCONOCIDA, 'ninguno'],
    ['declaro prueba + link desconocido', 'prueba', URL_DESCONOCIDA, 'ninguno'],
  ] as const)('%s', (_caso, modoDeclarado, url, esperado) => {
    expect(banner(modoDeclarado, url)).toBe(esperado)
  })
})
