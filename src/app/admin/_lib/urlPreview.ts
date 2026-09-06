// Misma regla que DemoCTA: en local, el subdominio real sirve lo deployado en
// producción, así que la vista previa apunta a /sites/<subdominio> de la app
// local. Fuera de localhost se usa el subdominio real.
export function construirUrlPreview(subdominio: string, appUrl: string, baseDomain: string): string {
  const esLocal = appUrl.includes('localhost')
  return esLocal ? `${appUrl.replace(/\/$/, '')}/sites/${subdominio}` : `https://${subdominio}.${baseDomain}`
}

export function urlPreviewDesdeEnv(subdominio: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'sitios.devalpo.cl'
  return construirUrlPreview(subdominio, appUrl, baseDomain)
}
