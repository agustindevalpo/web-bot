// Precios vigentes de la fábrica de sitios (WB-42). Módulo de datos puros:
// sin fetch, sin dependencias externas — page.tsx y DemoCTA.tsx importan
// desde acá para no duplicar el precio en dos lugares (ver design D5/D9).

export const PRECIO_SITIO = 149990
export const PRECIO_PROMO = 119990
export const PRECIO_MULTIPAGINA = 249990
export const RENOVACION_ANUAL = 39990
export const CUPOS_PROMO = 10

// Mantención manual: no hay conteo en base de datos (ver design D10).
// Al vender un cupo, sumar 1 acá y documentar el cambio en docs/BITACORA.md.
export const CUPOS_VENDIDOS = 0

const SEPARADOR_MILES = /\B(?=(\d{3})+(?!\d))/g

/**
 * Formatea un entero CLP como "$" + puntos de miles, sin decimales.
 * Implementación manual (sin Intl) para que el resultado sea un string
 * literal estable entre entornos — ver design D4.
 */
export function formatCLP(valor: number): string {
  const signo = valor < 0 ? '-' : ''
  const magnitud = Math.abs(Math.trunc(valor)).toString().replace(SEPARADOR_MILES, '.')
  return `${signo}$${magnitud}`
}

export interface EstadoPromo {
  activa: boolean
  restantes: number
  agotada: boolean
}

/**
 * Calcula el estado del cupo promocional a partir de la cantidad vendida.
 * `restantes` nunca baja de 0; `agotada` es `true` cuando ya no quedan
 * cupos; `activa` es siempre el complemento de `agotada`.
 */
export function estadoPromo(vendidos: number = CUPOS_VENDIDOS): EstadoPromo {
  const restantes = Math.max(0, CUPOS_PROMO - vendidos)
  const agotada = restantes === 0
  return { activa: !agotada, restantes, agotada }
}
