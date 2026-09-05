// Helpers puros para construir links de contacto/redes desde datos de
// SiteConfigDTO — ninguno hace fetch ni toca el DOM (Threat Matrix en
// design.md: "URL injection in mailto:" y "Path escape in social handle").

export function soloDigitos(telefono: string): string {
  return telefono.replace(/[^\d]/g, '')
}

export function buildWhatsAppUrl(telefono: string): string {
  return `https://wa.me/${soloDigitos(telefono)}`
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
