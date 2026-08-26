import Anthropic from '@anthropic-ai/sdk'
import { ClaudeChatService, parseSiteConfig } from '@/infrastructure/claude/ClaudeChatService'
import { ClaudeServiceError } from '@/infrastructure/claude/claudeErrors'
import { MensajeDTO } from '@/application/dtos/MensajeDTO'
import { RUBRO_FIXTURES } from './fixtures/rubros'

function fakeAnthropicClient(create: jest.Mock) {
  return { messages: { create } } as unknown as Anthropic
}

function textResponse(texto: string) {
  return { content: [{ type: 'text', text: texto }] }
}

const ORIGINAL_ENV = process.env

beforeEach(() => {
  process.env = { ...ORIGINAL_ENV, ANTHROPIC_API_KEY: 'sk-ant-test-key' }
})

afterEach(() => {
  process.env = ORIGINAL_ENV
})

describe('ClaudeChatService — constructor', () => {
  it('lanza un error descriptivo cuando ANTHROPIC_API_KEY no está configurada', () => {
    delete process.env.ANTHROPIC_API_KEY
    expect(() => new ClaudeChatService()).toThrow(/ANTHROPIC_API_KEY/)
    expect(() => new ClaudeChatService()).toThrow(/\.env\.example/)
  })

  it('no lanza cuando ANTHROPIC_API_KEY está configurada', () => {
    expect(() => new ClaudeChatService()).not.toThrow()
  })
})

describe('ClaudeChatService — procesarMensaje', () => {
  it('llama a messages.create con el modelo, el system prompt y el historial mapeado, y devuelve el texto', async () => {
    const create = jest.fn().mockResolvedValue(textResponse('¿A qué se dedica tu negocio?'))
    const service = new ClaudeChatService(fakeAnthropicClient(create))

    const historial: MensajeDTO[] = [
      { rol: 'user', contenido: 'Panadería El Trigal', timestamp: new Date() },
      { rol: 'assistant', contenido: '¿Cómo se llama tu negocio?', timestamp: new Date() },
    ]

    const respuesta = await service.procesarMensaje(historial, 'Panadería El Trigal')

    expect(respuesta).toBe('¿A qué se dedica tu negocio?')
    expect(create).toHaveBeenCalledTimes(1)

    const llamada = create.mock.calls[0][0]
    expect(llamada.model).toBe('claude-sonnet-4-6')
    expect(typeof llamada.system).toBe('string')
    expect(llamada.system).toContain('WebBot')
    expect(llamada.messages).toEqual([
      { role: 'user', content: 'Panadería El Trigal' },
      { role: 'assistant', content: '¿Cómo se llama tu negocio?' },
      { role: 'user', content: 'Panadería El Trigal' },
    ])
    // timestamp nunca viaja al SDK
    expect(llamada.messages.some((m: Record<string, unknown>) => 'timestamp' in m)).toBe(false)
  })

  it('usa ANTHROPIC_MODEL del entorno cuando está configurada', async () => {
    process.env.ANTHROPIC_MODEL = 'claude-opus-9'
    const create = jest.fn().mockResolvedValue(textResponse('siguiente pregunta'))
    const service = new ClaudeChatService(fakeAnthropicClient(create))

    await service.procesarMensaje([], 'hola')

    expect(create.mock.calls[0][0].model).toBe('claude-opus-9')
  })

  it('devuelve string vacío cuando el primer bloque de contenido no es texto', async () => {
    const create = jest.fn().mockResolvedValue({ content: [{ type: 'tool_use' }] })
    const service = new ClaudeChatService(fakeAnthropicClient(create))

    const respuesta = await service.procesarMensaje([], 'hola')

    expect(respuesta).toBe('')
  })
})

describe('ClaudeChatService — fallas de la API de Anthropic', () => {
  it('envuelve el rechazo del SDK en ClaudeServiceError("claude_api_error"), con exactamente una llamada (sin reintento)', async () => {
    const create = jest.fn().mockRejectedValue(new Error('529 Overloaded'))
    const service = new ClaudeChatService(fakeAnthropicClient(create))

    await expect(service.procesarMensaje([], 'hola')).rejects.toBeInstanceOf(ClaudeServiceError)
    expect(create).toHaveBeenCalledTimes(1)
  })

  it('el error resultante trae el código claude_api_error', async () => {
    const create = jest.fn().mockRejectedValue(new Error('429 rate limited'))
    const service = new ClaudeChatService(fakeAnthropicClient(create))

    try {
      await service.procesarMensaje([], 'hola')
      throw new Error('no debería llegar acá')
    } catch (error) {
      expect(error).toBeInstanceOf(ClaudeServiceError)
      expect((error as InstanceType<typeof ClaudeServiceError>).codigo).toBe('claude_api_error')
    }

    expect(create).toHaveBeenCalledTimes(1)
  })
})

describe('parseSiteConfig — fallas de parseo', () => {
  let consoleErrorSpy: jest.SpyInstance

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  it('lanza claude_extraction_failed cuando el texto es JSON basura', () => {
    const basura = 'esto no es json ni parecido {{{'
    expect(() => parseSiteConfig(basura)).toThrow(ClaudeServiceError)
    try {
      parseSiteConfig(basura)
    } catch (error) {
      expect((error as InstanceType<typeof ClaudeServiceError>).codigo).toBe('claude_extraction_failed')
    }
  })

  it('lanza claude_extraction_failed cuando el JSON viene truncado (llave sin cerrar)', () => {
    const truncado = '{"nombre": "Panadería El Trigal", "rubro": "panaderia"'
    expect(() => parseSiteConfig(truncado)).toThrow(ClaudeServiceError)
  })

  it('no expone el texto crudo completo en el mensaje de error público', () => {
    const marcador = 'X'.repeat(2000)
    const basura = `no-json-${marcador}`
    try {
      parseSiteConfig(basura)
      throw new Error('no debería llegar acá')
    } catch (error) {
      const err = error as InstanceType<typeof ClaudeServiceError>
      expect(err.message).not.toContain(marcador)
    }
  })

  it('registra en consola (server-side) el texto crudo truncado a 500 caracteres', () => {
    const marcador = 'Y'.repeat(2000)
    const basura = `no-json-${marcador}`
    try {
      parseSiteConfig(basura)
    } catch {
      // esperado
    }
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
    const loggedText = String(consoleErrorSpy.mock.calls[0][1] ?? consoleErrorSpy.mock.calls[0][0])
    expect(loggedText.length).toBeLessThanOrEqual(500)
  })
})

describe('parseSiteConfig — normalización', () => {
  function jsonBase(overrides: Record<string, unknown> = {}): string {
    return JSON.stringify({
      nombre: 'Panadería El Trigal',
      rubro: 'panaderia',
      descripcion: 'Pan artesanal',
      servicios: ['Pan', 'Tortas'],
      ciudad: 'Viña del Mar',
      contacto: { telefono: '+56911112222', email: 'a@a.cl' },
      redes: { instagram: null, facebook: null },
      estilo: 'moderno',
      highlight: '20 años',
      ...overrides,
    })
  }

  it('normaliza el rubro a minúsculas', () => {
    const datos = parseSiteConfig(jsonBase({ rubro: 'PANADERIA' }))
    expect(datos.rubro).toBe('panaderia')
  })

  it('clampa un rubro desconocido a "otro"', () => {
    const datos = parseSiteConfig(jsonBase({ rubro: 'astronauta-espacial' }))
    expect(datos.rubro).toBe('otro')
  })

  it('mapea estilo a la Estilo VO, con "moderno" como default cuando viene inválido', () => {
    const datos = parseSiteConfig(jsonBase({ estilo: 'inventado-random' }))
    expect(datos.estilo).toBe('moderno')
  })

  it('mapea estilo "colorido" correctamente cuando es válido', () => {
    const datos = parseSiteConfig(jsonBase({ estilo: 'colorido' }))
    expect(datos.estilo).toBe('colorido')
  })

  it('convierte redes null a undefined', () => {
    const datos = parseSiteConfig(jsonBase({ redes: { instagram: null, facebook: null } }))
    expect(datos.redes.instagram).toBeUndefined()
    expect(datos.redes.facebook).toBeUndefined()
  })

  it('preserva redes cuando vienen con valores reales', () => {
    const datos = parseSiteConfig(jsonBase({ redes: { instagram: '@trigal', facebook: null } }))
    expect(datos.redes.instagram).toBe('@trigal')
    expect(datos.redes.facebook).toBeUndefined()
  })

  it('coerciona servicios a string[]', () => {
    const datos = parseSiteConfig(jsonBase({ servicios: ['Pan', 'Torta', 'Empanada'] }))
    expect(datos.servicios).toEqual(['Pan', 'Torta', 'Empanada'])
  })

  it('rellena template/colores/imagenes desde RUBRO_DEFAULTS según el rubro', () => {
    const datos = parseSiteConfig(jsonBase({ rubro: 'veterinaria' }))
    expect(datos.template).toBe('SERVICIOS')
    expect(datos.colores).toEqual({ primario: '#6C5CE7', secundario: '#a29bfe', acento: '#fd79a8', texto: '#ffffff' })
    expect(datos.imagenes?.length).toBeGreaterThan(0)
  })

  it('lanza claude_extraction_failed cuando nombre viene vacío', () => {
    expect(() => parseSiteConfig(jsonBase({ nombre: '' }))).toThrow(ClaudeServiceError)
    try {
      parseSiteConfig(jsonBase({ nombre: '   ' }))
    } catch (error) {
      expect((error as InstanceType<typeof ClaudeServiceError>).codigo).toBe('claude_extraction_failed')
    }
  })

  it('lanza claude_extraction_failed cuando rubro viene vacío', () => {
    expect(() => parseSiteConfig(jsonBase({ rubro: '' }))).toThrow(ClaudeServiceError)
  })
})

describe('ClaudeChatService — extraerDatos (10 rubros, describe.each)', () => {
  describe.each(RUBRO_FIXTURES)('rubro: $rubro ($formato)', (fixture) => {
    it(`devuelve un SiteConfigDTO completo y válido para "${fixture.rubro}"`, async () => {
      const create = jest.fn().mockResolvedValue(textResponse(fixture.respuestaClaude))
      const service = new ClaudeChatService(fakeAnthropicClient(create))

      const datos = await service.extraerDatos(fixture.historial)

      expect(create).toHaveBeenCalledTimes(1)
      const llamada = create.mock.calls[0][0]
      expect(llamada.max_tokens).toBe(1024)
      expect(llamada.messages).toHaveLength(1)
      expect(llamada.messages[0].role).toBe('user')
      expect(llamada.messages[0].content).toContain('CLIENTE:')
      expect(llamada.messages[0].content).toContain('BOT:')

      expect(datos.nombre).toBe(fixture.esperado.nombre)
      expect(datos.rubro).toBe(fixture.esperado.rubro)
      expect(datos.template).toBe(fixture.esperado.template)
      expect(datos.descripcion.length).toBeGreaterThan(0)
      expect(datos.servicios.length).toBeGreaterThan(0)
      expect(datos.ciudad.length).toBeGreaterThan(0)
      expect(datos.contacto.telefono.length).toBeGreaterThan(0)
      expect(datos.contacto.email.length).toBeGreaterThan(0)
      expect(datos.colores).toBeDefined()
      expect(datos.imagenes?.length).toBeGreaterThan(0)
    })
  })
})
