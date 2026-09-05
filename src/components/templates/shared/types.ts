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

// Forma de salida de cada `buildFooter` (D3, regla de tres — la misma forma
// se repite idéntica en landing/servicios/restaurante/tienda/sections.ts;
// esos builders quedan sin tocar, solo se referencia el tipo desde acá para
// que `shared/Footer.tsx` no dependa de ningún template en particular).
export type FooterProps = {
  ciudad: string | null
  telefono: string | null
  email: string | null
  instagramUrl: string | null
  instagramHandle: string | null
  facebook: string | null
}
