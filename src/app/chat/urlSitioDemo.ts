// URL pública del sitio de demo de una sesión. En local, sitios.devalpo.cl
// sirve lo que esté deployado en producción, no esta rama: apuntar ahí en dev
// muestra código viejo, no el que se está probando. Solo se usa el subdominio
// real fuera de localhost. Lee el entorno al llamarla, no al importar.
export function urlSitioDemo(subdominio: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'sitios.devalpo.cl'
  return appUrl.includes('localhost') ? `${appUrl}/sites/${subdominio}` : `https://${subdominio}.${baseDomain}`
}
