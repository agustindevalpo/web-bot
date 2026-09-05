import type { ReactElement } from 'react'
import { SiteConfigDTO } from '@/application/dtos/SiteConfigDTO'

// Tipos puros compartidos por los 5 templates y el registry (Decisión D2/D3
// en design.md). Sin lógica — solo forma.

export type TemplateProps = { config: SiteConfigDTO }

export type TemplateComponent = (p: TemplateProps) => ReactElement | Promise<ReactElement>

export type ContactoProps = {
  telefono: string | null
  email: string | null
  // default true cuando config.contacto.formulario está ausente (D5)
  formularioHabilitado: boolean
  // formulario.destinatarioEmail ?? contacto.email — dirección real usada por el mailto:
  destinatarioEmail: string | null
}
