// El momento 2 no se puede abrir ni escribir: la sesión no tiene un sitio de
// demo (sin cookie, sesión desconocida o sitio inexistente) o Devalpo ya
// confirmó el pago y el sitio dejó de ser del cliente demo.
export type MotivoMomento2NoDisponible = 'sesion_vencida' | 'cerrado'

export class Momento2NoDisponibleException extends Error {
  constructor(public readonly motivo: MotivoMomento2NoDisponible) {
    super(motivo === 'cerrado' ? 'El momento 2 ya está cerrado.' : 'No se encontró el sitio de prueba de esta sesión.')
    this.name = 'Momento2NoDisponibleException'
  }
}
