import { ISesionRepository } from '@/domain/repositories/ISesionRepository'
import { ISitioRepository } from '@/domain/repositories/ISitioRepository'
import { IClienteRepository } from '@/domain/repositories/IClienteRepository'
import { IDeployService } from '@/application/services/IDeployService'
import { INotificacionService } from '@/application/services/INotificacionService'
import { SiteConfigDTO } from '@/application/dtos/SiteConfigDTO'

export class GenerarSitioUseCase {
  constructor(
    private sesionRepo: ISesionRepository,
    private sitioRepo: ISitioRepository,
    private clienteRepo: IClienteRepository,
    private deployService: IDeployService,
    private notificacionService: INotificacionService,
  ) {}

  async execute(sessionId: string, clienteId: string): Promise<{ url: string }> {
    const sesion = await this.sesionRepo.findBySessionId(sessionId)
    if (!sesion || !sesion.completada || !sesion.datosJson) {
      throw new Error('Sesión incompleta o datos no extraídos')
    }

    const { url } = await this.deployService.deployarSitio(
      clienteId,
      sesion.datosJson as unknown as SiteConfigDTO,
    )

    const cliente = await this.clienteRepo.findById(clienteId)
    if (cliente) {
      await this.notificacionService.enviarSitioListo(cliente, url)
    }

    return { url }
  }
}
