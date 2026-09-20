// Normalización compartida del campo `servicios` del DTO (aditivo desde el
// rediseño de plantillas: cada entrada puede ser un string —forma legada, ya
// en producción— o un objeto `{ nombre, descripcion? }`, ver
// `SiteConfigDTO.ts`). No hay validación de runtime de `configJson`
// (`src/app/sites/renderizarSitio.ts:18` es un cast pelado), así que una
// entrada de cualquier forma —número, array, objeto sin `nombre`— puede
// llegar hasta acá: ninguna función de este archivo lanza.
//
// `nombreDeServicio` es intencionalmente mínima y NO trimea ni filtra: la
// usan los 4 templates que ya existían antes de este cambio
// (servicios/restaurante/tienda/portfolio `sections.ts`), y tienen que
// seguir renderizando idéntico a como lo hacían con `servicios: string[]`.
// Para un string de entrada devuelve el mismo string sin tocarlo — ni
// siquiera un `''` se convierte en otra cosa — así que para cualquier config
// ya en producción (puro `string[]`) el resultado es exactamente el de
// antes.
export function nombreDeServicio(item: unknown): string | null {
  if (typeof item === 'string') return item
  if (item && typeof item === 'object' && typeof (item as { nombre?: unknown }).nombre === 'string') {
    return (item as { nombre: string }).nombre
  }
  return null
}

// Solo el shape objeto tiene descripción. El shape legado (string) y
// cualquier entrada malformada devuelven `null` — nunca lanzan.
export function descripcionDeServicio(item: unknown): string | null {
  if (item && typeof item === 'object' && typeof (item as { descripcion?: unknown }).descripcion === 'string') {
    const descripcion = (item as { descripcion: string }).descripcion
    return descripcion.trim() !== '' ? descripcion : null
  }
  return null
}
