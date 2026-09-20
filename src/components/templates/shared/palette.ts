import type { CSSProperties } from 'react'
import { SiteConfigDTO } from '@/application/dtos/SiteConfigDTO'
import { derivarPaletaDesdeAcento } from '@/domain/color/paletaDerivada'

// Acento por defecto cuando el sitio aún no tiene config.colores.acento
// propio — el mismo que ya usaba PALETA_DEFAULT antes de D-31.
const ACENTO_DEFAULT = '#15DEFA'

// Mecanismo de custom properties CSS compartido por los 5 templates
// (Decisión D6) — cada template lo aplica en su propio elemento raíz.
//
// D-31 (camino 3): `--acento` sigue siendo el único color que persiste el
// cliente; `--primario`, `--secundario` y `--texto` ya NO se leen de
// `config.colores` (aunque la fila los traiga, quedan huérfanos) — se derivan
// siempre del acento con `derivarPaletaDesdeAcento`. Las cuatro variables se
// siguen emitiendo igual: las plantillas vivas tienen 64 usos entre las tres
// derivadas y romperían sin ellas.
export function buildPaletteStyle(config: SiteConfigDTO): CSSProperties {
  const acento = config.colores?.acento ?? ACENTO_DEFAULT
  const { primario, secundario, texto } = derivarPaletaDesdeAcento(acento)

  return {
    '--primario': primario,
    '--secundario': secundario,
    '--acento': acento,
    '--texto': texto,
  } as CSSProperties
}
