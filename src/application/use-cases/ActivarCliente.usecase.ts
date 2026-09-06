import { IClienteRepository } from '@/domain/repositories/IClienteRepository'
import { IPagoRepository } from '@/domain/repositories/IPagoRepository'
import { INotificacionService } from '@/application/services/INotificacionService'
import { Pago } from '@/domain/entities/Pago'
import { EstadoPago } from '@/domain/value-objects/EstadoPago'
import { Proveedor } from '@/domain/value-objects/Proveedor'
import { ClienteNoEncontradoException } from '@/domain/exceptions/ClienteNoEncontradoException'

export class ActivarClienteUseCase {
  constructor(
    private clienteRepo: IClienteRepository,
    private pagoRepo: IPagoRepository,
    private notificacionService: INotificacionService,
  ) {}

  // `referencia` es el identificador del pago en el proveedor (p. ej. el número
  // de operación de Mercado Pago que Devalpo copia a mano desde el panel, WB-43).
  async execute(clienteId: string, monto: number, proveedor: Proveedor, referencia?: string): Promise<void> {
    const cliente = await this.clienteRepo.findById(clienteId)
    if (!cliente) throw new ClienteNoEncontradoException(clienteId)

    cliente.activar()
    await this.clienteRepo.update(clienteId, {
      activo: true,
      fechaPago: cliente.fechaPago,
    })

    await this.pagoRepo.save(
      new Pago(crypto.randomUUID(), clienteId, monto, EstadoPago.CONFIRMADO, proveedor, referencia ?? null),
    )
  }
}
