import type { TokenAcceso as PrismaTokenAcceso } from '@prisma/client'
import { TokenAcceso } from '@/domain/entities/TokenAcceso'

export class TokenAccesoMapper {
  static toDomain(raw: PrismaTokenAcceso): TokenAcceso {
    return new TokenAcceso(
      raw.id,
      raw.email,
      raw.tokenHash,
      raw.expiraEn,
      raw.usadoEn,
      raw.fechaCreacion,
    )
  }

  static toPrisma(token: TokenAcceso) {
    return {
      id: token.id,
      email: token.email,
      tokenHash: token.tokenHash,
      expiraEn: token.expiraEn,
      usadoEn: token.usadoEn,
      fechaCreacion: token.fechaCreacion,
    }
  }
}
