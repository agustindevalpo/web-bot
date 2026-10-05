import { ISitioRepository } from '@/domain/repositories/ISitioRepository'
import { Sitio } from '@/domain/entities/Sitio'
import { SitioNoEncontradoException } from '@/domain/exceptions/SitioNoEncontradoException'
import { ConfigSitioInvalidaException } from '@/domain/exceptions/ConfigSitioInvalidaException'
import { normalizarRazonSocial, normalizarRut } from '@/domain/legal/datosLegales'

// Edita solo `configJson.legal` ({ razonSocial, rut }), que el footer de las
// plantillas lee en `comoLegal`. Los demás campos del config no se tocan. El
// footer exige ambos datos, así que o se guardan los dos o se quitan los dos.
export class ActualizarDatosLegalesSitioUseCase {
  constructor(private sitioRepo: ISitioRepository) {}

  async execute(sitioId: string, razonSocialCruda: string, rutCrudo: string): Promise<Sitio> {
    const sitio = await this.sitioRepo.findById(sitioId)
    if (!sitio) throw new SitioNoEncontradoException(sitioId)

    const sinRazon = razonSocialCruda.trim() === ''
    const sinRut = rutCrudo.trim() === ''

    const config = { ...sitio.configJson }

    if (sinRazon && sinRut) {
      delete config.legal
    } else if (sinRazon || sinRut) {
      throw new ConfigSitioInvalidaException(
        'Completa la razón social y el RUT, o deja ambos vacíos. El pie del sitio solo los muestra juntos.',
      )
    } else {
      const razon = normalizarRazonSocial(razonSocialCruda)
      if (!razon.ok) throw new ConfigSitioInvalidaException(razon.error)
      const rut = normalizarRut(rutCrudo)
      if (!rut.ok) throw new ConfigSitioInvalidaException(rut.error)
      config.legal = { razonSocial: razon.valor, rut: rut.valor }
    }

    return this.sitioRepo.update(sitioId, { configJson: config })
  }
}
