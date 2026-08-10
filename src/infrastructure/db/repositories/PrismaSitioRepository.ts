import type { Prisma } from '@prisma/client'
import { prisma } from '@/infrastructure/db'
import { ISitioRepository } from '@/domain/repositories/ISitioRepository'
import { Sitio } from '@/domain/entities/Sitio'
import { SitioMapper } from '@/application/mappers/SitioMapper'

export class PrismaSitioRepository implements ISitioRepository {
  async findBySubdominio(subdominio: string): Promise<Sitio | null> {
    const raw = await prisma.sitio.findUnique({ where: { subdominio } })
    return raw ? SitioMapper.toDomain(raw) : null
  }

  async findByDominioPropio(dominio: string): Promise<Sitio | null> {
    const raw = await prisma.sitio.findUnique({ where: { dominioPropio: dominio } })
    return raw ? SitioMapper.toDomain(raw) : null
  }

  async findByClienteId(clienteId: string): Promise<Sitio[]> {
    const raws = await prisma.sitio.findMany({ where: { clienteId } })
    return raws.map(SitioMapper.toDomain)
  }

  async save(sitio: Sitio): Promise<Sitio> {
    const raw = await prisma.sitio.create({
      data: SitioMapper.toPrisma(sitio),
    })
    return SitioMapper.toDomain(raw)
  }

  async update(id: string, data: Partial<Sitio>): Promise<Sitio> {
    // configJson (Record<string, unknown> en el dominio) no calza 1:1 con la
    // unión de tipos de Prisma para update — se convierte en el borde de infra.
    const raw = await prisma.sitio.update({
      where: { id },
      data: data as unknown as Prisma.SitioUpdateInput,
    })
    return SitioMapper.toDomain(raw)
  }

  async findAll(): Promise<Sitio[]> {
    const raws = await prisma.sitio.findMany()
    return raws.map(SitioMapper.toDomain)
  }
}
