import { buildWhatsAppUrlConMensaje } from './enlaces'

// Armado del mensaje de WhatsApp del formulario de Contacto, compartido por
// LANDING (nombre, email, mensaje) y SERVICIOS (nombre, servicio, día). Todo
// puro y sin DOM: `FormularioContacto.tsx` (cliente) solo lo llama.

function limpio(valor: string): string | null {
  const recortado = valor.trim()
  return recortado === '' ? null : recortado
}

// Formato LANDING. Cualquier campo vacío o solo espacios omite su línea en
// vez de dejar "Nombre: " colgando.
export function construirMensajeContacto(nombre: string, email: string, mensaje: string): string {
  const nombreLimpio = limpio(nombre)
  const emailLimpio = limpio(email)
  return [nombreLimpio && `Nombre: ${nombreLimpio}`, emailLimpio && `Email: ${emailLimpio}`, limpio(mensaje)]
    .filter((parte): parte is string => parte !== null)
    .join('\n')
}

// Formato SERVICIOS (02-SERVICIOS.md, "Contacto"):
// `Hola, soy {nombre}. Quiero agendar {servicio}. Me acomoda {día}.`
// Cada frase vive o muere con su campo; con los tres vacíos el resultado es ''.
export function construirMensajeAgenda(nombre: string, servicio: string, dia: string): string {
  const nombreLimpio = limpio(nombre)
  const servicioLimpio = limpio(servicio)
  const diaLimpio = limpio(dia)
  return [
    nombreLimpio && `Hola, soy ${nombreLimpio}.`,
    servicioLimpio && `Quiero agendar ${servicioLimpio}.`,
    diaLimpio && `Me acomoda ${diaLimpio}.`,
  ]
    .filter((parte): parte is string => parte !== null)
    .join(' ')
}

export type ResultadoEnvioContacto = { mensaje: string | null; debeResetear: boolean }

const MENSAJE_SIN_TELEFONO = 'No pudimos preparar el mensaje de WhatsApp. Escríbenos al teléfono o al email de esta sección.'
const MENSAJE_POPUP_BLOQUEADO = 'Tu navegador bloqueó la ventana de WhatsApp. Permite ventanas emergentes o escríbenos al teléfono o al email de esta sección.'

// Decide qué feedback mostrar y si el formulario debe limpiarse, sin tocar el
// DOM — `abrirVentana` es la única frontera con el navegador, inyectada para
// poder pinear los 3 casos (sin teléfono, popup bloqueado, éxito). Nunca pide
// resetear salvo que `abrirVentana` haya devuelto algo truthy: ni con
// teléfono inutilizable ni con el popup bloqueado se pierde lo tipeado (R3-002).
export function resolverEnvioContacto(
  telefono: string,
  mensaje: string,
  abrirVentana: (url: string) => unknown,
): ResultadoEnvioContacto {
  const url = buildWhatsAppUrlConMensaje(telefono, mensaje)
  if (!url) return { mensaje: MENSAJE_SIN_TELEFONO, debeResetear: false }

  const ventana = abrirVentana(url)
  if (!ventana) return { mensaje: MENSAJE_POPUP_BLOQUEADO, debeResetear: false }

  return { mensaje: null, debeResetear: true }
}
