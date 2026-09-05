import { Template } from '@/domain/value-objects/Template'

// Único mapa rubro→Template del sistema (ver Requirement "Single Selection
// Code Path" en spec.md, Decisión D1 en design.md). rubroDefaults.ts,
// ClaudeChatService.parseSiteConfig, DemoChatService.extraerDatos y
// prisma/seed-demo.ts leen de acá — ninguno debe hardcodear su propio mapeo.
export const RUBRO_TEMPLATES: Record<string, Template> = {
  panaderia: Template.RESTAURANTE,
  restaurante: Template.RESTAURANTE,
  peluqueria: Template.SERVICIOS,
  dentista: Template.SERVICIOS,
  yoga: Template.SERVICIOS,
  veterinaria: Template.SERVICIOS,
  ferreteria: Template.TIENDA,
  tienda: Template.TIENDA,
  consultora: Template.LANDING,
  taller: Template.PORTFOLIO,
}

// Rubro desconocido, vacío o ausente cae acá — nunca se lanza un error por
// un rubro no reconocido (ver Requirement "Unknown Rubro Defaults to LANDING").
export const TEMPLATE_FALLBACK: Template = Template.LANDING
