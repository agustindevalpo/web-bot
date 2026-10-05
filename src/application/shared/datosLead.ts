// Validación del paso de datos (R1), compartida por el formulario del chat y
// por el caso de uso: ambos aplican exactamente la misma regla.

export const MENSAJES_LEAD = {
  nombreVacio: 'Escribe tu nombre.',
  correoVacio: 'Escribe tu correo.',
  correoSinDominio: 'Revisa el correo: le falta el final, por ejemplo .cl o .com.',
  correoIncompleto: 'Revisa el correo, parece incompleto.',
  telefono: 'Escribe los 8 dígitos que van después del +56 9.',
} as const

export interface DatosLeadCrudos {
  nombre: string
  email: string
  telefono: string
}

export type ErroresLead = Partial<Record<keyof DatosLeadCrudos, string>>

const DIGITOS_TELEFONO = 8
const CORREO_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@.]+$/

// Quita espacios, guiones y cualquier carácter no numérico mientras se escribe.
export function normalizarDigitosTelefono(valor: string): string {
  return valor.replace(/\D/g, '').slice(0, DIGITOS_TELEFONO)
}

// Devuelve `+569XXXXXXXX`, o null si no son exactamente 8 dígitos.
export function telefonoLeadANormalizado(valor: string): string | null {
  const digitos = valor.replace(/[\s-]/g, '')
  return /^\d{8}$/.test(digitos) ? `+569${digitos}` : null
}

export function mensajeErrorCorreo(valor: string): string | null {
  const correo = valor.trim()
  if (!correo) return MENSAJES_LEAD.correoVacio
  if (CORREO_VALIDO.test(correo)) return null
  // "ana@correo" o "ana@correo." : tiene arroba y dominio, pero sin final.
  if (/^[^\s@]+@[^\s@.]+\.?$/.test(correo)) return MENSAJES_LEAD.correoSinDominio
  return MENSAJES_LEAD.correoIncompleto
}

export function validarDatosLead(datos: DatosLeadCrudos): ErroresLead {
  const errores: ErroresLead = {}
  if (!datos.nombre.trim()) errores.nombre = MENSAJES_LEAD.nombreVacio
  const errorCorreo = mensajeErrorCorreo(datos.email)
  if (errorCorreo) errores.email = errorCorreo
  if (!telefonoLeadANormalizado(datos.telefono)) errores.telefono = MENSAJES_LEAD.telefono
  return errores
}
