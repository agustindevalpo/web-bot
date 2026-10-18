// Qué muestra el bloque de precio según el estado de la promo. Función pura:
// todos los montos y el total de cupos salen de precios.ts, nada se repite acá.
import { PRECIO } from './copy'
import {
  CUPOS_PROMO,
  formatCLP,
  PRECIO_MULTIPAGINA,
  PRECIO_PROMO,
  PRECIO_SITIO,
  RENOVACION_ANUAL,
  type EstadoPromo,
} from './precios'

export interface VistaPrecio {
  /** Monto grande: el de lanzamiento mientras haya cupos, el normal si no. */
  monto: string
  /** Precio normal tachado; solo mientras la promo está activa. */
  montoTachado: string | null
  /** Etiqueta naranja; solo mientras la promo está activa. */
  etiquetaPromo: string | null
  /** Línea cyan bajo el monto. */
  lineaPagoUnico: string
  /** Aviso de cupos agotados; solo cuando la promo terminó. */
  notaAgotado: string | null
  multipagina: string
  renovacion: string
}

export function vistaPrecio(promo: EstadoPromo): VistaPrecio {
  const extras = { multipagina: formatCLP(PRECIO_MULTIPAGINA), renovacion: formatCLP(RENOVACION_ANUAL) }

  if (promo.agotada) {
    return {
      monto: formatCLP(PRECIO_SITIO),
      montoTachado: null,
      etiquetaPromo: null,
      lineaPagoUnico: PRECIO.etiquetaPagoUnico,
      notaAgotado: `${PRECIO.agotado.etiqueta} — ${PRECIO.agotado.nota(formatCLP(PRECIO_SITIO))}`,
      ...extras,
    }
  }

  return {
    monto: formatCLP(PRECIO_PROMO),
    montoTachado: formatCLP(PRECIO_SITIO),
    etiquetaPromo: `${PRECIO.lanzamiento.prefijo} · ${PRECIO.lanzamiento.cupos(promo.restantes)}`,
    lineaPagoUnico: `${PRECIO.etiquetaPagoUnico}, ${PRECIO.lanzamiento.primeros(CUPOS_PROMO)}`,
    notaAgotado: null,
    ...extras,
  }
}
