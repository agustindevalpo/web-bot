import { ISitioRepository } from '@/domain/repositories/ISitioRepository'
import { Sitio } from '@/domain/entities/Sitio'

export class MockSitioRepository implements ISitioRepository {
  private store: Map<string, Sitio> = new Map()

  constructor(seedData: Sitio[] = []) {
    seedData.forEach((s) => this.store.set(s.id, s))
  }

  async findById(id: string) {
    return this.store.get(id) ?? null
  }

  async findBySubdominio(subdominio: string) {
    return [...this.store.values()].find((s) => s.subdominio === subdominio) ?? null
  }

  async findByDominioPropio(dominio: string) {
    return [...this.store.values()].find((s) => s.dominioPropio === dominio) ?? null
  }

  async findByClienteId(clienteId: string) {
    return [...this.store.values()].filter((s) => s.clienteId === clienteId)
  }

  async save(sitio: Sitio) {
    this.store.set(sitio.id, sitio)
    return sitio
  }

  async update(id: string, data: Partial<Sitio>) {
    const s = this.store.get(id)
    if (!s) throw new Error('Not found')
    Object.assign(s, data)
    return s
  }

  async findAll() {
    return [...this.store.values()]
  }
}
