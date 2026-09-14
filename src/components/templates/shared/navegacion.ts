import type { CSSProperties, ReactNode } from 'react'

// Helpers puros del envoltorio SPA (WB-plantillas-fundaciones, S0a) — sin JSX,
// sin `SiteConfigDTO` ni ningún tipo de `src/application/` (Decisión D-02,
// límite hexagonal; mirra el split resolver.ts/registry.ts de D-11). El
// wrapper (`SeccionesSPA.tsx`) recibe únicamente `{id, etiqueta, contenido}[]`
// ya filtrado — cada `sections.ts` de template arma el array desde sus propios
// `buildAbout`/`buildGaleria` (que ya devuelven `null` cuando falta el dato,
// ver landing/sections.ts:60-63,71-75) y llama a `filtrarSecciones`.

export type SeccionSPA = { id: string; etiqueta: string; contenido: ReactNode }

// Regla exacta, dicha con precisión porque `0` y `''` son ReactNode válidos:
// una entrada se descarta SOLO si `contenido == null` (null o undefined,
// comparación laxa a propósito). Nunca por falsiness — un template que arme
// una sección con contenido `0` o `''` no puede perderla en silencio.
export function filtrarSecciones(entradas: SeccionSPA[]): SeccionSPA[] {
  return entradas.filter((entrada) => entrada.contenido != null)
}

// Delay de cascada por índice — función pura, tabla-testeable sin DOM
// (mirra el cast `as CSSProperties` de `buildPaletteStyle`). Índices
// negativos o no enteros se normalizan a un delay no negativo: `Math.trunc`
// descarta la parte decimal y `Math.max(0, …)` evita un `animation-delay`
// negativo si algún llamador pasa un índice inválido.
export function estiloCascada(indice: number): CSSProperties {
  const pasos = Math.max(0, Math.trunc(indice))

  return { '--dv-delay': `${pasos * 70}ms` } as CSSProperties
}
