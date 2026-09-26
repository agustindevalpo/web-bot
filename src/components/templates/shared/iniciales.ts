// Iniciales del monograma (handoff de diseño, bloque 3c — "El monograma, si
// nunca sube logo"). Compartido por los 6 templates (hoy solo LANDING lo
// consume, ver `landing/sections.ts` `buildMarca`) porque la regla es la
// misma para todos: solo cambia la tipografía que la envuelve, y eso lo
// resuelve `Monograma.tsx`, no esta función.
//
// Regla 01 del handoff, verbatim: «Dos iniciales, no una. "CV" lee como
// marca; "C" lee como avatar de aplicación. Si el nombre es de una palabra,
// las dos primeras letras.» Esta función solo decide QUÉ dos letras — nunca
// lanza, porque lee `config.nombre` de un `configJson` sin validar en
// runtime (`src/app/sites/renderizarSitio.ts:18` es un cast pelado), mismo
// criterio defensivo que `shared/servicios.ts`.
//
// Casos resueltos que el handoff no especifica (decisión propia, documentada
// acá porque es el único lugar donde se toma):
//
// - Nombres de más de una palabra con artículos/preposiciones cortas
//   ("La Casona", "El Rincón de Ana"): la regla 01 dice "dos iniciales", pero
//   tomar la primera letra de "La" o "El" da un monograma que no identifica
//   el negocio ("LC" en vez de "CA"). Se filtran las palabras "vacías" (lista
//   cerrada de artículos/preposiciones/conjunciones de 1-3 letras más
//   frecuentes en nombres de negocio en español) y las iniciales salen de las
//   dos primeras palabras SIGNIFICATIVAS. "La Casona" → "CA" (Casona es la
//   única palabra significativa → regla de una sola palabra, dos primeras
//   letras). "El Rincón de Ana" → "RA" (Rincón + Ana, "El"/"de" se saltan).
// - Si TODAS las palabras son "vacías" (nombre compuesto solo por artículos,
//   o una sola palabra de 1-2 letras que coincide con la lista), no hay
//   ninguna palabra significativa de la cual sacar iniciales con sentido:
//   se degrada a las palabras originales sin filtrar (dos iniciales si hay
//   dos o más palabras, o las dos primeras letras de la única palabra) — más
//   informativo que devolver una cadena vacía cuando el nombre sí tenía
//   contenido.
// - Nombre de una sola letra ("X"): la regla 01 pide "las dos primeras
//   letras" de una palabra de una sola palabra, pero no hay una segunda letra
//   que tomar. Se devuelve la única letra disponible ("X") en vez de rellenar
//   con algo inventado — un monograma de una letra es preferible a uno con un
//   carácter que no existe en el nombre real.
// - Acentos: NO se despojan. "Ávila" → "ÁV", no "AV" — la tilde es parte de
//   la letra en español y `String.prototype.toUpperCase` ya la resuelve bien
//   para el alfabeto latino (`'á'.toUpperCase() === 'Á'`).
// - Entrada vacía, solo espacios, o que no es string (`undefined`, `null`,
//   número, etc. — la misma falta de validación de runtime de arriba):
//   devuelve `''`. Es responsabilidad de quien llama decidir el fallback
//   (hoy, `Monograma.tsx` no pinta nada si recibe iniciales vacías — ver su
//   comentario).
const PALABRAS_VACIAS = new Set([
  'el',
  'la',
  'los',
  'las',
  'un',
  'una',
  'unos',
  'unas',
  'del',
  'al',
  'de',
  'y',
  'e',
  'o',
  'u',
  'a',
  'en',
  'con',
  'por',
  'para',
  'que',
])

function esPalabraSignificativa(palabra: string): boolean {
  if (palabra.length <= 2) return false
  return !PALABRAS_VACIAS.has(palabra.toLowerCase())
}

function dosLetrasDe(palabra: string): string {
  return palabra.slice(0, 2).toUpperCase()
}

export function obtenerIniciales(nombreCrudo: unknown): string {
  if (typeof nombreCrudo !== 'string') return ''

  const nombre = nombreCrudo.trim()
  if (nombre === '') return ''

  const palabras = nombre.split(/\s+/)
  const significativas = palabras.filter(esPalabraSignificativa)

  if (significativas.length >= 2) {
    return (significativas[0].charAt(0) + significativas[1].charAt(0)).toUpperCase()
  }

  if (significativas.length === 1) {
    return dosLetrasDe(significativas[0])
  }

  // Ninguna palabra pasó el filtro (nombre compuesto solo de artículos/
  // palabras cortas) — se recurre a las palabras originales sin filtrar en
  // vez de devolver '' con un nombre no vacío.
  if (palabras.length >= 2) {
    return (palabras[0].charAt(0) + palabras[1].charAt(0)).toUpperCase()
  }

  return dosLetrasDe(palabras[0])
}
