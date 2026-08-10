import { Prisma } from '@prisma/client'
import type { Sesion as PrismaSesion } from '@prisma/client'
import { Sesion, MensajeHistorial } from '@/domain/entities/Sesion'

export class SesionMapper {
  static toDomain(raw: PrismaSesion): Sesion {
    const sesion = new Sesion(raw.id, raw.sessionId, raw.fechaCreacion)
    sesion.historial = (raw.historial as unknown as MensajeHistorial[]) ?? []
    sesion.datosJson = raw.datosJson as Record<string, unknown> | null
    sesion.completada = raw.completada
    return sesion
  }

  static toPrisma(sesion: Sesion) {
    return {
      id: sesion.id,
      sessionId: sesion.sessionId,
      historial: sesion.historial as unknown as Prisma.InputJsonValue,
      datosJson: (sesion.datosJson as Prisma.InputJsonValue | null) ?? Prisma.JsonNull,
      completada: sesion.completada,
    }
  }
}
