import { prisma } from '@/infrastructure/db'
import { IClienteRepository } from '@/domain/repositories/IClienteRepository'
import { Cliente } from '@/domain/entities/Cliente'
import { ClienteMapper } from '@/application/mappers/ClienteMapper'

export class PrismaClienteRepository implements IClienteRepository {
  async findById(id: string): Promise<Cliente | null> {
    const raw = await prisma.cliente.findUnique({ where: { id } })
    return raw ? ClienteMapper.toDomain(raw) : null
  }

  async findByEmail(email: string): Promise<Cliente | null> {
    const raw = await prisma.cliente.findUnique({ where: { email } })
    return raw ? ClienteMapper.toDomain(raw) : null
  }

  async save(cliente: Cliente): Promise<Cliente> {
    const raw = await prisma.cliente.create({
      data: ClienteMapper.toPrisma(cliente),
    })
    return ClienteMapper.toDomain(raw)
  }

  async update(id: string, data: Partial<Cliente>): Promise<Cliente> {
    const raw = await prisma.cliente.update({ where: { id }, data })
    return ClienteMapper.toDomain(raw)
  }

  async delete(id: string): Promise<void> {
    await prisma.cliente.delete({ where: { id } })
  }

  async findAll(): Promise<Cliente[]> {
    const raws = await prisma.cliente.findMany()
    return raws.map(ClienteMapper.toDomain)
  }
}
