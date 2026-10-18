// Lógica pura de la animación del hero (ventana rotativa y tarjeta de chat),
// separada del componente para poder probarla sin DOM.
import type { MensajeChat } from './copy'

export const INTERVALO_SLIDE_MS = 4200
export const INTERVALO_CHAT_MS = 1100
export const PASOS_CHAT = 9
// Con movimiento reducido el chat queda quieto en un paso con varios mensajes.
export const PASO_CHAT_ESTATICO = 6

export function siguienteSlide(actual: number, total: number): number {
  return (actual + 1) % total
}

export function siguientePasoChat(actual: number): number {
  return (actual + 1) % PASOS_CHAT
}

export interface EstadoChat {
  mensajes: MensajeChat[]
  escribiendo: boolean
}

/**
 * Qué muestra la tarjeta de chat en `paso` (0 a PASOS_CHAT - 1): un mensaje
 * nuevo cada ~1,6 pasos y, antes de cada respuesta del bot, los tres puntos de
 * "escribiendo" en los pasos pares.
 */
export function estadoChat(paso: number, guion: MensajeChat[]): EstadoChat {
  const visibles = Math.min(guion.length, Math.floor((paso + 1) / 1.6))
  const proximo = guion[visibles]
  return {
    mensajes: guion.slice(0, Math.max(1, visibles)),
    escribiendo: visibles < guion.length && paso % 2 === 0 && proximo?.quien === 'bot',
  }
}
