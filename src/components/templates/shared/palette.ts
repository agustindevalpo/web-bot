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
//
// `--acento` se emite con el acento RESUELTO que devuelve
// `derivarPaletaDesdeAcento` (no con el valor crudo de `config.colores`): si
// el dato de cliente no es un hex válido, la derivación ya degrada
// internamente al acento por defecto para calcular primario/secundario/texto,
// y `--acento` tiene que coincidir con ESE mismo valor — de lo contrario
// quedaría con el dato roto mientras las otras tres variables ya reflejan el
// fallback, rompiendo la coherencia de las cuatro entre sí.
export function buildPaletteStyle(config: SiteConfigDTO): CSSProperties {
  const acentoEntrada = config.colores?.acento ?? ACENTO_DEFAULT
  const { primario, secundario, texto, acento } = derivarPaletaDesdeAcento(acentoEntrada)

  return {
    '--primario': primario,
    '--secundario': secundario,
    '--acento': acento,
    '--texto': texto,
  } as CSSProperties
}
