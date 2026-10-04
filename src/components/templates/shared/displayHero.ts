// Escala del display del hero (handoff Bloques, "Escala del display"): tres
// tramos discretos por el largo del nombre, calculados en el servidor. Nunca
// `clamp()`: el tamaño no depende del ancho de la ventana. Compartido para que
// SERVICIOS (y las demás plantillas al migrar) reusen la misma tabla.
//
// Los valores de `ESCALA_DISPLAY` son documentación testeable; el CSS de cada
// plantilla los pinta con una clase por tramo (en móvil los tres tramos bajan
// a 44px / .98 / -.045em, y una clase se deja pisar por un media query,
// una variable en línea no).

export type TramoDisplay = 'grande' | 'medio' | 'chico'

export type EspecDisplay = {
  tramo: TramoDisplay
  tamanoPx: number
  alturaLinea: number
  trackingEm: number
}

export const ESCALA_DISPLAY: Record<TramoDisplay, EspecDisplay> = {
  grande: { tramo: 'grande', tamanoPx: 104, alturaLinea: 0.95, trackingEm: -0.048 },
  medio: { tramo: 'medio', tamanoPx: 78, alturaLinea: 1.0, trackingEm: -0.042 },
  chico: { tramo: 'chico', tamanoPx: 56, alturaLinea: 1.06, trackingEm: -0.035 },
}

const MAX_TRAMO_GRANDE = 14
const MAX_TRAMO_MEDIO = 26

// Mide el nombre ya recortado: espacios sobrantes no cuentan.
export function tramoDisplay(nombre: string): EspecDisplay {
  const largo = nombre.trim().length
  if (largo <= MAX_TRAMO_GRANDE) return ESCALA_DISPLAY.grande
  if (largo <= MAX_TRAMO_MEDIO) return ESCALA_DISPLAY.medio
  return ESCALA_DISPLAY.chico
}
