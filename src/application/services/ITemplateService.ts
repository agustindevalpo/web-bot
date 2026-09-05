import { Template } from '@/domain/value-objects/Template'
import { SiteConfigDTO } from '@/application/dtos/SiteConfigDTO'

export interface ITemplateService {
  /** Único punto de decisión rubro→Template (WB-22 / Tarea 3.1). */
  seleccionarTemplate(config: SiteConfigDTO): Template

  /**
   * Motor de generación de contenido por template — Tarea 3.2, fuera de
   * alcance de WB-22. La implementación actual (TemplateService) lanza
   * `not_implemented`; no invocar todavía.
   */
  generarConfig(template: Template, config: SiteConfigDTO): Promise<SiteConfigDTO>
}
