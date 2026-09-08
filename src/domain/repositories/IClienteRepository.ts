import { Cliente } from '@/domain/entities/Cliente'

export interface IClienteRepository {
  findById(id: string): Promise<Cliente | null>
  findByEmail(email: string): Promise<Cliente | null>
  save(cliente: Cliente): Promise<Cliente>
  update(id: string, data: Partial<Cliente>): Promise<Cliente>
  delete(id: string): Promise<void>
  findAll(): Promise<Cliente[]>
  // Busca por email; si no existe, crea `cliente`. Debe resolver de forma
  // segura ante intentos concurrentes con el mismo email (ver implementación
  // de infraestructura para el manejo de la violación de unicidad).
  findOrCreateByEmail(cliente: Cliente): Promise<Cliente>
}
