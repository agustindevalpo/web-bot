import { Estilo } from '@/domain/value-objects/Estilo'

// Un servicio es un nombre solo (forma legada, ya en producción) o un
// objeto con nombre + descripción opcional (rediseño de plantillas, handoff
// v2: las tres direcciones muestran una frase bajo cada servicio —
// README.md:201 ya la pedía, D-19 nunca se implementó porque el DTO no
// tenía dónde ponerla). Aditivo: ninguna fila de `Sitio` en producción trae
// el shape de objeto hoy, así que el shape legado sigue funcionando sin
// migración. Nada valida `configJson` en runtime
// (`src/app/sites/renderizarSitio.ts:18` es un cast pelado), así que una
// entrada de cualquier forma puede llegar hasta el render — se normaliza en
// el borde (`shared/servicios.ts`), no acá, mismo patrón que D-32 con el
// color.
export type ServicioDTO = string | { nombre: string; descripcion?: string }

export interface SiteConfigDTO {
  nombre: string
  rubro: string
  descripcion: string
  sobreNosotros?: string
  servicios: ServicioDTO[]
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
