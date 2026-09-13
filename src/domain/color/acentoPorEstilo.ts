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
import { hexALineal, linealAHex, linealAOklch, mapearAGamut, type OKLCH } from '@/domain/color/contraste'

// Ámbar — hacia acá rota `calido` una fracción del tono, para acercar
// cualquier acento a una temperatura de color cálida sin perder su identidad.
const TONO_CALIDO = 70

// Recorre el arco MÁS CORTO entre `origen` y `destino` (nunca el de 360°-x
// grados de más), y avanza `fraccion` de ese arco. Sin esto, un acento en, por
// ejemplo, 100° rotaría 260° en vez de 30° para acercarse a 70° por el lado
// largo.
function rotarHaciaTono(origen: number, destino: number, fraccion: number): number {
  const diferencia = (((destino - origen + 540) % 360) - 180)
  return ((origen + diferencia * fraccion) % 360 + 360) % 360
}

function clamp01(valor: number): number {
  return Math.min(1, Math.max(0, valor))
}

function transformar(base: OKLCH, estilo: Estilo): OKLCH {
  switch (estilo) {
    case Estilo.MODERNO:
      // Minimalista y contenido: se le quita saturación sin tocar cuán claro
      // u oscuro es.
      return { ...base, c: base.c * 0.55 }
    case Estilo.CALIDO:
      // Cercano: rota una fracción hacia el ámbar y sube apenas la
      // luminosidad, sin desaturar — un cálido apagado se lee sucio, no cercano.
      return {
        l: clamp01(base.l + 0.04),
        c: base.c * 0.95,
        h: rotarHaciaTono(base.h, TONO_CALIDO, 0.4),
      }
    case Estilo.COLORIDO:
      // Llamativo: más croma y un toque más de luz para que no se sature a
      // oscuras.
      return { l: clamp01(base.l + 0.02), c: base.c * 1.35, h: base.h }
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
