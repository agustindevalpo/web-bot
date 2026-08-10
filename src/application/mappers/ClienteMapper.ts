import type { Cliente as PrismaCliente } from '@prisma/client'
import { Cliente } from '@/domain/entities/Cliente'

export class ClienteMapper {
  static toDomain(raw: PrismaCliente): Cliente {
    return new Cliente(
      raw.id,
      raw.email,
      raw.nombre,
      raw.plan,
      raw.activo,
      raw.fechaPago,
      raw.telefono ?? undefined,
    )
  }

  static toPrisma(cliente: Cliente) {
    return {
      id: cliente.id,
      email: cliente.email,
      nombre: cliente.nombre,
      telefono: cliente.telefono ?? null,
      plan: cliente.plan,
      activo: cliente.activo,
      fechaPago: cliente.fechaPago,
    }
  }
}
