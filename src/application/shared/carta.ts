// Carta de RESTAURANTE (handoff S4, 04-RESTAURANTE.md: "Carta", "Reglas de
// `menu`" y "Casos intermedios"). Módulo puro de la capa de aplicación: sin
// React ni Next. `configJson` no se valida en runtime, así que `menu` y
// `servicios` se leen de forma defensiva y la función nunca lanza.

export const MAX_PLATOS_CARTA = 8
export const MAX_CATEGORIAS_CARTA = 3
// Con guías y sin categorías, 6 a 8 platos se reparten en dos columnas.
export const MIN_PLATOS_DOS_COLUMNAS = 6

export interface PlatoCarta {
  nombre: string
  precio?: string
}

export interface GrupoCarta {
  categoria?: string
  platos: PlatoCarta[]
}

export interface CartaNormalizada {
  // Al menos un plato con precio: forma con guías (H2 "Nuestra carta").
  // Si no: forma grande (H2 "Lo que preparamos").
  conPrecios: boolean
  // En orden de lectura. Un grupo sin categoría, si existe, es siempre el
  // primero. Sin ninguna categoría hay un único grupo.
  grupos: GrupoCarta[]
  totalPlatos: number
  // Algún grupo con título: la forma con guías va en grid, una columna por
  // categoría.
  hayCategorias: boolean
  // Solo con guías y sin categorías: los platos ya repartidos en 1 columna
  // (5 o menos) o 2 (6 a 8; la primera mitad a la izquierda, redondeando
  // hacia arriba). `null` en cualquier otro caso.
  columnasSinCategorias: PlatoCarta[][] | null
  // Sin precios y algún ítem se llama "menú del día": el pie muestra
  // "Pregunta por el menú del día al reservar."
  notaMenuDelDia: boolean
}

function texto(valor: unknown): string {
  return typeof valor === 'string' ? valor.trim() : ''
}

function nombreDeItem(item: unknown): string {
  if (typeof item === 'string') return item.trim()
  if (item && typeof item === 'object') return texto((item as { nombre?: unknown }).nombre)
  return ''
}

function gruposDeMenu(menu: unknown): GrupoCarta[] {
  if (!Array.isArray(menu)) return []
  const grupos: GrupoCarta[] = []
  for (const bruto of menu) {
    if (!bruto || typeof bruto !== 'object') continue
    const { categoria, items } = bruto as { categoria?: unknown; items?: unknown }
    if (!Array.isArray(items)) continue
    const platos: PlatoCarta[] = []
    for (const item of items) {
      const nombre = nombreDeItem(item)
      if (nombre === '') continue
      const precio = item && typeof item === 'object' ? texto((item as { precio?: unknown }).precio) : ''
      platos.push(precio !== '' ? { nombre, precio } : { nombre })
    }
    if (platos.length === 0) continue
    const titulo = texto(categoria)
    grupos.push(titulo !== '' ? { categoria: titulo, platos } : { platos })
  }
  return grupos
}

function gruposDeServicios(servicios: unknown): GrupoCarta[] {
  if (!Array.isArray(servicios)) return []
  const platos = servicios.map((s) => ({ nombre: nombreDeItem(s) })).filter((p) => p.nombre !== '')
  return platos.length > 0 ? [{ platos }] : []
}

// El grupo sin título va primero (si hay varios se funden en uno); los
// titulados conservan el orden en que se guardaron, nunca se ordenan.
function ordenarGrupos(grupos: GrupoCarta[]): GrupoCarta[] {
  const sinTitulo = grupos.filter((g) => g.categoria === undefined).flatMap((g) => g.platos)
  const conTitulo = grupos.filter((g) => g.categoria !== undefined).slice(0, MAX_CATEGORIAS_CARTA)
  return sinTitulo.length > 0 ? [{ platos: sinTitulo }, ...conTitulo] : conTitulo
}

function recortarPlatos(grupos: GrupoCarta[]): GrupoCarta[] {
  let restantes = MAX_PLATOS_CARTA
  const salida: GrupoCarta[] = []
  for (const grupo of grupos) {
    if (restantes === 0) break
    const platos = grupo.platos.slice(0, restantes)
    restantes -= platos.length
    salida.push({ ...grupo, platos })
  }
  return salida
}

const REGEX_MENU_DEL_DIA = /men[uú] del d[ií]a/i

export function normalizarCarta(menu: unknown, servicios: unknown): CartaNormalizada | null {
  const delMenu = gruposDeMenu(menu)
  // `menu` con al menos un plato reemplaza a `servicios[]`; no se mezclan.
  const origen = delMenu.length > 0 ? delMenu : gruposDeServicios(servicios)
  if (origen.length === 0) return null

  const grupos = recortarPlatos(ordenarGrupos(origen))
  const platos = grupos.flatMap((g) => g.platos)
  const conPrecios = platos.some((p) => p.precio !== undefined)
  const hayCategorias = grupos.some((g) => g.categoria !== undefined)

  let columnasSinCategorias: PlatoCarta[][] | null = null
  if (conPrecios && !hayCategorias) {
    const mitad = platos.length >= MIN_PLATOS_DOS_COLUMNAS ? Math.ceil(platos.length / 2) : platos.length
    columnasSinCategorias = [platos.slice(0, mitad)]
    if (mitad < platos.length) columnasSinCategorias.push(platos.slice(mitad))
  }

  return {
    conPrecios,
    grupos,
    totalPlatos: platos.length,
    hayCategorias,
    columnasSinCategorias,
    notaMenuDelDia: !conPrecios && platos.some((p) => REGEX_MENU_DEL_DIA.test(p.nombre)),
  }
}
