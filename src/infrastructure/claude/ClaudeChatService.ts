import { IChatService } from '@/application/services/IChatService'
import { MensajeDTO } from '@/application/dtos/MensajeDTO'
import { SiteConfigDTO } from '@/application/dtos/SiteConfigDTO'

/**
 * Stub — se implementa en la Fase 2 (Tarea 2.2, agente de onboarding).
 * Requiere ANTHROPIC_API_KEY y el SDK @anthropic-ai/sdk, ninguno instalado todavía.
 */
export class ClaudeChatService implements IChatService {
  async procesarMensaje(_historial: MensajeDTO[], _mensajeUsuario: string): Promise<string> {
    throw new Error('ClaudeChatService.procesarMensaje no implementado — Fase 2')
  }

  async extraerDatos(_historial: MensajeDTO[]): Promise<SiteConfigDTO> {
    throw new Error('ClaudeChatService.extraerDatos no implementado — Fase 2')
  }

  conversacionCompleta(historial: MensajeDTO[]): boolean {
    return historial.filter((m) => m.rol === 'user').length >= 8
  }
}
