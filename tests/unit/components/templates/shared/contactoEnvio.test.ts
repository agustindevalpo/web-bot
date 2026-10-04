import { construirMensajeContacto, construirMensajeAgenda, resolverEnvioContacto } from '@/components/templates/shared/contactoEnvio'

describe('contactoEnvio — construirMensajeContacto (formato LANDING)', () => {
  it('arma las 3 líneas cuando los 3 campos vienen completos', () => {
    expect(construirMensajeContacto('Ana', 'ana@mail.cl', 'Quiero cotizar una torta')).toBe(
      'Nombre: Ana\nEmail: ana@mail.cl\nQuiero cotizar una torta',
    )
  })

  it('omite las líneas de campos vacíos o solo espacios', () => {
    expect(construirMensajeContacto('', '  ', 'Solo el mensaje')).toBe('Solo el mensaje')
  })

  it('degrada a string vacío con los 3 campos vacíos, sin lanzar', () => {
    expect(construirMensajeContacto('', '', '')).toBe('')
  })
})

describe('contactoEnvio — construirMensajeAgenda (formato SERVICIOS)', () => {
  it('arma la frase completa con los 3 campos', () => {
    expect(construirMensajeAgenda('Ana', 'Corte de pelo', 'el jueves')).toBe(
      'Hola, soy Ana. Quiero agendar Corte de pelo. Me acomoda el jueves.',
    )
  })

  it('omite la frase del servicio cuando no se eligió ninguno', () => {
    expect(construirMensajeAgenda('Ana', '', 'el jueves')).toBe('Hola, soy Ana. Me acomoda el jueves.')
  })

  it('omite la frase del día cuando viene vacío o solo espacios', () => {
    expect(construirMensajeAgenda('Ana', 'Corte de pelo', '   ')).toBe('Hola, soy Ana. Quiero agendar Corte de pelo.')
  })

  it('con solo el servicio no inventa saludo', () => {
    expect(construirMensajeAgenda('', 'Corte de pelo', '')).toBe('Quiero agendar Corte de pelo.')
  })

  it('con los 3 campos vacíos devuelve string vacío', () => {
    expect(construirMensajeAgenda('', '', '')).toBe('')
  })
})

describe('contactoEnvio — resolverEnvioContacto (R3-002)', () => {
  it('abre wa.me con el mensaje precargado y pide resetear', () => {
    const abrirVentana = jest.fn(() => ({}))
    const resultado = resolverEnvioContacto('+56 9 1234 5678', 'Hola, soy Ana.', abrirVentana)
    expect(abrirVentana).toHaveBeenCalledWith(`https://wa.me/56912345678?text=${encodeURIComponent('Hola, soy Ana.')}`)
    expect(resultado).toEqual({ mensaje: null, debeResetear: true })
  })

  it('sin teléfono utilizable, avisa y no abre ventana ni pide resetear', () => {
    const abrirVentana = jest.fn()
    const resultado = resolverEnvioContacto('sin numero', 'Hola', abrirVentana)
    expect(abrirVentana).not.toHaveBeenCalled()
    expect(resultado.debeResetear).toBe(false)
    expect(resultado.mensaje).toMatch(/teléfono o al email/)
  })

  it('con el popup bloqueado avisa y no pide resetear', () => {
    const resultado = resolverEnvioContacto('+56 9 1234 5678', 'Hola', () => null)
    expect(resultado.debeResetear).toBe(false)
    expect(resultado.mensaje).toMatch(/bloqueó/)
  })
})
