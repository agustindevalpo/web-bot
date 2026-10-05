// Modelo de avance del sitio de demo (S3, 03-CHAT-Y-MOMENTO-2.md, sección (i)).
//
// El porcentaje sirve para motivar, no para medir: parte de una base de 35 %
// (el chat y el paso de datos ya están hechos al llegar al reveal) y suma el
// peso completo de cada tarea del momento 2 que tenga al menos una respuesta.
// No hay porcentajes proporcionales: describir 1 de 4 servicios suma lo mismo
// que describir los 4. El 20 % restante (logo y fotos) solo existe después del
// pago, cargado por Devalpo, así que antes del pago el techo es 80 %.
//
// Módulo puro de la capa de aplicación: sin React ni Next. Lo usan el reveal,
// el momento 2 (T5) y `/admin`. `configJson` no se valida en runtime, así que
// todo se lee de forma defensiva (cualquier forma puede llegar).

export const AVANCE_BASE = 35
export const AVANCE_TECHO_ANTES_DEL_PAGO = 80

export type IdTareaMomento2 = 'servicios' | 'horarios' | 'nosotros' | 'frase'

export interface TareaMomento2 {
  id: IdTareaMomento2
  // Aporte al porcentaje cuando la tarea tiene al menos una respuesta.
  peso: number
}

export type PlantillaConAvance = 'LANDING' | 'SERVICIOS'

// Tabla de (d) con los pesos de (i). Cada plantilla suma 45 puntos de texto:
// base 35 + 45 = techo de 80. El orden es el orden de las pantallas.
export const TAREAS_POR_PLANTILLA: Record<PlantillaConAvance, readonly TareaMomento2[]> = {
  LANDING: [
    { id: 'servicios', peso: 20 },
    { id: 'nosotros', peso: 15 },
    { id: 'frase', peso: 10 },
  ],
  SERVICIOS: [
    { id: 'servicios', peso: 15 },
    { id: 'horarios', peso: 10 },
    { id: 'nosotros', peso: 10 },
    { id: 'frase', peso: 10 },
  ],
}

// RESTAURANTE, PORTFOLIO y TIENDA "como LANDING hasta su capítulo": cualquier
// plantilla que no tenga tabla propia usa la de LANDING.
export function tareasDePlantilla(plantilla: string | null | undefined): readonly TareaMomento2[] {
  return plantilla === 'SERVICIOS' ? TAREAS_POR_PLANTILLA.SERVICIOS : TAREAS_POR_PLANTILLA.LANDING
}

export type EstadoTarea = 'completa' | 'omitida' | 'pendiente'

export interface TareaConEstado extends TareaMomento2 {
  estado: EstadoTarea
}

function comoObjeto(valor: unknown): Record<string, unknown> | null {
  return valor !== null && typeof valor === 'object' && !Array.isArray(valor) ? (valor as Record<string, unknown>) : null
}

function tieneTexto(valor: unknown): boolean {
  return typeof valor === 'string' && valor.trim() !== ''
}

function algunServicioCon(servicios: unknown, campos: readonly string[]): boolean {
  if (!Array.isArray(servicios)) return false
  return servicios.some((servicio) => {
    const objeto = comoObjeto(servicio)
    return objeto !== null && campos.some((campo) => tieneTexto(objeto[campo]))
  })
}

// "Al menos una respuesta" por tarea, medida sobre lo que la plantilla
// realmente muestra: la descripción de un servicio (y su precio en SERVICIOS),
// un horario con día y rango, una parte de Nosotros o la frase del cliente (el
// autor es opcional).
function tareaRespondida(id: IdTareaMomento2, config: Record<string, unknown>, plantilla: string | null | undefined): boolean {
  switch (id) {
    case 'servicios':
      return algunServicioCon(config.servicios, plantilla === 'SERVICIOS' ? ['descripcion', 'precioDesde'] : ['descripcion'])
    case 'horarios':
      return (
        Array.isArray(config.horarios) &&
        config.horarios.some((item) => {
          const horario = comoObjeto(item)
          return horario !== null && tieneTexto(horario.dia) && tieneTexto(horario.rango)
        })
      )
    case 'nosotros': {
      const partes = comoObjeto(config.sobreNosotrosPartes)
      return partes !== null && ['desde', 'quien', 'distinto'].some((clave) => tieneTexto(partes[clave]))
    }
    case 'frase':
      return tieneTexto(config.highlight)
  }
}

function idsOmitidos(config: Record<string, unknown>): Set<string> {
  const omitidas = config.momento2Omitidas
  if (!Array.isArray(omitidas)) return new Set()
  return new Set(omitidas.filter((id): id is string => typeof id === 'string'))
}

/**
 * Estado de cada tarea del momento 2 de la plantilla, en el orden de las
 * pantallas. Una tarea con respuesta es `completa` aunque figure en
 * `momento2Omitidas` (la omitió y después la respondió); sin respuesta es
 * `omitida` si el visitante la omitió y `pendiente` si no. Omitir no suma ni
 * resta: solo cambia lo que dice el resumen ("Lo omitiste" frente a "Pendiente").
 */
export function estadoDeTareas(config: unknown, plantilla: string | null | undefined): TareaConEstado[] {
  const datos = comoObjeto(config) ?? {}
  const omitidas = idsOmitidos(datos)
  return tareasDePlantilla(plantilla).map((tarea) => ({
    ...tarea,
    estado: tareaRespondida(tarea.id, datos, plantilla) ? 'completa' : omitidas.has(tarea.id) ? 'omitida' : 'pendiente',
  }))
}

/**
 * Porcentaje de avance del sitio antes del pago: base de 35 % más el peso de
 * cada tarea completa, con techo de 80 %. Siempre un entero; nunca llega a 100.
 */
export function calcularAvance(config: unknown, plantilla: string | null | undefined): number {
  const suma = estadoDeTareas(config, plantilla).reduce((total, tarea) => total + (tarea.estado === 'completa' ? tarea.peso : 0), 0)
  return Math.min(AVANCE_BASE + suma, AVANCE_TECHO_ANTES_DEL_PAGO)
}
