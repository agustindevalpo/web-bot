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
  type ResultadoDeteccion,
} from '@/infrastructure/demo/rubroDefaults'
import { RUBRO_TEMPLATES, TEMPLATE_FALLBACK } from '@/infrastructure/templates/rubroTemplates'

// Las preguntas del bot que siguen a la pregunta 1 ("¿cómo se llama tu
// negocio?"), idénticas a las que hace Claude en modo real. Esa primera
// pregunta ya la muestra ChatWidget como saludo estático antes de la primera
// llamada a la API — repetirla aquí duplicaba el saludo en la conversación.
const PREGUNTAS = [
  '¡Qué buen nombre! ¿A qué se dedica tu negocio? Cuéntame brevemente.',
  '¿Cuáles son tus principales productos o servicios? Menciona los 3 o 4 más importantes.',
  '¿En qué ciudad o zona opera tu negocio?',
  '¿Cuál es el teléfono de contacto y el email de tu negocio?',
  '¿Tienes redes sociales? (Instagram, Facebook — comparte el nombre de usuario o el link)',
  '¿Qué estilo visual prefieres para tu sitio?\n\n• Moderno y minimalista\n• Cálido y cercano\n• Colorido y llamativo',
  '¡Casi listo! ¿Hay algo especial de tu negocio que quieras destacar? (un logro, frase especial, oferta)',
]

// Etiquetas amigables para el cliente — RUBROS_CONOCIDOS son las claves
// internas ("ferreteria") que nunca se le muestran a un cliente. Se usan
// para armar la pregunta guiada de la Pieza 4, ambas cuando se ofrece la
// lista completa (puntaje 0) y cuando se ofrecen solo los candidatos
// empatados.
const RUBRO_LABELS: Record<string, string> = {
  panaderia: 'Panadería o pastelería',
  peluqueria: 'Peluquería o salón de belleza',
  dentista: 'Dentista o clínica dental',
  restaurante: 'Restaurante, café o local de comida',
  consultora: 'Consultora o asesoría (contable, tributaria, legal)',
  taller: 'Taller mecánico o automotriz',
  yoga: 'Yoga, pilates o centro de bienestar',
  ferreteria: 'Ferretería o materiales de construcción',
  veterinaria: 'Veterinaria o cuidado de mascotas',
  tienda: 'Tienda de ropa o accesorios',
}

const OPCION_NINGUNO = 'Ninguno de estos'

const MENSAJE_FINAL = '¡Perfecto! Ya tengo todo lo que necesito. Así se vería tu sitio web... 🚀'

// Cuántas respuestas hacen falta antes de poder evaluar el rubro: nombre,
// descripción y servicios (los mismos tres campos que ya usa `detectarRubro`
// hoy). Antes de eso no hay texto suficiente para decidir si hace falta la
// pregunta guiada, así que `construirScript` devuelve el guion base.
const RESPUESTAS_PARA_EVALUAR_RUBRO = 3

/**
 * Arma la pregunta guiada de rubro (Pieza 4), en el mismo tono y formato de
 * viñetas que la pregunta de estilo visual de PREGUNTAS. Ofrece los
 * candidatos empatados si los hay, o el listado completo de las 10
 * categorías cuando el matcher no encontró ninguna señal — en ambos casos
 * con la salida explícita de "ninguno de estos", porque forzar una opción
 * cuando ninguna aplica sería peor que preguntar.
 */
function construirPreguntaRubro(deteccion: ResultadoDeteccion): string {
  const candidatos = deteccion.candidatosEmpatados.length > 0 ? deteccion.candidatosEmpatados : RUBROS_CONOCIDOS
  const opciones = candidatos.map((rubro) => `• ${RUBRO_LABELS[rubro]}`).join('\n')

  return `Para elegir bien el diseño y los colores de tu sitio, ¿cuál de estas categorías describe mejor tu negocio?\n\n${opciones}\n• ${OPCION_NINGUNO}`
}

/**
 * Único punto que decide el guion de preguntas — 8 (base) o 9 (con la
 * pregunta guiada de rubro al final) — a partir de lo que el cliente ya
 * contestó. `procesarMensaje` y `conversacionCompleta` derivan los dos de
 * este mismo resultado para no poder desincronizarse entre sí (antes,
 * "8" vivía repetido en dos lugares).
 *
 * La pregunta extra va al FINAL, como una 9ª condicional, para no tocar el
 * destructuring posicional de `extraerDatos` (los primeros 8 índices de
 * `respuestas` significan siempre lo mismo). Se pregunta solo cuando el
 * matcher local no tiene con qué decidir por su cuenta: puntaje 0 (nada
 * matcheó) o empate entre rubros distintos — cualquier otro caso ya viene
 * resuelto y agregar una pregunta de más sería fricción sin necesidad.
 */
function construirScript(historial: MensajeDTO[]): string[] {
  const respuestas = historial.filter((m) => m.rol === 'user').map((m) => m.contenido)
  if (respuestas.length < RESPUESTAS_PARA_EVALUAR_RUBRO) return PREGUNTAS

  const [nombre, descripcion, serviciosTexto] = respuestas
  const deteccion = detectarRubroDetallado([nombre, descripcion, serviciosTexto].filter(Boolean).join(' '))
  const necesitaPreguntar = deteccion.hits === 0 || deteccion.candidatosEmpatados.length > 1

  return necesitaPreguntar ? [...PREGUNTAS, construirPreguntaRubro(deteccion)] : PREGUNTAS
}

function parseServicios(texto: string): string[] {
  return texto
    .split(/,|\/|;|\by\b/i)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 6)
}

function parseContacto(texto: string): { telefono: string; email: string } {
  const emailMatch = texto.match(/[\w.+-]+@[\w-]+\.[\w.-]+/)
  const email = emailMatch?.[0] ?? ''
  const telefono = texto
    .replace(email, '')
    .replace(/[^\d+ ]/g, '')
    .trim()
  return { telefono, email }
}

function parseRedes(texto: string): { instagram?: string; facebook?: string } {
  const instaMatch = texto.match(/@[\w.]+/)
  const instagram = instaMatch?.[0]
  const resto = texto.replace(instagram ?? '', '').trim()
  const facebook = resto.length > 2 && !/^no\b/i.test(resto) ? resto : undefined
  return { instagram, facebook }
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
  async procesarMensaje(historial: MensajeDTO[], _mensajeUsuario: string): Promise<string> {
    const respuestasUsuario = historial.filter((m) => m.rol === 'user').length
    const script = construirScript(historial)
    return script[respuestasUsuario] ?? MENSAJE_FINAL
  }

  /**
   * Construye el sitio con las respuestas REALES del usuario — nombre,
   * descripción, servicios, ciudad, contacto, redes, estilo y highlight
   * salen literalmente de lo que escribió en el chat (parseo de texto, no
   * IA — sigue costando $0 en tokens). Lo único que se toma "prestado" por
   * rubro detectado es lo puramente visual sin datos propios del negocio:
   * paleta de colores y fotos stock (RUBRO_DEFAULTS) más el template
   * (RUBRO_TEMPLATES, único mapa del sistema — ver Requirement "Single
   * Selection Code Path").
   */
  async extraerDatos(historial: MensajeDTO[]): Promise<SiteConfigDTO> {
    const respuestas = historial.filter((m) => m.rol === 'user').map((m) => m.contenido)
    const [nombre, descripcion, serviciosTexto, ciudad, contactoTexto, redesTexto, estiloTexto, highlight] = respuestas
    // Se lee por índice y no por destructuring posicional junto con los
    // ocho de arriba, a propósito: es condicional (Pieza 4), y solo existe
    // cuando `construirScript` agregó la 9ª pregunta.
    const respuestaRubro = respuestas[8]

    // El rubro se deduce del nombre MÁS la descripción y los servicios: es en
    // esos dos donde el cliente dice a qué se dedica ("somos un taller
    // mecánico", "clínica dental"). Mirando solo el nombre, cualquier negocio
    // que no se llamara como su rubro terminaba siempre en el mismo lugar.
    //
    // Cuando el matcher local no tuvo con qué decidir (puntaje 0 o empate),
    // `construirScript` ya agregó la pregunta guiada y `respuestaRubro` trae
    // la respuesta del cliente — esa respuesta pasa por el MISMO matcher
    // (reconoce tanto las etiquetas amigables de RUBRO_LABELS, que están
    // armadas con las mismas keywords, como "ninguno de estos", que no
    // matchea nada y cae a RUBRO_OTRO igual que un rubro no reconocido).
    const rubro =
      respuestaRubro !== undefined
        ? detectarRubro(respuestaRubro)
        : detectarRubro([nombre, descripcion, serviciosTexto].filter(Boolean).join(' '))
    const defaults = RUBRO_DEFAULTS[rubro] ?? RUBRO_DEFAULTS[RUBRO_OTRO]
    const estilo = parseEstilo(estiloTexto ?? '')

    return {
      nombre: nombre ?? '',
      rubro,
      descripcion: descripcion ?? '',
      servicios: parseServicios(serviciosTexto ?? ''),
      ciudad: ciudad ?? '',
      contacto: parseContacto(contactoTexto ?? ''),
      redes: parseRedes(redesTexto ?? ''),
      estilo,
      highlight: highlight ?? '',
      template: RUBRO_TEMPLATES[rubro] ?? TEMPLATE_FALLBACK,
      colores: resolverColores(rubro, defaults.colores, estilo),
      imagenes: defaults.imagenes,
    }
  }

  conversacionCompleta(historial: MensajeDTO[]): boolean {
    // El nombre (Q1) se contesta fuera de PREGUNTAS/construirScript (ver
    // comentario de esa constante), así que la conversación necesita esa
    // respuesta MÁS todo el guion — 8 respuestas con guion base, 9 cuando
    // construirScript agregó la pregunta guiada de rubro. Deriva del mismo
    // resultado que usa `procesarMensaje` para que ambos nunca desacuerden.
    return historial.filter((m) => m.rol === 'user').length >= construirScript(historial).length + 1
  }
}
