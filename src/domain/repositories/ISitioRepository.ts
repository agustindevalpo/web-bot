import { Sitio } from '@/domain/entities/Sitio'

export interface ISitioRepository {
  findById(id: string): Promise<Sitio | null>
  findBySubdominio(subdominio: string): Promise<Sitio | null>
  findByDominioPropio(dominio: string): Promise<Sitio | null>
  findByClienteId(clienteId: string): Promise<Sitio[]>
  save(sitio: Sitio): Promise<Sitio>
  update(id: string, data: Partial<Sitio>): Promise<Sitio>
  findAll(): Promise<Sitio[]>
}
