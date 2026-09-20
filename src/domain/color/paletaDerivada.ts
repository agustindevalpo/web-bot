// Deriva `primario`, `secundario` y `texto` de un único acento por cliente
// (D-31, resuelta por el camino 3: dejar de persistir los tres y calcularlos
// siempre desde `colores.acento`). Módulo puro sobre las primitivas OKLCH de
// `contraste.ts` — misma convención que ese archivo y que `acentoPorEstilo.ts`:
// sin excepciones, sin React, sin `SiteConfigDTO`, sin ningún import fuera de
// `src/domain/color/` (mismo límite hexagonal, ver AGENTS.md y D-02).
//
// Origen de cada regla:
// - `primario`: el propio handoff de diseño describe el footer oscuro de la
//   plantilla SERVICIOS como "el acento con L bajada a ~0.22 en OKLCH"
//   (docs/design_handoff_plantillas_webbot/README.md:237). Se generaliza esa
//   regla a los seis rubros en vez de quemarla solo para SERVICIOS.
// - `secundario`: L intermedia (~0.45) entre `primario` (0.22) y el acento
//   original — no hay precedente textual del handoff para este valor puntual,
//   así que queda documentado acá como decisión de este ciclo (D-31): un paso
//   intermedio de luminosidad, mismo tono y croma que `primario`.
// - `texto`: blanco o negro, el que gane `razonContraste` contra el
//   `primario` derivado, apuntando a `OBJETIVO_TEXTO` (4.5:1, WCAG SC 1.4.3).
//   `razonContraste` ya devuelve el mayor de los dos extremos cuando ninguno
//   alcanza el objetivo, así que no hace falta una rama aparte para ese caso.
import {
  hexALineal,
  linealAHex,
  linealAOklch,
  mapearAGamut,
  razonContraste,
  type OKLCH,
} from '@/domain/color/contraste'

// Luminosidad OKLCH de `primario` — footer oscuro, ver cita del handoff arriba.
export const L_PRIMARIO = 0.22

// Luminosidad OKLCH de `secundario` — intermedia entre `primario` y el acento.
export const L_SECUNDARIO = 0.45

// Acento de reserva cuando la entrada no es un hex válido — el mismo que usa
// `PALETA_DEFAULT.acento` en `palette.ts` y el acento por defecto documentado
// en `contraste.test.ts`. No se importa de `palette.ts` (violaría el límite
// de este módulo): se repite acá a propósito, como constante local.
const ACENTO_DEFAULT = '#15DEFA'

export interface PaletaDerivada {
  primario: string
  secundario: string
  texto: string
}

// Hex de `ACENTO_DEFAULT` en OKLCH — precalculado porque `hexALineal` de un
// hex constante y válido nunca puede dar `null`; el `!` queda documentado acá
// y no disperso en cada llamada de fallback.
const OKLCH_ACENTO_DEFAULT: OKLCH = linealAOklch(hexALineal(ACENTO_DEFAULT)!)

function conLuminosidad(oklch: OKLCH, l: number): string {
  return linealAHex(mapearAGamut({ ...oklch, l }))
}

function textoLegibleContra(primario: string): string {
  // `razonContraste` es simétrica: comparar cuál de los dos extremos da mayor
  // razón contra `primario` YA es "el que gane, apuntando a OBJETIVO_TEXTO; si
  // ninguno lo alcanza, el de mayor razón" — no hace falta una rama extra para
  // el caso en que ninguno llega a 4.5:1, el máximo sigue siendo la respuesta.
  return razonContraste('#ffffff', primario) >= razonContraste('#000000', primario) ? '#ffffff' : '#000000'
}

/**
 * Deriva la paleta completa (`primario`, `secundario`, `texto`) a partir de
 * un único acento de cliente. Nunca lanza: un `acento` inválido (cualquier
 * cosa que `hexALineal` rechace) degrada al acento por defecto en vez de
 * propagar el dato roto — mismo criterio que `acentoPorEstilo.ts` y
 * `contraste.ts`, porque `acento` es dato de cliente sin validar.
 */
export function derivarPaletaDesdeAcento(acento: string): PaletaDerivada {
  const base = hexALineal(acento)
  const oklch = base === null ? OKLCH_ACENTO_DEFAULT : linealAOklch(base)

  const primario = conLuminosidad(oklch, L_PRIMARIO)
  const secundario = conLuminosidad(oklch, L_SECUNDARIO)
  const texto = textoLegibleContra(primario)

  return { primario, secundario, texto }
}
