import { IChatService } from '@/application/services/IChatService'
import { MensajeDTO } from '@/application/dtos/MensajeDTO'
import { SiteConfigDTO } from '@/application/dtos/SiteConfigDTO'
import { Estilo } from '@/domain/value-objects/Estilo'
import {
  RUBRO_DEFAULTS,
  RUBRO_OTRO,
  RUBROS_CONOCIDOS,
  detectarRubro,
  detectarRubroDetallado,
  resolverColores,
} from '@/infrastructure/demo/rubroDefaults'
import {
  MENSAJE_FINAL,
  OPCIONES_ESTILO,
  OPCION_CONFIRMAR_RUBRO,
  OPCION_NINGUNO,
  OPCION_RECHAZAR_RUBRO,
  PREGUNTA_CATEGORIAS,
  PREGUNTA_CIUDAD,
  PREGUNTA_DESCRIPCION,
  PREGUNTA_ESTILO,
  PREGUNTA_SERVICIOS,
  RUBRO_FRASE,
  RUBRO_LABELS,
  SUGERENCIAS_SERVICIOS,
  listaDeOpciones,
} from '@/infrastructure/demo/guionChat'
import { RUBRO_TEMPLATES, TEMPLATE_FALLBACK } from '@/infrastructure/templates/rubroTemplates'

// El guion tiene seis preguntas. La 1 ("¿cómo se llama tu negocio?") ya la
// muestra ChatWidget como saludo estático antes de la primera llamada a la
// API, así que aquí solo se preguntan las que siguen. La 2 es de rubro y
// puede tomar una o dos respuestas (2a confirma lo deducido del nombre; 2b
// ofrece las categorías), por eso el guion se deriva de las respuestas y no
// es una lista posicional.
const PREGUNTAS_RESTANTES = [
  PREGUNTA_DESCRIPCION,
  PREGUNTA_SERVICIOS,
  PREGUNTA_CIUDAD,
  `${PREGUNTA_ESTILO}\n\n${listaDeOpciones(OPCIONES_ESTILO)}`,
]

function construirPreguntaConfirmacionRubro(rubro: string): string {
  return `Por el nombre, parece que es ${RUBRO_FRASE[rubro]}. ¿Es correcto?\n\n${listaDeOpciones([
    OPCION_CONFIRMAR_RUBRO,
    OPCION_RECHAZAR_RUBRO,
  ])}`
}

function construirPreguntaCategorias(): string {
  const etiquetas = RUBROS_CONOCIDOS.map((rubro) => RUBRO_LABELS[rubro])
  return `${PREGUNTA_CATEGORIAS}\n\n${listaDeOpciones([...etiquetas, OPCION_NINGUNO])}`
}

function esConfirmacion(texto: string): boolean {
  return /^s[ií](?![\p{L}])/iu.test(texto.trim())
}

type FaseRubro = { pregunta: string } | { rubro: string; respuestasConsumidas: number }

/**
 * Resuelve el rubro a partir de las respuestas dadas hasta ahora. Solo mira
 * el nombre (respuesta 0): si el matcher lo deduce sin empate, pregunta 2a;
 * si no, o si el cliente responde otra cosa que "Sí, es correcto", pregunta
 * 2b con las categorías. Devuelve la pregunta pendiente o el rubro resuelto
 * junto con cuántas respuestas ocupó la fase (2 o 3 contando el nombre).
 */
function resolverFaseRubro(respuestas: string[]): FaseRubro {
  const deteccion = detectarRubroDetallado(respuestas[0] ?? '')
  const deducido = deteccion.hits > 0 && deteccion.candidatosEmpatados.length === 0 ? deteccion.rubro : null

  let indiceCategoria = 1
  if (deducido) {
    if (respuestas.length < 2) return { pregunta: construirPreguntaConfirmacionRubro(deducido) }
    if (esConfirmacion(respuestas[1])) return { rubro: deducido, respuestasConsumidas: 2 }
    indiceCategoria = 2
  }

  if (respuestas.length <= indiceCategoria) return { pregunta: construirPreguntaCategorias() }
  // La etiqueta elegida pasa por el mismo matcher: "Ninguno de estos" no
  // matchea nada y cae a RUBRO_OTRO, igual que un rubro no reconocido.
  return { rubro: detectarRubro(respuestas[indiceCategoria]), respuestasConsumidas: indiceCategoria + 1 }
}

/**
 * Única fuente del guion: dadas todas las respuestas del usuario (incluida la
 * actual), devuelve la siguiente pregunta, o null si ya está todo.
 * `procesarMensaje` y `conversacionCompleta` derivan de aquí para no poder
 * desincronizarse.
 */
function siguientePregunta(respuestas: string[]): string | null {
  const fase = resolverFaseRubro(respuestas)
  if ('pregunta' in fase) return fase.pregunta

  const restantes = respuestas.length - fase.respuestasConsumidas
  return PREGUNTAS_RESTANTES[restantes] ?? null
}

function respuestasDeUsuario(historial: MensajeDTO[]): string[] {
  return historial.filter((m) => m.rol === 'user').map((m) => m.contenido)
}

/**
 * Sugerencias de servicios para la pregunta 4, según el rubro que ya resolvió
 * la conversación. Vacío mientras el rubro no está resuelto o si es "otro".
 * Es solo apoyo de interfaz: el parser no las lee.
 */
export function sugerenciasServicios(historial: MensajeDTO[]): readonly string[] {
  const respuestas = respuestasDeUsuario(historial)
  if (respuestas.length === 0) return []
  const fase = resolverFaseRubro(respuestas)
  if ('pregunta' in fase) return []
  return SUGERENCIAS_SERVICIOS[fase.rubro] ?? []
}

function parseServicios(texto: string): string[] {
  return texto
    .split(/,|\/|;|\by\b/i)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 6)
}

function parseEstilo(texto: string): Estilo {
  const t = texto.toLowerCase()
  if (t.includes('calid') || t.includes('cálid') || t.includes('cercano')) return Estilo.CALIDO
  if (t.includes('colorido') || t.includes('llamativo')) return Estilo.COLORIDO
  return Estilo.MODERNO
}

/**
 * Modo demo: guion fijo, cero llamadas a Claude, cero tokens consumidos.
 * Ver docs/WEBBOT_DEMO_MODE.md — se usa para cualquier visitante sin
 * suscripción activa, para poder mostrar el producto sin costo variable.
 */
export class DemoChatService implements IChatService {
  async procesarMensaje(historial: MensajeDTO[], mensajeUsuario: string): Promise<string> {
    const respuestas = [...respuestasDeUsuario(historial), mensajeUsuario]
    return siguientePregunta(respuestas) ?? MENSAJE_FINAL
  }

  /**
   * Construye el sitio con las respuestas REALES del usuario — nombre,
   * descripción, servicios, ciudad y estilo salen literalmente de lo que
   * escribió en el chat (parseo de texto, no IA — sigue costando $0 en
   * tokens). El teléfono ya no se pregunta aquí: `contacto`, `redes` y
   * `highlight` salen vacíos y se completan después (el teléfono llega con
   * el paso de datos). Lo único que se toma "prestado" por rubro es lo
   * puramente visual sin datos propios del negocio: paleta de colores y
   * fotos stock (RUBRO_DEFAULTS) más el template (RUBRO_TEMPLATES, único mapa
   * del sistema — ver Requirement "Single Selection Code Path").
   */
  async extraerDatos(historial: MensajeDTO[]): Promise<SiteConfigDTO> {
    const respuestas = respuestasDeUsuario(historial)
    const fase = resolverFaseRubro(respuestas)
    // Con el guion incompleto (reintentos o historiales parciales) el rubro
    // se deduce del nombre; sin match cae a RUBRO_OTRO.
    const rubro = 'rubro' in fase ? fase.rubro : detectarRubro(respuestas[0] ?? '')
    const consumidas = 'rubro' in fase ? fase.respuestasConsumidas : respuestas.length
    const [descripcion, serviciosTexto, ciudad, estiloTexto] = respuestas.slice(consumidas)

    const defaults = RUBRO_DEFAULTS[rubro] ?? RUBRO_DEFAULTS[RUBRO_OTRO]
    const estilo = parseEstilo(estiloTexto ?? '')

    return {
      nombre: respuestas[0] ?? '',
      rubro,
      descripcion: descripcion ?? '',
      servicios: parseServicios(serviciosTexto ?? ''),
      ciudad: ciudad ?? '',
      contacto: { telefono: '', email: '' },
      redes: {},
      estilo,
      highlight: '',
      template: RUBRO_TEMPLATES[rubro] ?? TEMPLATE_FALLBACK,
      colores: resolverColores(rubro, defaults.colores, estilo),
      imagenes: defaults.imagenes,
    }
  }

  conversacionCompleta(historial: MensajeDTO[]): boolean {
    const respuestas = respuestasDeUsuario(historial)
    return respuestas.length > 0 && siguientePregunta(respuestas) === null
  }
}
