// Estado del acordeón de la FAQ: a lo más un ítem abierto; el primero abre por
// defecto. Pura, para probar la regla sin montar React.

export const FAQ_ABIERTO_INICIAL = 0

/** Pulsar el ítem abierto lo cierra; pulsar otro lo abre y cierra el anterior. */
export function alternarFaq(abierto: number | null, indice: number): number | null {
  return abierto === indice ? null : indice
}
