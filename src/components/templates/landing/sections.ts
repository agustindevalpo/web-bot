import { SiteConfigDTO } from '@/application/dtos/SiteConfigDTO'
import { buildWhatsAppUrl, buildTelUrl, buildWhatsAppUrlConMensaje } from '@/components/templates/shared/enlaces'
import { nombreDeServicio, descripcionDeServicio } from '@/components/templates/shared/servicios'

// Constructores puros de props por sección del rediseño SPA (rediseño de
// plantillas, S1) — de props planas a las cuatro entradas que consume
// `filtrarSecciones` (`shared/navegacion.ts`). Ninguno hace fetch ni toca el
// DOM, todos toleran un config que solo trae `{ nombre }` (fixture del e2e,
// Hard constraint D4 heredado de la versión anterior) sin lanzar.
//
// Defensivo también contra FORMA equivocada, no solo dato ausente: no hay
// ninguna validación en runtime de `configJson`
// (`src/app/sites/renderizarSitio.ts:18` es un cast pelado), así que un
// `destacados` string en vez de array, o con objetos sin `etiqueta`, llega
// intacto hasta acá. Cada campo opcional que este archivo consume pasa por
// uno de los helpers `comoStringNoVacio`/`comoArrayDeStrings`/`comoDestacados`
// de abajo antes de usarse — nunca un `.map`/`.toUpperCase` directo sobre
// dato de cliente sin tipar en runtime.

function comoStringNoVacio(valor: unknown): string | null {
  return typeof valor === 'string' && valor.trim() !== '' ? valor : null
}

function comoArrayDeStrings(valor: unknown): string[] {
  if (!Array.isArray(valor)) return []
  return valor.filter((item): item is string => typeof item === 'string' && item.trim() !== '')
}

// Cada entrada de `servicios` puede llegar en forma legada (string) o con
// descripción propia (objeto) — ver `SiteConfigDTO.ts` `ServicioDTO`. Mismo
// criterio defensivo que `comoArrayDeStrings`/`comoDestacados`: trimea el
// nombre y descarta la entrada si queda vacío o si la forma no es
// reconocible (`nombreDeServicio`/`descripcionDeServicio` de
// `shared/servicios.ts`, que ya tratan el dato como forma no confiable y
// nunca lanzan).
type ServicioNormalizado = { nombre: string; descripcion: string | null }

function comoServicios(valor: unknown): ServicioNormalizado[] {
  if (!Array.isArray(valor)) return []
  const resultado: ServicioNormalizado[] = []
  for (const item of valor) {
    const nombreCrudo = nombreDeServicio(item)
    const nombre = typeof nombreCrudo === 'string' ? nombreCrudo.trim() : ''
    if (nombre === '') continue
    resultado.push({ nombre, descripcion: descripcionDeServicio(item) })
  }
  return resultado
}

export type Destacado = { valor: string; etiqueta: string }

function comoDestacados(valor: unknown): Destacado[] {
  if (!Array.isArray(valor)) return []
  return valor.filter((item): item is Destacado => {
    if (typeof item !== 'object' || item === null) return false
    const candidato = item as Record<string, unknown>
    return (
      typeof candidato.valor === 'string' &&
      candidato.valor.trim() !== '' &&
      typeof candidato.etiqueta === 'string' &&
      candidato.etiqueta.trim() !== ''
    )
  })
}

// Techos de la maqueta (README.md:190-207): 3 cifras en el hero, grilla de
// 5 servicios + la celda de CTA, 3 fotos en el grid asimétrico de Nosotros.
//
// Las 3 fotos salen de la aritmética del grid, no de un gusto: README.md:203
// pide «grid `1fr 1fr` × `1fr 1fr` ... con la primera celda ocupando
// `grid-row: span 2`». Dos columnas por dos filas son cuatro casillas, y la
// celda que abarca dos filas se come dos, así que quedan dos libres: una
// grande y dos chicas. Con un cuarto cupo la grilla se desborda a una tercera
// fila que la maqueta nunca tuvo, y la sección pasa a ser más alta que el
// hero — medido: 955px contra 652px del hero, antes de corregirlo.
const MAX_DESTACADOS = 3
const MAX_SERVICIOS_GRID = 5
const MAX_IMAGENES_NOSOTROS = 3

// La grilla de Servicios es de 3 columnas (Landing.module.css
// `.serviciosGrid`) y la celda de CTA es siempre la última. Con un número
// cualquiera de servicios (incluido cualquiera de los 1-5 que deja
// `MAX_SERVICIOS_GRID`), la fila final puede quedar incompleta: sin corregir
// eso, la celda vacía sobrante se pinta gris y lee como un bug de layout, no
// como espacio deliberado (defecto encontrado mirando `demo-consultora` con
// 4 servicios: 5 celdas en una grilla de 3×2 dejan la sexta gris). La
// corrección: la celda de CTA extiende su `grid-column` para absorber las
// columnas que le quedan libres en su fila — ver `ctaSpan` más abajo y su
// consumo en `index.tsx` (`gridColumn: span ${servicios.ctaSpan}`).
const COLUMNAS_GRID_SERVICIOS = 3

// Microcopy estructural del template — no es dato de cliente (como
// `ETIQUETA_SERVICIOS` ya lo era en la versión anterior), así que no pasa
// por los helpers defensivos de arriba: es texto fijo de la plantilla, igual
// que "Qué ofrecemos" ya lo era antes de este rediseño.
const ETIQUETA_SERVICIOS = 'Qué ofrecemos'
// Chrome del H2 de Nosotros (ver `buildNosotros` más abajo: ya no repite el
// nombre del negocio, que el hero ya muestra a un clic de distancia en la
// SPA).
const ETIQUETA_NOSOTROS = 'Quiénes somos'
const ETIQUETA_FOTO_HERO = 'Nuestro trabajo'
const FRASE_CTA_SERVICIOS = '¿Conversamos sobre tu proyecto?'
const TEXTO_ENLACE_CTA_SERVICIOS = 'Escríbenos →'

export type MarcaProps = { nombre: string; inicial: string }

export function buildMarca(config: SiteConfigDTO): MarcaProps {
  const nombre = comoStringNoVacio(config.nombre) ?? ''
  return { nombre, inicial: nombre.trim().charAt(0).toUpperCase() }
}

export type InicioProps = {
  rubro: string | null
  ciudad: string | null
  nombre: string
  descripcion: string | null
  whatsappUrl: string | null
  telUrl: string | null
  telefonoDisplay: string | null
  imagenHero: string | null
  etiquetaFoto: string
  highlight: string | null
  destacados: Destacado[]
}

export function buildInicio(config: SiteConfigDTO): InicioProps {
  const telefono = comoStringNoVacio(config.contacto?.telefono)
  const rubroCrudo = comoStringNoVacio(config.rubro)
  const rubro = rubroCrudo && rubroCrudo !== 'demo' ? rubroCrudo.toUpperCase() : null
  const [imagenHero] = comoArrayDeStrings(config.imagenes)

  return {
    rubro,
    ciudad: comoStringNoVacio(config.ciudad),
    nombre: config.nombre,
    descripcion: comoStringNoVacio(config.descripcion),
    whatsappUrl: telefono ? buildWhatsAppUrl(telefono) : null,
    telUrl: telefono ? buildTelUrl(telefono) : null,
    telefonoDisplay: telefono,
    imagenHero: imagenHero ?? null,
    etiquetaFoto: ETIQUETA_FOTO_HERO,
    highlight: comoStringNoVacio(config.highlight),
    destacados: comoDestacados(config.destacados).slice(0, MAX_DESTACADOS),
  }
}

// `descripcion` nace siempre ausente hoy (ningún productor del chat la
// pregunta ni la extrae, ver `SiteConfigDTO.ts`), pero el tipo la expone
// desde ya para que la celda de Servicios la pinte apenas exista.
export type ServicioItem = { numero: number; titulo: string; descripcion: string | null }

export type ServiciosProps = {
  etiqueta: string
  items: ServicioItem[]
  ctaFrase: string
  ctaEnlaceTexto: string
  whatsappUrl: string | null
  // Columnas que la celda de CTA debe extender (`grid-column: span N`) para
  // terminar de llenar su fila en la grilla de 3 columnas — nunca deja una
  // celda vacía, para cualquier cantidad de servicios. Ver el comentario de
  // `COLUMNAS_GRID_SERVICIOS` más arriba.
  ctaSpan: number
}

// Campo opcional ausente → sección ausente (regla transversal del plan): sin
// servicios utilizables, `null` esconde la pestaña entera vía
// `filtrarSecciones`. Con cero servicios la sección desaparece entera (no
// solo la grilla): no tiene sentido mostrar una celda de CTA sola sin ningún
// servicio alrededor, y es coherente con esta misma regla.
export function buildServicios(config: SiteConfigDTO): ServiciosProps | null {
  const servicios = comoServicios(config.servicios).slice(0, MAX_SERVICIOS_GRID)
  if (servicios.length === 0) return null

  const telefono = comoStringNoVacio(config.contacto?.telefono)
  const restoFila = servicios.length % COLUMNAS_GRID_SERVICIOS
  const ctaSpan = restoFila === 0 ? COLUMNAS_GRID_SERVICIOS : COLUMNAS_GRID_SERVICIOS - restoFila

  return {
    etiqueta: ETIQUETA_SERVICIOS,
    items: servicios.map((servicio, indice) => ({
      numero: indice + 1,
      titulo: servicio.nombre,
      descripcion: servicio.descripcion,
    })),
    ctaFrase: FRASE_CTA_SERVICIOS,
    ctaEnlaceTexto: TEXTO_ENLACE_CTA_SERVICIOS,
    whatsappUrl: telefono ? buildWhatsAppUrl(telefono) : null,
    ctaSpan,
  }
}

export type NosotrosProps = {
  // Chrome de sección, no dato de cliente — ver `ETIQUETA_NOSOTROS` más
  // arriba y el porqué en el comentario de `buildNosotros`.
  titulo: string
  // `null` cuando `sobreNosotros` no tiene contenido propio: la sección
  // igual puede existir (con solo fotos), pero el párrafo no se pinta. Ver
  // `buildNosotros`.
  texto: string | null
  // Longitud fija MAX_IMAGENES_NOSOTROS: `null` es un cupo vacío que el
  // template pinta con `--wb-tpl-placeholder` en vez de recortar el grid.
  imagenes: (string | null)[]
}

// La versión anterior (buildAbout, y esta misma T3 hasta que se encontró en
// navegador) caía de `sobreNosotros` a `descripcion` cuando el primero
// faltaba. Ese fallback era correcto en el long-scroll viejo, donde Inicio y
// Nosotros quedaban a miles de píxeles de distancia. En esta SPA son un solo
// clic de nav aparte: con el fallback, Nosotros repetía literalmente el
// mismo párrafo que el hero ya mostró (`descripcion`) bajo un H2 que además
// repetía el nombre del negocio del H1. Decisión: sin fallback. El párrafo
// de Nosotros solo existe cuando `sobreNosotros` tiene contenido propio, y
// el H2 deja de ser el nombre del negocio para ser chrome de sección (mismo
// patrón que `ETIQUETA_SERVICIOS`).
//
// Consecuencia: con `sobreNosotros` ausente pero fotos de galería
// presentes, la sección igual se muestra (solo fotos, sin párrafo) — el
// contenido "propio" de esta sección es sobreNosotros O imágenes, no ambos
// a la vez. Solo cuando NINGUNO de los dos existe, `null` esconde la
// sección entera (y "Nosotros" desaparece del nav vía `filtrarSecciones`).
export function buildNosotros(config: SiteConfigDTO): NosotrosProps | null {
  const texto = comoStringNoVacio(config.sobreNosotros)

  // Excluye la primera imagen (reservada para el hero de Inicio), mismo
  // criterio que la `buildGaleria` de la versión anterior.
  const disponibles = comoArrayDeStrings(config.imagenes).slice(1)
  if (!texto && disponibles.length === 0) return null

  const imagenes: (string | null)[] = Array.from(
    { length: MAX_IMAGENES_NOSOTROS },
    (_, indice) => disponibles[indice] ?? null,
  )

  return { titulo: ETIQUETA_NOSOTROS, texto, imagenes }
}

export type ContactoProps = {
  telefono: string | null
  email: string | null
  formularioHabilitado: boolean
}

// Sin `mailtoUrl`: la regla transversal del rediseño reemplaza el `mailto:`
// por un mensaje de WhatsApp armado en el cliente (ver
// `construirMensajeContacto` + `FormularioContacto.tsx`) — `telefono` es el
// único dato que ese formulario necesita del server.
export function buildContacto(config: SiteConfigDTO): ContactoProps {
  const formulario = config.contacto?.formulario
  const formularioHabilitado =
    typeof formulario === 'object' && formulario !== null && typeof formulario.habilitado === 'boolean'
      ? formulario.habilitado
      : true

  return {
    telefono: comoStringNoVacio(config.contacto?.telefono),
    email: comoStringNoVacio(config.contacto?.email),
    formularioHabilitado,
  }
}

// Compone el mensaje de WhatsApp precargado desde los 3 campos del
// formulario de Contacto (Criterio de aceptación 4). Función pura,
// testeable sin renderizar `FormularioContacto.tsx` (cliente): ese
// componente solo la llama y pasa el resultado a
// `buildWhatsAppUrlConMensaje`. Cualquier campo vacío o solo espacios se
// omite de la línea correspondiente en vez de dejar "Nombre: " colgando.
export function construirMensajeContacto(nombre: string, email: string, mensaje: string): string {
  const partes = [
    comoStringNoVacio(nombre) ? `Nombre: ${nombre.trim()}` : null,
    comoStringNoVacio(email) ? `Email: ${email.trim()}` : null,
    comoStringNoVacio(mensaje)?.trim() ?? null,
  ].filter((parte): parte is string => parte !== null)

  return partes.join('\n')
}

export function construirWhatsAppFormulario(telefono: string, nombre: string, email: string, mensaje: string): string | null {
  return buildWhatsAppUrlConMensaje(telefono, construirMensajeContacto(nombre, email, mensaje))
}

export type FooterProps = {
  nombre: string
  ciudad: string | null
  telefono: string | null
  email: string | null
}

// El footer propio de LANDING (T6) no lleva redes — el handoff
// (README.md:207) solo pide nombre, datos de contacto y crédito, a
// diferencia del `shared/Footer.tsx` que consumían las otras 3 plantillas.
export function buildFooter(config: SiteConfigDTO): FooterProps {
  return {
    nombre: config.nombre,
    ciudad: comoStringNoVacio(config.ciudad),
    telefono: comoStringNoVacio(config.contacto?.telefono),
    email: comoStringNoVacio(config.contacto?.email),
  }
}
