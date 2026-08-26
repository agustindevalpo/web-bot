import { NextRequest } from 'next/server'
import { Sesion } from '@/domain/entities/Sesion'
import { Cliente } from '@/domain/entities/Cliente'
import { Plan } from '@/domain/value-objects/Plan'
import { ClaudeServiceError } from '@/infrastructure/claude/claudeErrors'
import type { IChatService } from '@/application/services/IChatService'
import type { MensajeDTO } from '@/application/dtos/MensajeDTO'
import type { SiteConfigDTO } from '@/application/dtos/SiteConfigDTO'

// Container y colaboradores externos mockeados — este es un test de
// wiring a nivel de route handler (capa "Integration" en design.md),
// no un test de infraestructura real (Prisma, Anthropic).
jest.mock('@/infrastructure/container', () => ({
  sesionRepo: { findBySessionId: jest.fn(), save: jest.fn(), update: jest.fn() },
  clienteRepo: { findById: jest.fn() },
  sitioRepo: { findBySubdominio: jest.fn(), save: jest.fn(), update: jest.fn() },
  getChatServiceReal: jest.fn(),
  generarSitioUC: { execute: jest.fn().mockResolvedValue(undefined) },
}))
jest.mock('@/infrastructure/claude/claudeRateLimit', () => ({
  verificarLimiteClaude: jest.fn(),
}))
jest.mock('@/infrastructure/auth/JwtSessionService', () => ({
  verificarSesionJWT: jest.fn(),
  SESSION_COOKIE_NAME: 'webbot_auth',
}))

import { POST } from '@/app/api/chat/route'
import { sesionRepo, clienteRepo, getChatServiceReal } from '@/infrastructure/container'
import { verificarLimiteClaude } from '@/infrastructure/claude/claudeRateLimit'
import { verificarSesionJWT } from '@/infrastructure/auth/JwtSessionService'

const mockSesionRepo = sesionRepo as jest.Mocked<typeof sesionRepo>
const mockClienteRepo = clienteRepo as jest.Mocked<typeof clienteRepo>
const mockGetChatServiceReal = getChatServiceReal as jest.Mock
const mockVerificarLimiteClaude = verificarLimiteClaude as jest.Mock
const mockVerificarSesionJWT = verificarSesionJWT as jest.Mock

function buildRequest(body: Record<string, unknown>, cookie?: string): NextRequest {
  return new NextRequest('http://localhost/api/chat', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'content-type': 'application/json',
      ...(cookie ? { cookie: `webbot_auth=${cookie}` } : {}),
    },
  })
}

function fakeChatService(overrides: Partial<IChatService> = {}): IChatService {
  return {
    procesarMensaje: jest.fn().mockResolvedValue('siguiente pregunta'),
    extraerDatos: jest.fn().mockResolvedValue({
      nombre: 'Negocio Test',
      rubro: 'panaderia',
      descripcion: 'desc',
      servicios: ['a'],
      ciudad: 'Santiago',
      contacto: { telefono: '123', email: 'a@a.cl' },
      redes: {},
      estilo: 'moderno',
      highlight: 'h',
      template: 'RESTAURANTE',
    } satisfies SiteConfigDTO),
    conversacionCompleta: jest.fn().mockReturnValue(false),
    ...overrides,
  }
}

function activatedClienteSetup(chatService: IChatService) {
  mockVerificarSesionJWT.mockResolvedValue({ clienteId: 'cliente-1', email: 'a@a.cl' })
  mockClienteRepo.findById.mockResolvedValue(new Cliente('cliente-1', 'a@a.cl', 'Test', Plan.PRO, true))
  mockGetChatServiceReal.mockReturnValue(chatService)
  mockVerificarLimiteClaude.mockReturnValue({ permitido: true, restantes: 19, resetAt: Date.now() + 1000 })
}

beforeEach(() => {
  jest.clearAllMocks()
  mockSesionRepo.findBySessionId.mockResolvedValue(null)
  mockSesionRepo.save.mockImplementation(async (s) => s)
  mockSesionRepo.update.mockImplementation(async () => ({}) as never)
})

describe('POST /api/chat — demo path', () => {
  it('sigue funcionando sin tocar getChatServiceReal cuando no hay sesión autenticada (esDemo=true)', async () => {
    const req = buildRequest({ mensaje: 'Panadería El Trigal', sessionId: 'sess-demo-1' })

    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.esDemo).toBe(true)
    expect(mockGetChatServiceReal).not.toHaveBeenCalled()
  })
})

describe('POST /api/chat — guard de clasificación demo/real', () => {
  it('un cliente sin activar (activo=false) queda en modo demo, no llama a getChatServiceReal', async () => {
    mockVerificarSesionJWT.mockResolvedValue({ clienteId: 'cliente-2', email: 'b@b.cl' })
    mockClienteRepo.findById.mockResolvedValue(new Cliente('cliente-2', 'b@b.cl', 'Test', Plan.STARTER, false))

    const req = buildRequest({ mensaje: 'hola', sessionId: 'sess-inactivo' }, 'token-fake')
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.esDemo).toBe(true)
    expect(mockGetChatServiceReal).not.toHaveBeenCalled()
  })
})

describe('POST /api/chat — 503 sin ANTHROPIC_API_KEY configurada', () => {
  it('devuelve 503 chat_no_configurado cuando getChatServiceReal() es null para un cliente activado', async () => {
    mockVerificarSesionJWT.mockResolvedValue({ clienteId: 'cliente-3', email: 'c@c.cl' })
    mockClienteRepo.findById.mockResolvedValue(new Cliente('cliente-3', 'c@c.cl', 'Test', Plan.PRO, true))
    mockGetChatServiceReal.mockReturnValue(null)

    const req = buildRequest({ mensaje: 'hola', sessionId: 'sess-sin-key' }, 'token-fake')
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(503)
    expect(body.error).toBe('chat_no_configurado')
  })
})

describe('POST /api/chat — rate limiting de Claude (429)', () => {
  it('devuelve 429 claude_limit_reached y preserva la sesión sin llamar a sesionRepo.update', async () => {
    const chatService = fakeChatService()
    activatedClienteSetup(chatService)
    mockVerificarLimiteClaude.mockReturnValue({ permitido: false, restantes: 0, resetAt: Date.now() + 1000 })

    const sesionExistente = new Sesion('sesion-1', 'sess-limitado')
    mockSesionRepo.findBySessionId.mockResolvedValue(sesionExistente)

    const req = buildRequest({ mensaje: 'hola', sessionId: 'sess-limitado' }, 'token-fake')
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(429)
    expect(body.error).toBe('claude_limit_reached')
    expect(chatService.procesarMensaje).not.toHaveBeenCalled()
    expect(mockSesionRepo.update).not.toHaveBeenCalled()
  })
})

describe('POST /api/chat — short-circuit de reintento de extracción', () => {
  it('cuando la conversación ya está completa pero no marcada completada, salta procesarMensaje y llama extraerDatos directo', async () => {
    const historialCompleto: MensajeDTO[] = Array.from({ length: 16 }, (_, i) => ({
      rol: i % 2 === 0 ? 'assistant' : 'user',
      contenido: `msg ${i}`,
      timestamp: new Date(),
    }))
    const chatService = fakeChatService({ conversacionCompleta: jest.fn().mockReturnValue(true) })
    activatedClienteSetup(chatService)

    const sesionExistente = new Sesion('sesion-2', 'sess-retry')
    sesionExistente.historial = historialCompleto
    mockSesionRepo.findBySessionId.mockResolvedValue(sesionExistente)

    const req = buildRequest({ mensaje: 'reintentar', sessionId: 'sess-retry' }, 'token-fake')
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.completada).toBe(true)
    expect(chatService.procesarMensaje).not.toHaveBeenCalled()
    expect(chatService.extraerDatos).toHaveBeenCalledTimes(1)
  })
})

describe('POST /api/chat — mapeo de errores de Claude a HTTP', () => {
  it('mapea claude_api_error a 502 claude_no_disponible sin persistir la vuelta fallida', async () => {
    const chatService = fakeChatService({
      procesarMensaje: jest.fn().mockRejectedValue(new ClaudeServiceError('claude_api_error', 'boom')),
    })
    activatedClienteSetup(chatService)

    const sesionExistente = new Sesion('sesion-3', 'sess-502-api')
    mockSesionRepo.findBySessionId.mockResolvedValue(sesionExistente)

    const req = buildRequest({ mensaje: 'hola', sessionId: 'sess-502-api' }, 'token-fake')
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(502)
    expect(body.error).toBe('claude_no_disponible')
    expect(mockSesionRepo.update).not.toHaveBeenCalled()
  })

  it('mapea claude_extraction_failed a 502 extraccion_fallida y SÍ persiste el historial para permitir reintento', async () => {
    const chatService = fakeChatService({
      conversacionCompleta: jest.fn().mockReturnValue(true),
      extraerDatos: jest.fn().mockRejectedValue(new ClaudeServiceError('claude_extraction_failed', 'no parseable')),
    })
    activatedClienteSetup(chatService)

    const historialCompleto: MensajeDTO[] = Array.from({ length: 16 }, (_, i) => ({
      rol: i % 2 === 0 ? 'assistant' : 'user',
      contenido: `msg ${i}`,
      timestamp: new Date(),
    }))
    const sesionExistente = new Sesion('sesion-4', 'sess-502-extract')
    sesionExistente.historial = historialCompleto
    mockSesionRepo.findBySessionId.mockResolvedValue(sesionExistente)

    const req = buildRequest({ mensaje: 'reintentar', sessionId: 'sess-502-extract' }, 'token-fake')
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(502)
    expect(body.error).toBe('extraccion_fallida')
    expect(mockSesionRepo.update).toHaveBeenCalledTimes(1)
    expect(mockSesionRepo.update.mock.calls[0][1]).toMatchObject({ historial: historialCompleto })
  })
})
