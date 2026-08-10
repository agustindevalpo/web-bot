import { ActivarClienteUseCase } from '@/application/use-cases/ActivarCliente.usecase'
import { Cliente } from '@/domain/entities/Cliente'
import { Plan } from '@/domain/value-objects/Plan'
import { Proveedor } from '@/domain/value-objects/Proveedor'
import { ClienteNoEncontradoException } from '@/domain/exceptions/ClienteNoEncontradoException'

describe('ActivarCliente UseCase', () => {
  const clienteMock = Cliente.crear('a@b.cl', 'Test', Plan.PRO)

  const mockClienteRepo = {
    findById: jest.fn().mockResolvedValue(clienteMock),
    update: jest.fn().mockResolvedValue(clienteMock),
    findByEmail: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    findAll: jest.fn(),
  }

  const mockPagoRepo = {
    save: jest.fn().mockResolvedValue({}),
    findById: jest.fn(),
    findByClienteId: jest.fn(),
    update: jest.fn(),
  }

  const mockNotifService = {
    enviarBienvenida: jest.fn().mockResolvedValue(undefined),
    enviarSitioListo: jest.fn().mockResolvedValue(undefined),
    enviarAvisoVencimiento: jest.fn().mockResolvedValue(undefined),
    enviarPagoFallido: jest.fn().mockResolvedValue(undefined),
  }

  const useCase = new ActivarClienteUseCase(mockClienteRepo, mockPagoRepo, mockNotifService)

  beforeEach(() => jest.clearAllMocks())

  it('activa el cliente y registra el pago', async () => {
    mockClienteRepo.findById.mockResolvedValueOnce(clienteMock)
    mockClienteRepo.update.mockResolvedValueOnce(clienteMock)

    await useCase.execute('cli-123', 39990, Proveedor.FLOW)

    expect(mockClienteRepo.findById).toHaveBeenCalledWith('cli-123')
    expect(mockClienteRepo.update).toHaveBeenCalledWith(
      'cli-123',
      expect.objectContaining({ activo: true }),
    )
    expect(mockPagoRepo.save).toHaveBeenCalledTimes(1)
  })

  it('lanza excepción si el cliente no existe', async () => {
    mockClienteRepo.findById.mockResolvedValueOnce(null)
    await expect(useCase.execute('no-existe', 0, Proveedor.FLOW)).rejects.toThrow(
      ClienteNoEncontradoException,
    )
  })
})
