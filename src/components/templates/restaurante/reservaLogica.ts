import { buildWhatsAppUrlConMensaje } from '@/components/templates/shared/enlaces'

// Lógica pura de `FormReserva` (cliente): validación, armado del mensaje de
// WhatsApp y decisión de qué mostrar tras enviar. Sin DOM, para poder probarla
// en el entorno `node` de Jest; el componente solo la llama.

export const OPCIONES_PERSONAS: readonly string[] = [
  '1 persona',
  ...Array.from({ length: 7 }, (_, indice) => `${indice + 2} personas`),
  'Más de 8 personas',
]

export const MAX_NOMBRE = 40
export const MAX_CUANDO = 40
export const MAX_PEDIDO = 60

// `detalle` es "Personas" en la reserva y "¿Qué quieres encargar?" en el encargo.
export type ValoresReserva = { nombre: string; detalle: string; cuando: string }
export type CampoReserva = keyof ValoresReserva
export type ErroresReserva = Partial<Record<CampoReserva, string>>

export const ORDEN_CAMPOS: readonly CampoReserva[] = ['nombre', 'detalle', 'cuando']

const ERRORES = {
  nombre: 'Escribe tu nombre.',
  personas: 'Elige para cuántas personas.',
  pedido: 'Cuéntanos qué quieres encargar.',
  cuando: 'Cuéntanos para qué día y hora.',
} as const

export function validarReserva(valores: ValoresReserva, esEncargo: boolean): ErroresReserva {
  const errores: ErroresReserva = {}
  if (valores.nombre.trim() === '') errores.nombre = ERRORES.nombre
  if (valores.detalle.trim() === '') errores.detalle = esEncargo ? ERRORES.pedido : ERRORES.personas
  if (valores.cuando.trim() === '') errores.cuando = ERRORES.cuando
  return errores
}

export function primerCampoInvalido(errores: ErroresReserva): CampoReserva | null {
  return ORDEN_CAMPOS.find((campo) => errores[campo] !== undefined) ?? null
}

// "Hola, soy {nombre}. Quiero reservar una mesa para {personas}, {cuándo}."
// "Hola, soy {nombre}. Quiero encargar {pedido} para {cuándo}."
// Valores recortados; las personas van en minúsculas tal como se eligieron.
export function construirMensajeReserva(valores: ValoresReserva, esEncargo: boolean): string {
  const nombre = valores.nombre.trim()
  const cuando = valores.cuando.trim()
  const detalle = valores.detalle.trim()
  return esEncargo
    ? `Hola, soy ${nombre}. Quiero encargar ${detalle} para ${cuando}.`
    : `Hola, soy ${nombre}. Quiero reservar una mesa para ${detalle.toLowerCase()}, ${cuando}.`
}

export type ResultadoEnvioReserva = { url: string | null; bloqueado: boolean }

// `abrirVentana` es la única frontera con el navegador. `url: null` = el
// teléfono no tiene dígitos utilizables (no hay link posible).
export function resolverEnvioReserva(
  telefono: string,
  mensaje: string,
  abrirVentana: (url: string) => unknown,
): ResultadoEnvioReserva {
  const url = buildWhatsAppUrlConMensaje(telefono, mensaje)
  if (!url) return { url: null, bloqueado: true }
  return { url, bloqueado: !abrirVentana(url) }
}
