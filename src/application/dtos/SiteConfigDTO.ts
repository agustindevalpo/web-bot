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
  // D-31 (camino 3): `acento` es el único color que persiste el cliente.
  // `primario`, `secundario` y `texto` se derivan siempre en tiempo de
  // render (`src/components/templates/shared/palette.ts` +
  // `src/domain/color/paletaDerivada.ts`) y ya no se escriben acá. Una fila
  // ya existente en producción puede traer los tres campos viejos en el
  // JSON crudo; ese dato extra queda huérfano en runtime porque nada lo lee.
  colores?: {
    acento: string
  }
}
