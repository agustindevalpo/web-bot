// Momento 2 (S3, 03-CHAT-Y-MOMENTO-2.md): validación de lo que el visitante
// escribe en cada tarea, merge defensivo en `configJson` y la vista (avance,
// estado por tarea, detalles del resumen) que usan la pantalla y la acción.
//
// Módulo puro de la capa de aplicación: sin React, sin Next, sin repositorios.
// `configJson` no se valida en runtime, así que todo se lee de forma defensiva
// y cada tarea escribe solo las claves que le pertenecen.

import {
  calcularAvance,
  estadoDeTareas,
  tareasDePlantilla,
  type IdTareaMomento2,
  type TareaConEstado,
} from '@/application/shared/avanceSitio'

// Largos máximos de la tabla "Largos máximos" de la spec. El campo del
// formulario deja de aceptar texto al llegar al máximo; el servidor rechaza
// lo que llegue más largo (un cliente que no sea el formulario).
export const LIMITES_MOMENTO2 = {
  descripcion: 90,
  precioDesde: 20,
  dia: 30,
  rango: 30,
  microPregunta: 80,
  frase: 160,
  autor: 40,
  relacion: 40,
} as const

export const HORARIOS_MAX = 3

export type ErrorTareaMomento2 =
  | 'tarea_invalida'
  | 'valores_invalidos'
  | 'vacia'
  | 'demasiado_largo'
  | 'horario_incompleto'

export interface FilaServicio {
  descripcion: string
  // null: la plantilla no pide precio (LANDING); esa clave no se toca.
  precioDesde: string | null
}

export interface FilaHorario {
  dia: string
  rango: string
}

export type DatosTarea =
  | { tarea: 'servicios'; filas: FilaServicio[] }
  | { tarea: 'horarios'; filas: FilaHorario[] }
  | { tarea: 'nosotros'; desde: string; quien: string; distinto: string }
  | { tarea: 'frase'; frase: string; autor: string; relacion: string }

export type ResultadoValidacion = { ok: true; datos: DatosTarea } | { ok: false; error: ErrorTareaMomento2 }

const MAX_FILAS_SERVICIOS = 50

const ID_TAREAS: readonly IdTareaMomento2[] = ['servicios', 'horarios', 'nosotros', 'frase']

export function esIdTarea(valor: unknown): valor is IdTareaMomento2 {
  return typeof valor === 'string' && (ID_TAREAS as readonly string[]).includes(valor)
}

// La tarea existe y es una de las que pide la plantilla (LANDING no tiene
// horarios).
export function tareaPerteneceAPlantilla(id: unknown, plantilla: string | null | undefined): id is IdTareaMomento2 {
  return esIdTarea(id) && tareasDePlantilla(plantilla).some((tarea) => tarea.id === id)
}

function comoObjeto(valor: unknown): Record<string, unknown> | null {
  return valor !== null && typeof valor === 'object' && !Array.isArray(valor) ? (valor as Record<string, unknown>) : null
}

class ValoresInvalidos extends Error {
  constructor(public readonly error: ErrorTareaMomento2) {
    super(error)
  }
}

// Un campo de texto de una sola línea: sin caracteres de control, espacios
// internos colapsados y recortado. Ausente equivale a vacío; otro tipo es
// inválido.
function texto(valor: unknown, maximo: number): string {
  if (valor === undefined || valor === null) return ''
  if (typeof valor !== 'string') throw new ValoresInvalidos('valores_invalidos')
  const limpio = valor.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim()
  if (limpio.length > maximo) throw new ValoresInvalidos('demasiado_largo')
  return limpio
}

function validarServicios(valores: Record<string, unknown>, plantilla: string | null | undefined): DatosTarea {
  if (!Array.isArray(valores.filas) || valores.filas.length > MAX_FILAS_SERVICIOS) {
    throw new ValoresInvalidos('valores_invalidos')
  }
  const conPrecio = plantilla === 'SERVICIOS'
  const filas = valores.filas.map((fila): FilaServicio => {
    const objeto = comoObjeto(fila)
    if (!objeto) throw new ValoresInvalidos('valores_invalidos')
    return {
      descripcion: texto(objeto.descripcion, LIMITES_MOMENTO2.descripcion),
      precioDesde: conPrecio ? texto(objeto.precioDesde, LIMITES_MOMENTO2.precioDesde) : null,
    }
  })
  return { tarea: 'servicios', filas }
}

function validarHorarios(valores: Record<string, unknown>): DatosTarea {
  if (!Array.isArray(valores.filas) || valores.filas.length > HORARIOS_MAX) {
    throw new ValoresInvalidos('valores_invalidos')
  }
  const filas: FilaHorario[] = []
  for (const fila of valores.filas) {
    const objeto = comoObjeto(fila)
    if (!objeto) throw new ValoresInvalidos('valores_invalidos')
    const dia = texto(objeto.dia, LIMITES_MOMENTO2.dia)
    const rango = texto(objeto.rango, LIMITES_MOMENTO2.rango)
    if (!dia && !rango) continue
    // Un horario a medias no se puede mostrar: la plantilla pide los dos.
    if (!dia || !rango) throw new ValoresInvalidos('horario_incompleto')
    filas.push({ dia, rango })
  }
  return { tarea: 'horarios', filas }
}

function validarNosotros(valores: Record<string, unknown>): DatosTarea {
  return {
    tarea: 'nosotros',
    desde: texto(valores.desde, LIMITES_MOMENTO2.microPregunta),
    quien: texto(valores.quien, LIMITES_MOMENTO2.microPregunta),
    distinto: texto(valores.distinto, LIMITES_MOMENTO2.microPregunta),
  }
}

function validarFrase(valores: Record<string, unknown>): DatosTarea {
  return {
    tarea: 'frase',
    frase: texto(valores.frase, LIMITES_MOMENTO2.frase),
    autor: texto(valores.autor, LIMITES_MOMENTO2.autor),
    relacion: texto(valores.relacion, LIMITES_MOMENTO2.relacion),
  }
}

// Una tarea sin respuesta no se guarda: la única salida es "Omitir". Es la
// misma regla con la que `calcularAvance` cuenta la tarea.
export function tieneRespuesta(datos: DatosTarea): boolean {
  switch (datos.tarea) {
    case 'servicios':
      return datos.filas.some((fila) => fila.descripcion !== '' || (fila.precioDesde ?? '') !== '')
    case 'horarios':
      return datos.filas.length > 0
    case 'nosotros':
      return datos.desde !== '' || datos.quien !== '' || datos.distinto !== ''
    case 'frase':
      return datos.frase !== ''
  }
}

/**
 * Valida y normaliza lo que llegó del cliente para una tarea. `valores` es
 * `unknown` a propósito: viene de una acción de servidor, alcanzable con
 * cualquier POST.
 */
export function validarTarea(tarea: unknown, valores: unknown, plantilla: string | null | undefined): ResultadoValidacion {
  if (!tareaPerteneceAPlantilla(tarea, plantilla)) return { ok: false, error: 'tarea_invalida' }
  const objeto = comoObjeto(valores)
  if (!objeto) return { ok: false, error: 'valores_invalidos' }

  try {
    let datos: DatosTarea
    switch (tarea) {
      case 'servicios':
        datos = validarServicios(objeto, plantilla)
        break
      case 'horarios':
        datos = validarHorarios(objeto)
        break
      case 'nosotros':
        datos = validarNosotros(objeto)
        break
      case 'frase':
        datos = validarFrase(objeto)
        break
    }
    return tieneRespuesta(datos) ? { ok: true, datos } : { ok: false, error: 'vacia' }
  } catch (error) {
    if (error instanceof ValoresInvalidos) return { ok: false, error: error.error }
    throw error
  }
}

// ── Merge defensivo ──

// Pone o quita una clave según el texto: vacío quita solo esa clave.
function conClave(objeto: Record<string, unknown>, clave: string, valor: string): Record<string, unknown> {
  const resto = { ...objeto }
  if (valor) resto[clave] = valor
  else delete resto[clave]
  return resto
}

// Las filas se emparejan con `config.servicios` por posición: el nombre no es
// editable, así que la fila i es siempre el servicio i.
function aplicarServicios(config: Record<string, unknown>, filas: FilaServicio[]): Record<string, unknown> {
  if (!Array.isArray(config.servicios)) return config

  const servicios = config.servicios.map((servicio: unknown, indice) => {
    const fila = filas[indice]
    if (!fila) return servicio
    const original = comoObjeto(servicio)
    if (typeof servicio !== 'string' && !original) return servicio

    let objeto: Record<string, unknown> = original ? { ...original } : { nombre: servicio }
    objeto = conClave(objeto, 'descripcion', fila.descripcion)
    if (fila.precioDesde !== null) objeto = conClave(objeto, 'precioDesde', fila.precioDesde)

    // Un servicio que era solo un nombre y sigue sin datos vuelve a su forma
    // legada, sin dejar un objeto de más.
    return typeof servicio === 'string' && Object.keys(objeto).length === 1 ? servicio : objeto
  })
  return { ...config, servicios }
}

function aplicarNosotros(config: Record<string, unknown>, datos: Extract<DatosTarea, { tarea: 'nosotros' }>) {
  let partes = comoObjeto(config.sobreNosotrosPartes) ?? {}
  partes = conClave(partes, 'desde', datos.desde)
  partes = conClave(partes, 'quien', datos.quien)
  partes = conClave(partes, 'distinto', datos.distinto)
  return { ...config, sobreNosotrosPartes: partes }
}

function aplicarFrase(config: Record<string, unknown>, datos: Extract<DatosTarea, { tarea: 'frase' }>) {
  const resultado: Record<string, unknown> = { ...config, highlight: datos.frase }
  // Sin nombre no hay atribución (el DTO exige `nombre`); la relación sola no
  // se guarda.
  if (datos.autor) {
    const actual = comoObjeto(config.highlightAutor) ?? {}
    resultado.highlightAutor = conClave({ ...actual, nombre: datos.autor }, 'cargo', datos.relacion)
  } else {
    delete resultado.highlightAutor
  }
  return resultado
}

/**
 * Escribe en `config` las respuestas de UNA tarea y devuelve una copia. Solo
 * toca las claves de esa tarea; `servicios[].nombre`, `foto`, `contacto`,
 * `destacados`, etc. quedan como estaban.
 */
export function aplicarTarea(config: Record<string, unknown>, datos: DatosTarea): Record<string, unknown> {
  switch (datos.tarea) {
    case 'servicios':
      return aplicarServicios(config, datos.filas)
    case 'horarios':
      return { ...config, horarios: datos.filas }
    case 'nosotros':
      return aplicarNosotros(config, datos)
    case 'frase':
      return aplicarFrase(config, datos)
  }
}

/**
 * Registra la tarea como omitida, sin guardar ni borrar nada más. Idempotente:
 * omitir dos veces deja un solo id (y devuelve el mismo objeto).
 */
export function omitirTarea(config: Record<string, unknown>, tarea: IdTareaMomento2): Record<string, unknown> {
  const actuales = Array.isArray(config.momento2Omitidas)
    ? config.momento2Omitidas.filter((id): id is string => typeof id === 'string')
    : []
  if (actuales.includes(tarea)) return config
  return { ...config, momento2Omitidas: [...actuales, tarea] }
}

// ── Lectura para la pantalla ──

export interface ServicioEditable {
  nombre: string
  descripcion: string
  precioDesde: string
}

export interface ValoresIniciales {
  servicios: ServicioEditable[]
  horarios: FilaHorario[]
  nosotros: { desde: string; quien: string; distinto: string }
  frase: { frase: string; autor: string; relacion: string }
}

function textoDe(valor: unknown): string {
  return typeof valor === 'string' ? valor.trim() : ''
}

// Un elemento por entrada de `config.servicios`, en el mismo orden, para que
// la fila i de la pantalla sea el servicio i de `aplicarServicios`.
function serviciosEditables(config: Record<string, unknown>): ServicioEditable[] {
  if (!Array.isArray(config.servicios)) return []
  return config.servicios.map((servicio: unknown): ServicioEditable => {
    if (typeof servicio === 'string') return { nombre: servicio.trim(), descripcion: '', precioDesde: '' }
    const objeto = comoObjeto(servicio)
    return {
      nombre: textoDe(objeto?.nombre),
      descripcion: textoDe(objeto?.descripcion),
      precioDesde: textoDe(objeto?.precioDesde),
    }
  })
}

export function valoresIniciales(config: unknown): ValoresIniciales {
  const datos = comoObjeto(config) ?? {}
  const partes = comoObjeto(datos.sobreNosotrosPartes) ?? {}
  const autor = comoObjeto(datos.highlightAutor) ?? {}
  const horarios = Array.isArray(datos.horarios) ? datos.horarios : []

  return {
    servicios: serviciosEditables(datos),
    horarios: horarios.slice(0, HORARIOS_MAX).flatMap((item): FilaHorario[] => {
      const horario = comoObjeto(item)
      return horario ? [{ dia: textoDe(horario.dia), rango: textoDe(horario.rango) }] : []
    }),
    nosotros: { desde: textoDe(partes.desde), quien: textoDe(partes.quien), distinto: textoDe(partes.distinto) },
    frase: { frase: textoDe(datos.highlight), autor: textoDe(autor.nombre), relacion: textoDe(autor.cargo) },
  }
}

export interface VistaMomento2 {
  avance: number
  tareas: TareaConEstado[]
  // Para "{k} de {n} descritos" y la línea de lo que falta.
  serviciosTotal: number
  sinDescripcion: string[]
  horarios: number
}

export function construirVistaMomento2(config: unknown, plantilla: string | null | undefined): VistaMomento2 {
  const datos = comoObjeto(config) ?? {}
  const iniciales = valoresIniciales(datos)
  const nombrados = iniciales.servicios.filter((servicio) => servicio.nombre !== '')
  return {
    avance: calcularAvance(datos, plantilla),
    tareas: estadoDeTareas(datos, plantilla),
    serviciosTotal: nombrados.length,
    sinDescripcion: nombrados.filter((servicio) => servicio.descripcion === '').map((servicio) => servicio.nombre),
    horarios: iniciales.horarios.filter((fila) => fila.dia !== '' && fila.rango !== '').length,
  }
}
