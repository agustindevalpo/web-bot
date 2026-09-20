// Lógica pura de decisión del scrollspy de `SeccionesSPA.tsx` — extraída para
// poder pinear con tests unitarios, sin stubear IntersectionObserver ni
// window.scrollY, los 4 comportamientos documentados en scrollspy.test.ts
// (R3-001): orden de documento ante intersecciones simultáneas, centinela de
// fin de página para una sección final corta, que el centinela deje de ganar
// al subir, y que una página corta arranque en la primera sección.
export function resolverSeccionActiva(
  ordenIds: string[],
  interseccionPorId: Map<string, boolean>,
  enFinDePagina: boolean,
  scrollY: number,
  activaActual: string,
): string {
  if (enFinDePagina && scrollY > 0) {
    const ultimaId = ordenIds.at(-1)
    if (ultimaId) return ultimaId
  }

  let activaEntreLasQueIntersectan: string | null = null
  for (const id of ordenIds) {
    if (interseccionPorId.get(id)) activaEntreLasQueIntersectan = id
  }
  return activaEntreLasQueIntersectan ?? activaActual
}
