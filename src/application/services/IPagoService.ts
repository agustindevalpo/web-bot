import { Plan } from '@/domain/value-objects/Plan'
import { PagoDTO } from '@/application/dtos/PagoDTO'

/**
 * Modelado contra el contrato real del motor de pagos Devalpo (microservicio
 * aparte, ver docs/BITACORA.md — Tarea 1.4), no contra un webhook simple:
 * el checkout se resuelve por redirect y el estado real siempre se confirma
 * con un GET, porque los webhooks salientes del motor no llevan firma.
 */
export interface IPagoService {
  crearSuscripcion(
    clienteId: string,
    plan: Plan
  ): Promise<{ checkoutUrl: string; subscriptionId: string }>

  consultarSuscripcion(subscriptionId: string): Promise<PagoDTO>

  cancelarSuscripcion(subscriptionId: string): Promise<void>
}
