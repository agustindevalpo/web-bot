import { IPagoService } from '@/application/services/IPagoService'
import { Plan } from '@/domain/value-objects/Plan'
import { PagoDTO } from '@/application/dtos/PagoDTO'

/**
 * Stub — el motor de pagos Devalpo (microservicio FastAPI aparte) todavía no
 * está deployado (ver docs/BITACORA.md, Tarea 1.4, bloqueada). Cuando se
 * deploye, esta clase llama a su API real (POST /v1/subscriptions,
 * GET /v1/subscriptions/{id}) usando X-API-Key.
 */
export class PaymentEngineService implements IPagoService {
  async crearSuscripcion(_clienteId: string, _plan: Plan): Promise<{ checkoutUrl: string; subscriptionId: string }> {
    throw new Error('PaymentEngineService.crearSuscripcion no implementado — Tarea 1.4 bloqueada')
  }

  async consultarSuscripcion(_subscriptionId: string): Promise<PagoDTO> {
    throw new Error('PaymentEngineService.consultarSuscripcion no implementado — Tarea 1.4 bloqueada')
  }

  async cancelarSuscripcion(_subscriptionId: string): Promise<void> {
    throw new Error('PaymentEngineService.cancelarSuscripcion no implementado — Tarea 1.4 bloqueada')
  }
}
