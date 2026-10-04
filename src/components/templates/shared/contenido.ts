// Lectores defensivos de los campos de contenido Bloques v2 del DTO
// (`sobreNosotrosPartes`, `highlightAutor`, `legal`, `horarios`). Mismo
// criterio que `servicios.ts`/`logoOptico.ts`: `configJson` no se valida en
// runtime (`src/app/sites/renderizarSitio.ts` es un cast pelado, y el editor
// JSON del admin solo valida `nombre`), así que cualquier forma puede
// llegar. Cada helper recibe `unknown`, trimea los strings, descarta lo
// vacío y devuelve un valor limpio o null/[]; ninguno lanza.

function comoTexto(valor: unknown): string | null {
  if (typeof valor !== 'string') return null
  const limpio = valor.trim()
  return limpio !== '' ? limpio : null
}

function comoObjeto(valor: unknown): Record<string, unknown> | null {
  return valor !== null && typeof valor === 'object' && !Array.isArray(valor) ? (valor as Record<string, unknown>) : null
}

export type ClaveParteNosotros = 'desde' | 'quien' | 'distinto'
export type ParteNosotros = { clave: ClaveParteNosotros; texto: string }

const ORDEN_PARTES: ClaveParteNosotros[] = ['desde', 'quien', 'distinto']

// Partes no vacías en orden fijo (desde, quien, distinto): la plantilla
// dibuja 0-3 tarjetas con esto.
export function comoPartesNosotros(valor: unknown): ParteNosotros[] {
  const objeto = comoObjeto(valor)
  if (objeto === null) return []
  const partes: ParteNosotros[] = []
  for (const clave of ORDEN_PARTES) {
    const texto = comoTexto(objeto[clave])
    if (texto !== null) partes.push({ clave, texto })
  }
  return partes
}

export type AutorHighlight = { nombre: string; cargo: string | null }

// Requiere `nombre` no vacío; `cargo` es opcional (null si falta o vacío).
export function comoAutorHighlight(valor: unknown): AutorHighlight | null {
  const objeto = comoObjeto(valor)
  if (objeto === null) return null
  const nombre = comoTexto(objeto.nombre)
  if (nombre === null) return null
  return { nombre, cargo: comoTexto(objeto.cargo) }
}

export type DatosLegales = { razonSocial: string; rut: string }

// T7: razón social Y RUT, o nada. Nunca se muestra la mitad.
export function comoLegal(valor: unknown): DatosLegales | null {
  const objeto = comoObjeto(valor)
  if (objeto === null) return null
  const razonSocial = comoTexto(objeto.razonSocial)
  const rut = comoTexto(objeto.rut)
  if (razonSocial === null || rut === null) return null
  return { razonSocial, rut }
}

export type Horario = { dia: string; rango: string }

// Entradas con `dia` y `rango` no vacíos, en el orden recibido. Sin tope: el
// de 3 de la banda de datos es decisión de la plantilla.
export function comoHorarios(valor: unknown): Horario[] {
  if (!Array.isArray(valor)) return []
  const horarios: Horario[] = []
  for (const item of valor) {
    const objeto = comoObjeto(item)
    if (objeto === null) continue
    const dia = comoTexto(objeto.dia)
    const rango = comoTexto(objeto.rango)
    if (dia !== null && rango !== null) horarios.push({ dia, rango })
  }
  return horarios
}
