// Copy por rubro de la plantilla RESTAURANTE (04-RESTAURANTE.md + P3). El
// rubro `panaderia` comparte plantilla pero no tiene mesas: reserva se vuelve
// encargo. Todo el texto que cambia vive acá, en un solo lugar, para que el
// header, el hero, la sección de Reservas y el formulario (R4) no se desalineen.

export type CopyReserva = {
  // Verdadero si el rubro encarga en vez de reservar (panadería, P3).
  esEncargo: boolean
  // Etiqueta del nav; el ancla sigue siendo `#reservas`.
  etiquetaNav: string
  ctaHeader: string
  ctaHeroPrimario: string
  // Rótulo de la celda del hero tipográfico que lleva el teléfono.
  rotuloDatoHero: string
  eyebrow: string
  titulo: string
  parrafo: string
  // Sin teléfono no hay formulario: se invita a escribir por correo.
  sinTelefono: string
  // Texto del botón de envío del formulario (R4).
  botonEnviar: string
}

const RESERVA: CopyReserva = {
  esEncargo: false,
  etiquetaNav: 'Reservas',
  ctaHeader: 'Reservar mesa',
  ctaHeroPrimario: 'Reservar por WhatsApp',
  rotuloDatoHero: 'Reservas',
  eyebrow: 'Reservas',
  titulo: 'Reserva tu mesa',
  parrafo: 'Cuéntanos para cuántas personas y cuándo. Te respondemos por WhatsApp para confirmar.',
  sinTelefono: 'Escríbenos para reservar.',
  botonEnviar: 'Pedir reserva por WhatsApp',
}

const ENCARGO: CopyReserva = {
  esEncargo: true,
  etiquetaNav: 'Encargos',
  ctaHeader: 'Hacer un encargo',
  ctaHeroPrimario: 'Encargar por WhatsApp',
  rotuloDatoHero: 'Encargos',
  eyebrow: 'Encargos',
  titulo: 'Haz tu encargo',
  parrafo: 'Cuéntanos qué quieres encargar y para cuándo. Te respondemos por WhatsApp para confirmar.',
  sinTelefono: 'Escríbenos para encargar.',
  botonEnviar: 'Pedir encargo por WhatsApp',
}

export const TEXTO_ESCRIBENOS = 'Escríbenos'

export function esPanaderia(rubro: unknown): boolean {
  return typeof rubro === 'string' && rubro.trim().toLowerCase() === 'panaderia'
}

export function copyReserva(rubro: unknown): CopyReserva {
  return esPanaderia(rubro) ? ENCARGO : RESERVA
}
