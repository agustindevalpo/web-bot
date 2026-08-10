import { IPagoRepository } from '@/domain/repositories/IPagoRepository'
import { Pago } from '@/domain/entities/Pago'

export class MockPagoRepository implements IPagoRepository {
  private store: Map<string, Pago> = new Map()

  constructor(seedData: Pago[] = []) {
    seedData.forEach((p) => this.store.set(p.id, p))
  }

  async findById(id: string) {
    return this.store.get(id) ?? null
  }

  async findByClienteId(clienteId: string) {
    return [...this.store.values()].filter((p) => p.clienteId === clienteId)
  }

  async save(pago: Pago) {
    this.store.set(pago.id, pago)
    return pago
  }

  async update(id: string, data: Partial<Pago>) {
    const p = this.store.get(id)
    if (!p) throw new Error('Not found')
    Object.assign(p, data)
    return p
  }
}
