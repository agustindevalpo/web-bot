import { ISesionRepository } from '@/domain/repositories/ISesionRepository'
import { Sesion } from '@/domain/entities/Sesion'

export class MockSesionRepository implements ISesionRepository {
  private store: Map<string, Sesion> = new Map()

  constructor(seedData: Sesion[] = []) {
    seedData.forEach((s) => this.store.set(s.sessionId, s))
  }

  async findBySessionId(sessionId: string) {
    return this.store.get(sessionId) ?? null
  }

  async save(sesion: Sesion) {
    this.store.set(sesion.sessionId, sesion)
    return sesion
  }

  async update(sessionId: string, data: Partial<Sesion>) {
    const s = this.store.get(sessionId)
    if (!s) throw new Error('Not found')
    Object.assign(s, data)
    return s
  }
}
