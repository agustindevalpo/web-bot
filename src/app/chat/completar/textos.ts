// Microcopy y reglas de presentación del momento 2 (03-CHAT-Y-MOMENTO-2.md,
// "Microcopy > Momento 2"). Funciones puras: lo testeable de las pantallas vive
// acá y los componentes solo lo dibujan.

import type { IdTareaMomento2, TareaConEstado } from '@/application/shared/avanceSitio'
import { AVANCE_TECHO_ANTES_DEL_PAGO } from '@/application/shared/avanceSitio'
import type { VistaMomento2 } from '@/application/shared/momento2'

export const TITULO_HEADER = 'Completar tu sitio'
export const HREF_VOLVER_AL_SITIO = '/chat?vista=sitio'

export const TITULO_TAREA: Record<IdTareaMomento2, string> = {
  servicios: 'Describe tus servicios',
  horarios: '¿Cuándo atiendes?',
  nosotros: 'Cuéntanos quién está detrás',
  frase: 'Una frase de un cliente',
}

export function ayudaDeTarea(id: IdTareaMomento2, template: string | null): string {
  switch (id) {
    case 'servicios':
      return template === 'SERVICIOS'
        ? 'Una línea por servicio y, si quieres, el precio desde. Lo que dejes vacío no aparece en tu sitio.'
        : 'Una línea por servicio. Lo que dejes vacío no aparece en tu sitio.'
    case 'horarios':
      return 'Escribe tus horarios tal como quieres que se lean. Hasta tres.'
    case 'nosotros':
      return 'Tres respuestas cortas. Las mostramos con tus palabras, sin cambiarlas.'
    case 'frase':
      return 'Copia un mensaje real que te haya mandado un cliente. Si no tienes uno, omite este paso: tu sitio no muestra una cita inventada.'
  }
}

// El ancla de la sección que cambió. Los horarios viven en la banda del
// inicio y en la tarjeta de Contacto; solo Contacto tiene ancla propia, y la
// frase se muestra dentro de Nosotros.
export const ANCLA_TAREA: Record<IdTareaMomento2, string> = {
  servicios: 'servicios',
  horarios: 'contacto',
  nosotros: 'nosotros',
  frase: 'nosotros',
}

export const MENSAJE_ERROR_GUARDADO = 'No pudimos guardar tus datos. Revisa tu conexión e inténtalo de nuevo.'
export const MENSAJE_HORARIO_INCOMPLETO = 'Completa los días y el horario, o deja la fila vacía.'

export function avisoGuardado(avance: number, subio: boolean): string {
  return subio ? `Guardado · tu sitio subió a ${avance} %` : `Guardado · tu sitio está al ${avance} %`
}

// Línea de lo que falta tras guardar los servicios (M2). Solo si queda alguno
// sin descripción.
export function lineaFaltante(id: IdTareaMomento2, vista: VistaMomento2): string | null {
  if (id !== 'servicios') return null
  const faltan = vista.sinDescripcion
  if (faltan.length === 0) return null
  const cierre = 'Puedes volver a este paso cuando quieras.'
  if (faltan.length === 1) return `${faltan[0]} sigue sin descripción, y en tu sitio solo se ve su nombre. ${cierre}`
  return `${faltan.length} servicios siguen sin descripción, y en tu sitio solo se ven sus nombres. ${cierre}`
}

export function tituloResumen(avance: number): string {
  return avance >= AVANCE_TECHO_ANTES_DEL_PAGO
    ? 'Completaste todo lo que se puede antes del pago'
    : `Tu sitio está al ${avance} %`
}

// Línea de detalle de una fila del resumen.
export function detalleDeTarea(tarea: TareaConEstado, vista: VistaMomento2): string | null {
  if (tarea.estado === 'omitida') return `Lo omitiste · suma ${tarea.peso} %`
  if (tarea.estado === 'pendiente') return `Pendiente · suma ${tarea.peso} %`
  if (tarea.id === 'servicios') return `${vista.serviciosTotal - vista.sinDescripcion.length} de ${vista.serviciosTotal} descritos`
  if (tarea.id === 'horarios') return vista.horarios === 1 ? '1 horario' : `${vista.horarios} horarios`
  return null
}

export function accionDeTarea(tarea: TareaConEstado): 'Editar' | 'Responder' {
  return tarea.estado === 'completa' ? 'Editar' : 'Responder'
}

export function zonasAntesala(template: string | null): string[] {
  return template === 'SERVICIOS'
    ? ['Logo', 'Foto principal', 'El lugar', '3 fotos']
    : ['Logo', 'Foto principal', 'Una foto por servicio']
}

export function textoAntesala(template: string | null, avance: number): string {
  if (avance >= AVANCE_TECHO_ANTES_DEL_PAGO) {
    return 'Nos los mandas por WhatsApp cuando pagues, y los agregamos antes de publicar.'
  }
  return template === 'SERVICIOS'
    ? 'Nos los mandas por WhatsApp cuando pagues. Mientras tanto, tu sitio usa tus iniciales y no muestra fotos del lugar.'
    : 'Nos los mandas por WhatsApp cuando pagues. Mientras tanto, tu sitio usa tus iniciales y muestra tus servicios con números grandes.'
}

// Pantalla con la que se abre el momento 2: la primera tarea que el visitante
// no respondió ni omitió; si no queda ninguna, el resumen. Así "Completar mi
// sitio" retoma donde quedó y "Editar respuestas" cae en el resumen.
export type PantallaInicial = { tipo: 'tarea'; indice: number } | { tipo: 'resumen' }

export function pantallaInicial(tareas: readonly TareaConEstado[]): PantallaInicial {
  const indice = tareas.findIndex((tarea) => tarea.estado === 'pendiente')
  return indice === -1 ? { tipo: 'resumen' } : { tipo: 'tarea', indice }
}
