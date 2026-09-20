import { Estilo } from '@/domain/value-objects/Estilo'
import { derivarColores, type ColoresRubro } from '@/domain/color/acentoPorEstilo'

// Cliente "dueño" de los sitios generados en modo demo — no paga, no se
// factura, solo existe para satisfacer la FK de Sitio.clienteId. Creado por
// prisma/seed-demo.ts (correr una vez por entorno).
export const CLIENTE_DEMO_ID = 'cliente-demo-webbot-devalpo'

// El campo `template` vivió acá hasta WB-22 (Tarea 3.1) — se eliminó porque
// duplicaba el mapeo rubro→Template ahora centralizado en
// infrastructure/templates/rubroTemplates.ts (Requirement "Single Selection
// Code Path"). Este archivo conserva solo lo puramente visual.
// D-31 (camino 3): solo `acento` se persiste por rubro — `primario`,
// `secundario` y `texto` se derivan siempre en `palette.ts`
// (src/domain/color/paletaDerivada.ts) y ya no viven acá.
export interface RubroVisualDefaults {
  colores: { acento: string }
  imagenes: string[]
}

// Valores visuales por defecto por rubro (colores + fotos stock) — el
// contenido real (nombre, descripción, servicios, etc.) sale de las
// respuestas del usuario en el chat, ver DemoChatService.extraerDatos.
// Nota: los mismos colores/imágenes también viven en prisma/seed-demo.ts
// (sitios de ejemplo prefabricados) — duplicado a propósito para no acoplar
// el script de seed (fuera de src/, sin alias @/) a este módulo.
export const RUBRO_DEFAULTS: Record<string, RubroVisualDefaults> = {
  panaderia: {
    colores: { acento: '#FF8C00' },
    imagenes: [
      'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1200',
      'https://images.unsplash.com/photo-1556217477-d325251ece38?w=800',
    ],
  },
  peluqueria: {
    colores: { acento: '#e94560' },
    imagenes: [
      'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200',
      'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800',
    ],
  },
  dentista: {
    colores: { acento: '#0891B2' },
    imagenes: [
      'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=1200',
      'https://images.unsplash.com/photo-1588776814546-1ffbb9b3754e?w=800',
    ],
  },
  restaurante: {
    colores: { acento: '#FF6B35' },
    imagenes: [
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200',
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800',
    ],
  },
  consultora: {
    colores: { acento: '#15DEFA' },
    imagenes: [
      'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1200',
      'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800',
    ],
  },
  taller: {
    colores: { acento: '#FF4500' },
    imagenes: [
      'https://images.unsplash.com/photo-1625047509248-ec889cbff17f?w=1200',
      'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=800',
    ],
  },
  yoga: {
    colores: { acento: '#f0c040' },
    imagenes: [
      'https://images.unsplash.com/photo-1588286840104-8957b019727f?w=1200',
      'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800',
    ],
  },
  ferreteria: {
    colores: { acento: '#FFAF4D' },
    imagenes: [
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200',
      'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800',
    ],
  },
  veterinaria: {
    colores: { acento: '#fd79a8' },
    imagenes: [
      'https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=1200',
      'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800',
    ],
  },
  tienda: {
    colores: { acento: '#f39c12' },
    imagenes: [
      'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200',
      'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=800',
    ],
  },
  // Catch-all cuando `detectarRubro` no reconoce nada (ver RUBRO_OTRO más
  // abajo): antes un negocio no reconocido se reportaba como "panaderia" con
  // total confianza y heredaba colores y template de panadería sin tener
  // nada que ver — colores neutros (slate/grafito) y fotos genéricas de
  // oficina, sin ninguna seña de rubro, para no mentirle al cliente sobre su
  // propio negocio. RUBRO_TEMPLATES no tiene entrada para "otro" a propósito
  // (ver rubroTemplates.ts): TEMPLATE_FALLBACK (LANDING) aplica solo.
  otro: {
    colores: { acento: '#556270' },
    imagenes: [
      'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=1200',
      'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800',
    ],
  },
}

// Clave del catch-all — ver comentario en RUBRO_DEFAULTS.otro y en
// resolverColores. `detectarRubro` la devuelve cuando ninguna palabra clave
// matchea; también es la que ya usa ClaudeChatService.normalizarRubro para
// un rubro que Claude reporta pero que no está en RUBROS_VALIDOS.
export const RUBRO_OTRO = 'otro'

// Histórico: hasta este cambio, un rubro no reconocido caía acá
// ("panaderia") en vez de a un fallback neutro (ver RUBRO_OTRO). Se conserva
// exportado por si algún llamador todavía la necesita, pero `detectarRubro`
// ya NO la usa como valor de retorno.
export const RUBRO_DEFAULT = 'panaderia'

// Escape hatch manual: combinaciones (rubro, estilo) donde la regla de
// src/domain/color/acentoPorEstilo.ts da un resultado matemáticamente válido
// pero feo a la vista — la transformación es genérica y no puede saber, por
// ejemplo, que rotar hacia ámbar arruina un rubro cuyo acento del rubro ya es
// casi ámbar. Vacía a propósito: se llena caso a caso cuando el diseño
// detecta una combinación así. Una entrada acá siempre gana por sobre el
// valor derivado — ver `resolverColores` más abajo.
export const OVERRIDES_ACENTO: Partial<Record<string, Partial<Record<Estilo, string>>>> = {}

// Caso especial de "otro": para un rubro conocido, `derivarAcento` transforma
// el acento DEL RUBRO (D-27, docs/DECISIONES.md) porque ese acento ya es una
// identidad a preservar. "otro" no tiene esa identidad — es un negocio que
// nuestro matcher local no supo clasificar — así que no hay base de rubro
// que transformar: acá el estilo elegido por el cliente es la única señal
// real, y decide el acento directamente. Los tres valores pasan >=3:1 de
// contraste contra blanco (razonContraste, contraste.ts): moderno 6.24:1,
// calido 4.23:1, colorido 4.12:1 — medido, no supuesto (ver informe de la
// Pieza 3 del cambio). Vive acá y no en acentoPorEstilo.ts a propósito: ese
// módulo de dominio no conoce rubros ni "otro" (ver su cabecera).
const ACENTO_OTRO_POR_ESTILO: Record<Estilo, string> = {
  [Estilo.MODERNO]: '#556270',
  [Estilo.CALIDO]: '#b06a3b',
  [Estilo.COLORIDO]: '#0f8b8d',
}

// Punto único donde se decide el acento final de un sitio: primero la
// excepción manual (OVERRIDES_ACENTO), luego el caso especial de "otro", y
// si no aplica ninguno, la derivación automática (acentoPorEstilo.ts). Vive
// acá y no en el dominio porque OVERRIDES_ACENTO es dato de infraestructura
// — el dominio no puede depender de él sin invertir la capa (ver AGENTS.md,
// límite hexagonal).
//
// Las tres ramas devuelven un objeto `{ acento: ... }` construido a mano, sin
// `...colores` de por medio: cualquier campo extra que `colores` traiga en
// runtime (p. ej. un `primario`/`secundario`/`texto` huérfano de una fila
// vieja, ver SiteConfigDTO) se descarta. Es DELIBERADO, no un recorte
// accidental al reducir `ColoresRubro` a un solo campo: D-31 (camino 3)
// estableció que esos tres campos ya no los lee nadie del sistema — ni
// `palette.ts` (que deriva siempre desde `acento`, ver paletaDerivada.ts) ni
// ningún otro punto — así que reenviarlos sería resucitar dato muerto.
// Pinneado en tests/unit/domain/color/acentoPorEstilo.test.ts y
// tests/unit/infrastructure/demo/rubroDefaults.test.ts.
export function resolverColores(rubro: string, colores: ColoresRubro, estilo: Estilo): ColoresRubro {
  const override = OVERRIDES_ACENTO[rubro]?.[estilo]
  if (override) return { acento: override }

  if (rubro === RUBRO_OTRO) return { acento: ACENTO_OTRO_POR_ESTILO[estilo] }

  return derivarColores(colores, estilo)
}

// Nota sobre "odontologia" y "odontólogo": a simple vista parecen el mismo
// par accent/sin-accent que panadería/panaderia, pero NO lo son — son dos
// palabras distintas ("odontología" = la disciplina, "odontólogo" = el
// profesional) que difieren en un carácter más allá de la tilde
// (...odontolog[o] contra ...odontolog[ia]). Tras la normalización de la
// Pieza 2 siguen sin colisionar (se verificó carácter a carácter), así que
// se conservan ambas — a diferencia de los 4 pares de abajo que sí son la
// misma palabra repetida con y sin tilde.
const DETECCION_RUBRO: Array<{ keywords: string[]; rubro: string }> = [
  { keywords: ['pan', 'panadería', 'torta', 'repostería', 'horno', 'hallulla', 'marraqueta'], rubro: 'panaderia' },
  { keywords: ['pelo', 'peluquería', 'cabello', 'corte', 'colorimetría', 'salón', 'beauty', 'estética'], rubro: 'peluqueria' },
  { keywords: ['diente', 'dental', 'dentista', 'odontólogo', 'odontologia', 'boca', 'ortodoncia', 'clínica dental'], rubro: 'dentista' },
  { keywords: ['restaurant', 'restorán', 'comida', 'menú', 'almuerzo', 'cena', 'cocina', 'café', 'cafetería', 'picada'], rubro: 'restaurante' },
  { keywords: ['contab', 'tributar', 'impuesto', 'renta', 'sii', 'asesor', 'consultor', 'contador'], rubro: 'consultora' },
  { keywords: ['auto', 'mecánic', 'taller', 'motor', 'freno', 'aceite', 'vehículo', 'camion'], rubro: 'taller' },
  { keywords: ['yoga', 'meditación', 'pilates', 'bienestar', 'mindfulness', 'zen', 'relajación'], rubro: 'yoga' },
  { keywords: ['ferretería', 'herramienta', 'construcción', 'pintura', 'gasfiter', 'electricidad'], rubro: 'ferreteria' },
  { keywords: ['veterinar', 'mascota', 'perro', 'gato', 'animal', 'clínica animal', 'veterinaria'], rubro: 'veterinaria' },
  { keywords: ['ropa', 'boutique', 'moda', 'vestido', 'tienda', 'indumentaria', 'calzado', 'accesorio'], rubro: 'tienda' },
]

// Las 10 categorías reconocidas por el matcher local, en el mismo orden de
// declaración de arriba — lo usa DemoChatService para ofrecer la lista
// completa como opciones cuando la detección da 0 puntaje (ver Pieza 4).
export const RUBROS_CONOCIDOS: readonly string[] = DETECCION_RUBRO.map((entrada) => entrada.rubro)

// A partir de esta longitud un keyword se compara como PREFIJO de palabra
// (`veterinar` cubre veterinaria y veterinario sin listar los dos); por debajo
// se compara como palabra ENTERA, admitiendo el plural.
//
// La distinción no es cosmética. Mientras `detectarRubro` solo miraba el nombre
// del negocio, comparar por subcadena casi no molestaba porque el texto era
// corto. Desde que mira también la descripción y los servicios, `pan` convierte
// "pantalones" en panadería, `ropa` convierte "Europa" en tienda, `corte`
// convierte "cortesía" en peluquería y `moda` convierte "modalidad" en tienda.
const LARGO_MINIMO_PREFIJO = 6

// `\b` de JavaScript es ASCII y se equivoca con acentos y ñ, que abundan acá
// ("peluquería", "ñandú"). Por eso el límite de palabra se expresa con
// lookarounds sobre las propiedades Unicode de letra y número.
const LIMITE_IZQ = '(?<![\\p{L}\\p{N}])'
const LIMITE_DER = '(?![\\p{L}\\p{N}])'

// El cliente escribe sin tildes con frecuencia ("odontologica", "relajacion",
// "construccion"). NFD descompone cada letra acentuada en base + marca
// combinante (ej. 'ó' → 'o' + U+0301) y el rango \u0300-\u036f cubre esas
// marcas — se quitan y queda solo la base. Se aplica TANTO al texto del
// cliente como a cada keyword antes de compilar el patrón: si solo se
// normalizara un lado, "construcción" (keyword, con tilde) dejaría de
// matchear "construccion" (texto del cliente, sin tilde).
//
// Esto también pliega la ñ a n, porque 'ñ' se descompone en 'n' + U+0303
// (COMBINING TILDE) — no es un caso especial, es la misma regla. Se revisó
// si eso genera colisiones con el vocabulario de DETECCION_RUBRO (del tipo
// "año"/"ano") y no existe ninguna: ningún keyword de la lista depende de
// distinguir ñ de n. Se probó además con casos fuera del vocabulario
// ("Ñandú", "mañana", "pequeño") y ninguno coincide con ningún keyword ni
// con ni sin el pliegue — ver tests.
function normalizarDiacriticos(texto: string): string {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function patronDe(keyword: string): RegExp {
  const normalizado = normalizarDiacriticos(keyword)
  const escapado = normalizado.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const cuerpo =
    normalizado.length >= LARGO_MINIMO_PREFIJO ? escapado : `${escapado}(?:es|s)?${LIMITE_DER}`

  return new RegExp(`${LIMITE_IZQ}${cuerpo}`, 'iu')
}

// Los patrones se compilan una sola vez, al cargar el módulo: `detectarRubro`
// corre por cada sitio generado y no tiene por qué rearmar ~70 expresiones.
const DETECCION_COMPILADA = DETECCION_RUBRO.map((entrada) => ({
  rubro: entrada.rubro,
  patrones: entrada.keywords.map(patronDe),
}))

export interface ResultadoDeteccion {
  // Rubro ganador — el de más keywords matcheadas; en empate, el primero en
  // orden de declaración (ver DETECCION_RUBRO). "otro" cuando nadie matcheó.
  rubro: string
  // Cantidad de keywords distintas que matchearon para `rubro`. 0 cuando
  // nadie matcheó nada — ese es justamente el caso en que `rubro` es "otro".
  hits: number
  // Otros rubros que empataron en el máximo puntaje, en orden de
  // declaración, "rubro" incluido como primer elemento. Longitud > 1 solo
  // cuando hubo empate real; array vacío si un rubro ganó solo o si nadie
  // matcheó nada (0 no es un empate, es ausencia de señal).
  candidatosEmpatados: string[]
}

/**
 * Igual que `detectarRubro`, pero expone el detalle que DemoChatService
 * necesita para decidir si hace falta preguntar (Pieza 4): cuántas keywords
 * matchearon y si hubo empate entre rubros distintos. `detectarRubro` no
 * cambia de firma para no tocar a sus llamadores existentes — este es el
 * punto de entrada nuevo.
 *
 * Antes se devolvía el PRIMER rubro con algún match, en orden de
 * declaración — así "Patitas / clínica veterinaria / vacunas, consultas,
 * peluquería canina" caía en `peluqueria` (1 match: "peluquería") en vez de
 * `veterinaria` (2 matches: "veterinar" y "veterinaria", ambos sobre la
 * misma palabra del texto), solo porque peluquería está declarada antes en
 * la lista. Contar hits y quedarse con el máximo corrige eso sin tocar el
 * orden de DETECCION_RUBRO, que sigue decidiendo los empates.
 */
export function detectarRubroDetallado(textoUsuario: string): ResultadoDeteccion {
  const textoNormalizado = normalizarDiacriticos(textoUsuario)

  const puntajes = DETECCION_COMPILADA.map((entrada) => ({
    rubro: entrada.rubro,
    hits: entrada.patrones.filter((patron) => patron.test(textoNormalizado)).length,
  }))

  const maxHits = Math.max(0, ...puntajes.map((p) => p.hits))
  if (maxHits === 0) {
    return { rubro: RUBRO_OTRO, hits: 0, candidatosEmpatados: [] }
  }

  const empatados = puntajes.filter((p) => p.hits === maxHits).map((p) => p.rubro)
  return {
    rubro: empatados[0],
    hits: maxHits,
    candidatosEmpatados: empatados.length > 1 ? empatados : [],
  }
}

/**
 * Deduce el rubro a partir de lo que el cliente escribió. Se le pasa el nombre
 * del negocio JUNTO CON la descripción y los servicios: el nombre por sí solo
 * es justamente el campo donde un negocio real no dice a qué se dedica
 * ("Servicios Integrales SpA", "Aurora"), y mirándolo solo a él la deducción
 * caía en RUBRO_OTRO para casi cualquier cliente.
 *
 * Cuando nada matchea devuelve RUBRO_OTRO en vez de un rubro cualquiera
 * (ver RUBRO_DEFAULTS.otro): reportar con total confianza "panaderia" para
 * un negocio no reconocido le heredaba colores y plantilla de panadería sin
 * ninguna relación real.
 */
export function detectarRubro(textoUsuario: string): string {
  return detectarRubroDetallado(textoUsuario).rubro
}
