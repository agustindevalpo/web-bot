import { Pago } from '@/domain/entities/Pago'

export interface IPagoRepository {
  findById(id: string): Promise<Pago | null>
  findByClienteId(clienteId: string): Promise<Pago[]>
  save(pago: Pago): Promise<Pago>
  update(id: string, data: Partial<Pago>): Promise<Pago>
}
