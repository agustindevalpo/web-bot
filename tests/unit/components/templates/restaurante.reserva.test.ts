import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import Restaurante from '@/components/templates/restaurante'
import FormReserva from '@/components/templates/restaurante/FormReserva'
import { copyReserva } from '@/components/templates/restaurante/copy'
import {
  OPCIONES_PERSONAS,
  construirMensajeReserva,
  primerCampoInvalido,
  resolverEnvioReserva,
  validarReserva,
} from '@/components/templates/restaurante/reservaLogica'
import { SiteConfigDTO } from '@/application/dtos/SiteConfigDTO'

jest.mock('@/infrastructure/container', () => ({
  getAlmacenamientoArchivos: () => ({ urlPublicaBase: () => 'https://media.devalpo.cl' }),
}))

const RESERVA = copyReserva('restaurante')
const ENCARGO = copyReserva('panaderia')

describe('mensaje de reserva y de encargo', () => {
  it('reserva: recorta, deja las personas en minúsculas y respeta el formato', () => {
    const mensaje = construirMensajeReserva({ nombre: '  Ana ', detalle: 'Más de 8 personas', cuando: ' sábado a las 21:00 ' }, false)
    expect(mensaje).toBe('Hola, soy Ana. Quiero reservar una mesa para más de 8 personas, sábado a las 21:00.')
    expect(construirMensajeReserva({ nombre: 'Ana', detalle: '2 personas', cuando: 'hoy' }, false)).toBe(
      'Hola, soy Ana. Quiero reservar una mesa para 2 personas, hoy.',
    )
  })

  it('encargo: usa el pedido tal cual (recortado) y "para {cuándo}"', () => {
    const mensaje = construirMensajeReserva({ nombre: 'Luz', detalle: ' una torta de mil hojas ', cuando: 'el viernes' }, true)
    expect(mensaje).toBe('Hola, soy Luz. Quiero encargar una torta de mil hojas para el viernes.')
  })
})

describe('validación', () => {
  const vacio = { nombre: '', detalle: '', cuando: '' }

  it('reserva: un mensaje por campo vacío o solo espacios', () => {
    expect(validarReserva({ nombre: '  ', detalle: '', cuando: ' ' }, false)).toEqual({
      nombre: 'Escribe tu nombre.',
      detalle: 'Elige para cuántas personas.',
      cuando: 'Cuéntanos para qué día y hora.',
    })
  })

  it('encargo: el pedido vacío dice "Cuéntanos qué quieres encargar."', () => {
    expect(validarReserva(vacio, true).detalle).toBe('Cuéntanos qué quieres encargar.')
  })

  it('los errores desaparecen apenas el campo es válido', () => {
    expect(validarReserva({ nombre: 'Ana', detalle: '', cuando: '' }, false)).not.toHaveProperty('nombre')
    expect(validarReserva({ nombre: 'Ana', detalle: '2 personas', cuando: 'hoy' }, false)).toEqual({})
  })

  it('el foco va al primer campo inválido, en orden visual', () => {
    expect(primerCampoInvalido(validarReserva(vacio, false))).toBe('nombre')
    expect(primerCampoInvalido(validarReserva({ nombre: 'Ana', detalle: '', cuando: '' }, false))).toBe('detalle')
    expect(primerCampoInvalido(validarReserva({ nombre: 'Ana', detalle: '2 personas', cuando: '' }, false))).toBe('cuando')
    expect(primerCampoInvalido({})).toBeNull()
  })
})

describe('apertura de WhatsApp', () => {
  it('codifica el mensaje y arma wa.me sin el +', () => {
    const abrir = jest.fn(() => ({}))
    const mensaje = 'Hola, soy Ana & Co. ¿Sí?'
    const resultado = resolverEnvioReserva('+56 9 5555 1234', mensaje, abrir)
    const url = `https://wa.me/56955551234?text=${encodeURIComponent(mensaje)}`
    expect(abrir).toHaveBeenCalledWith(url)
    expect(resultado).toEqual({ url, bloqueado: false })
  })

  it('window.open devuelve null: queda bloqueado y conserva la URL para el enlace', () => {
    const resultado = resolverEnvioReserva('+56 9 5555 1234', 'Hola', () => null)
    expect(resultado).toEqual({ url: 'https://wa.me/56955551234?text=Hola', bloqueado: true })
  })

  it('teléfono sin dígitos: no abre nada', () => {
    const abrir = jest.fn()
    expect(resolverEnvioReserva('abc', 'Hola', abrir)).toEqual({ url: null, bloqueado: true })
    expect(abrir).not.toHaveBeenCalled()
  })
})

describe('FormReserva — render en reposo', () => {
  const html = (copy = RESERVA) =>
    renderToStaticMarkup(React.createElement(FormReserva, { telefono: '+56 9 5555 1234', copy, tituloId: 'reservas-titulo' }))

  it('reserva: tres campos con rótulo, select de personas y límites', () => {
    const markup = html()
    expect(markup).toContain('noValidate')
    expect(markup).toContain('aria-labelledby="reservas-titulo"')
    expect(markup).toContain('>Tu nombre</label>')
    expect(markup).toContain('autoComplete="name"')
    expect(markup).toContain('>Personas</label>')
    expect(markup).toContain('<option value="" selected="">Elige</option>')
    for (const opcion of OPCIONES_PERSONAS) expect(markup).toContain(`<option value="${opcion}">${opcion}</option>`)
    expect(OPCIONES_PERSONAS).toHaveLength(9)
    expect(markup).toContain('>¿Para cuándo?</label>')
    expect(markup).toContain('placeholder="Por ejemplo: sábado a las 21:00"')
    expect(markup.match(/maxLength="40"/g)).toHaveLength(2)
  })

  it('botón siempre activo, con apoyo enlazado por aria-describedby', () => {
    const markup = html()
    const boton = markup.match(/<button[^>]*>/)?.[0] ?? ''
    expect(boton).not.toContain('disabled')
    expect(markup).toContain('Pedir reserva por WhatsApp')
    const apoyo = boton.match(/aria-describedby="([^"]+)"/)?.[1]
    expect(apoyo).toBeTruthy()
    expect(markup).toContain(`id="${apoyo}"`)
    expect(markup).toContain('Se abre WhatsApp con tu mensaje listo. La reserva queda confirmada cuando te respondamos.')
  })

  it('antes del primer envío no hay errores, campos inválidos ni caja de estado', () => {
    const markup = html()
    expect(markup).not.toContain('aria-invalid')
    expect(markup).not.toContain('role="alert"')
    expect(markup).not.toContain('Abrimos WhatsApp con tu mensaje')
    expect(markup).toContain('role="status"')
  })

  it('panadería: pedido libre (obligatorio, tope 60), mismo orden y apoyo de encargo', () => {
    const markup = html(ENCARGO)
    expect(markup).toContain('>¿Qué quieres encargar?</label>')
    expect(markup).toContain('placeholder="Por ejemplo: una torta de mil hojas para 10 personas"')
    expect(markup).toContain('maxLength="60"')
    expect(markup).not.toContain('<select')
    expect(markup).toContain('Pedir encargo por WhatsApp')
    expect(markup).toContain('El encargo queda confirmado cuando te respondamos.')
  })
})

describe('RESTAURANTE — formulario en la sección Reservas', () => {
  const CON_TELEFONO = {
    nombre: 'El Fogón',
    rubro: 'restaurante',
    ciudad: 'Valparaíso',
    contacto: { telefono: '+56 9 5555 1234', email: 'reservas@elfogon.cl' },
  } as unknown as SiteConfigDTO
  const render = async (config: SiteConfigDTO) => renderToStaticMarkup(await Restaurante({ config }))

  it('con teléfono monta el formulario, enlazado al H2 de Reservas', async () => {
    const markup = await render(CON_TELEFONO)
    expect(markup).toContain('<h2 id="reservas-titulo"')
    expect(markup).toContain('aria-labelledby="reservas-titulo"')
    expect(markup).toContain('Pedir reserva por WhatsApp')
    expect(markup).toContain('Cuéntanos para cuántas personas y cuándo.')
  })

  it('sin teléfono no hay formulario y se invita a escribir', async () => {
    const markup = await render({ ...CON_TELEFONO, contacto: { email: 'reservas@elfogon.cl' } } as unknown as SiteConfigDTO)
    expect(markup).not.toContain('Pedir reserva por WhatsApp')
    expect(markup).not.toContain('aria-labelledby="reservas-titulo"')
    expect(markup).toContain('Escríbenos para reservar.')
  })

  it('panadería monta la variante de encargo', async () => {
    const markup = await render({ ...CON_TELEFONO, rubro: 'panaderia' } as unknown as SiteConfigDTO)
    expect(markup).toContain('Pedir encargo por WhatsApp')
    expect(markup).toContain('¿Qué quieres encargar?')
  })
})
