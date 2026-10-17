import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import ContactoDatos from '@/components/templates/shared/ContactoDatos'

// Render de la columna de datos de Contacto (LANDING y SERVICIOS). El entorno
// de Jest es 'node', así que se verifica el HTML.

function render(props: Partial<React.ComponentProps<typeof ContactoDatos>>) {
  return renderToStaticMarkup(
    React.createElement(ContactoDatos, { telefono: '+56912345678', email: 'hola@negocio.cl', ...props }),
  )
}

describe('ContactoDatos — dirección', () => {
  it('con dirección pinta una tarjeta "Dirección" sin enlace', () => {
    const markup = render({ direccion: 'Av. Libertad 1200, Viña del Mar' })

    expect(markup).toContain('Dirección')
    expect(markup).toContain('Av. Libertad 1200, Viña del Mar')
    expect(markup).not.toMatch(/<a[^>]*>[^<]*<span[^>]*>Dirección/)
  })

  it.each([undefined, null, '   '])('sin dirección (%j) no pinta la tarjeta', (direccion) => {
    expect(render({ direccion })).not.toContain('Dirección')
  })

  it('con solo la dirección la columna no desaparece', () => {
    const markup = render({ telefono: null, email: null, direccion: 'Av. Libertad 1200' })

    expect(markup).toContain('Av. Libertad 1200')
  })
})
