import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { BurbujaAsistente } from '@/app/chat/ChatWidget'

// Prueba de render en tiempo de ejecución para BurbujaAsistente (mismo
// patrón que DemoCTA.render.test.ts): jest.config.ts corre el proyecto
// "unit" en testEnvironment 'node', sin jsdom, así que no se puede simular
// un clic — renderToStaticMarkup alcanza para verificar que las opciones
// aparecen como botones reales en el HTML producido.

const MENSAJE_CON_OPCIONES = '¿Qué estilo visual prefieres para tu sitio?\n\n• Moderno y minimalista\n• Cálido y cercano\n• Colorido y llamativo'

describe('BurbujaAsistente — render', () => {
  it('muestra la prosa y cada opción como un <button> cuando mostrarOpciones es true', () => {
    const markup = renderToStaticMarkup(
      React.createElement(BurbujaAsistente, {
        contenido: MENSAJE_CON_OPCIONES,
        mostrarOpciones: true,
        enviando: false,
        onSeleccionarOpcion: () => {},
      }),
    )

    expect(markup).toContain('¿Qué estilo visual prefieres para tu sitio?')
    expect(markup).not.toContain('•')

    for (const opcion of ['Moderno y minimalista', 'Cálido y cercano', 'Colorido y llamativo']) {
      expect(markup).toMatch(new RegExp(`<button[^>]*>${opcion}</button>`))
    }
  })

  it('no renderiza botones cuando mostrarOpciones es false, aunque el mensaje tenga viñetas', () => {
    const markup = renderToStaticMarkup(
      React.createElement(BurbujaAsistente, {
        contenido: MENSAJE_CON_OPCIONES,
        mostrarOpciones: false,
        enviando: false,
        onSeleccionarOpcion: () => {},
      }),
    )

    expect(markup).not.toContain('<button')
    expect(markup).toContain('¿Qué estilo visual prefieres para tu sitio?')
  })

  it('deshabilita los botones de opción mientras enviando es true', () => {
    const markup = renderToStaticMarkup(
      React.createElement(BurbujaAsistente, {
        contenido: MENSAJE_CON_OPCIONES,
        mostrarOpciones: true,
        enviando: true,
        onSeleccionarOpcion: () => {},
      }),
    )

    expect(markup).toMatch(/<button[^>]*disabled=""[^>]*>Moderno y minimalista<\/button>/)
  })

  it('no muestra opciones para un mensaje sin viñetas', () => {
    const markup = renderToStaticMarkup(
      React.createElement(BurbujaAsistente, {
        contenido: '¿Cómo se llama tu negocio?',
        mostrarOpciones: true,
        enviando: false,
        onSeleccionarOpcion: () => {},
      }),
    )

    expect(markup).not.toContain('<button')
    expect(markup).toContain('¿Cómo se llama tu negocio?')
  })
})
