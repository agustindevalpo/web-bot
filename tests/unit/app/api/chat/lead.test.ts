import { NextRequest } from 'next/server'

// Container y colaboradores externos mockeados — test de wiring a nivel de
// route handler, igual que `tests/unit/app/api/chat.test.ts`.
jest.mock('@/infrastructure/container', () => ({
  capturarLeadDemoUC: { execute: jest.fn() },
  clienteRepo: {},
}))
jest.mock('@/infrastructure/auth/modoChat', () => ({
  resolverModoChat: jest.fn(),
}))
jest.mock('@/infrastructure/auth/JwtSessionService', () => ({
  SESSION_COOKIE_NAME: 'webbot_auth',
}))

import { POST } from '@/app/api/chat/lead/route'
import { capturarLeadDemoUC } from '@/infrastructure/container'
import { resolverModoChat } from '@/infrastructure/auth/modoChat'
import { LeadInvalidoException } from '@/domain/exceptions/LeadInvalidoException'
import { SesionNoEncontradaException } from '@/domain/exceptions/SesionNoEncontradaException'
import { SesionIncompletaException } from '@/domain/exceptions/SesionIncompletaException'
import { SesionNoDemoException } from '@/domain/exceptions/SesionNoDemoException'

const mockExecute = capturarLeadDemoUC.execute as jest.Mock
const mockResolverModoChat = resolverModoChat as jest.Mock

function buildRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost/api/chat/lead', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  mockResolverModoChat.mockResolvedValue(true)
})

describe('POST /api/chat/lead', () => {
  it('200: devuelve subdominioDemo en el happy path', async () => {
    mockExecute.mockResolvedValue({ subdominioDemo: 'demo-abc12345' })

    const req = buildRequest({ sessionId: 'sess-1', nombre: 'Ana', email: 'ana@correo.cl' })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body).toEqual({ subdominioDemo: 'demo-abc12345' })
  })

  it('400 datos_invalidos cuando el use-case rechaza nombre/email', async () => {
    mockExecute.mockRejectedValue(new LeadInvalidoException('El nombre es obligatorio.'))

    const req = buildRequest({ sessionId: 'sess-1', nombre: '', email: 'ana@correo.cl' })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toBe('datos_invalidos')
  })

  it('400 sesion_no_demo cuando la sesión pertenece a un cliente pagado', async () => {
    mockExecute.mockRejectedValue(new SesionNoDemoException())

    const req = buildRequest({ sessionId: 'sess-1', nombre: 'Ana', email: 'ana@correo.cl' })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toBe('sesion_no_demo')
  })

  it('400 sesion_incompleta cuando la conversación no terminó', async () => {
    mockExecute.mockRejectedValue(new SesionIncompletaException())

    const req = buildRequest({ sessionId: 'sess-1', nombre: 'Ana', email: 'ana@correo.cl' })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toBe('sesion_incompleta')
  })

  it('404 sesion_no_encontrada cuando el sessionId no existe', async () => {
    mockExecute.mockRejectedValue(new SesionNoEncontradaException('sess-1'))

    const req = buildRequest({ sessionId: 'sess-1', nombre: 'Ana', email: 'ana@correo.cl' })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(404)
    expect(body.error).toBe('sesion_no_encontrada')
  })

  it('500 con error genérico ante una excepción inesperada', async () => {
    mockExecute.mockRejectedValue(new Error('boom'))
    const spyConsole = jest.spyOn(console, 'error').mockImplementation(() => {})

    const req = buildRequest({ sessionId: 'sess-1', nombre: 'Ana', email: 'ana@correo.cl' })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.error).toBe('Error interno del servidor')
    spyConsole.mockRestore()
  })

  // Los 6 casos anteriores fijan `resolverModoChat` a `true` en el
  // `beforeEach` — nunca ejercitan, a nivel de route, el camino de un
  // cliente pagado. Este caso cierra esa brecha (verify-report obs #399,
  // WARNING #2): prueba que la ruta re-deriva `esDemo` de forma
  // independiente (no confía en el body del request) y que la excepción
  // que el use-case lanza para ese caso se mapea al contrato HTTP
  // documentado. El use-case sigue siendo invocado (no se corta antes) y
  // es su rechazo el que impide que se cree un lead o un `Sitio`: al
  // rechazar, la ruta nunca llega a `NextResponse.json({ subdominioDemo })`.
  it('400 sesion_no_demo cuando resolverModoChat resuelve un cliente pagado (esDemo:false) — no se crea lead ni Sitio', async () => {
    mockResolverModoChat.mockResolvedValue(false)
    mockExecute.mockRejectedValue(new SesionNoDemoException())

    const req = buildRequest({ sessionId: 'sess-1', nombre: 'Ana', email: 'ana@correo.cl' })
    const res = await POST(req)
    const body = await res.json()

    // La ruta forwardeó el esDemo re-derivado (false), no un valor fijo.
    expect(mockExecute).toHaveBeenCalledWith(expect.objectContaining({ esDemo: false }))
    expect(res.status).toBe(400)
    expect(body.error).toBe('sesion_no_demo')
    // El use-case fue invocado y rechazado — no hay ruta de éxito que
    // hubiera podido persistir un lead o un Sitio (la única llamada al
    // container mockeado fue esta invocación rechazada).
    expect(mockExecute).toHaveBeenCalledTimes(1)
    expect(body).not.toHaveProperty('subdominioDemo')
  })
})
