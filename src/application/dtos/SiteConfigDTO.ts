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
  // Fila de 3 cifras destacadas del hero de LANDING (handoff de diseño,
  // rediseño de plantillas S1). Mismo patrón aditivo-opcional que
  // `sobreNosotros`: cuando el campo no viene, la fila simplemente no se
  // renderiza — no se inventan valores. A propósito, el productor del chat
  // (ClaudeChatService.parseSiteConfig, DemoChatService.extraerDatos) NO
  // pregunta ni completa este campo todavía: queda fuera de este slice, así
  // que en la práctica hoy nace siempre ausente.
  destacados?: { valor: string; etiqueta: string }[]
}
