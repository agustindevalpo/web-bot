import { buildWhatsAppUrlConMensaje } from '@/components/templates/shared/enlaces'

// Número de contacto de Devalpo, el mismo que ya publica el pie de la landing
// (src/app/page.tsx). Una sola constante para que el chat y las pantallas que
// vienen (momento 2, /gracias) escriban al mismo WhatsApp.
export const WHATSAPP_DEVALPO = '+56976424587'

export const MENSAJE_WHATSAPP_LIMITE = 'Hola, quiero armar el sitio de mi negocio con WebBot.'

export function enlaceWhatsAppDevalpo(mensaje: string): string | null {
  return buildWhatsAppUrlConMensaje(WHATSAPP_DEVALPO, mensaje)
}
