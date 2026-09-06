import { ActivarClienteUseCase } from '@/application/use-cases/ActivarCliente.usecase'
import { Cliente } from '@/domain/entities/Cliente'
import { Pago } from '@/domain/entities/Pago'
import { EstadoPago } from '@/domain/value-objects/EstadoPago'
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

  it('registra el pago como CONFIRMADO con Mercado Pago y la referencia (WB-43)', async () => {
    const cliente = Cliente.crear('c@d.cl', 'Cliente Nuevo', Plan.PRO)
    mockClienteRepo.findById.mockResolvedValueOnce(cliente)
    mockClienteRepo.update.mockResolvedValueOnce(cliente)

    await useCase.execute(cliente.id, 119990, Proveedor.MERCADOPAGO, 'MP-123456789')

    expect(cliente.activo).toBe(true)
    expect(cliente.fechaPago).toBeInstanceOf(Date)
    expect(mockClienteRepo.update).toHaveBeenCalledWith(cliente.id, { activo: true, fechaPago: cliente.fechaPago })

    const pago = mockPagoRepo.save.mock.calls[0][0] as Pago
    expect(pago).toBeInstanceOf(Pago)
    expect(pago.clienteId).toBe(cliente.id)
    expect(pago.monto).toBe(119990)
    expect(pago.estado).toBe(EstadoPago.CONFIRMADO)
    expect(pago.proveedor).toBe(Proveedor.MERCADOPAGO)
    expect(pago.referencia).toBe('MP-123456789')
  })

  it('guarda referencia null cuando no se entrega (compatibilidad con la firma anterior)', async () => {
    mockClienteRepo.findById.mockResolvedValueOnce(clienteMock)
    mockClienteRepo.update.mockResolvedValueOnce(clienteMock)

    await useCase.execute('cli-123', 149990, Proveedor.MERCADOPAGO)

    const pago = mockPagoRepo.save.mock.calls[0][0] as Pago
    expect(pago.referencia).toBeNull()
    expect(pago.estado).toBe(EstadoPago.CONFIRMADO)
  })

  it('lanza excepción si el cliente no existe', async () => {
    mockClienteRepo.findById.mockResolvedValueOnce(null)
    await expect(useCase.execute('no-existe', 0, Proveedor.FLOW)).rejects.toThrow(
      ClienteNoEncontradoException,
    )
  })
})
