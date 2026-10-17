import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { Sesion } from '@/domain/entities/Sesion'
import { DemoChatService } from '@/infrastructure/demo/DemoChatService'
import { PREGUNTA_SERVICIOS, SUGERENCIAS_SERVICIOS } from '@/infrastructure/demo/guionChat'
import { recuperarChat } from '@/app/chat/recuperarChat'
import ChatWidget from '@/app/chat/ChatWidget'

async function conversacion(respuestas: string[]) {
  const sesion = new Sesion('id', 'session-id')
  const servicio = new DemoChatService()
  for (const respuesta of respuestas) {
    const siguiente = await servicio.procesarMensaje(sesion.historial, respuesta)
    sesion.agregarMensaje('user', respuesta)
    sesion.agregarMensaje('assistant', siguiente)
  }
  return sesion
}

describe('unfinished predefined chat recovery', () => {
  it('does not restore missing, empty, or completed sessions', () => {
    expect(recuperarChat(null)).toBeUndefined()
    const sesion = new Sesion('id', 'session-id')
    expect(recuperarChat(sesion)).toBeUndefined()
    sesion.agregarMensaje('user', 'Peluquería Luz')
    sesion.completada = true
    expect(recuperarChat(sesion)).toBeUndefined()
  })

  it('restores serializable history, identity and current suggestions', async () => {
    const sesion = await conversacion(['Peluquería Luz', 'Sí, es correcto', 'Cortes profesionales'])
    const estado = recuperarChat(sesion)!
    expect(estado.sessionId).toBe('session-id')
    expect(estado.mensajes).toHaveLength(6)
    expect(estado.mensajes[5].contenido).toBe(PREGUNTA_SERVICIOS)
    expect(estado.sugerencias).toEqual(SUGERENCIAS_SERVICIOS.peluqueria)
    expect(estado.reintentoExtraccion).toBeNull()
    expect(estado.mensajes.every((mensaje) => !('timestamp' in mensaje))).toBe(true)
    expect(JSON.parse(JSON.stringify(estado))).toEqual(estado)
    const html = renderToStaticMarkup(React.createElement(ChatWidget, { chatInicial: estado }))
    expect(html).toContain('Pregunta 4 de 6')
    expect(html).toContain('Cortes profesionales')
    expect(html).toContain('Agregar Corte de pelo a tu respuesta')
  })

  it('preserves the extra category turn after rejecting the inferred category', async () => {
    const sesion = await conversacion(['Peluquería Luz', 'No, es otra cosa'])
    const estado = recuperarChat(sesion)!
    const html = renderToStaticMarkup(React.createElement(ChatWidget, { chatInicial: estado }))
    expect(html).toContain('Pregunta 2 de 6')
    expect(html).toContain('¿Cuál de estas categorías describe mejor tu negocio?')
    expect(estado.sugerencias).toEqual([])
    expect(await new DemoChatService().procesarMensaje(sesion.historial, 'Veterinaria o cuidado de mascotas'))
      .toContain('¿A qué se dedica tu negocio?')
  })

  it('offers extraction retry without a duplicate user turn or premature lead form', async () => {
    const sesion = await conversacion([
      'Peluquería Luz', 'Sí, es correcto', 'Cortes profesionales', 'Corte, Tintura', 'Santiago', 'Moderno',
    ])
    const estado = recuperarChat(sesion)!
    expect(estado.reintentoExtraccion).toBe('Moderno')
    expect(estado.mensajes.filter((mensaje) => mensaje.rol === 'user')).toHaveLength(6)
    const html = renderToStaticMarkup(React.createElement(ChatWidget, { chatInicial: estado }))
    expect(html).toContain('Reintentar')
    expect(html).not.toContain('name="telefono"')
    expect(html).toMatch(/aria-label="Tu respuesta"[^>]*disabled/)
  })
})
