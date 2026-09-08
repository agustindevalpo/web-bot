import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { LeadForm } from '@/app/chat/LeadForm'

// Prueba de render en tiempo de ejecución para LeadForm (mismo enfoque que
// DemoCTA.render.test.ts): es un componente presentacional puro — recibe
// todo su estado por props (nombre, email, enviando, error) y delega el
// envío a `onSubmit` — así que renderToStaticMarkup alcanza para verificar
// el HTML producido para cada combinación de props, sin necesitar jsdom.

function propsBase() {
  return {
    nombre: '',
    email: '',
    enviando: false,
    error: null as string | null,
    onNombreChange: () => {},
    onEmailChange: () => {},
    onSubmit: () => {},
  }
}

describe('LeadForm — render', () => {
  it('con campos vacíos, el botón queda deshabilitado y no muestra error', () => {
    const markup = renderToStaticMarkup(React.createElement(LeadForm, propsBase()))

    expect(markup).toContain('Ver mi sitio de ejemplo')
    expect(markup).toMatch(/<button[^>]*disabled=""[^>]*>/)
    expect(markup).not.toContain('Revisa tu nombre')
  })

  it('con nombre y correo completos y enviando=false, el botón queda habilitado', () => {
    const markup = renderToStaticMarkup(
      React.createElement(LeadForm, { ...propsBase(), nombre: 'Ana', email: 'ana@ejemplo.cl' }),
    )

    expect(markup).not.toMatch(/<button[^>]*disabled=""[^>]*>/)
    expect(markup).toContain('value="Ana"')
    expect(markup).toContain('value="ana@ejemplo.cl"')
  })

  it('mientras enviando=true, deshabilita ambos campos y el botón, y cambia el texto', () => {
    const markup = renderToStaticMarkup(
      React.createElement(LeadForm, { ...propsBase(), nombre: 'Ana', email: 'ana@ejemplo.cl', enviando: true }),
    )

    expect(markup).toContain('Enviando...')
    expect(markup).toMatch(/<input[^>]*disabled=""[^>]*>/)
    expect(markup).toMatch(/<button[^>]*disabled=""[^>]*>/)
  })

  it('muestra el mensaje de error recibido por props', () => {
    const markup = renderToStaticMarkup(
      React.createElement(LeadForm, { ...propsBase(), error: 'Revisa tu nombre y tu correo electrónico.' }),
    )

    expect(markup).toContain('Revisa tu nombre y tu correo electrónico.')
  })
})
