import { IClienteRepository } from '@/domain/repositories/IClienteRepository'
import { ISitioRepository } from '@/domain/repositories/ISitioRepository'
import { INotificacionService } from '@/application/services/INotificacionService'
import { ClienteNoEncontradoException } from '@/domain/exceptions/ClienteNoEncontradoException'

export class ReactivarSitioUseCase {
  constructor(
    private clienteRepo: IClienteRepository,
    private sitioRepo: ISitioRepository,
    private notificacionService: INotificacionService,
  ) {}

  async execute(clienteId: string): Promise<void> {
    const cliente = await this.clienteRepo.findById(clienteId)
    if (!cliente) throw new ClienteNoEncontradoException(clienteId)
    cliente.activar()
    await this.clienteRepo.update(clienteId, {
      activo: true,
      fechaPago: cliente.fechaPago,
    })

    const sitios = await this.sitioRepo.findByClienteId(clienteId)
    for (const sitio of sitios) {
      sitio.reactivar()
      await this.sitioRepo.update(sitio.id, { activo: true })
    }

    const sitioPrincipal = sitios[0]
    if (sitioPrincipal) {
      const url = sitioPrincipal.dominioPropio ?? `https://${sitioPrincipal.subdominio}.sitios.devalpo.cl`
      await this.notificacionService.enviarSitioListo(cliente, url)
    }
  }
}
