import { prisma } from '@/infrastructure/db'
import { ITokenAccesoRepository } from '@/domain/repositories/ITokenAccesoRepository'
import { TokenAcceso } from '@/domain/entities/TokenAcceso'
import { TokenAccesoMapper } from '@/application/mappers/TokenAccesoMapper'

export class PrismaTokenAccesoRepository implements ITokenAccesoRepository {
  async findByTokenHash(tokenHash: string): Promise<TokenAcceso | null> {
    const raw = await prisma.tokenAcceso.findUnique({ where: { tokenHash } })
    return raw ? TokenAccesoMapper.toDomain(raw) : null
  }

  async save(token: TokenAcceso): Promise<TokenAcceso> {
    const raw = await prisma.tokenAcceso.create({
      data: TokenAccesoMapper.toPrisma(token),
    })
    return TokenAccesoMapper.toDomain(raw)
  }

  async update(id: string, data: Partial<TokenAcceso>): Promise<TokenAcceso> {
    const raw = await prisma.tokenAcceso.update({ where: { id }, data })
    return TokenAccesoMapper.toDomain(raw)
  }

  async countRecientesPorEmail(email: string, desde: Date): Promise<number> {
    return prisma.tokenAcceso.count({
      where: { email, fechaCreacion: { gte: desde } },
    })
  }
}
