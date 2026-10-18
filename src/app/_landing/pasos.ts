// Lógica pura del riel de "Cómo funciona" (README del handoff §5). El relleno
// del riel sigue el scroll; cada círculo se enciende cuando el relleno lo alcanza.

const FRACCION_VENTANA = 0.6
// Alto del círculo de un paso: el riel recorre el contenedor menos esta medida.
export const ALTO_CIRCULO_PX = 56

function acotar(valor: number): number {
  return Math.min(1, Math.max(0, valor))
}

/**
 * Progreso 0..1 del relleno: cuánto del contenedor de pasos ya cruzó el 60 % de
 * la altura de la ventana. `rectTop` y `rectAlto` vienen de getBoundingClientRect.
 */
export function progresoPasos(alturaVentana: number, rectTop: number, rectAlto: number): number {
  const recorrido = rectAlto - ALTO_CIRCULO_PX
  if (recorrido <= 0) return 1
  return acotar((alturaVentana * FRACCION_VENTANA - rectTop) / recorrido)
}

/** `true` si el paso `indice` (0-based) ya fue alcanzado por el relleno. */
export function pasoActivo(progreso: number, indice: number, totalPasos: number): boolean {
  if (totalPasos <= 1) return progreso > 0
  return progreso >= indice / (totalPasos - 1)
}
