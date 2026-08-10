import { Cliente } from '@/domain/entities/Cliente'

export interface IClienteRepository {
  findById(id: string): Promise<Cliente | null>
  findByEmail(email: string): Promise<Cliente | null>
  save(cliente: Cliente): Promise<Cliente>
  update(id: string, data: Partial<Cliente>): Promise<Cliente>
  delete(id: string): Promise<void>
  findAll(): Promise<Cliente[]>
}
