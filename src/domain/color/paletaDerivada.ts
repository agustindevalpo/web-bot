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
//   regla a los seis rubros en vez de quemarla solo para SERVICIOS. Cuando
//   ningún extremo (blanco/negro) alcanza 4.5:1 contra ese `primario`, la L
//   se reajusta (ver `primarioConTextoLegible` más abajo) — 0.22 es el punto de
//   partida, no un valor que se preserve a cualquier costo.
// - `secundario`: L intermedia (~0.45) entre `primario` (0.22) y el acento
//   original — no hay precedente textual del handoff para este valor puntual,
//   así que queda documentado acá como decisión de este ciclo (D-31): un paso
//   intermedio de luminosidad, mismo tono y croma que `primario`. No se ve
//   afectado por el reajuste de `primario`: sale siempre del acento de
//   entrada, no del `primario` ya corregido.
// - `texto`: blanco o negro, el que gane `razonContraste` contra el
//   `primario` derivado. El módulo GARANTIZA el objetivo `OBJETIVO_TEXTO`
//   (4.5:1, WCAG SC 1.4.3): si ni blanco ni negro lo alcanzan con `primario`
//   en L=0.22, se reajusta la L de `primario` (conservando tono y croma) con
//   `clampAcento` de `contraste.ts` hasta que el texto ganador sí llegue a
//   4.5:1 — mismo mecanismo de búsqueda binaria acotada que ese módulo ya usa
//   para el acento contra un fondo de plantilla; acá se reutiliza en vez de
//   duplicar la búsqueda, tratando `primario` como el color que se mueve y el
//   texto ganador como el "fondo" fijo contra el que tiene que rendir.
import {
  clampAcento,
  hexALineal,
  linealAHex,
  linealAOklch,
  mapearAGamut,
  razonContraste,
  OBJETIVO_TEXTO,
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
  // Acento efectivamente usado para derivar el resto de la paleta: igual al
  // parámetro de entrada cuando es un hex válido, o `ACENTO_DEFAULT` cuando
  // no lo es. `palette.ts` lo usa para emitir `--acento`, así las cuatro
  // variables CSS quedan siempre coherentes entre sí — un acento inválido de
  // cliente nunca deja `--acento` con el valor roto mientras las otras tres
  // ya cayeron al fallback (R3-acento-no-normalizado).
  acento: string
}

// Hex de `ACENTO_DEFAULT` en OKLCH — precalculado porque `hexALineal` de un
// hex constante y válido nunca puede dar `null`; el `!` queda documentado acá
// y no disperso en cada llamada de fallback.
const OKLCH_ACENTO_DEFAULT: OKLCH = linealAOklch(hexALineal(ACENTO_DEFAULT)!)

function conLuminosidad(oklch: OKLCH, l: number): string {
  return linealAHex(mapearAGamut({ ...oklch, l }))
}

function ganadorDeContraste(primario: string): string {
  // `razonContraste` es simétrica: comparar cuál de los dos extremos da mayor
  // razón contra `primario` da el mejor candidato disponible con ese
  // `primario` — todavía puede no alcanzar `OBJETIVO_TEXTO`; ver
  // `textoLegibleContra`, que es quien garantiza el objetivo.
  return razonContraste('#ffffff', primario) >= razonContraste('#000000', primario) ? '#ffffff' : '#000000'
}

// Devuelve el `primario` (posiblemente reajustado en L) y el texto que
// alcanza `OBJETIVO_TEXTO` contra él. Si el `primario` de partida (L en
// `lPrimario`) ya deja a blanco o negro por encima del objetivo, se devuelve
// tal cual. Si no, se trata al texto ganador como el "fondo" fijo y se mueve
// la L de `primario` con `clampAcento` (mismo mecanismo que ese módulo usa
// para el acento contra un fondo de plantilla) hasta alcanzar 4.5:1,
// preservando tono y croma. `clampAcento` nunca falla en devolver algo por
// debajo del objetivo cuando el "fondo" es blanco o negro puro: en el peor
// caso el propio extremo opuesto (negro u blanco) da máximo contraste.
function primarioConTextoLegible(oklch: OKLCH): { primario: string; texto: string } {
  const primarioBase = conLuminosidad(oklch, L_PRIMARIO)
  const texto = ganadorDeContraste(primarioBase)

  if (razonContraste(texto, primarioBase) >= OBJETIVO_TEXTO) {
    return { primario: primarioBase, texto }
  }

  const primario = clampAcento(primarioBase, texto, OBJETIVO_TEXTO)
  return { primario, texto }
}

/**
 * Deriva la paleta completa (`primario`, `secundario`, `texto`) a partir de
 * un único acento de cliente. Nunca lanza: un `acento` inválido (cualquier
 * cosa que `hexALineal` rechace) degrada al acento por defecto en vez de
 * propagar el dato roto — mismo criterio que `acentoPorEstilo.ts` y
 * `contraste.ts`, porque `acento` es dato de cliente sin validar. El `acento`
 * devuelto en el resultado es ese mismo acento resuelto (el válido de
 * entrada, o el de reserva), nunca el valor roto original.
 */
export function derivarPaletaDesdeAcento(acento: string): PaletaDerivada {
  const base = hexALineal(acento)
  const acentoResuelto = base === null ? ACENTO_DEFAULT : acento
  const oklch = base === null ? OKLCH_ACENTO_DEFAULT : linealAOklch(base)

  const { primario, texto } = primarioConTextoLegible(oklch)
  const secundario = conLuminosidad(oklch, L_SECUNDARIO)

  return { primario, secundario, texto, acento: acentoResuelto }
}
