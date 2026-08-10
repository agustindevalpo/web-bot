import type { Prisma } from '@prisma/client'
import { prisma } from '@/infrastructure/db'
import { ISesionRepository } from '@/domain/repositories/ISesionRepository'
import { Sesion } from '@/domain/entities/Sesion'
import { SesionMapper } from '@/application/mappers/SesionMapper'

export class PrismaSesionRepository implements ISesionRepository {
  async findBySessionId(sessionId: string): Promise<Sesion | null> {
    const raw = await prisma.sesion.findUnique({ where: { sessionId } })
    return raw ? SesionMapper.toDomain(raw) : null
  }

  async save(sesion: Sesion): Promise<Sesion> {
    const raw = await prisma.sesion.create({
      data: SesionMapper.toPrisma(sesion),
    })
    return SesionMapper.toDomain(raw)
  }

  async update(sessionId: string, data: Partial<Sesion>): Promise<Sesion> {
    // Los campos JSON del dominio (historial/datosJson) no calzan 1:1 con la
    // unión de tipos de Prisma para update — se convierte en el borde de infra.
    const raw = await prisma.sesion.update({
      where: { sessionId },
      data: data as unknown as Prisma.SesionUpdateInput,
    })
    return SesionMapper.toDomain(raw)
  }
}
