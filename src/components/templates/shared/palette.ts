import type { CSSProperties } from 'react'
import { SiteConfigDTO } from '@/application/dtos/SiteConfigDTO'

// Paleta por defecto cuando el sitio aún no tiene config.colores propia —
// idéntica a la que usaba el page.tsx inline antes de esta migración.
const PALETA_DEFAULT = { primario: '#080056', secundario: '#5B46F8', acento: '#15DEFA', texto: '#ffffff' }

// Mecanismo de custom properties CSS compartido por los 5 templates
// (Decisión D6) — cada template lo aplica en su propio elemento raíz.
export function buildPaletteStyle(config: SiteConfigDTO): CSSProperties {
  const colores = config.colores ?? PALETA_DEFAULT

  return {
    '--primario': colores.primario,
    '--secundario': colores.secundario,
    '--acento': colores.acento,
    '--texto': colores.texto,
  } as CSSProperties
}
