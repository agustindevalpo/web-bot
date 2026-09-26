// Helpers puros para construir links de contacto/redes desde datos de
// SiteConfigDTO — ninguno hace fetch ni toca el DOM (Threat Matrix en
// design.md: "URL injection in mailto:" y "Path escape in social handle").

export function soloDigitos(telefono: string): string {
  return telefono.replace(/[^\d]/g, '')
}

export function buildWhatsAppUrl(telefono: string): string {
  return `https://wa.me/${soloDigitos(telefono)}`
}

// Regla transversal del rediseño (PLAN-SLICES.md:84-95): los formularios de
// contacto arman un mensaje de WhatsApp precargado, no un mailto:. A
// diferencia de buildWhatsAppUrl (que nunca rechaza nada, ni siquiera un
// teléfono vacío), acá un teléfono sin dígitos utilizables no tiene link
// posible — se rechaza con null en vez de devolver un wa.me/ roto.
//
// `mensaje` viaja en el query param `text`, así que se URL-encodea con
// encodeURIComponent: eso cubre saltos de línea (%0A), "&" y "#" (que
// romperían el query string sin encodear), y cualquier acento o emoji (son
// UTF-16 en el string de JS; encodeURIComponent los serializa a UTF-8
// porcentual, que es lo que wa.me espera). Un mensaje vacío o solo espacios
// degrada al link simple en vez de dejar un "?text=" colgando.
export function buildWhatsAppUrlConMensaje(telefono: string, mensaje: string): string | null {
  const digitos = soloDigitos(telefono)
  if (!digitos) return null

  const mensajeLimpio = mensaje.trim()
  if (!mensajeLimpio) return `https://wa.me/${digitos}`

  return `https://wa.me/${digitos}?text=${encodeURIComponent(mensajeLimpio)}`
}

export function buildTelUrl(telefono: string): string {
  return `tel:${telefono}`
}

// Solo letras, dígitos, punto y guion bajo — cualquier "/" o ".." queda
// despojado antes de interpolar, así un handle malicioso no puede escapar
// del path de perfil de Instagram (Threat: path escape).
const HANDLE_CARACTERES_PERMITIDOS = /[^A-Za-z0-9._]/g

export function buildInstagramUrl(handle: string): string {
  const limpio = handle.replace(/^@/, '').replace(HANDLE_CARACTERES_PERMITIDOS, '')
  return `https://instagram.com/${limpio}`
}

// Rechaza (retorna null) direcciones con "?" o saltos de línea — ninguna de
// las dos puede viajar a un mailto: sin permitir anexar parámetros
// cc/bcc/subject o inyectar headers de correo (Threat: URL injection en
// mailto:). El valor aceptado se URL-encodea igual, como defensa en
// profundidad.
const CARACTERES_INSEGUROS_MAILTO = /[?\r\n]/

export function buildMailtoUrl(destinatarioEmail: string): string | null {
  if (CARACTERES_INSEGUROS_MAILTO.test(destinatarioEmail)) return null
  return `mailto:${encodeURIComponent(destinatarioEmail)}`
}
