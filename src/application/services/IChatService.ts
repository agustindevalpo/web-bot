import { MensajeDTO } from '@/application/dtos/MensajeDTO'
import { SiteConfigDTO } from '@/application/dtos/SiteConfigDTO'

export interface IChatService {
  procesarMensaje(
    historial: MensajeDTO[],
    mensajeUsuario: string
  ): Promise<string>

  extraerDatos(
    historial: MensajeDTO[]
  ): Promise<SiteConfigDTO>

  conversacionCompleta(historial: MensajeDTO[]): boolean
}
