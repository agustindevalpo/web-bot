import type { Sitio as PrismaSitio, Prisma } from '@prisma/client'
import { Sitio } from '@/domain/entities/Sitio'

export class SitioMapper {
  static toDomain(raw: PrismaSitio): Sitio {
    return new Sitio(
      raw.id,
      raw.clienteId,
      raw.subdominio,
      raw.template,
      raw.configJson as Record<string, unknown>,
      raw.activo,
      raw.dominioPropio,
      raw.fechaCreacion,
    )
  }

  static toPrisma(sitio: Sitio) {
    return {
      id: sitio.id,
      clienteId: sitio.clienteId,
      subdominio: sitio.subdominio,
      dominioPropio: sitio.dominioPropio,
      template: sitio.template,
      configJson: sitio.configJson as Prisma.InputJsonValue,
      activo: sitio.activo,
    }
  }
}
