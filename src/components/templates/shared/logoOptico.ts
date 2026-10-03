// Tamaño óptico del logo del cliente. Un alto fijo hace que un logo ancho
// pese demasiado y uno angosto o vertical se vea diminuto; esto escala el
// alto base (44px escritorio / 34px móvil, `Landing.module.css`) según la
// proporción del logo.
//
//   escala = clamp(sqrt(PROPORCION_REFERENCIA / (ancho / alto)), MIN, MAX)
//
// La raíz cuadrada reparte el ajuste entre alto y ancho para que el área
// visual se mantenga parecida. 4:1 es la caja con la que se diseñó el header
// (escala 1). Un logo cuadrado o vertical sube hasta 1.5x; uno muy ancho baja
// hasta 0.75x.
const PROPORCION_REFERENCIA = 4
const ESCALA_MIN = 0.75
const ESCALA_MAX = 1.5

export type DimensionesLogo = { ancho: number; alto: number }

export function comoDimensionesLogo(valor: unknown): DimensionesLogo | null {
  if (typeof valor !== 'object' || valor === null) return null
  const { ancho, alto } = valor as Record<string, unknown>
  const esLado = (n: unknown): n is number => typeof n === 'number' && Number.isInteger(n) && n > 0
  return esLado(ancho) && esLado(alto) ? { ancho, alto } : null
}

export function escalaLogo(dimensiones: DimensionesLogo): number {
  const proporcion = dimensiones.ancho / dimensiones.alto
  const escala = Math.sqrt(PROPORCION_REFERENCIA / proporcion)
  return Math.round(Math.min(ESCALA_MAX, Math.max(ESCALA_MIN, escala)) * 1000) / 1000
}
