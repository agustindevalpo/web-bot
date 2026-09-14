// Deriva el acento final de un sitio a partir del acento por defecto del
// rubro (RUBRO_DEFAULTS) y la respuesta de estilo visual que el cliente da en
// el chat (SiteConfigDTO.estilo) — hasta este cambio esa respuesta se parseaba
// y viajaba en el DTO pero ninguna plantilla la leía, así que dos negocios del
// mismo rubro terminaban con sitios idénticos. La transformación corre en
// OKLCH (mismo espacio que src/domain/color/contraste.ts) porque ahí croma y
// tono se manipulan por separado sin arrastrar el sesgo de luminancia de
// HSL. Ver docs/DECISIONES.md para el ADR de este ciclo.
//
// Deliberadamente NO se llama a `clampAcento` acá: ese clamp mide contraste
// contra el fondo real de cada plantilla, dato que este módulo de dominio no
// tiene (ni debe tener). El contraste final lo garantiza la plantilla al
// renderizar, igual que ya hace con el acento del rubro sin transformar — si
// se clampeara acá también, el segundo clamp correría contra un fondo
// supuesto y podría mover el tono dos veces.
import { Estilo } from '@/domain/value-objects/Estilo'
import { enGamut, hexALineal, linealAHex, linealAOklch, mapearAGamut, oklchALineal, type OKLCH } from '@/domain/color/contraste'

// Ámbar — hacia acá rota `calido` una fracción del tono, para acercar
// cualquier acento a una temperatura de color cálida sin perder su identidad.
const TONO_CALIDO = 70

// Distancia máxima al ámbar que se considera rotable. Más allá de esto el
// acento es frío de raíz (turquesa, cian, azul) y NO existe rotación que lo
// vuelva cálido sin que deje de ser la marca del cliente: se probaron las dos
// direcciones y las dos fallan — por el arco corto un `#0891B2` sale verde
// menta (`#4ba37a`), por el largo sale lavanda (`#9e7ec2`). Cálido y frío son
// mitades opuestas del círculo; ninguna regla las reconcilia. Para esos rubros
// `calido` conserva el tono y solo ablanda el color, y si alguno necesita un
// acento genuinamente cálido va elegido a mano en OVERRIDES_ACENTO.
const MAX_ROTACION_CALIDO = 90

function normalizarTono(grados: number): number {
  return ((grados % 360) + 360) % 360
}

// Arco con signo desde `origen` hasta `destino` por el camino más corto, en
// (-180, 180].
function arcoCorto(origen: number, destino: number): number {
  return ((destino - origen + 540) % 360) - 180
}

function rotarHaciaTono(origen: number, destino: number, fraccion: number): number {
  return normalizarTono(origen + arcoCorto(origen, destino) * fraccion)
}

function clamp01(valor: number): number {
  return Math.min(1, Math.max(0, valor))
}

// Croma que realmente sobrevive después de mapear a sRGB. Pedir croma no es
// obtenerlo: `mapearAGamut` lo recorta al máximo que entra para esa L y ese
// tono, y esta función mide el resultado en vez del pedido.
function cromaTrasGamut(color: OKLCH): number {
  return linealAOklch(mapearAGamut(color)).c
}

const PASO_L = 0.01
const CAIDA_MAX_L = 0.25

/**
 * Intensifica un acento cuyo croma pedido NO entra en sRGB, buscando la
 * luminosidad que maximiza el croma que sobrevive al mapeo de gamut — la
 * "cúspide" del gamut para ese tono.
 *
 * Se muestrea en vez de suponer una dirección. Una versión anterior daba por
 * sentado que oscurecer siempre libera croma, y para los naranjas más
 * saturados (`#FF8C00`, `#FF4500`) es falso: su cúspide ya está en la L
 * original y oscurecerlos les BAJA el croma por debajo del acento de partida.
 *
 * Por eso la garantía de este estilo es negativa antes que positiva: `colorido`
 * nunca devuelve un acento menos saturado ni más claro que el base. Cuando el
 * acento ya está en su cúspide no hay nada que ganar dentro de sRGB y se
 * devuelve tal cual: ese acento ya es lo más vívido que el rubro puede dar, y
 * fingir lo contrario sería entregar un color peor. Si aun así se lo quiere
 * distinto, va elegido a mano en OVERRIDES_ACENTO.
 */
function intensificarEnElBorde(pedido: OKLCH): OKLCH {
  // El barrido se detiene en 0. Sin este piso, un acento oscuro (L < 0.25)
  // hacía que el bucle puntuara luminosidades NEGATIVAS —físicamente
  // imposibles— y pudiera elegir como "mejor" un croma correspondiente a una L
  // que `clamp01` después nunca dejaba usar. El color entregado quedaba con
  // menos croma del que justificó elegirlo, rompiendo justo la garantía que
  // esta función promete.
  const piso = Math.max(0, pedido.l - CAIDA_MAX_L)
  let mejorL = pedido.l
  let mejorCroma = cromaTrasGamut(pedido)

  for (let l = pedido.l - PASO_L; l >= piso; l -= PASO_L) {
    const croma = cromaTrasGamut({ ...pedido, l })
    if (croma > mejorCroma) {
      mejorCroma = croma
      mejorL = l
    }
  }

  return { ...pedido, l: clamp01(mejorL) }
}

function transformar(base: OKLCH, estilo: Estilo): OKLCH {
  switch (estilo) {
    case Estilo.MODERNO:
      // Minimalista y contenido: se le quita saturación sin tocar cuán claro
      // u oscuro es.
      return { ...base, c: base.c * 0.55 }
    case Estilo.CALIDO: {
      // Cercano: rota una fracción hacia el ámbar y sube apenas la
      // luminosidad, sin desaturar — un cálido apagado se lee sucio, no cercano.
      // Un acento frío de raíz no rota (ver MAX_ROTACION_CALIDO): conserva su
      // tono y se queda solo con el ablandado.
      const esFrio = Math.abs(arcoCorto(base.h, TONO_CALIDO)) > MAX_ROTACION_CALIDO

      return {
        l: clamp01(base.l + 0.04),
        c: base.c * 0.95,
        h: esFrio ? base.h : rotarHaciaTono(base.h, TONO_CALIDO, 0.4),
      }
    }
    case Estilo.COLORIDO: {
      // Llamativo: más croma. El detalle que la primera versión pasó por alto
      // es que 6 de los 10 acentos por rubro ya están contra el borde de sRGB,
      // así que ese croma extra se recorta entero en `mapearAGamut` y el
      // estilo quedaba indistinguible del base — peor: el +0.02 de L que
      // llevaba antes los dejaba MÁS pálidos que el original, justo lo
      // contrario de "llamativo" (`#FF4500` salía `#ff572a`).
      const pedido = { l: base.l, c: base.c * 1.35, h: base.h }
      if (enGamut(oklchALineal(pedido))) return pedido

      return intensificarEnElBorde(pedido)
    }
    default:
      return base
  }
}

/**
 * Deriva el acento final (hex) para un `estilo` dado a partir del acento del
 * rubro. Un hex de entrada inválido degrada devolviéndolo tal cual —
 * `acentoDelRubro` sale de RUBRO_DEFAULTS, dato interno y no de cliente, pero
 * la función se mantiene defensiva por el mismo motivo que `contraste.ts`:
 * ninguna función de este dominio lanza.
 */
export function derivarAcento(acentoDelRubro: string, estilo: Estilo): string {
  const base = hexALineal(acentoDelRubro)
  if (base === null) return acentoDelRubro

  const oklch = transformar(linealAOklch(base), estilo)

  // `mapearAGamut` es imprescindible acá: subir el croma en `colorido` puede
  // sacar el color de sRGB, y sin este paso `linealAHex` lo recortaría canal
  // por canal, corriendo el tono en vez de preservarlo.
  return linealAHex(mapearAGamut(oklch))
}

export interface ColoresRubro {
  primario: string
  secundario: string
  acento: string
  texto: string
}

/**
 * Igual que `derivarAcento`, pero opera sobre el objeto `colores` completo:
 * `primario`, `secundario` y `texto` pasan sin tocar, solo `acento` se
 * deriva. Pensada para reemplazar `defaults.colores` en un solo punto de
 * llamada (DemoChatService/ClaudeChatService).
 */
export function derivarColores(colores: ColoresRubro, estilo: Estilo): ColoresRubro {
  return { ...colores, acento: derivarAcento(colores.acento, estilo) }
}
