import { cookies } from 'next/headers'
import { Sesion } from '@/domain/entities/Sesion'
import { sesionRepo, obtenerMomento2UC } from '@/infrastructure/container'
import { resolverModoChat } from '@/infrastructure/auth/modoChat'
import ChatPage from '@/app/chat/page'

jest.mock('next/headers', () => ({ cookies: jest.fn() }))
jest.mock('@/infrastructure/container', () => ({
  sesionRepo: { findBySessionId: jest.fn() }, clienteRepo: {},
  obtenerMomento2UC: { execute: jest.fn() },
}))
jest.mock('@/infrastructure/auth/modoChat', () => ({ resolverModoChat: jest.fn() }))

beforeEach(() => {
  jest.clearAllMocks()
  jest.mocked(cookies).mockResolvedValue({ get: (name: string) => name === 'webbot_session' ? { value: 'session-id' } : undefined } as never)
  jest.mocked(resolverModoChat).mockResolvedValue(true)
  jest.mocked(sesionRepo.findBySessionId).mockResolvedValue(null)
})

describe('/chat server initialization', () => {
  it('recovers an unfinished conversation using only the cookie session', async () => {
    const sesion = new Sesion('id', 'session-id')
    sesion.agregarMensaje('user', 'Luz')
    sesion.agregarMensaje('assistant', '¿Cuál de estas categorías describe mejor tu negocio?')
    jest.mocked(sesionRepo.findBySessionId).mockResolvedValue(sesion)
    const page = await ChatPage({ searchParams: Promise.resolve({}) })
    expect(sesionRepo.findBySessionId).toHaveBeenCalledWith('session-id')
    expect(page.props.chatInicial?.mensajes).toHaveLength(2)
    expect(page.props.revealInicial).toBeUndefined()
  })

  it('starts safely without a cookie or a matching session', async () => {
    expect((await ChatPage({ searchParams: Promise.resolve({}) })).props.chatInicial).toBeUndefined()
    jest.mocked(cookies).mockResolvedValue({ get: () => undefined } as never)
    jest.clearAllMocks()
    expect((await ChatPage({ searchParams: Promise.resolve({}) })).props.chatInicial).toBeUndefined()
    expect(sesionRepo.findBySessionId).not.toHaveBeenCalled()
  })

  it('leaves completed demos available for existing POST rotation', async () => {
    const sesion = new Sesion('id', 'session-id')
    sesion.agregarMensaje('user', 'Luz')
    sesion.completada = true
    jest.mocked(sesionRepo.findBySessionId).mockResolvedValue(sesion)
    expect((await ChatPage({ searchParams: Promise.resolve({}) })).props.chatInicial).toBeUndefined()
  })

  it('preserves explicit reveal without recovering or exposing conversation state', async () => {
    jest.mocked(obtenerMomento2UC.execute).mockResolvedValue({
      estado: 'abierto', subdominio: 'demo-test', nombre: 'Luz', template: 'SERVICIOS', vista: { avance: 50 },
    } as never)
    const page = await ChatPage({ searchParams: Promise.resolve({ vista: 'sitio' }) })
    expect(page.props.revealInicial?.avance).toBe(50)
    expect(page.props.chatInicial).toBeUndefined()
    expect(sesionRepo.findBySessionId).not.toHaveBeenCalled()
  })

  it('does not apply predefined recovery to the real chat mode', async () => {
    jest.mocked(resolverModoChat).mockResolvedValue(false)
    expect((await ChatPage({ searchParams: Promise.resolve({}) })).props.chatInicial).toBeUndefined()
    expect(sesionRepo.findBySessionId).not.toHaveBeenCalled()
  })
})
