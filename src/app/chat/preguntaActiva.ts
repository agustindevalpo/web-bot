// Lógica pura de la pregunta activa del chat (barra de avance, texto de ayuda
// y chips de sugerencias). Vive aparte de ChatWidget para poder probarla sin
// renderizar: el proyecto "unit" de Jest corre en node, sin jsdom.

import {
  PREGUNTA_CATEGORIAS,
  PREGUNTA_CIUDAD,
  PREGUNTA_DESCRIPCION,
  PREGUNTA_ESTILO,
  PREGUNTA_SERVICIOS,
  MENSAJE_FINAL,
} from '@/infrastructure/demo/guionChat'

export const TOTAL_PREGUNTAS = 6

const PREFIJO_CONFIRMACION_RUBRO = 'Por el nombre, parece que es'

// El texto de la pregunta de servicios lleva su ayuda tras la primera línea en
// blanco. Se compara solo la primera parte: la ayuda no identifica la pregunta.
function primeraLinea(texto: string): string {
  return dividirAyuda(texto).pregunta
}

/**
 * Número (1 a 6) de la pregunta que muestra un mensaje del asistente. Las
 * preguntas 2a y 2b cuentan como la 2: el visitante responde seis veces aunque
 * el rubro pida una confirmación y luego, a veces, una categoría. Un texto que
 * no pertenece al guion (el modo real lo genera Claude) cae al conteo de
 * respuestas del visitante, acotado a 1–6.
 */
export function numeroDePregunta(textoAsistente: string, respuestasDelVisitante: number): number {
  const pregunta = primeraLinea(textoAsistente)

  if (pregunta.startsWith(PREFIJO_CONFIRMACION_RUBRO) || pregunta === PREGUNTA_CATEGORIAS) return 2
  if (pregunta === PREGUNTA_DESCRIPCION) return 3
  if (pregunta === primeraLinea(PREGUNTA_SERVICIOS)) return 4
  if (pregunta === PREGUNTA_CIUDAD) return 5
  if (pregunta === PREGUNTA_ESTILO || pregunta === MENSAJE_FINAL) return 6

  return Math.min(TOTAL_PREGUNTAS, Math.max(1, respuestasDelVisitante + 1))
}

/**
 * Separa la pregunta de su línea de ayuda: lo que sigue a la primera línea en
 * blanco es la ayuda. Genérico: no conoce ninguna pregunta en particular.
 */
export function dividirAyuda(texto: string): { pregunta: string; ayuda: string | null } {
  const corte = texto.indexOf('\n\n')
  if (corte === -1) return { pregunta: texto.trim(), ayuda: null }

  const ayuda = texto.slice(corte + 2).trim()
  return { pregunta: texto.slice(0, corte).trim(), ayuda: ayuda || null }
}

function normalizar(texto: string): string {
  return texto.trim().toLowerCase()
}

/** true si la sugerencia ya es una de las respuestas separadas por coma del campo. */
export function sugerenciaYaIncluida(actual: string, sugerencia: string): boolean {
  const objetivo = normalizar(sugerencia)
  return actual.split(/[,;]/).some((parte) => normalizar(parte) === objetivo)
}

/** Agrega `{sugerencia}, ` al final del campo, separando de lo que ya hubiera. */
export function agregarSugerencia(actual: string, sugerencia: string): string {
  const base = actual.replace(/[\s,;]+$/, '')
  return base ? `${base}, ${sugerencia}, ` : `${sugerencia}, `
}

/** Opciones apiladas a ancho completo: hasta 4 y ninguna de más de 28 caracteres. */
export function opcionesApiladas(opciones: readonly string[]): boolean {
  return opciones.length <= 4 && opciones.every((opcion) => opcion.length <= 28)
}

/** Lista larga (los rubros de la 2b): botones compactos de 44px. */
export function opcionesCompactas(opciones: readonly string[]): boolean {
  return opciones.length > 4
}
