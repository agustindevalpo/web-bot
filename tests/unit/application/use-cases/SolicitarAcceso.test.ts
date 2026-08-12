import { SolicitarAccesoUseCase } from '@/application/use-cases/SolicitarAcceso.usecase'

describe('SolicitarAcceso UseCase', () => {
  const mockTokenAccesoRepo = {
    save: jest.fn().mockResolvedValue({}),
    findByTokenHash: jest.fn(),
    update: jest.fn(),
    countRecientesPorEmail: jest.fn(),
  }

  const mockEmailService = {
    enviarMagicLink: jest.fn().mockResolvedValue(undefined),
  }

  const useCase = new SolicitarAccesoUseCase(
    mockTokenAccesoRepo,
    mockEmailService,
    'http://localhost:3000',
  )

  beforeEach(() => jest.clearAllMocks())

  it('guarda un token y manda el link de acceso por email', async () => {
    await useCase.execute('Test@Ejemplo.cl')

    expect(mockTokenAccesoRepo.save).toHaveBeenCalledTimes(1)
    expect(mockEmailService.enviarMagicLink).toHaveBeenCalledTimes(1)

    const [emailEnviado, url] = mockEmailService.enviarMagicLink.mock.calls[0]
    expect(emailEnviado).toBe('test@ejemplo.cl')
    expect(url).toContain('http://localhost:3000/api/auth/verificar?token=')
  })

  it('normaliza el email (trim + minúsculas) antes de guardar el token', async () => {
    await useCase.execute('  Otro@Ejemplo.CL  ')

    const tokenGuardado = mockTokenAccesoRepo.save.mock.calls[0][0]
    expect(tokenGuardado.email).toBe('otro@ejemplo.cl')
  })
})
