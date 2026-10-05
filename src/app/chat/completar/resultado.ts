import type { VistaMomento2 } from '@/application/shared/momento2'

// Códigos de error que la acción devuelve al formulario. Los de validación
// vienen de `validarTarea`; el resto son estados del momento 2.
export type ErrorGuardado =
  | 'sesion_vencida'
  | 'cerrado'
  | 'tarea_invalida'
  | 'valores_invalidos'
  | 'vacia'
  | 'demasiado_largo'
  | 'horario_incompleto'
  | 'error'

export type ResultadoGuardado =
  | { ok: true; subdominio: string; vista: VistaMomento2 }
  | { ok: false; error: ErrorGuardado }

const ERRORES_DE_VALIDACION: readonly ErrorGuardado[] = [
  'tarea_invalida',
  'valores_invalidos',
  'vacia',
  'demasiado_largo',
  'horario_incompleto',
]

export function errorDeValidacion(codigo: string): ErrorGuardado {
  return (ERRORES_DE_VALIDACION as readonly string[]).includes(codigo) ? (codigo as ErrorGuardado) : 'error'
}
