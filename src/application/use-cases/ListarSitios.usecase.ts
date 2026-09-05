import { ISitioRepository } from '@/domain/repositories/ISitioRepository'
import { Sitio } from '@/domain/entities/Sitio'

export class ListarSitiosUseCase {
  constructor(private sitioRepo: ISitioRepository) {}

  async execute(): Promise<Sitio[]> {
    const sitios = await this.sitioRepo.findAll()
    // Los más recientes primero — copia para no mutar lo que devuelva el repo.
    return [...sitios].sort((a, b) => b.fechaCreacion.getTime() - a.fechaCreacion.getTime())
  }
}
