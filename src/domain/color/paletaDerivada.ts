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

// Exportada (R3-fallback-de-contraste-sin-cobertura) para que
// `paletaDerivada.test.ts` pueda ejercitar la rama de negro directamente, sin
// depender de encontrar un acento real que la dispare — ver más abajo por
// qué eso no es posible con el objetivo de producción.
export function ganadorDeContraste(primario: string): string {
  // `razonContraste` es simétrica: comparar cuál de los dos extremos da mayor
  // razón contra `primario` da el mejor candidato disponible con ese
  // `primario` — todavía puede no alcanzar `OBJETIVO_TEXTO`; ver
  // `resolverPrimarioYTexto`, que es quien garantiza el objetivo.
  return razonContraste('#ffffff', primario) >= razonContraste('#000000', primario) ? '#ffffff' : '#000000'
}

// Devuelve el `primario` (posiblemente reajustado en L) y el texto que
// alcanza `objetivo` contra él. Si el `primario` de partida (L en `l`) ya
// deja a blanco o negro por encima del objetivo, se devuelve tal cual. Si no,
// se trata al texto ganador como el "fondo" fijo y se mueve la L de
// `primario` con `clampAcento` (mismo mecanismo que ese módulo usa para el
// acento contra un fondo de plantilla) hasta alcanzarlo, preservando tono y
// croma. `clampAcento` nunca falla en devolver algo por debajo del objetivo
// cuando el "fondo" es blanco o negro puro: en el peor caso el propio extremo
// opuesto (negro o blanco) da máximo contraste.
//
// `l` y `objetivo` son parámetros (no `L_PRIMARIO`/`OBJETIVO_TEXTO` quemados
// adentro) exclusivamente para que el test pueda forzar la rama de reajuste
// de forma determinística — ver R3-fallback-de-contraste-sin-cobertura.
// `primarioConTextoLegible`, la única llamadora en producción, siempre pasa
// `L_PRIMARIO` y el `objetivo` por defecto (`OBJETIVO_TEXTO`), así que el
// comportamiento público de `derivarPaletaDesdeAcento` no cambia.
//
// Por qué el reajuste es matemáticamente inalcanzable con `objetivo =
// OBJETIVO_TEXTO` (4.5): para cualquier fondo, el mejor de blanco/negro
// siempre da como mínimo ~4.583:1 — el punto de empate entre
// `(Y+0.05)/0.05` (contraste con negro) y `1.05/(Y+0.05)` (contraste con
// blanco) se da en Y≈0.1791, donde ambos valen ~4.583, y alejarse de ese
// punto en cualquier dirección solo aumenta el contraste del ganador. Por
// eso el barrido de 720 puntos de `paletaDerivada.test.ts` nunca dispara
// esta rama con un acento real: no es un hueco de cobertura evitable, es una
// garantía matemática de la fórmula WCAG. El test de esta rama pasa un
// `objetivo` explícito más exigente (no `OBJETIVO_TEXTO`) para forzar el
// reajuste de forma reproducible, y confirma igual que el resultado sigue
// cumpliendo `OBJETIVO_TEXTO` de sobra.
export function resolverPrimarioYTexto(oklch: OKLCH, l: number, objetivo: number = OBJETIVO_TEXTO): { primario: string; texto: string } {
  const primarioBase = conLuminosidad(oklch, l)
  const texto = ganadorDeContraste(primarioBase)

  if (razonContraste(texto, primarioBase) >= objetivo) {
    return { primario: primarioBase, texto }
  }

  const primario = clampAcento(primarioBase, texto, objetivo)
  return { primario, texto }
}

function primarioConTextoLegible(oklch: OKLCH): { primario: string; texto: string } {
  return resolverPrimarioYTexto(oklch, L_PRIMARIO)
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
