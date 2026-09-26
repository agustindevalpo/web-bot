// Lógica pura del scroll horizontal del nav móvil (S1-fix,
// odd/tasks/nav-movil-seccionesspa.md; handoff_bloques README.md:305) —
// extraída para poder pinear con tests unitarios sin DOM real, mismo
// criterio que `resolverSeccionActiva` en scrollspy.ts. SeccionesSPA.tsx
// llama esto cuando cambia la sección activa y usa el resultado con
// `nav.scrollTo({ left, behavior })` — NUNCA `scrollIntoView` sobre el
// documento (README.md:305: "scroll horizontal solo dentro de la fila").
export type ParametrosScrollNav = {
  // `nav.clientWidth` — ancho visible de la fila con scroll.
  anchoNav: number
  // `nav.scrollLeft` actual, antes de decidir el nuevo valor.
  scrollActual: number
  // `item.offsetLeft` del `<a>` activo, relativo al propio nav.
  offsetItem: number
  // `item.offsetWidth` del `<a>` activo.
  anchoItem: number
  // `scroll-padding-inline` del nav (18px en el CSS, README.md:302) — el
  // ítem nunca debe quedar pegado al canto de la fila.
  paddingScroll: number
}

// Devuelve el `scrollLeft` que deja al ítem activo completamente visible
// dentro de la fila, respetando el padding de scroll en ambos bordes.
// Si el ítem ya está visible, devuelve `scrollActual` sin cambios (el
// llamador lo usa para evitar un `scrollTo` de no-op).
export function calcularScrollNavHorizontal({
  anchoNav,
  scrollActual,
  offsetItem,
  anchoItem,
  paddingScroll,
}: ParametrosScrollNav): number {
  const bordeIzquierdoVisible = scrollActual + paddingScroll
  const bordeDerechoVisible = scrollActual + anchoNav - paddingScroll

  // Cortado por la izquierda (o el nav recién se centró más allá del
  // ítem, p. ej. al volver a la primera sección): alinea su borde
  // izquierdo al padding de scroll.
  if (offsetItem < bordeIzquierdoVisible) {
    return Math.max(0, offsetItem - paddingScroll)
  }

  // Cortado por la derecha: alinea su borde derecho al padding de scroll
  // del otro extremo.
  if (offsetItem + anchoItem > bordeDerechoVisible) {
    return Math.max(0, offsetItem + anchoItem - anchoNav + paddingScroll)
  }

  // Ya totalmente visible entre ambos paddings — no mover el scroll.
  return scrollActual
}
