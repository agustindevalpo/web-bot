import { SiteConfigDTO } from '@/application/dtos/SiteConfigDTO'

export interface IDeployService {
  deployarSitio(clienteId: string, config: SiteConfigDTO): Promise<{ url: string; sitioId: string }>
  pausarSitio(subdominio: string): Promise<void>
  reactivarSitio(subdominio: string): Promise<void>
  verificarDNS(dominio: string): Promise<boolean>
}
