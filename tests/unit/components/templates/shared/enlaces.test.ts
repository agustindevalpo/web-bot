import {
  soloDigitos,
  buildWhatsAppUrl,
  buildWhatsAppUrlConMensaje,
  buildTelUrl,
  buildInstagramUrl,
  buildMailtoUrl,
} from '@/components/templates/shared/enlaces'

describe('soloDigitos', () => {
  it('extrae solo los dígitos de un teléfono formateado', () => {
    expect(soloDigitos('+56 9 1234 5678')).toBe('56912345678')
  })
})

describe('buildWhatsAppUrl', () => {
  it('arma un link wa.me con solo dígitos', () => {
    expect(buildWhatsAppUrl('+56 9 1234 5678')).toBe('https://wa.me/56912345678')
  })
})

describe('buildWhatsAppUrlConMensaje', () => {
  it('arma un link wa.me con el mensaje codificado en "text"', () => {
    expect(buildWhatsAppUrlConMensaje('+56 9 1234 5678', 'Hola, quiero cotizar')).toBe(
      `https://wa.me/56912345678?text=${encodeURIComponent('Hola, quiero cotizar')}`,
    )
  })

  it('codifica saltos de línea y "&" para que no rompan el query string', () => {
    const mensaje = 'Hola!\nQuiero cotizar & agendar una visita'
    const url = buildWhatsAppUrlConMensaje('56912345678', mensaje)

    expect(url).toBe(`https://wa.me/56912345678?text=${encodeURIComponent(mensaje)}`)
    expect(url).not.toContain('\n')
    // el "&" del mensaje debe ir codificado (%26), no como separador real de query params
    expect(url?.split('&').length).toBe(1)
  })

  it('codifica acentos y "#" correctamente', () => {
    const mensaje = 'Consulta sobre el ítem #3, ¿está disponible?'
    expect(buildWhatsAppUrlConMensaje('56912345678', mensaje)).toBe(
      `https://wa.me/56912345678?text=${encodeURIComponent(mensaje)}`,
    )
  })

  it('codifica emoji', () => {
    const mensaje = 'Hola 👋 quiero cotizar 🎉'
    expect(buildWhatsAppUrlConMensaje('56912345678', mensaje)).toBe(
      `https://wa.me/56912345678?text=${encodeURIComponent(mensaje)}`,
    )
  })

  it('degrada al link simple cuando el mensaje es vacío', () => {
    expect(buildWhatsAppUrlConMensaje('56912345678', '')).toBe('https://wa.me/56912345678')
  })

  it('degrada al link simple cuando el mensaje es solo espacios', () => {
    expect(buildWhatsAppUrlConMensaje('56912345678', '   \n  ')).toBe('https://wa.me/56912345678')
  })

  it('rechaza (null) un teléfono sin dígitos utilizables', () => {
    expect(buildWhatsAppUrlConMensaje('abc', 'Hola')).toBeNull()
  })

  it('extrae solo los dígitos de un teléfono con caracteres de formato', () => {
    expect(buildWhatsAppUrlConMensaje('+56 (9) 1234-5678', 'Hola')).toBe(
      `https://wa.me/56912345678?text=${encodeURIComponent('Hola')}`,
    )
  })
})

describe('buildTelUrl', () => {
  it('arma un link tel: preservando el formato original', () => {
    expect(buildTelUrl('+56 9 1234 5678')).toBe('tel:+56 9 1234 5678')
  })
})

describe('buildInstagramUrl — Threat: path escape en handle de red social', () => {
  it('arma el link normal para un handle simple', () => {
    expect(buildInstagramUrl('@negocio_oficial')).toBe('https://instagram.com/negocio_oficial')
  })

  it('quita el @ inicial cuando está presente', () => {
    expect(buildInstagramUrl('negocio_oficial')).toBe('https://instagram.com/negocio_oficial')
  })

  it('un handle con intento de path traversal no puede salir del path del perfil', () => {
    const url = buildInstagramUrl('../../evil')
    const path = url.replace('https://instagram.com/', '')

    expect(url.startsWith('https://instagram.com/')).toBe(true)
    expect(path).not.toContain('/')
  })
})

describe('buildMailtoUrl — Threat: inyección de headers vía mailto:', () => {
  it('arma un mailto: con la dirección URL-encodeada', () => {
    expect(buildMailtoUrl('ventas@negocio.cl')).toBe(`mailto:${encodeURIComponent('ventas@negocio.cl')}`)
  })

  it('rechaza (null) una dirección con "?" — no puede anexar parámetros cc/bcc/subject', () => {
    expect(buildMailtoUrl('ventas@negocio.cl?bcc=atacante@evil.com')).toBeNull()
  })

  it('rechaza (null) una dirección con salto de línea — no puede inyectar headers', () => {
    expect(buildMailtoUrl('ventas@negocio.cl\nBcc: atacante@evil.com')).toBeNull()
  })
})
