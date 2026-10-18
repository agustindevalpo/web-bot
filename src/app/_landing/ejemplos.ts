// Ejemplos reales enlazados desde la landing (WB-42). Reusa
// construirUrlPreview (src/app/admin/_lib/urlPreview.ts) — ya extraída y
// probada — en vez de duplicar la rama local/producción (ver design D9).
import { construirUrlPreview } from '@/app/admin/_lib/urlPreview'

export interface EjemploReal {
  subdominio: string
  rubro: string
  descripcion: string
  url: string
  // Host público (sin esquema), siempre sobre el dominio real: lo muestra la barra
  // de URL de la ventana del hero, incluso en local.
  host: string
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || ''
const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'sitios.devalpo.cl'

function crearEjemplo(subdominio: string, rubro: string, descripcion: string): EjemploReal {
  return {
    subdominio,
    rubro,
    descripcion,
    url: construirUrlPreview(subdominio, APP_URL, BASE_DOMAIN),
    host: `${subdominio}.${BASE_DOMAIN}`,
  }
}

export const EJEMPLOS: EjemploReal[] = [
  crearEjemplo('demo-restaurante', 'Restaurante', 'Menú, fotos y datos de reserva'),
  crearEjemplo('demo-tienda', 'Tienda', 'Catálogo de productos y contacto directo'),
  crearEjemplo('demo-dentista', 'Consulta dental', 'Servicios, horarios y formulario de contacto'),
]
