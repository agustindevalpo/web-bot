import { TokenAcceso } from '@/domain/entities/TokenAcceso'

export interface ITokenAccesoRepository {
  findByTokenHash(tokenHash: string): Promise<TokenAcceso | null>
  save(token: TokenAcceso): Promise<TokenAcceso>
  update(id: string, data: Partial<TokenAcceso>): Promise<TokenAcceso>
  countRecientesPorEmail(email: string, desde: Date): Promise<number>
}
