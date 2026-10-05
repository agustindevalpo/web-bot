import {
  MENSAJES_LEAD,
  mensajeErrorCorreo,
  normalizarDigitosTelefono,
  telefonoLeadANormalizado,
  validarDatosLead,
} from '@/application/shared/datosLead'

describe('telefonoLeadANormalizado', () => {
  it.each([
    ['12345678', '+56912345678'],
    ['1234 5678', '+56912345678'],
    ['1234-5678', '+56912345678'],
    [' 1234 5678 ', '+56912345678'],
  ])('normaliza %j', (entrada, esperado) => {
    expect(telefonoLeadANormalizado(entrada)).toBe(esperado)
  })

  it.each(['', '1234567', '123456789', 'abcdefgh', '+56912345678', '1234 567a'])('rechaza %j', (entrada) => {
    expect(telefonoLeadANormalizado(entrada)).toBeNull()
  })
})

describe('normalizarDigitosTelefono', () => {
  it('deja solo dígitos y corta en 8', () => {
    expect(normalizarDigitosTelefono('12a34-56 78 99')).toBe('12345678')
  })
})

describe('mensajeErrorCorreo', () => {
  it('correo vacío', () => {
    expect(mensajeErrorCorreo('  ')).toBe(MENSAJES_LEAD.correoVacio)
  })
  it.each(['ana@correo', 'ana@correo.', 'ana@'])('%j: sin dominio final', (c) => {
    expect(mensajeErrorCorreo(c)).toBe(
      c === 'ana@' ? MENSAJES_LEAD.correoIncompleto : MENSAJES_LEAD.correoSinDominio,
    )
  })
  it.each(['ana', 'ana correo.cl', '@correo.cl', 'a@b@c.cl'])('%j: otro formato', (c) => {
    expect(mensajeErrorCorreo(c)).toBe(MENSAJES_LEAD.correoIncompleto)
  })
  it('acepta un correo válido', () => {
    expect(mensajeErrorCorreo(' ana@correo.cl ')).toBeNull()
  })
})

describe('validarDatosLead', () => {
  it('sin errores con datos válidos', () => {
    expect(validarDatosLead({ nombre: 'Ana', email: 'ana@correo.cl', telefono: '1234 5678' })).toEqual({})
  })
  it('un mensaje por campo inválido', () => {
    expect(validarDatosLead({ nombre: ' ', email: '', telefono: '123' })).toEqual({
      nombre: MENSAJES_LEAD.nombreVacio,
      email: MENSAJES_LEAD.correoVacio,
      telefono: MENSAJES_LEAD.telefono,
    })
  })
})
