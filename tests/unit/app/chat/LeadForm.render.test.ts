import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { LeadForm } from '@/app/chat/LeadForm'

// Prueba de render para LeadForm (mismo enfoque que DemoCTA.render.test.ts):
// es presentacional, recibe sus valores por props y el entorno de Jest es
// 'node' (sin jsdom), así que se verifica el HTML, no la interacción. La
// validación en sí se prueba en datosLead.test.ts.

function propsBase() {
  return {
    nombre: '',
    email: '',
    telefono: '',
    enviando: false,
    error: null as string | null,
    onNombreChange: () => {},
    onEmailChange: () => {},
    onTelefonoChange: () => {},
    onSubmit: () => {},
  }
}

describe('LeadForm — render', () => {
  it('muestra el copy de R1: título, texto, rótulos, ayuda, botón y pie', () => {
    const markup = renderToStaticMarkup(React.createElement(LeadForm, propsBase()))

    expect(markup).toContain('Tu sitio está listo para verlo')
    expect(markup).toContain('Déjanos tus datos y te lo mostramos ahora.')
    expect(markup).toContain('Tu nombre')
    expect(markup).toContain('Tu correo')
    expect(markup).toContain('WhatsApp del negocio')
    expect(markup).toContain('Es el número que recibe los mensajes de tu sitio. Puedes cambiarlo después.')
    expect(markup).toContain('Ver mi sitio')
    expect(markup).toContain('Usamos estos datos solo para tu sitio.')
    expect(markup).toMatch(/<a[^>]*href="\/privacidad"[^>]*>Política de privacidad<\/a>/)
  })

  it('el teléfono lleva el prefijo fijo "+56 9" y atributos de móvil', () => {
    const markup = renderToStaticMarkup(React.createElement(LeadForm, propsBase()))

    expect(markup).toContain('+56 9')
    expect(markup).toContain('inputMode="numeric"')
    expect(markup).toContain('autoComplete="tel-national"')
  })

  it('sin intentos de envío no muestra errores ni marca campos inválidos', () => {
    const markup = renderToStaticMarkup(React.createElement(LeadForm, propsBase()))

    expect(markup).not.toContain('aria-invalid')
    expect(markup).not.toContain('Escribe tu nombre.')
  })

  it('refleja los valores recibidos por props', () => {
    const markup = renderToStaticMarkup(
      React.createElement(LeadForm, { ...propsBase(), nombre: 'Ana', email: 'ana@ejemplo.cl', telefono: '12345678' }),
    )

    expect(markup).toContain('value="Ana"')
    expect(markup).toContain('value="ana@ejemplo.cl"')
    expect(markup).toContain('value="12345678"')
  })

  it('mientras enviando=true, deshabilita campos y botón, y cambia el texto', () => {
    const markup = renderToStaticMarkup(React.createElement(LeadForm, { ...propsBase(), enviando: true }))

    expect(markup).toContain('Enviando...')
    expect(markup).toMatch(/<input[^>]*disabled=""[^>]*>/)
    expect(markup).toMatch(/<button[^>]*disabled=""[^>]*>/)
  })

  it('muestra el error de envío como alerta y conserva los datos', () => {
    const markup = renderToStaticMarkup(
      React.createElement(LeadForm, {
        ...propsBase(),
        nombre: 'Ana',
        error: 'No pudimos guardar tus datos. Revisa tu conexión e inténtalo de nuevo.',
      }),
    )

    expect(markup).toMatch(/role="alert"[^>]*>No pudimos guardar tus datos/)
    expect(markup).toContain('value="Ana"')
  })
})
