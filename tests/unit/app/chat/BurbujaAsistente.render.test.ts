import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { BurbujaAsistente, TarjetaLimite } from '@/app/chat/ChatWidget'

// Prueba de render en tiempo de ejecución para BurbujaAsistente (mismo
// patrón que DemoCTA.render.test.ts): jest.config.ts corre el proyecto
// "unit" en testEnvironment 'node', sin jsdom, así que no se puede simular
// un clic — renderToStaticMarkup alcanza para verificar que las opciones
// aparecen como botones reales en el HTML producido.

const MENSAJE_CON_OPCIONES = '¿Qué estilo visual prefieres para tu sitio?\n\n• Moderno y minimalista\n• Cálido y cercano\n• Colorido y llamativo'
const MENSAJE_SERVICIOS =
  '¿Cuáles son tus principales servicios?\n\nEscribe los 3 o 4 más importantes, separados por coma.'

function props(overrides: Partial<React.ComponentProps<typeof BurbujaAsistente>> = {}) {
  return {
    contenido: MENSAJE_CON_OPCIONES,
    activa: true,
    numero: 6 as number | null,
    mostrarOpciones: true,
    enviando: false,
    sugerencias: [] as string[],
    valorInput: '',
    onSeleccionarOpcion: () => {},
    onAgregarSugerencia: () => {},
    ...overrides,
  }
}

describe('BurbujaAsistente — render', () => {
  it('muestra la prosa y cada opción como un <button> cuando mostrarOpciones es true', () => {
    const markup = renderToStaticMarkup(React.createElement(BurbujaAsistente, props()))

    expect(markup).toContain('¿Qué estilo visual prefieres para tu sitio?')
    expect(markup).not.toContain('•')

    for (const opcion of ['Moderno y minimalista', 'Cálido y cercano', 'Colorido y llamativo']) {
      expect(markup).toMatch(new RegExp(`<button[^>]*>${opcion}</button>`))
    }
  })

  it('no renderiza botones cuando mostrarOpciones es false, aunque el mensaje tenga viñetas', () => {
    const markup = renderToStaticMarkup(React.createElement(BurbujaAsistente, props({ mostrarOpciones: false })))

    expect(markup).not.toContain('<button')
    expect(markup).toContain('¿Qué estilo visual prefieres para tu sitio?')
  })

  it('deshabilita los botones de opción mientras enviando es true', () => {
    const markup = renderToStaticMarkup(React.createElement(BurbujaAsistente, props({ enviando: true })))

    expect(markup).toMatch(/<button[^>]*disabled=""[^>]*>Moderno y minimalista<\/button>/)
  })

  it('no muestra opciones para un mensaje sin viñetas', () => {
    const markup = renderToStaticMarkup(
      React.createElement(BurbujaAsistente, props({ contenido: '¿Cómo se llama tu negocio?', numero: 1 })),
    )

    expect(markup).not.toContain('<button')
    expect(markup).toContain('¿Cómo se llama tu negocio?')
  })

  it('una pregunta ya respondida se muestra como texto de historial, sin rótulo ni botones', () => {
    const markup = renderToStaticMarkup(React.createElement(BurbujaAsistente, props({ activa: false })))

    expect(markup).toContain('¿Qué estilo visual prefieres para tu sitio?')
    expect(markup).not.toContain('<button')
    expect(markup).not.toContain('Pregunta 6 de 6')
  })

  it('la pregunta activa lleva su rótulo "Pregunta n de 6"; el cierre (numero null) no', () => {
    const activa = renderToStaticMarkup(React.createElement(BurbujaAsistente, props({ numero: 3 })))
    const cierre = renderToStaticMarkup(React.createElement(BurbujaAsistente, props({ numero: null })))

    expect(activa).toContain('Pregunta 3 de 6')
    expect(cierre).not.toContain('Pregunta')
  })

  it('agrupa las opciones con role="group" enlazado a la pregunta y a su ayuda (sección j)', () => {
    const markup = renderToStaticMarkup(React.createElement(BurbujaAsistente, props()))

    expect(markup).toMatch(/<div[^>]*role="group"[^>]*aria-labelledby="pregunta-activa"/)
    expect(markup).toContain('id="pregunta-activa"')
    expect(markup).toContain('id="ayuda-opciones"')
    expect(markup).toContain('aria-describedby="ayuda-opciones"')
    expect(markup).toContain('También puedes escribir tu respuesta.')
  })

  it('separa la ayuda de la pregunta y la enlaza con aria-describedby', () => {
    const markup = renderToStaticMarkup(
      React.createElement(BurbujaAsistente, props({ contenido: MENSAJE_SERVICIOS, numero: 4 })),
    )

    expect(markup).toMatch(/id="pregunta-activa"[^>]*>¿Cuáles son tus principales servicios\?<\/p>/)
    expect(markup).toMatch(/id="ayuda-activa"[^>]*>Escribe los 3 o 4 más importantes, separados por coma\.<\/p>/)
  })

  it('muestra las sugerencias como botones con aria-label y oculta las que ya están en el campo', () => {
    const markup = renderToStaticMarkup(
      React.createElement(
        BurbujaAsistente,
        props({
          contenido: MENSAJE_SERVICIOS,
          numero: 4,
          sugerencias: ['Limpieza dental', 'Ortodoncia'],
          valorInput: 'limpieza dental, ',
        }),
      ),
    )

    expect(markup).toContain('aria-label="Agregar Ortodoncia a tu respuesta"')
    expect(markup).not.toContain('Agregar Limpieza dental')
    // Sin viñetas no hay grupo de opciones: solo el de sugerencias.
    expect(markup).not.toContain('También puedes escribir tu respuesta.')
  })

  it('no muestra sugerencias cuando mostrarOpciones es false', () => {
    const markup = renderToStaticMarkup(
      React.createElement(
        BurbujaAsistente,
        props({ contenido: MENSAJE_SERVICIOS, numero: 4, mostrarOpciones: false, sugerencias: ['Ortodoncia'] }),
      ),
    )

    expect(markup).not.toContain('Ortodoncia')
  })
})

describe('TarjetaLimite — render', () => {
  it('muestra el copy del límite diario con el CTA de WhatsApp y el enlace al inicio', () => {
    const markup = renderToStaticMarkup(
      React.createElement(TarjetaLimite, { hrefWhatsApp: 'https://wa.me/56900000000?text=Hola' }),
    )

    expect(markup).toContain('Sitios de prueba')
    expect(markup).toContain('Por hoy llegaste al máximo de sitios de prueba')
    expect(markup).toContain('Desde esta conexión se pueden armar 2 sitios de prueba al día.')
    expect(markup).toMatch(/<a[^>]*href="https:\/\/wa\.me\/56900000000\?text=Hola"[^>]*>Escribir a Devalpo por WhatsApp<\/a>/)
    expect(markup).toMatch(/<a[^>]*href="\/"[^>]*>Volver al inicio<\/a>/)
  })

  it('sin enlace de WhatsApp conserva solo "Volver al inicio"', () => {
    const markup = renderToStaticMarkup(React.createElement(TarjetaLimite, { hrefWhatsApp: null }))

    expect(markup).not.toContain('WhatsApp')
    expect(markup).toContain('Volver al inicio')
  })
})
