import { INotificacionService } from '@/application/services/INotificacionService'
import { Cliente } from '@/domain/entities/Cliente'

/**
 * Stub — canal de notificaciones (WhatsApp u otro) todavía no definido.
 */
export class WhatsAppNotificacionService implements INotificacionService {
  async enviarBienvenida(_cliente: Cliente, _urlSitio: string): Promise<void> {
    throw new Error('WhatsAppNotificacionService.enviarBienvenida no implementado')
  }

  async enviarSitioListo(_cliente: Cliente, _urlSitio: string): Promise<void> {
    throw new Error('WhatsAppNotificacionService.enviarSitioListo no implementado')
  }

  async enviarAvisoVencimiento(_cliente: Cliente, _diasRestantes: number): Promise<void> {
    throw new Error('WhatsAppNotificacionService.enviarAvisoVencimiento no implementado')
  }

  async enviarPagoFallido(_cliente: Cliente, _linkPago: string): Promise<void> {
    throw new Error('WhatsAppNotificacionService.enviarPagoFallido no implementado')
  }
}
