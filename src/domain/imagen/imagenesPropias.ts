// Decide qué URLs de imagen de un configJson son "propias": objetos que
// subimos nosotros a R2 para ese sitio (`<R2_PUBLIC_URL>/sitios/<sitioId>/...`).
// Solo esas se borran al reemplazarse o quitarse (limpieza de huérfanos, D-42);
// URLs externas (Unsplash), claves de otro sitio o cualquier cosa rara nunca
// son propias. Función pura: la base pública viene de afuera.

const ARCHIVO_SEGURO = /^[A-Za-z0-9._-]+$/

// Devuelve la clave del objeto si `url` es propia de `sitioId`, o null.
export function claveSiPropia(url: unknown, urlPublica: string | null, sitioId: string): string | null {
  if (typeof url !== 'string' || !urlPublica || !sitioId) return null

  const prefijo = `${urlPublica.replace(/\/+$/, '')}/`
  if (!url.startsWith(prefijo)) return null

  const clave = url.slice(prefijo.length)
  const carpeta = `sitios/${sitioId}/`
  if (!clave.startsWith(carpeta)) return null

  // Archivo plano bajo la carpeta del sitio: sin subcarpetas, query, hash,
  // escapes ni segmentos `.`/`..`.
  const archivo = clave.slice(carpeta.length)
  if (!ARCHIVO_SEGURO.test(archivo) || archivo === '.' || archivo.includes('..')) return null

  return clave
}

// Variante para quien renderiza un sitio sin conocer su id (los templates solo
// reciben el config): propia = archivo plano bajo `<urlPublica>/sitios/<cualquier
// id>/`. Reutiliza `claveSiPropia` con el id que trae la propia URL, así que las
// reglas de saneo son las mismas. Unsplash, hosts ajenos y `urlPublica` ausente
// nunca son propios.
export function esImagenPropia(url: unknown, urlPublica: string | null): boolean {
  if (typeof url !== 'string' || !urlPublica) return false

  const prefijo = `${urlPublica.replace(/\/+$/, '')}/sitios/`
  if (!url.startsWith(prefijo)) return false

  const sitioId = url.slice(prefijo.length).split('/')[0]
  return claveSiPropia(url, urlPublica, sitioId) !== null
}

// Todas las URLs de imagen que un configJson referencia: `logo` e
// `imagenes[]` (SiteConfigDTO no tiene ningún otro campo de imagen).
export function urlsImagenDeConfig(config: Record<string, unknown>): string[] {
  const urls: string[] = []
  if (typeof config.logo === 'string') urls.push(config.logo)
  if (Array.isArray(config.imagenes)) {
    for (const valor of config.imagenes) {
      if (typeof valor === 'string') urls.push(valor)
    }
  }
  return urls
}
