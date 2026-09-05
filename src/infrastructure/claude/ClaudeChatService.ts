import Anthropic from '@anthropic-ai/sdk'
import { IChatService } from '@/application/services/IChatService'
import { MensajeDTO } from '@/application/dtos/MensajeDTO'
import { SiteConfigDTO } from '@/application/dtos/SiteConfigDTO'
import { Estilo } from '@/domain/value-objects/Estilo'
import { RUBRO_DEFAULTS } from '@/infrastructure/demo/rubroDefaults'
import { TemplateService } from '@/infrastructure/templates/TemplateService'
import { ClaudeServiceError } from './claudeErrors'

const templateService = new TemplateService()

// Las 10 categorías de negocio soportadas por RUBRO_DEFAULTS (ver
// rubroDefaults.ts) más "otro" como catch-all cuando Claude devuelve un
// rubro que no reconocemos — nunca dejamos pasar un rubro arbitrario porque
// determina el template/colores/fotos por defecto del sitio.
const RUBROS_VALIDOS = [
  'panaderia',
  'peluqueria',
  'dentista',
  'restaurante',
  'consultora',
  'taller',
  'yoga',
  'ferreteria',
  'veterinaria',
  'tienda',
  'otro',
] as const

const RUBRO_VISUAL_FALLBACK = 'panaderia'

const ESTILOS_VALIDOS: readonly string[] = Object.values(Estilo)

function normalizarRubro(valor: unknown): string {
  const texto = typeof valor === 'string' ? valor.trim().toLowerCase() : ''
  return (RUBROS_VALIDOS as readonly string[]).includes(texto) ? texto : 'otro'
}

function normalizarEstilo(valor: unknown): Estilo {
  const texto = typeof valor === 'string' ? valor.trim().toLowerCase() : ''
  return ESTILOS_VALIDOS.includes(texto) ? (texto as Estilo) : Estilo.MODERNO
}

function normalizarRedes(valor: unknown): { instagram?: string; facebook?: string } {
  const redes = (valor ?? {}) as Record<string, unknown>
  const instagram = typeof redes.instagram === 'string' ? redes.instagram : undefined
  const facebook = typeof redes.facebook === 'string' ? redes.facebook : undefined
  return { instagram, facebook }
}

function normalizarServicios(valor: unknown): string[] {
  if (!Array.isArray(valor)) return []
  return valor.filter((s): s is string => typeof s === 'string')
}

function normalizarSobreNosotros(valor: unknown): string {
  return typeof valor === 'string' ? valor : ''
}

// Nunca fabrica el campo: solo lo emite cuando el raw trae `habilitado`
// boolean explícito (ver Requirement "Optional About and Contact-Form
// Fields" — el default "form habilitado" lo aplica el template al renderizar,
// no esta normalización).
function normalizarFormulario(valor: unknown): { habilitado: boolean; destinatarioEmail?: string } | undefined {
  const raw = (valor ?? {}) as Record<string, unknown>
  if (typeof raw.habilitado !== 'boolean') return undefined

  const destinatarioEmail = typeof raw.destinatarioEmail === 'string' ? raw.destinatarioEmail : undefined
  return destinatarioEmail ? { habilitado: raw.habilitado, destinatarioEmail } : { habilitado: raw.habilitado }
}

const MODELO_DEFAULT = 'claude-sonnet-4-6'
const RAW_TEXT_LOG_LIMIT = 500

const FENCE_REGEX = /^```(?:json)?\s*([\s\S]*?)\s*```$/
const JSON_SLICE_REGEX = /\{[\s\S]*\}/

/**
 * Parsea y normaliza la respuesta de texto de Claude a un SiteConfigDTO.
 * Función pura — sin llamadas de red, fácil de testear directamente.
 * Estrategia (ver design.md):
 *   1. trim() + strip de fence markdown
 *   2. JSON.parse
 *   3. fallback: slice del primer { al último }
 *   4. si todo falla, throw claude_extraction_failed (texto crudo logueado
 *      server-side, truncado a 500 chars — nunca expuesto al cliente)
 */
export function parseSiteConfig(textoCrudo: string): SiteConfigDTO {
  const texto = textoCrudo.trim()
  const sinFence = FENCE_REGEX.exec(texto)?.[1] ?? texto

  let parsed: unknown
  try {
    parsed = JSON.parse(sinFence)
  } catch {
    const slice = JSON_SLICE_REGEX.exec(sinFence)?.[0]
    if (slice) {
      try {
        parsed = JSON.parse(slice)
      } catch {
        parsed = undefined
      }
    }
  }

  if (parsed === undefined || parsed === null || typeof parsed !== 'object') {
    logExtraccionFallida(textoCrudo)
    throw extraccionFallidaError()
  }

  const raw = parsed as Record<string, unknown>
  const nombre = typeof raw.nombre === 'string' ? raw.nombre.trim() : ''
  const rubro = normalizarRubro(raw.rubro)
  const rubroCrudo = typeof raw.rubro === 'string' ? raw.rubro.trim() : ''

  if (!nombre || !rubroCrudo) {
    logExtraccionFallida(textoCrudo)
    throw extraccionFallidaError()
  }

  const defaults = RUBRO_DEFAULTS[rubro] ?? RUBRO_DEFAULTS[RUBRO_VISUAL_FALLBACK]

  const contactoRaw = (raw.contacto ?? {}) as Record<string, unknown>
  const formulario = normalizarFormulario(contactoRaw.formulario)

  const config: SiteConfigDTO = {
    nombre,
    rubro,
    descripcion: typeof raw.descripcion === 'string' ? raw.descripcion : '',
    sobreNosotros: normalizarSobreNosotros(raw.sobreNosotros),
    servicios: normalizarServicios(raw.servicios),
    ciudad: typeof raw.ciudad === 'string' ? raw.ciudad : '',
    contacto: {
      telefono: typeof contactoRaw.telefono === 'string' ? contactoRaw.telefono : '',
      email: typeof contactoRaw.email === 'string' ? contactoRaw.email : '',
      ...(formulario ? { formulario } : {}),
    },
    redes: normalizarRedes(raw.redes),
    estilo: normalizarEstilo(raw.estilo),
    highlight: typeof raw.highlight === 'string' ? raw.highlight : '',
    colores: defaults.colores,
    imagenes: defaults.imagenes,
  }

  return { ...config, template: templateService.seleccionarTemplate(config) }
}

function logExtraccionFallida(textoCrudo: string): void {
  console.error(
    '[ClaudeChatService.parseSiteConfig] no se pudo extraer los datos del sitio desde la respuesta de Claude:',
    textoCrudo.slice(0, RAW_TEXT_LOG_LIMIT),
  )
}

function extraccionFallidaError(): ClaudeServiceError {
  return new ClaudeServiceError(
    'claude_extraction_failed',
    'No se pudo extraer los datos del sitio desde la respuesta de Claude',
  )
}

// Ported verbatim from docs/WEBBOT_ROADMAP.md:499-515 — 8 preguntas en orden
// fijo, tono chileno informal, una pregunta por vuelta.
const SYSTEM_PROMPT = `Eres el asistente de WebBot, un servicio de Devalpo que crea sitios web para negocios chilenos en minutos.

Tu trabajo es hacerle exactamente 8 preguntas al cliente para recopilar la información necesaria para crear su sitio web. Haz UNA pregunta a la vez y espera la respuesta antes de continuar.

PREGUNTAS EN ORDEN (no te saltes ninguna):
1. ¿Cómo se llama tu negocio?
2. ¿A qué se dedica? (describe brevemente qué hace o vende)
3. ¿Cuáles son tus principales productos o servicios? (menciona los 3 o 4 más importantes)
4. ¿En qué ciudad o zona opera tu negocio?
5. ¿Cuál es el teléfono de contacto y el email?
6. ¿Tienes redes sociales? (Instagram, Facebook — comparte los links o nombres de usuario)
7. ¿Qué estilo visual prefieres para tu sitio? (Elige: Moderno y minimalista / Cálido y cercano / Colorido y llamativo)
8. ¿Hay algo especial de tu negocio que quieras destacar? (un logro, diferenciador, frase especial)

TONO: amigable, directo, chileno. Nada de formalidades. Tutea al cliente.
Cuando hayas recibido las 8 respuestas, confirma con un mensaje de que ya tienes todo y que vas a crear su sitio.
NO hagas más de 8 preguntas. NO combines preguntas. NO des explicaciones largas.`

// Basado en docs/WEBBOT_ROADMAP.md:550-570 — 10 rubros + "otro" como
// catch-all (ver RUBROS_VALIDOS arriba). Extendido en WB-22 (Tarea 3.1) con
// "sobreNosotros" y "contacto.formulario" — ambos opcionales, tolerados
// ausentes por parseSiteConfig (ver Requirement "Optional About and
// Contact-Form Fields" en spec.md).
const EXTRACTION_PROMPT = `Analiza esta conversación y extrae los datos del negocio en formato JSON.
Devuelve SOLO el JSON, sin texto adicional, sin markdown, sin explicaciones.

FORMATO REQUERIDO:
{
  "nombre": "nombre exacto del negocio",
  "rubro": "categoría del negocio (panaderia|peluqueria|dentista|restaurante|consultora|taller|yoga|ferreteria|veterinaria|tienda|otro)",
  "descripcion": "descripción corta de 1-2 frases del negocio",
  "sobreNosotros": "1-2 frases sobre la historia, misión o valores del negocio si se mencionaron, o null",
  "servicios": ["servicio 1", "servicio 2", "servicio 3"],
  "ciudad": "ciudad donde opera",
  "contacto": {
    "telefono": "número limpio sin espacios",
    "email": "email@ejemplo.cl",
    "formulario": { "habilitado": true }
  },
  "redes": {
    "instagram": "@usuario o null",
    "facebook": "url o nombre o null"
  },
  "estilo": "moderno|calido|colorido",
  "highlight": "frase o diferenciador especial del negocio"
}`

function construirTranscript(historial: MensajeDTO[]): string {
  return historial.map((m) => `${m.rol === 'user' ? 'CLIENTE' : 'BOT'}: ${m.contenido}`).join('\n')
}

/**
 * Adaptador real de Claude — reemplaza el stub de Fase 1. Mirroring
 * ResendEmailService: el constructor siempre valida la config y tira
 * descriptivo; cada método público hace exactamente una llamada a
 * messages.create() y envuelve fallas del SDK en ClaudeServiceError.
 */
export class ClaudeChatService implements IChatService {
  private client: Anthropic
  private modelo: string

  constructor(client?: Anthropic) {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY no configurada — ver .env.example')
    }
    this.client = client ?? new Anthropic({ apiKey })
    this.modelo = process.env.ANTHROPIC_MODEL || MODELO_DEFAULT
  }

  async procesarMensaje(historial: MensajeDTO[], mensajeUsuario: string): Promise<string> {
    const mensajes = [
      ...historial.map((m) => ({ role: m.rol, content: m.contenido })),
      { role: 'user' as const, content: mensajeUsuario },
    ]

    try {
      const response = await this.client.messages.create({
        model: this.modelo,
        max_tokens: 300,
        system: SYSTEM_PROMPT,
        messages: mensajes,
      })

      const bloque = response.content[0]
      return bloque?.type === 'text' ? bloque.text : ''
    } catch (error) {
      throw new ClaudeServiceError(
        'claude_api_error',
        `Fallo al llamar a Claude (procesarMensaje): ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }

  async extraerDatos(historial: MensajeDTO[]): Promise<SiteConfigDTO> {
    const conversacionTexto = construirTranscript(historial)

    let response: Anthropic.Message
    try {
      response = await this.client.messages.create({
        model: this.modelo,
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: `${EXTRACTION_PROMPT}\n\nCONVERSACIÓN:\n${conversacionTexto}`,
          },
        ],
      })
    } catch (error) {
      throw new ClaudeServiceError(
        'claude_api_error',
        `Fallo al llamar a Claude (extraerDatos): ${error instanceof Error ? error.message : String(error)}`,
      )
    }

    const bloque = response.content[0]
    const texto = bloque?.type === 'text' ? bloque.text : ''
    return parseSiteConfig(texto)
  }

  conversacionCompleta(historial: MensajeDTO[]): boolean {
    return historial.filter((m) => m.rol === 'user').length >= 8
  }
}
