import { Template } from '@/domain/value-objects/Template'
import { SiteConfigDTO } from '@/application/dtos/SiteConfigDTO'

export interface ITemplateService {
  seleccionarTemplate(config: SiteConfigDTO): Template
  generarConfig(template: Template, config: SiteConfigDTO): Promise<SiteConfigDTO>
}
