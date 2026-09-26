import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import TerminosPage from '@/app/terminos/page'

// Render en tiempo de ejecución para /terminos (WB-legal), mismo patrón que
// tests/unit/app/chat/DemoCTA.render.test.ts: server component sin hooks, así
// que renderToStaticMarkup alcanza sin necesitar jsdom.

describe('TerminosPage — render', () => {
  it('declara la identidad del vendedor (RUT y razón social)', () => {
    const markup = renderToStaticMarkup(React.createElement(TerminosPage))

    expect(markup).toContain('Devalpo Soluciones Tecnológicas SpA')
    expect(markup).toContain('77.119.936-4')
  })

  it('excluye expresamente el derecho a retracto y ofrece la garantía de publicación', () => {
    const markup = renderToStaticMarkup(React.createElement(TerminosPage))

    expect(markup).toContain('no aplica')
    expect(markup).toContain('artículo 3 bis')
    expect(markup).toContain('10 días corridos')
  })

  it('enlaza a la política de privacidad', () => {
    const markup = renderToStaticMarkup(React.createElement(TerminosPage))

    expect(markup).toMatch(/<a href="\/privacidad"[^>]*>Política de Privacidad<\/a>/)
  })
})
