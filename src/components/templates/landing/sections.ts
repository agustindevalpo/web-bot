import { SiteConfigDTO } from '@/application/dtos/SiteConfigDTO'
import { rubroVisible } from '@/components/templates/shared/rubroVisible'
import { buildWhatsAppUrl, buildTelUrl, buildWhatsAppUrlConMensaje } from '@/components/templates/shared/enlaces'
import { nombreDeServicio, descripcionDeServicio, fotoDeServicio } from '@/components/templates/shared/servicios'
import { construirNosotros, type NosotrosProps } from '@/components/templates/shared/nosotros'
import { comoHorarios, type Horario } from '@/components/templates/shared/contenido'
import { obtenerIniciales } from '@/components/templates/shared/iniciales'
import { comoDimensionesLogo, altosLogo, esLogotipo, AltosLogo, DimensionesLogo } from '@/components/templates/shared/logoOptico'

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
type ServicioNormalizado = { nombre: string; descripcion: string | null; foto: string | null }

function comoServicios(valor: unknown): ServicioNormalizado[] {
  if (!Array.isArray(valor)) return []
  const resultado: ServicioNormalizado[] = []
  for (const item of valor) {
    const nombreCrudo = nombreDeServicio(item)
    const nombre = typeof nombreCrudo === 'string' ? nombreCrudo.trim() : ''
    if (nombre === '') continue
    resultado.push({ nombre, descripcion: descripcionDeServicio(item), foto: fotoDeServicio(item) })
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

// Techo de la maqueta (README, banda de datos): 3 cifras. Los servicios no
// tienen techo: una banda por servicio, todos se muestran.
const MAX_DESTACADOS = 3

// Microcopy estructural del template — no es dato de cliente (como
// `ETIQUETA_SERVICIOS` ya lo era en la versión anterior), así que no pasa
// por los helpers defensivos de arriba: es texto fijo de la plantilla, igual
// que "Qué ofrecemos" ya lo era antes de este rediseño.
const ETIQUETA_SERVICIOS = 'Qué ofrecemos'
const TEXTO_ENLACE_SERVICIO = 'Consultar por WhatsApp'

// `iniciales` reemplaza a la vieja `inicial` (una sola letra, cuadrado con
// relleno plano — handoff bloque 3c, regla 03) por las dos iniciales del
// monograma (`shared/iniciales.ts`, regla 01). `logo` es `null` cuando
// `config.logo` está ausente o vacío — la misma decisión pura que
// `index.tsx` usa para elegir entre pintar el logo del cliente
// (`object-fit: contain`, regla 04) o el monograma derivado del nombre.
// `logoDimensiones`/`logoAltos` son `null` cuando el config no trae
// dimensiones válidas (logo subido antes de guardarlas): el template mantiene
// entonces el render de alto fijo y el nombre visible. `mostrarNombre` es false
// solo para un logotipo (proporción >= 1.6, ya trae el nombre). Ver `shared/logoOptico.ts`.
export type MarcaProps = {
  nombre: string
  iniciales: string
  logo: string | null
  logoDimensiones: DimensionesLogo | null
  logoAltos: AltosLogo | null
  mostrarNombre: boolean
}

export function buildMarca(config: SiteConfigDTO): MarcaProps {
  const nombre = comoStringNoVacio(config.nombre) ?? ''
  const logoDimensiones = comoDimensionesLogo(config.logoDimensiones)
  const logo = comoStringNoVacio(config.logo)
  return {
    nombre,
    iniciales: obtenerIniciales(nombre),
    logo,
    logoDimensiones,
    logoAltos: logoDimensiones ? altosLogo(logoDimensiones) : null,
    mostrarNombre: !(logo && logoDimensiones && esLogotipo(logoDimensiones)),
  }
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
}

export function buildInicio(config: SiteConfigDTO): InicioProps {
  const telefono = comoStringNoVacio(config.contacto?.telefono)
  const rubroCrudo = comoStringNoVacio(config.rubro)
  const rubro = rubroCrudo && rubroCrudo !== 'demo' ? rubroVisible(rubroCrudo) : null
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
  }
}

// Las cifras y la frase destacada ya no viven en el hero (Bloques): `destacados`
// pasan a la banda de datos (U5) y `highlight` a la cita del bloque Nosotros
// (U7, C3), con el mismo saneo defensivo.
export function buildDestacados(config: SiteConfigDTO): Destacado[] {
  return comoDestacados(config.destacados).slice(0, MAX_DESTACADOS)
}

export function buildHighlight(config: SiteConfigDTO): string | null {
  return comoStringNoVacio(config.highlight)
}

// Una banda por servicio (Bloques, README "Bandas de servicio"). La forma se
// decide por banda leyendo `foto`: con foto, forma B (la foto llena la celda
// visual); sin ella, forma A (el número gigante). Nunca se usa `imagenes[]`:
// una foto de banco en una banda afirma algo falso sobre ese servicio.
// `descripcion` nace ausente hoy (ningún productor del chat la pregunta).
export type ServicioBanda = {
  numero: number
  nombre: string
  descripcion: string | null
  foto: string | null
  // WhatsApp con el nombre del servicio precargado; `null` sin teléfono (la
  // banda no pinta el enlace).
  whatsappUrl: string | null
}

export type ServiciosProps = {
  etiqueta: string
  enlaceTexto: string
  bandas: ServicioBanda[]
}

// Campo opcional ausente → sección ausente (regla transversal del plan): sin
// servicios utilizables, `null` esconde la pestaña entera vía
// `filtrarSecciones`.
export function buildServicios(config: SiteConfigDTO): ServiciosProps | null {
  const servicios = comoServicios(config.servicios)
  if (servicios.length === 0) return null

  const telefono = comoStringNoVacio(config.contacto?.telefono)

  return {
    etiqueta: ETIQUETA_SERVICIOS,
    enlaceTexto: TEXTO_ENLACE_SERVICIO,
    bandas: servicios.map((servicio, indice) => ({
      numero: indice + 1,
      nombre: servicio.nombre,
      descripcion: servicio.descripcion,
      foto: servicio.foto,
      whatsappUrl: telefono ? buildWhatsAppUrlConMensaje(telefono, `Hola, quiero consultar por ${servicio.nombre}`) : null,
    })),
  }
}

// Nosotros nunca es null (T5.3): el caso base usa `nombre`, `ciudad` y
// `descripcion`, así que "Nosotros" siempre está en el nav. Las fotos de
// `imagenes[1..]` ya no se muestran acá (README: es un borrado, no una
// migración). La lógica vive en `shared/nosotros.ts` para reusarla en las
// demás plantillas; acá solo se le pasa la frase destacada (C3).
export function buildNosotros(config: SiteConfigDTO): NosotrosProps {
  return construirNosotros(config, buildHighlight(config))
}

export type ContactoProps = {
  telefono: string | null
  email: string | null
  formularioHabilitado: boolean
  horarios: Horario[]
}

// Sin `mailtoUrl`: la regla transversal del rediseño reemplaza el `mailto:`
// por un mensaje de WhatsApp armado en el cliente (ver
// `shared/contactoEnvio.ts` + `shared/FormularioContacto.tsx`) — `telefono` es
// el único dato que ese formulario necesita del server. `horarios` llega
// crudo: `ContactoDatos` lo filtra con `comoHorarios`.
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
    horarios: comoHorarios(config.horarios),
  }
}
