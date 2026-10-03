// Decisión pura de la banda de datos sobre `--ink` (handoff Bloques, "Banda de
// cifras", y 00-DECISIONES-TRANSVERSALES T1 punto 3): un único componente con
// distintos datos por plantilla (cifras, horarios, credenciales). Testeable sin
// DOM; el componente solo la consume.

export type LayoutBanda = 'una' | 'dos' | 'tres'

export const MAX_ITEMS_BANDA = 3

// Con 0 ítems la banda no se renderiza (`null`). Con más de 3 también se
// devuelve `null`: recortar en silencio mostraría una selección arbitraria, y
// cada plantilla decide su propio tope antes de llamar (LANDING recorta en
// `buildDestacados`; SERVICIOS oculta la banda si hay más de 3 horarios).
export function layoutBanda(cantidad: number): LayoutBanda | null {
  if (cantidad === 1) return 'una'
  if (cantidad === 2) return 'dos'
  if (cantidad === 3) return 'tres'
  return null
}
