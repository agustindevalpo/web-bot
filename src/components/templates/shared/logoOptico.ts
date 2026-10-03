// Tamaño óptico del logo del cliente: regla T3 del handoff de Bloques
// (docs/design_handoff_plantillas_webbot/handoff_bloquesV2, 2026-10-03).
// Un logo se ve del mismo tamaño cuando ocupa la misma área, no el mismo alto.
// Con r = ancho / alto:
//
//   escritorio: alto = clamp(28, sqrt(5808 / r), 60); si alto * r > 180 -> 180 / r
//   móvil:      alto = clamp(22, sqrt(3468 / r), 46); si alto * r > 140 -> 140 / r
//
// 5808 = 44^2 * 3 y 3468 = 34^2 * 3: el área de un logo 3:1 a 44px / 34px.
// El tope de ancho entra en la fórmula, así la caja de la imagen coincide con
// el logo y no queda hueco. Los altos se redondean a px enteros.
const AREA_ESCRITORIO = 5808
const AREA_MOVIL = 3468
const TOPES_ESCRITORIO = { min: 28, max: 60, anchoMax: 180 }
const TOPES_MOVIL = { min: 22, max: 46, anchoMax: 140 }

// Bajo esta proporción el logo es un isotipo (símbolo sin texto) y el nombre
// del negocio se muestra al lado; desde aquí el logo ya contiene el nombre.
export const PROPORCION_LOGOTIPO = 1.6

export type DimensionesLogo = { ancho: number; alto: number }

export function comoDimensionesLogo(valor: unknown): DimensionesLogo | null {
  if (typeof valor !== 'object' || valor === null) return null
  const { ancho, alto } = valor as Record<string, unknown>
  const esLado = (n: unknown): n is number => typeof n === 'number' && Number.isInteger(n) && n > 0
  return esLado(ancho) && esLado(alto) ? { ancho, alto } : null
}

type Topes = { min: number; max: number; anchoMax: number }

function altoOptico(proporcion: number, area: number, topes: Topes): number {
  const alto = Math.min(topes.max, Math.max(topes.min, Math.sqrt(area / proporcion)))
  return Math.round(alto * proporcion > topes.anchoMax ? topes.anchoMax / proporcion : alto)
}

export type AltosLogo = { escritorio: number; movil: number }

export function altosLogo({ ancho, alto }: DimensionesLogo): AltosLogo {
  const proporcion = ancho / alto
  return {
    escritorio: altoOptico(proporcion, AREA_ESCRITORIO, TOPES_ESCRITORIO),
    movil: altoOptico(proporcion, AREA_MOVIL, TOPES_MOVIL),
  }
}

export function esLogotipo({ ancho, alto }: DimensionesLogo): boolean {
  return ancho / alto >= PROPORCION_LOGOTIPO
}
