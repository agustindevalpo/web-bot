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
//
// Handoff Bloques v2 (README "Campos del SiteConfigDTO"): el objeto gana
// `foto` (URL; imagen de la banda B del servicio) y `precioDesde` (texto
// libre, se imprime tal cual, p. ej. "Desde $25.000"). Ambos opcionales y
// leídos de forma defensiva (`shared/servicios.ts`).
export type ServicioDTO = string | { nombre: string; descripcion?: string; foto?: string; precioDesde?: string }

// Las tres tarjetas del bloque Nosotros (handoff_bloques/README.md, "Campos
// del SiteConfigDTO"; U7). Cada parte es opcional: la plantilla dibuja de 0 a
// 3 tarjetas según cuántas vengan. Orden fijo: desde, quien, distinto.
export interface SobreNosotrosPartesDTO {
  desde?: string
  quien?: string
  distinto?: string
}

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
  // URL del logo del cliente (handoff de diseño, bloque 3c — "Cuando llega
  // el logo, ocupa el mismo espacio"). Mismo patrón aditivo-opcional que
  // `destacados`: cuando el campo no viene, el header sigue mostrando el
  // monograma derivado de `nombre` (`shared/iniciales.ts` +
  // `shared/Monograma.tsx`) — nunca un hueco ni un ícono roto. A propósito,
  // NINGÚN productor lo completa todavía (no hay flujo de subida de
  // archivos en el chat ni en `/admin`): nace siempre ausente hasta que esa
  // superficie exista.
  logo?: string
  // Ancho/alto intrínsecos del logo en píxeles, leídos de la cabecera de la
  // imagen al subirla (`SubirImagenSitioUseCase`). Campo paralelo para que
  // `logo` siga siendo un string. Ausente en logos anteriores o si no se pudo
  // leer: el header cae al render de alto fijo. Un valor inválido (llegado por
  // el editor JSON) se descarta al leerlo, nunca rompe el render.
  logoDimensiones?: { ancho: number; alto: number }
  // Bloques v2 (aditivos, todos opcionales; nada los completa todavía, nacen
  // ausentes y cada plantilla degrada sin ellos). Se leen defensivamente en
  // `shared/contenido.ts` porque `configJson` no se valida en runtime.
  //
  // Tarjetas del bloque Nosotros (README "Campos del SiteConfigDTO").
  sobreNosotrosPartes?: SobreNosotrosPartesDTO
  // Autor de la cita `highlight` (C3, 00-DECISIONES-TRANSVERSALES.md). Sin
  // `nombre` no se muestra atribución.
  highlightAutor?: { nombre: string; cargo?: string }
  // Datos legales para el footer (T7): solo se muestran con razón social Y
  // RUT; nunca medio RUT.
  legal?: { razonSocial: string; rut: string }
  // Horarios para la banda de datos y el contacto (C1/T9). El tope de la
  // banda (3) es decisión de la plantilla, no del DTO.
  horarios?: { dia: string; rango: string }[]
}
