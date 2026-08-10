import { ISitioRepository } from '@/domain/repositories/ISitioRepository'
import { IDeployService } from '@/application/services/IDeployService'
import { SitioNoActivoException } from '@/domain/exceptions/SitioNoActivoException'

export class VerificarDominioUseCase {
  constructor(
    private sitioRepo: ISitioRepository,
    private deployService: IDeployService,
  ) {}

  async execute(subdominio: string, dominio: string): Promise<{ verificado: boolean }> {
    const sitio = await this.sitioRepo.findBySubdominio(subdominio)
    if (!sitio || !sitio.estaActivo()) throw new SitioNoActivoException(subdominio)

    const verificado = await this.deployService.verificarDNS(dominio)
    if (verificado) {
      sitio.conectarDominio(dominio)
      await this.sitioRepo.update(sitio.id, { dominioPropio: dominio })
    }

    return { verificado }
  }
}
