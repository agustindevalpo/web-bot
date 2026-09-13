// Clamp de contraste del acento (WB-plantillas-contraste, S0b) — módulo puro:
// sin React, sin `SiteConfigDTO`, sin nada de `src/application/` (Decisión D-02,
// mismo límite hexagonal que `navegacion.ts`). Deliberadamente sin importador en
// S0b, igual que `fuentes.ts` en S0a: el fondo contra el que hay que clampear lo
// conoce cada plantilla (#171310 en RESTAURANTE, #080056 en PORTFOLIO, blanco en
// las otras cuatro), así que el cableado llega en S1-S6.
//
// El acento sale de `configJson.colores.acento` — dato de cliente sin validar, de
// ahí que ninguna función lance: todo degrada a un fallback documentado.
// Constantes y hallazgos: research `sdd/plantillas-contraste/research` (Engram
// #608) y docs/DECISIONES.md D-25.

export type RGB = { r: number; g: number; b: number }
export type OKLCH = { l: number; c: number; h: number }

// WCAG 2.1 SC 1.4.3 pide 4.5:1 solo para texto normal; íconos, botones y bordes
// caen bajo SC 1.4.11 (Non-text Contrast), que exige 3:1. Por eso el objetivo es
// un parámetro y no una constante quemada.
export const OBJETIVO_TEXTO = 4.5
export const OBJETIVO_NO_TEXTO = 3

// Umbral 0.04045 (sRGB / CSS Color 4) para AMBOS usos: la conversión a OKLCH y la
// luminancia WCAG. El texto de WCAG publica 0.03928 para la misma curva — es una
// inconsistencia conocida de la spec, no un modelo distinto. Mezclar los dos
// valores en el mismo módulo da números que no coinciden con ninguna de las dos.
function aLineal(v: number): number {
  const abs = Math.abs(v)
  return abs <= 0.04045 ? v / 12.92 : Math.sign(v) * Math.pow((abs + 0.055) / 1.055, 2.4)
}

function aGamma(v: number): number {
  const abs = Math.abs(v)
  return abs > 0.0031308 ? Math.sign(v) * (1.055 * Math.pow(abs, 1 / 2.4) - 0.055) : 12.92 * v
}

type Vec3 = [number, number, number]
type Mat3 = readonly [Vec3, Vec3, Vec3]

// Par de Ottosson (https://bottosson.github.io/posts/oklab/), la vía DIRECTA
// lineal-sRGB↔LMS, sin pasar por XYZ. Las de CSS Color 4 divergen en el 4º-5º
// decimal por redondeos distintos de la matriz sRGB↔XYZ: se elige UNA fuente para
// los dos sentidos y no se mezcla.
//
// OJO: el research (#608) rotula `M1 = [0.8189330101 …]` como "lineal-sRGB→LMS".
// Está mal: esa matriz es XYZ→LMS. Se verifica en este mismo repo —
// `node_modules/@img/colour/color.cjs:764` la usa dentro de `convert.xyz.oklab`,
// mientras que `convert.rgb.oklab` (líneas 499-501) usa la de acá abajo. Y se
// comprueba solo: M1·(1,1,1) da (1.0519, 0.9984, 0.9464) en vez del (1,1,1) que
// OKLab exige para el blanco, mientras que M1·XYZ_D65_blanco sí da (1,1,1).
// Usar la matriz de XYZ sobre RGB lineal le inventa croma 0.03 y tono 28.9° a
// TODO gris, y con eso el clamp deja de preservar el tono. Las constantes de
// abajo salen de `color.cjs:499-501, 502-504, 791-793 y 794-796`, no de memoria.
const RGB_A_LMS: Mat3 = [
  [0.4122214708, 0.5363325363, 0.0514459929],
  [0.2119034982, 0.6806995451, 0.1073969566],
  [0.0883024619, 0.2817188376, 0.6299787005],
]
const LMS_A_OKLAB: Mat3 = [
  [0.2104542553, 0.7936177850, -0.0040720468],
  [1.9779984951, -2.4285922050, 0.4505937099],
  [0.0259040371, 0.7827717662, -0.8086757660],
]
const OKLAB_A_LMS: Mat3 = [
  [1, 0.3963377774, 0.2158037573],
  [1, -0.1055613458, -0.0638541728],
  [1, -0.0894841775, -1.2914855480],
]
const LMS_A_RGB: Mat3 = [
  [4.0767416621, -3.3077115913, 0.2309699292],
  [-1.2684380046, 2.6097574011, -0.3413193965],
  [-0.0041960863, -0.7034186147, 1.7076147010],
]

function aplicar(m: Mat3, v: Vec3): Vec3 {
  return [
    m[0][0] * v[0] + m[0][1] * v[1] + m[0][2] * v[2],
    m[1][0] * v[0] + m[1][1] * v[1] + m[1][2] * v[2],
    m[2][0] * v[0] + m[2][1] * v[1] + m[2][2] * v[2],
  ]
}

const HEX = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i

// Devuelve `null` —nunca lanza— ante cualquier cosa que no sea un hex de 3 o 6
// dígitos: el llamador decide el fallback, porque depende del fondo.
export function hexALineal(hex: string): RGB | null {
  if (typeof hex !== 'string') return null
  const encontrado = HEX.exec(hex.trim())
  if (encontrado === null) return null

  const digitos = encontrado[1]
  const largo = digitos.length === 3 ? 1 : 2
  const canal = (indice: number): number => {
    const trozo = digitos.slice(indice * largo, indice * largo + largo)
    return aLineal(parseInt(largo === 1 ? trozo + trozo : trozo, 16) / 255)
  }

  return { r: canal(0), g: canal(1), b: canal(2) }
}

// El recorte a [0,255] acá es el último eslabón: absorbe el épsilon numérico que
// deja el mapeo de gamut, no un color realmente fuera de gamut.
export function linealAHex(rgb: RGB): string {
  const canal = (v: number): string => {
    const byte = Math.min(255, Math.max(0, Math.round(aGamma(v) * 255)))
    return byte.toString(16).padStart(2, '0')
  }

  return `#${canal(rgb.r)}${canal(rgb.g)}${canal(rgb.b)}`
}

export function linealAOklch(rgb: RGB): OKLCH {
  const lms = aplicar(RGB_A_LMS, [rgb.r, rgb.g, rgb.b])
  // `Math.cbrt` (no `** (1/3)`) porque LMS puede venir negativo fuera de gamut.
  const [l, a, b] = aplicar(LMS_A_OKLAB, [Math.cbrt(lms[0]), Math.cbrt(lms[1]), Math.cbrt(lms[2])])
  const grados = (Math.atan2(b, a) * 180) / Math.PI

  // OKLab↔OKLCH es la forma polar, definicional: C = hypot(a,b), h = atan2(b,a).
  return { l, c: Math.hypot(a, b), h: ((grados % 360) + 360) % 360 }
}

export function oklchALineal(color: OKLCH): RGB {
  const rad = (color.h * Math.PI) / 180
  const lms = aplicar(OKLAB_A_LMS, [color.l, color.c * Math.cos(rad), color.c * Math.sin(rad)])
  const [r, g, b] = aplicar(LMS_A_RGB, [lms[0] ** 3, lms[1] ** 3, lms[2] ** 3])

  return { r, g, b }
}

// Coeficientes WCAG sobre canales YA linealizados.
export function luminanciaRelativa(rgb: RGB): number {
  return 0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b
}

function razonEntre(lumA: number, lumB: number): number {
  const claro = Math.max(lumA, lumB)
  const oscuro = Math.min(lumA, lumB)

  return (claro + 0.05) / (oscuro + 0.05)
}

// Un hex inválido devuelve 1 (el peor contraste posible) en vez de lanzar: así el
// clamp lo trata como "no cumple" y cae al fallback por el camino normal.
export function razonContraste(hexA: string, hexB: string): number {
  const a = hexALineal(hexA)
  const b = hexALineal(hexB)
  if (a === null || b === null) return 1

  return razonEntre(luminanciaRelativa(a), luminanciaRelativa(b))
}

const EPS_GAMUT = 1e-6

function enGamut(rgb: RGB): boolean {
  return [rgb.r, rgb.g, rgb.b].every((v) => v >= -EPS_GAMUT && v <= 1 + EPS_GAMUT)
}

// Simplificación consciente: CSS Color 4 especifica bisección de croma con
// deltaEOK (~0.02) como criterio de parada. Acá se bisecta el croma preservando L
// y tono, pero se corta por iteraciones fijas y sin medir deltaEOK — para un
// acento de UI la diferencia es invisible, y el research marcó la afirmación
// sobre deltaEOK como corroboración secundaria, no verbatim de la spec.
function mapearAGamut(color: OKLCH): RGB {
  const directo = oklchALineal(color)
  if (enGamut(directo)) return directo

  // El gris de la misma L siempre está en gamut, así que sirve de piso seguro.
  let mejor = oklchALineal({ ...color, c: 0 })
  let lo = 0
  let hi = color.c
  for (let i = 0; i < 24; i += 1) {
    const medio = (lo + hi) / 2
    const prueba = oklchALineal({ ...color, c: medio })
    if (enGamut(prueba)) {
      lo = medio
      mejor = prueba
    } else {
      hi = medio
    }
  }

  return mejor
}

// Búsqueda binaria acotada sobre L hacia `extremo` (0 = negro, 1 = blanco). No hay
// forma cerrada: la L de OKLCH no predice el contraste WCAG, porque croma y tono
// mueven la mezcla de canales lineales por su cuenta. Cada iteración convierte a
// sRGB real, mapea gamut, cuantiza a hex y mide el contraste de ESE hex — nunca de
// los números OKLCH.
function buscarL(origen: OKLCH, extremo: number, objetivo: number, contra: (hex: string) => number): string | null {
  const evaluar = (l: number): { hex: string; cumple: boolean } => {
    const hex = linealAHex(mapearAGamut({ ...origen, l }))
    return { hex, cumple: contra(hex) >= objetivo }
  }

  // Si ni el extremo alcanza el objetivo, esta dirección no tiene solución; no se
  // itera al pedo y el llamador prueba la otra.
  const limite = evaluar(extremo)
  if (!limite.cumple) return null

  let lo = origen.l
  let hi = extremo
  let mejor = limite.hex
  // 18 pasos dejan el intervalo en ~4e-6 de L, bastante menos que un paso de 8 bits.
  for (let i = 0; i < 18; i += 1) {
    const medio = (lo + hi) / 2
    const prueba = evaluar(medio)
    if (prueba.cumple) {
      hi = medio
      mejor = prueba.hex
    } else {
      lo = medio
    }
  }

  return mejor
}

/**
 * Devuelve un acento que alcanza `objetivo` contra `fondo`, moviendo solo la L en
 * OKLCH para conservar tono y croma. Si no lo logra, devuelve un fallback
 * documentado (negro o blanco, el que más contraste dé contra ese fondo) en vez de
 * un color que falla en silencio.
 */
export function clampAcento(acento: string, fondo: string, objetivo: number = OBJETIVO_NO_TEXTO): string {
  // Un fondo inválido es un bug de plantilla, no dato de cliente: degrada a blanco,
  // el fondo de 4 de las 6 plantillas.
  const fondoLineal = hexALineal(fondo) ?? { r: 1, g: 1, b: 1 }
  const lumFondo = luminanciaRelativa(fondoLineal)
  const contra = (hex: string): number => {
    const rgb = hexALineal(hex)
    return rgb === null ? 1 : razonEntre(luminanciaRelativa(rgb), lumFondo)
  }
  const reserva = contra('#000000') >= contra('#ffffff') ? '#000000' : '#ffffff'

  const base = hexALineal(acento)
  if (base === null) return reserva

  const lumBase = luminanciaRelativa(base)
  // Un color que ya cumple se devuelve tal cual vino: nada de tocarlo de más.
  if (razonEntre(lumBase, lumFondo) >= objetivo) return acento

  // Primero la dirección que se aleja del fondo; si ese extremo no basta, la otra.
  const origen = linealAOklch(base)
  const extremos = lumBase < lumFondo ? [0, 1] : [1, 0]
  for (const extremo of extremos) {
    const candidato = buscarL(origen, extremo, objetivo, contra)
    // Guarda de convergencia: nadie demostró que el contraste WCAG sea monótono en
    // la L de OKLCH a croma y tono fijos, que es lo que garantizaría que la
    // bisección converge en vez de oscilar. Así que no se le cree: se remide el hex
    // final y, si no cumple, se cae al fallback.
    if (candidato !== null && contra(candidato) >= objetivo) return candidato
  }

  return reserva
}
