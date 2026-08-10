import { IClienteRepository } from '@/domain/repositories/IClienteRepository'
import { Cliente } from '@/domain/entities/Cliente'

export class MockClienteRepository implements IClienteRepository {
  private store: Map<string, Cliente> = new Map()

  constructor(seedData: Cliente[] = []) {
    seedData.forEach((c) => this.store.set(c.id, c))
  }

  async findById(id: string) {
    return this.store.get(id) ?? null
  }

  async findByEmail(email: string) {
    return [...this.store.values()].find((c) => c.email === email) ?? null
  }

  async save(cliente: Cliente) {
    this.store.set(cliente.id, cliente)
    return cliente
  }

  async update(id: string, data: Partial<Cliente>) {
    const c = this.store.get(id)
    if (!c) throw new Error('Not found')
    Object.assign(c, data)
    return c
  }

  async delete(id: string) {
    this.store.delete(id)
  }

  async findAll() {
    return [...this.store.values()]
  }
}
