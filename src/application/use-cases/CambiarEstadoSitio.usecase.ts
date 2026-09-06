import { ISitioRepository } from '@/domain/repositories/ISitioRepository'
import { Sitio } from '@/domain/entities/Sitio'
import { SitioNoEncontradoException } from '@/domain/exceptions/SitioNoEncontradoException'

export class CambiarEstadoSitioUseCase {
  constructor(private sitioRepo: ISitioRepository) {}

  async execute(sitioId: string, activo: boolean): Promise<Sitio> {
    const sitio = await this.sitioRepo.findById(sitioId)
    if (!sitio) throw new SitioNoEncontradoException(sitioId)

    if (activo) {
      sitio.reactivar()
    } else {
      sitio.pausar()
    }

    return this.sitioRepo.update(sitioId, { activo: sitio.activo })
  }
}
