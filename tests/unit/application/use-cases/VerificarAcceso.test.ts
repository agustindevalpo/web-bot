import { VerificarAccesoUseCase } from '@/application/use-cases/VerificarAcceso.usecase'
import { TokenAcceso } from '@/domain/entities/TokenAcceso'
import { Cliente } from '@/domain/entities/Cliente'
import { Plan } from '@/domain/value-objects/Plan'
import { TokenAccesoInvalidoException } from '@/domain/exceptions/TokenAccesoInvalidoException'

describe('VerificarAcceso UseCase', () => {
  const clienteExistente = Cliente.crear('existe@b.cl', 'existe', Plan.STARTER)

  const mockTokenAccesoRepo = {
    findByTokenHash: jest.fn(),
    save: jest.fn(),
    update: jest.fn().mockResolvedValue({}),
    countRecientesPorEmail: jest.fn(),
  }

  const mockClienteRepo = {
    findById: jest.fn(),
    findByEmail: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findAll: jest.fn(),
  }

  const useCase = new VerificarAccesoUseCase(mockTokenAccesoRepo, mockClienteRepo)

  beforeEach(() => jest.clearAllMocks())

  it('token válido de un cliente existente: lo marca usado y devuelve la cuenta', async () => {
    const token = TokenAcceso.crear('existe@b.cl', 'token-plano')
    mockTokenAccesoRepo.findByTokenHash.mockResolvedValueOnce(token)
    mockClienteRepo.findByEmail.mockResolvedValueOnce(clienteExistente)

    const resultado = await useCase.execute('token-plano')

    expect(mockTokenAccesoRepo.update).toHaveBeenCalledWith(
      token.id,
      expect.objectContaining({ usadoEn: expect.any(Date) }),
    )
    expect(mockClienteRepo.save).not.toHaveBeenCalled()
    expect(resultado).toEqual({ clienteId: clienteExistente.id, email: clienteExistente.email })
  })

  it('token válido de un email nuevo: crea el Cliente', async () => {
    const token = TokenAcceso.crear('nuevo@b.cl', 'token-plano')
    mockTokenAccesoRepo.findByTokenHash.mockResolvedValueOnce(token)
    mockClienteRepo.findByEmail.mockResolvedValueOnce(null)
    mockClienteRepo.save.mockImplementationOnce(async (c) => c)

    const resultado = await useCase.execute('token-plano')

    expect(mockClienteRepo.save).toHaveBeenCalledTimes(1)
    expect(resultado.email).toBe('nuevo@b.cl')
  })

  it('lanza excepción si el token no existe', async () => {
    mockTokenAccesoRepo.findByTokenHash.mockResolvedValueOnce(null)

    await expect(useCase.execute('no-existe')).rejects.toThrow(TokenAccesoInvalidoException)
  })

  it('lanza excepción si el token expiró', async () => {
    const tokenExpirado = new TokenAcceso(
      'id-1',
      'a@b.cl',
      TokenAcceso.hash('token-plano'),
      new Date(Date.now() - 1000),
    )
    mockTokenAccesoRepo.findByTokenHash.mockResolvedValueOnce(tokenExpirado)

    await expect(useCase.execute('token-plano')).rejects.toThrow(TokenAccesoInvalidoException)
  })

  it('lanza excepción si el token ya fue usado', async () => {
    const tokenUsado = TokenAcceso.crear('a@b.cl', 'token-plano')
    tokenUsado.marcarUsado()
    mockTokenAccesoRepo.findByTokenHash.mockResolvedValueOnce(tokenUsado)

    await expect(useCase.execute('token-plano')).rejects.toThrow(TokenAccesoInvalidoException)
  })
})
