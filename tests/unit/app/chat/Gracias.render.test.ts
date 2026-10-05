import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import GraciasPage from '@/app/gracias/page'

// Mismo enfoque que Momento2.render.test.ts: HTML del render de servidor.
// La página no recibe props, así que el HTML es el mismo con o sin los query
// params que Mercado Pago agrega al volver.

const MENSAJE = 'Hola, acabo de pagar mi sitio de WebBot. Les mando mi logo y mis fotos.'

describe('/gracias (G1)', () => {
  const html = renderToStaticMarkup(React.createElement(GraciasPage))

  it('muestra el texto de la spec', () => {
    expect(html).toContain('Gracias')
    expect(html).toContain('Ahora revisamos tu pago')
    expect(html).toContain(
      'Lo confirmamos a mano y te escribimos por WhatsApp en menos de un día hábil para publicar tu sitio.',
    )
    expect(html).toContain('Para publicarlo, ten a mano:')
    expect(html).toContain('Tu logo')
    expect(html).toContain('PNG, JPG o WebP, de hasta 5 MB. Si no tienes, usamos tus iniciales.')
    expect(html).toContain('Una foto de tu local o de tu equipo')
    expect(html).toContain('Es la que va arriba en tu sitio.')
    expect(html).toContain('Más fotos, si tienes')
    expect(html).toContain('Del lugar o de cada servicio. Son opcionales.')
    expect(html).toContain('Si ya nos escribiste, no necesitas hacer nada más.')
  })

  it('el botón de WhatsApp lleva el mensaje codificado hacia Devalpo', () => {
    expect(html).toContain('Mandar logo y fotos por WhatsApp')
    expect(html).toContain('https://wa.me/56976424587?text=')
    expect(html).toContain(encodeURIComponent(MENSAJE))
  })

  it('no confirma el pago más allá de la spec', () => {
    expect(html).not.toMatch(/pago (confirmado|exitoso|recibido)/i)
  })
})
