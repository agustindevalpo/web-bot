import { Sesion } from '@/domain/entities/Sesion'

export interface ISesionRepository {
  findBySessionId(sessionId: string): Promise<Sesion | null>
  save(sesion: Sesion): Promise<Sesion>
  update(sessionId: string, data: Partial<Sesion>): Promise<Sesion>
}
