import { IChatService } from '@/application/services/IChatService'
import { MensajeDTO } from '@/application/dtos/MensajeDTO'
import { SiteConfigDTO } from '@/application/dtos/SiteConfigDTO'
import { Estilo } from '@/domain/value-objects/Estilo'
import { RUBRO_DEFAULTS, RUBRO_DEFAULT, detectarRubro } from '@/infrastructure/demo/rubroDefaults'

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

const MENSAJE_FINAL = '¡Perfecto! Ya tengo todo lo que necesito. Así se vería tu sitio web... 🚀'

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
    return PREGUNTAS[respuestasUsuario] ?? MENSAJE_FINAL
  }

  /**
   * Construye el sitio con las respuestas REALES del usuario — nombre,
   * descripción, servicios, ciudad, contacto, redes, estilo y highlight
   * salen literalmente de lo que escribió en el chat (parseo de texto, no
   * IA — sigue costando $0 en tokens). Lo único que se toma "prestado" por
   * rubro detectado es lo puramente visual sin datos propios del negocio:
   * template, paleta de colores y fotos stock (RUBRO_DEFAULTS).
   */
  async extraerDatos(historial: MensajeDTO[]): Promise<SiteConfigDTO> {
    const respuestas = historial.filter((m) => m.rol === 'user').map((m) => m.contenido)
    const [nombre, descripcion, serviciosTexto, ciudad, contactoTexto, redesTexto, estiloTexto, highlight] = respuestas

    const rubro = detectarRubro(nombre ?? '')
    const defaults = RUBRO_DEFAULTS[rubro] ?? RUBRO_DEFAULTS[RUBRO_DEFAULT]

    return {
      nombre: nombre ?? '',
      rubro,
      descripcion: descripcion ?? '',
      servicios: parseServicios(serviciosTexto ?? ''),
      ciudad: ciudad ?? '',
      contacto: parseContacto(contactoTexto ?? ''),
      redes: parseRedes(redesTexto ?? ''),
      estilo: parseEstilo(estiloTexto ?? ''),
      highlight: highlight ?? '',
      template: defaults.template,
      colores: defaults.colores,
      imagenes: defaults.imagenes,
    }
  }

  conversacionCompleta(historial: MensajeDTO[]): boolean {
    return historial.filter((m) => m.rol === 'user').length >= 8
  }
}
