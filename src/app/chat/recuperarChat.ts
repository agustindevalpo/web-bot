import type { Sesion } from '@/domain/entities/Sesion'
import { DemoChatService, sugerenciasParaPregunta } from '@/infrastructure/demo/DemoChatService'

export type MensajeChat = { rol: 'user' | 'assistant'; contenido: string }
export interface ChatRecuperado {
  sessionId: string
  mensajes: MensajeChat[]
  sugerencias: string[]
  reintentoExtraccion: string | null
}

// Only unfinished predefined conversations are recovered. Completed demos
// retain the existing fresh-conversation rotation in POST /api/chat.
export function recuperarChat(sesion: Sesion | null): ChatRecuperado | undefined {
  if (!sesion || sesion.completada || sesion.historial.length === 0) return undefined
  const mensajes = sesion.historial.map(({ rol, contenido }) => ({ rol, contenido }))
  const ultimaRespuesta = mensajes.findLast((mensaje) => mensaje.rol === 'user')?.contenido ?? null
  const ultimaPregunta = mensajes.findLast((mensaje) => mensaje.rol === 'assistant')?.contenido ?? null
  return {
    sessionId: sesion.sessionId,
    mensajes,
    sugerencias: sugerenciasParaPregunta(sesion.historial, ultimaPregunta),
    reintentoExtraccion: new DemoChatService().conversacionCompleta(sesion.historial) ? ultimaRespuesta : null,
  }
}
