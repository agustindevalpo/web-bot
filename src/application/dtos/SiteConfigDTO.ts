import { Estilo } from '@/domain/value-objects/Estilo'

export interface SiteConfigDTO {
  nombre: string
  rubro: string
  descripcion: string
  sobreNosotros?: string
  servicios: string[]
  ciudad: string
  contacto: {
    telefono: string
    email: string
    formulario?: { habilitado: boolean; destinatarioEmail?: string }
  }
  redes: {
    instagram?: string
    facebook?: string
  }
  estilo: Estilo
  highlight: string
  template?: string
  subdominio?: string
  imagenes?: string[]
  colores?: {
    primario: string
    secundario: string
    acento: string
    texto: string
  }
}
