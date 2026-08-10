import { IClienteRepository } from '@/domain/repositories/IClienteRepository'
import { ISitioRepository } from '@/domain/repositories/ISitioRepository'
import { INotificacionService } from '@/application/services/INotificacionService'
import { ClienteNoEncontradoException } from '@/domain/exceptions/ClienteNoEncontradoException'

export class PausarSitioUseCase {
  constructor(
    private clienteRepo: IClienteRepository,
    private sitioRepo: ISitioRepository,
    private notificacionService: INotificacionService,
  ) {}

  async execute(clienteId: string): Promise<void> {
    const cliente = await this.clienteRepo.findById(clienteId)
    if (!cliente) throw new ClienteNoEncontradoException(clienteId)
    cliente.pausar()
    await this.clienteRepo.update(clienteId, { activo: false })

    const sitios = await this.sitioRepo.findByClienteId(clienteId)
    for (const sitio of sitios) {
      sitio.pausar()
      await this.sitioRepo.update(sitio.id, { activo: false })
    }

    const linkPago = `https://webbot.devalpo.cl/pagar/${clienteId}`
    await this.notificacionService.enviarPagoFallido(cliente, linkPago)
  }
}
