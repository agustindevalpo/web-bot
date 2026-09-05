import { ITemplateService } from '@/application/services/ITemplateService'
import { SiteConfigDTO } from '@/application/dtos/SiteConfigDTO'
import { Template } from '@/domain/value-objects/Template'
import { RUBRO_TEMPLATES, TEMPLATE_FALLBACK } from '@/infrastructure/templates/rubroTemplates'

/**
 * Único punto de decisión rubro→Template (Requirement "Single Selection
 * Code Path"). Adaptador de infraestructura porque implementa el puerto
 * ITemplateService — la tabla vive en rubroTemplates.ts.
 */
export class TemplateService implements ITemplateService {
  seleccionarTemplate(config: SiteConfigDTO): Template {
    return RUBRO_TEMPLATES[config.rubro] ?? TEMPLATE_FALLBACK
  }

  // Tarea 3.2 (fuera de alcance de WB-22 / este cambio) — ver ITemplateService.
  async generarConfig(_template: Template, _config: SiteConfigDTO): Promise<SiteConfigDTO> {
    throw new Error('not_implemented')
  }
}
