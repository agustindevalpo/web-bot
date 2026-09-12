// URL absoluta del sitio tal como fue servido, para `og:url` (Requirement
// "Absolute Open Graph URL"). Deliberadamente independiente de
// `construirUrlPreview` (admin/_lib/urlPreview.ts): esa función resuelve una
// vista previa para el panel de administración, con una rama `localhost` que
// devuelve una URL con forma de path (`http://localhost:3000/sites/x`) — la
// forma equivocada para un canonical público — y no contempla dominio
// propio. Sin rama `localhost`: en desarrollo local se emite el mismo
// canonical que en producción, que es correcto y no lo rastrea ningún bot.

/** `og:url` para un sitio servido por subdominio (`/sites/[subdominio]`). */
export function construirUrlSitioSubdominio(subdominio: string, baseDomain: string): string {
  return `https://${subdominio}.${baseDomain}`
}

/** `og:url` para un sitio servido por dominio propio (`/sites/custom/[host]`). */
export function construirUrlSitioDominioPropio(host: string): string {
  return `https://${host}`
}
