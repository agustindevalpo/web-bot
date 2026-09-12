import type { Metadata } from 'next'
import { SiteConfigDTO } from '@/application/dtos/SiteConfigDTO'

// Cierre fijo de toda descripción derivada (Requirement "Description
// Composition") — solo se usa cuando `descripcion` viene vacía; una
// `descripcion` propia se sirve verbatim, sin este sufijo.
const SUFIJO_DESCRIPCION = 'Conoce nuestros servicios y contáctanos.'

// `configJson` es una columna JSON sin schema en BD (mismo supuesto que
// `resolverTemplate`): cada campo se recorta y se valida antes de usarse,
// aunque `SiteConfigDTO` los declare requeridos.
function campo(valor: unknown): string {
  return typeof valor === 'string' ? valor.trim() : ''
}

function noVacio(valor: string): valor is string {
  return valor.length > 0
}

// Título y descripción derivada comparten esta misma lista de partes para
// degradar en el mismo orden cuando falta un dato (Decisión D-D del
// diseño): un `nombre` o una `ubicacion` ausente desaparece de la lista sin
// dejar separadores sueltos, en vez de renderizar un placeholder vacío.
function partesComunes(config: SiteConfigDTO): string[] {
  const nombre = campo(config.nombre)
  const rubro = campo(config.rubro)
  const ciudad = campo(config.ciudad)
  const ubicacion = rubro && ciudad ? `${rubro} en ${ciudad}` : rubro || ciudad
  return [nombre, ubicacion].filter(noVacio)
}

// "{nombre} | {rubro} en {ciudad}", omitiendo cualquier segmento vacío. Si
// las tres fuentes están vacías se omite el título entero: el `title` del
// layout raíz aplica por herencia de metadata de Next (no se repite acá).
function construirTitulo(config: SiteConfigDTO): string | undefined {
  const partes = partesComunes(config)
  return partes.length ? partes.join(' | ') : undefined
}

// `descripcion` propia tiene prioridad; si viene vacía o solo espacios se
// deriva de las mismas partes que el título, con el sufijo fijo. Si no hay
// ninguna parte de la que derivar (título también omitido), la descripción
// se omite: no hay ningún dato del negocio con el que componerla.
function construirDescripcion(config: SiteConfigDTO): string | undefined {
  const propia = campo(config.descripcion)
  if (noVacio(propia)) return propia

  const partes = partesComunes(config)
  return partes.length ? `${partes.join(', ')}. ${SUFIJO_DESCRIPCION}` : undefined
}

/**
 * Transforma la URL de una imagen almacenada en `configJson.imagenes` para
 * usarla como `og:image`, fijando `h=630&fit=crop` (Decisión D-E). Usa
 * `URL` + `searchParams` en vez de concatenar el query string a mano: las
 * URLs guardadas hoy siempre traen `?w=...`, pero una URL sin query string
 * es válida y concatenar `&h=630...` a mano la dejaría mal formada. Una
 * URL no parseable devuelve `undefined` para omitir `og:image` en vez de
 * emitir uno roto (Requirement "Open Graph Image Derivation").
 */
export function construirUrlImagenOg(url: string): string | undefined {
  try {
    const parsed = new URL(url)
    parsed.searchParams.set('h', '630')
    parsed.searchParams.set('fit', 'crop')
    return parsed.toString()
  } catch {
    return undefined
  }
}

/**
 * Compone el `Metadata` de Next para un sitio de cliente, a partir de su
 * `configJson` ya tipado como `SiteConfigDTO` y la URL absoluta con la que
 * fue servido (ver `urlSitio.ts` — nunca `headers()`, ver D-C). Devuelve
 * `{}` cuando no hay nada del negocio con qué componer título ni
 * descripción; quien llama decide si eso implica 404 (ver
 * `renderizarSitio`, que ya lo resuelve para el body de la página).
 */
export function construirMetadataSitio(config: SiteConfigDTO, urlAbsoluta: string): Metadata {
  const titulo = construirTitulo(config)
  const descripcion = construirDescripcion(config)

  // `og:image` solo se deriva de la primera imagen (Decisión D-F): es la
  // única variante ya lo bastante ancha para un link preview, las demás son
  // miniaturas de galería (`?w=800`).
  const primeraImagen = campo(config.imagenes?.[0])
  const urlImagen = primeraImagen ? construirUrlImagenOg(primeraImagen) : undefined

  return {
    ...(titulo ? { title: titulo } : {}),
    ...(descripcion ? { description: descripcion } : {}),
    openGraph: {
      ...(titulo ? { title: titulo } : {}),
      ...(descripcion ? { description: descripcion } : {}),
      url: urlAbsoluta,
      type: 'website',
      ...(urlImagen ? { images: [urlImagen] } : {}),
    },
  }
}
