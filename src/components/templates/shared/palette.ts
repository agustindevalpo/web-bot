import type { CSSProperties } from 'react'
import { SiteConfigDTO } from '@/application/dtos/SiteConfigDTO'
import { derivarPaletaDesdeAcento } from '@/domain/color/paletaDerivada'
import { clampAcento, OBJETIVO_TEXTO } from '@/domain/color/contraste'

// Acento por defecto cuando el sitio aún no tiene config.colores.acento
// propio — el mismo que ya usaba PALETA_DEFAULT antes de D-31.
const ACENTO_DEFAULT = '#15DEFA'

// Fondo contra el que se mide el acento (T2, handoff_bloques_v2/
// 00-DECISIONES-TRANSVERSALES.md): las seis plantillas Bloques son blancas, y
// el acento nunca se usa sobre `--ink`, así que un único clamp contra blanco
// alcanza (texto de acento sobre blanco y texto blanco sobre acento son la
// misma medición, el contraste es simétrico).
const FONDO_ACENTO = '#FFFFFF'

// Mecanismo de custom properties CSS compartido por los 5 templates
// (Decisión D6) — cada template lo aplica en su propio elemento raíz.
//
// D-31 (camino 3): `--acento` sigue siendo el único color que persiste el
// cliente; `--primario`, `--secundario` y `--texto` ya NO se leen de
// `config.colores` (aunque la fila los traiga, quedan huérfanos) — se derivan
// siempre del acento con `derivarPaletaDesdeAcento`.
//
// `--acento` se emite con el acento RESUELTO (hex válido o fallback). Con
// `bloques: true` (T2) sale además clampeado a >= 4.5:1 contra blanco: este es
// el ÚNICO lugar que clampea, ninguna plantilla debe volver a hacerlo. Es
// opt-in por plantilla y no global porque RESTAURANTE y PORTFOLIO todavía no
// son Bloques: pintan el acento sobre fondo oscuro y como fondo de un botón con
// texto `--primario` oscuro, y oscurecer el acento ahí les bajaba el contraste
// (con #FFD000, texto #221a00 sobre #8f7400). Cada plantilla lo activa al
// migrar a Bloques. `--primario`,
// `--secundario` y `--texto` se derivan del acento SIN clampear (igual que
// hacía LANDING antes: el clamp solo sobrescribía `--acento`), así que no
// cambian.
//
// Los derivados `--acento-07/18/28/hover` (T2) se calculan en CSS con
// color-mix / relative color a partir de `--acento` ya clampeado; no tocan
// ningún CSS de plantilla (ninguna los consume todavía).
export function buildPaletteStyle(
  config: SiteConfigDTO,
  { bloques = false }: { bloques?: boolean } = {},
): CSSProperties {
  const acentoEntrada = config.colores?.acento ?? ACENTO_DEFAULT
  const { primario, secundario, texto, acento } = derivarPaletaDesdeAcento(acentoEntrada)
  const acentoClampeado = bloques ? clampAcento(acento, FONDO_ACENTO, OBJETIVO_TEXTO) : acento

  return {
    '--primario': primario,
    '--secundario': secundario,
    '--acento': acentoClampeado,
    '--texto': texto,
    '--acento-07': 'color-mix(in oklch, var(--acento) 7%, white)',
    '--acento-18': 'color-mix(in oklch, var(--acento) 18%, white)',
    '--acento-28': 'color-mix(in oklch, var(--acento) 28%, white)',
    '--acento-hover': 'oklch(from var(--acento) calc(l - .08) c h)',
  } as CSSProperties
}
