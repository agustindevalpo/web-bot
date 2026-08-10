import { IDeployService } from '@/application/services/IDeployService'
import { SiteConfigDTO } from '@/application/dtos/SiteConfigDTO'

/**
 * Stub — se implementa en la Fase 3 (deploy de sitios generados a Railway).
 */
export class RailwayDeployService implements IDeployService {
  async deployarSitio(_clienteId: string, _config: SiteConfigDTO): Promise<{ url: string; sitioId: string }> {
    throw new Error('RailwayDeployService.deployarSitio no implementado — Fase 3')
  }

  async pausarSitio(_subdominio: string): Promise<void> {
    throw new Error('RailwayDeployService.pausarSitio no implementado — Fase 3')
  }

  async reactivarSitio(_subdominio: string): Promise<void> {
    throw new Error('RailwayDeployService.reactivarSitio no implementado — Fase 3')
  }

  async verificarDNS(_dominio: string): Promise<boolean> {
    throw new Error('RailwayDeployService.verificarDNS no implementado — Fase 3')
  }
}
