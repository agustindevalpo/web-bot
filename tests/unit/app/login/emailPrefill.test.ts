import { resolverEmailPrefill } from '@/app/login/emailPrefill'
import { Sesion } from '@/domain/entities/Sesion'
import { Cliente } from '@/domain/entities/Cliente'
import { Plan } from '@/domain/value-objects/Plan'

function crearSesion(clienteId: string | null): Sesion {
  const sesion = new Sesion('sesion-1', 'session-abc')
  sesion.clienteId = clienteId
  return sesion
}

function crearFakes(overrides?: {
  findBySessionId?: jest.Mock
  findById?: jest.Mock
}) {
  return {
    sesionRepo: { findBySessionId: overrides?.findBySessionId ?? jest.fn() },
    clienteRepo: { findById: overrides?.findById ?? jest.fn() },
  }
}

describe('resolverEmailPrefill', () => {
  it('devuelve el email del cliente vinculado a la sesión (camino feliz)', async () => {
    const sesion = crearSesion('cliente-1')
    const cliente = new Cliente('cliente-1', 'ana@ejemplo.cl', 'Ana', Plan.STARTER)
    const { sesionRepo, clienteRepo } = crearFakes({
      findBySessionId: jest.fn().mockResolvedValue(sesion),
      findById: jest.fn().mockResolvedValue(cliente),
    })

    const email = await resolverEmailPrefill('session-abc', sesionRepo, clienteRepo)

    expect(email).toBe('ana@ejemplo.cl')
    expect(sesionRepo.findBySessionId).toHaveBeenCalledWith('session-abc')
    expect(clienteRepo.findById).toHaveBeenCalledWith('cliente-1')
  })

  it('sin sessionId (sin cookie), devuelve string vacío sin consultar repositorios', async () => {
    const { sesionRepo, clienteRepo } = crearFakes()

    const email = await resolverEmailPrefill(undefined, sesionRepo, clienteRepo)

    expect(email).toBe('')
    expect(sesionRepo.findBySessionId).not.toHaveBeenCalled()
    expect(clienteRepo.findById).not.toHaveBeenCalled()
  })

  it('sesión no encontrada, degrada a string vacío', async () => {
    const { sesionRepo, clienteRepo } = crearFakes({
      findBySessionId: jest.fn().mockResolvedValue(null),
    })

    const email = await resolverEmailPrefill('session-x', sesionRepo, clienteRepo)

    expect(email).toBe('')
    expect(clienteRepo.findById).not.toHaveBeenCalled()
  })

  it('sesión con clienteId null (lead aún no capturado), degrada a string vacío', async () => {
    const sesion = crearSesion(null)
    const { sesionRepo, clienteRepo } = crearFakes({
      findBySessionId: jest.fn().mockResolvedValue(sesion),
    })

    const email = await resolverEmailPrefill('session-abc', sesionRepo, clienteRepo)

    expect(email).toBe('')
    expect(clienteRepo.findById).not.toHaveBeenCalled()
  })

  it('cliente no encontrado (referencia huérfana), degrada a string vacío', async () => {
    const sesion = crearSesion('cliente-fantasma')
    const { sesionRepo, clienteRepo } = crearFakes({
      findBySessionId: jest.fn().mockResolvedValue(sesion),
      findById: jest.fn().mockResolvedValue(null),
    })

    const email = await resolverEmailPrefill('session-abc', sesionRepo, clienteRepo)

    expect(email).toBe('')
  })

  it('un repositorio que falla nunca propaga: degrada a string vacío', async () => {
    const { sesionRepo, clienteRepo } = crearFakes({
      findBySessionId: jest.fn().mockRejectedValue(new Error('conexión a la base caída')),
    })

    await expect(resolverEmailPrefill('session-abc', sesionRepo, clienteRepo)).resolves.toBe('')
  })
})
