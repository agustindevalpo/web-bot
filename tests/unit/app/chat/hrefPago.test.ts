import { HREF_PAGO_FALLBACK, resolverEnlacePago } from '@/app/chat/hrefPago'

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
  ])('cae a /login cuando la URL es %s', (_caso, url) => {
    expect(resolverEnlacePago(url)).toEqual({ href: HREF_PAGO_FALLBACK, externo: false })
  })

  it('el fallback es /login', () => {
    expect(HREF_PAGO_FALLBACK).toBe('/login')
  })
})
