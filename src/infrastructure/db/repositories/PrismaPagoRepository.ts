import { prisma } from '@/infrastructure/db'
import { IPagoRepository } from '@/domain/repositories/IPagoRepository'
import { Pago } from '@/domain/entities/Pago'
import { PagoMapper } from '@/application/mappers/PagoMapper'

export class PrismaPagoRepository implements IPagoRepository {
  async findById(id: string): Promise<Pago | null> {
    const raw = await prisma.pago.findUnique({ where: { id } })
    return raw ? PagoMapper.toDomain(raw) : null
  }

  async findByClienteId(clienteId: string): Promise<Pago[]> {
    const raws = await prisma.pago.findMany({ where: { clienteId } })
    return raws.map(PagoMapper.toDomain)
  }

  async save(pago: Pago): Promise<Pago> {
    const raw = await prisma.pago.create({
      data: PagoMapper.toPrisma(pago),
    })
    return PagoMapper.toDomain(raw)
  }

  async update(id: string, data: Partial<Pago>): Promise<Pago> {
    const raw = await prisma.pago.update({ where: { id }, data })
    return PagoMapper.toDomain(raw)
  }
}
