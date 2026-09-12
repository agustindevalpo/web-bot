import { ISitioRepository } from '@/domain/repositories/ISitioRepository'
import { IDeployService } from '@/application/services/IDeployService'
import { SitioNoActivoException } from '@/domain/exceptions/SitioNoActivoException'

// Superado por AsignarDominioPropioUseCase + CloudflareCustomHostnameService
// (docs/DECISIONES.md, D-12). Depende de IDeployService.verificarDNS, cuya
// única implementación (RailwayDeployService) es un stub que lanza una
// excepción. Se conserva por ahora en lugar de eliminarse, pero no es el
// camino vigente para conectar un dominio propio.
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
