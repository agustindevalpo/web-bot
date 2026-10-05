// Estado del formulario del momento 2: valores iniciales desde lo ya guardado,
// carga útil que recibe la acción y la regla de "Guardar" habilitado. Puro y
// sin React, para poder testearlo.

import type { IdTareaMomento2 } from '@/application/shared/avanceSitio'
import {
  HORARIOS_MAX,
  validarTarea,
  type ErrorTareaMomento2,
  type FilaHorario,
  type ValoresIniciales,
} from '@/application/shared/momento2'

export interface ValoresFormulario {
  // Una fila por servicio del sitio, en el mismo orden (el nombre no se edita).
  servicios: { descripcion: string; precioDesde: string }[]
  horarios: FilaHorario[]
  nosotros: { desde: string; quien: string; distinto: string }
  frase: { frase: string; autor: string; relacion: string }
}

export const HORARIO_VACIO: FilaHorario = { dia: '', rango: '' }

export function formularioInicial(iniciales: ValoresIniciales): ValoresFormulario {
  return {
    servicios: iniciales.servicios.map(({ descripcion, precioDesde }) => ({ descripcion, precioDesde })),
    // La pantalla siempre ofrece al menos una fila de horario.
    horarios: iniciales.horarios.length > 0 ? iniciales.horarios.map((fila) => ({ ...fila })) : [{ ...HORARIO_VACIO }],
    nosotros: { ...iniciales.nosotros },
    frase: { ...iniciales.frase },
  }
}

export function agregarHorario(horarios: readonly FilaHorario[]): FilaHorario[] {
  return horarios.length >= HORARIOS_MAX ? [...horarios] : [...horarios, { ...HORARIO_VACIO }]
}

export function puedeAgregarHorario(horarios: readonly FilaHorario[]): boolean {
  return horarios.length < HORARIOS_MAX
}

export function cargaDeTarea(id: IdTareaMomento2, valores: ValoresFormulario): unknown {
  switch (id) {
    case 'servicios':
      return { filas: valores.servicios }
    case 'horarios':
      return { filas: valores.horarios }
    case 'nosotros':
      return valores.nosotros
    case 'frase':
      return valores.frase
  }
}

// "Guardar" queda deshabilitado mientras la tarea no tenga ninguna respuesta
// guardable: es la misma validación que corre el servidor.
export function estadoDeGuardado(
  id: IdTareaMomento2,
  valores: ValoresFormulario,
  template: string | null,
): { puede: true } | { puede: false; error: ErrorTareaMomento2 } {
  const resultado = validarTarea(id, cargaDeTarea(id, valores), template)
  return resultado.ok ? { puede: true } : { puede: false, error: resultado.error }
}
