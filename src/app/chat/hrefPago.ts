// Resuelve a dónde lleva el CTA "Quiero mi sitio real" (WB-43). Módulo puro,
// sin leer env: DemoCTA.tsx le pasa NEXT_PUBLIC_MERCADOPAGO_LINK_URL. Mientras la variable
// no esté configurada, el CTA sigue cayendo a /login (ver HREF_PAGO_FALLBACK).

export interface EnlacePago {
  href: string
  externo: boolean
}

// `desde=pago` es un marcador de intención, no un dato personal: /login lo usa
// para explicarle a quien llegó acá que vino del botón de compra, en vez de
// mostrarle el texto genérico de "crear tu cuenta" (ver LoginForm.tsx). No
// cambia a dónde lleva el fallback, solo por qué se ve como se ve al llegar.
export const HREF_PAGO_FALLBACK = '/login?desde=pago'

export function resolverEnlacePago(url: string | undefined): EnlacePago {
  const limpia = url?.trim() ?? ''
  if (limpia.startsWith('https://')) {
    return { href: limpia, externo: true }
  }
  return { href: HREF_PAGO_FALLBACK, externo: false }
}

// Clasificación del link de pago configurado (sandbox de pagos, ver
// scripts/dev-sandbox.mjs y docs/DECISIONES.md D-22). El riesgo real no es que
// falte el link — eso ya cae a /login sin más — es que alguien deje puesto el
// link de pruebas de Mercado Pago y un cliente real no pueda pagar en silencio.
export type ClasificacionPago = 'productivo' | 'prueba' | 'desconocido'

export interface DiagnosticoPago {
  clasificacion: ClasificacionPago
}

// Host del short-link real de Mercado Pago (WB-43). Cualquier link con este
// host es productivo sin más análisis: es la forma que toman los links de
// pago reales que Agustín genera para cobrar.
const HOST_PAGO_PRODUCTIVO = 'mpago.la'

// Marcas del checkout de pruebas de Mercado Pago: un link de preferencia
// (`pref_id`) o la ruta de redirect del checkout v1, que en la práctica solo
// aparece en preferencias de sandbox creadas desde el dashboard de desarrollo.
const RUTA_CHECKOUT_SANDBOX = '/checkout/v1/redirect'
const QUERY_PREF_ID = 'pref_id'

export function clasificarEnlacePago(url: string | undefined): DiagnosticoPago {
  const limpia = url?.trim() ?? ''
  // Sin link https no hay nada que alertar: resolverEnlacePago ya cae a
  // /login para este mismo caso, así que no hay pago real en riesgo.
  if (!limpia.startsWith('https://')) {
    return { clasificacion: 'productivo' }
  }

  let parsed: URL
  try {
    parsed = new URL(limpia)
  } catch {
    // URL malformada (https:// seguido de basura, por ejemplo): no se puede
    // parsear con confianza. No se adivina — se reporta "desconocido" y el
    // llamador decide no alarmar (ver regla siguiente).
    return { clasificacion: 'desconocido' }
  }

  const host = parsed.hostname.toLowerCase()
  if (host === HOST_PAGO_PRODUCTIVO || host === `www.${HOST_PAGO_PRODUCTIVO}`) {
    return { clasificacion: 'productivo' }
  }

  const esSandbox = parsed.searchParams.has(QUERY_PREF_ID) || parsed.pathname.includes(RUTA_CHECKOUT_SANDBOX)
  if (esSandbox) {
    return { clasificacion: 'prueba' }
  }

  // Ni el host productivo conocido ni una marca de sandbox: no se adivina.
  // Se trata como productivo para no mostrar una alarma falsa, pero queda
  // reportado como "desconocido" para que quien llama pueda distinguirlo.
  return { clasificacion: 'desconocido' }
}

// Modo de pago declarado explícitamente por quien configura el entorno
// (NEXT_PUBLIC_PAGOS_MODO, D-22). Es una intención, no un hecho: por eso nunca
// se usa solo — siempre se contrasta contra clasificarEnlacePago(), que lee la
// URL real. Ausente o con basura no es "producción por defecto": es "no
// declarado", un tercer estado explícito para no fingir una certeza que nadie
// afirmó.
export type ModoPagoDeclarado = 'produccion' | 'prueba'

export function normalizarModoPagoDeclarado(valor: string | undefined): ModoPagoDeclarado | undefined {
  const limpio = valor?.trim().toLowerCase()
  if (limpio === 'produccion' || limpio === 'prueba') return limpio
  return undefined
}

// Resultado de contrastar la intención declarada contra la realidad del link.
// "discrepancia" es el estado que justifica todo esto: alguien declaró un modo
// y la URL dice otra cosa, que es exactamente el escenario peligroso (sandbox
// apuntado en silencio hacia producción, o viceversa).
export type ContrasteModoPago = 'coincide-produccion' | 'coincide-prueba' | 'discrepancia' | 'sin-declarar' | 'indeterminado'

export function contrastarModoPago(modoDeclarado: string | undefined, diagnostico: DiagnosticoPago): ContrasteModoPago {
  const declarado = normalizarModoPagoDeclarado(modoDeclarado)

  // Sin declaración no hay nada que contrastar: se reporta como tal y quien
  // llama cae de vuelta al diagnóstico derivado solo (sin alarmar sobre una
  // discrepancia que nadie afirmó que no debía existir).
  if (declarado === undefined) return 'sin-declarar'

  // La URL no se pudo clasificar con confianza: no se puede confirmar ni
  // refutar lo declarado con un dato que en sí mismo es incierto.
  if (diagnostico.clasificacion === 'desconocido') return 'indeterminado'

  if (declarado === 'produccion' && diagnostico.clasificacion === 'productivo') return 'coincide-produccion'
  if (declarado === 'prueba' && diagnostico.clasificacion === 'prueba') return 'coincide-prueba'
  return 'discrepancia'
}

export type BannerPago = 'ninguno' | 'sandbox' | 'discrepancia'

/**
 * Decide qué banner corresponde. Vive acá y no en el componente para que la
 * regla quede testeada: es la única pieza que protege contra el escenario que
 * motiva toda esta función — el link de pruebas llegando a producción.
 *
 * El flag declara intención; la URL es la evidencia. Por eso la evidencia sola
 * basta para avisar: si no hay flag declarado pero la URL es del ambiente de
 * pruebas, se avisa igual. Exigir el flag para alarmar dejaría mudo justo el
 * caso más probable, que es el de alguien que cambió la URL y ni se acordó de
 * que el flag existe.
 */
export function bannerPago(contraste: ContrasteModoPago, diagnostico: DiagnosticoPago): BannerPago {
  if (contraste === 'discrepancia') return 'discrepancia'
  if (contraste === 'coincide-prueba') return 'sandbox'
  if (contraste === 'sin-declarar' && diagnostico.clasificacion === 'prueba') return 'sandbox'
  return 'ninguno'
}
