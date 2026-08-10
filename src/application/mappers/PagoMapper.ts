import type { Pago as PrismaPago } from '@prisma/client'
import { Pago } from '@/domain/entities/Pago'

export class PagoMapper {
  static toDomain(raw: PrismaPago): Pago {
    return new Pago(
      raw.id,
      raw.clienteId,
      raw.monto,
      raw.estado,
      raw.proveedor,
      raw.referencia,
      raw.fecha,
    )
  }

  static toPrisma(pago: Pago) {
    return {
      id: pago.id,
      clienteId: pago.clienteId,
      monto: pago.monto,
      estado: pago.estado,
      proveedor: pago.proveedor,
      referencia: pago.referencia,
    }
  }
}
