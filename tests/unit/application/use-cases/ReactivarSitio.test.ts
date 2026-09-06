import { ReactivarSitioUseCase } from '@/application/use-cases/ReactivarSitio.usecase'
import { Cliente } from '@/domain/entities/Cliente'
import { Sitio } from '@/domain/entities/Sitio'
import { Plan } from '@/domain/value-objects/Plan'
import { Template } from '@/domain/value-objects/Template'
import { ClienteNoEncontradoException } from '@/domain/exceptions/ClienteNoEncontradoException'

describe('ReactivarSitio UseCase', () => {
  const clienteMock = Cliente.crear('a@b.cl', 'Test', Plan.PRO)
  const sitioMock = new Sitio('sitio-1', clienteMock.id, 'testpyme', Template.LANDING, {})

  const mockClienteRepo = {
    findById: jest.fn(),
    update: jest.fn().mockResolvedValue(clienteMock),
    findByEmail: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    findAll: jest.fn(),
  }

  const mockSitioRepo = {
    findByClienteId: jest.fn(),
    update: jest.fn().mockResolvedValue(sitioMock),
    findById: jest.fn(),
    findBySubdominio: jest.fn(),
    findByDominioPropio: jest.fn(),
    save: jest.fn(),
    findAll: jest.fn(),
  }

  const mockNotifService = {
    enviarBienvenida: jest.fn().mockResolvedValue(undefined),
    enviarSitioListo: jest.fn().mockResolvedValue(undefined),
    enviarAvisoVencimiento: jest.fn().mockResolvedValue(undefined),
    enviarPagoFallido: jest.fn().mockResolvedValue(undefined),
  }

  const useCase = new ReactivarSitioUseCase(mockClienteRepo, mockSitioRepo, mockNotifService)

  beforeEach(() => jest.clearAllMocks())

  it('reactiva al cliente, sus sitios, y notifica que el sitio está listo', async () => {
    mockClienteRepo.findById.mockResolvedValueOnce(clienteMock)
    mockSitioRepo.findByClienteId.mockResolvedValueOnce([sitioMock])

    await useCase.execute(clienteMock.id)

    expect(mockClienteRepo.update).toHaveBeenCalledWith(
      clienteMock.id,
      expect.objectContaining({ activo: true }),
    )
    expect(mockSitioRepo.update).toHaveBeenCalledWith(sitioMock.id, { activo: true })
    expect(mockNotifService.enviarSitioListo).toHaveBeenCalledWith(
      clienteMock,
      expect.stringContaining(sitioMock.subdominio),
    )
  })

  it('lanza excepción si el cliente no existe', async () => {
    mockClienteRepo.findById.mockResolvedValueOnce(null)
    await expect(useCase.execute('no-existe')).rejects.toThrow(ClienteNoEncontradoException)
  })
})
