import { ISitioRepository } from '@/domain/repositories/ISitioRepository'
import { ICustomHostnameService, ResultadoHostname } from '@/application/services/ICustomHostnameService'
import { SitioNoEncontradoException } from '@/domain/exceptions/SitioNoEncontradoException'
import { DominioInvalidoException } from '@/domain/exceptions/DominioInvalidoException'

// Dominios que son nuestros: un cliente nunca puede "conectar" un dominio
// de Devalpo como propio.
const DOMINIO_PROPIO_DEVALPO = 'devalpo.cl'
const MAX_LARGO_HOSTNAME = 253
const MAX_LARGO_LABEL = 63
const LABEL_REGEX = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/

export interface ResultadoAsignarDominio {
  dominio: string | null
  hostname: ResultadoHostname | null
}

export class AsignarDominioPropioUseCase {
  constructor(
    private sitioRepo: ISitioRepository,
    private customHostnameService: ICustomHostnameService,
  ) {}

  async execute(sitioId: string, dominioCrudo: string): Promise<ResultadoAsignarDominio> {
    const sitio = await this.sitioRepo.findById(sitioId)
    if (!sitio) throw new SitioNoEncontradoException(sitioId)

    const dominio = normalizarDominio(dominioCrudo)

    if (dominio === '') {
      return this.quitarDominio(sitioId, sitio.dominioPropio)
    }

    validarHostname(dominio)

    const duenoActual = await this.sitioRepo.findByDominioPropio(dominio)
    if (duenoActual && duenoActual.id !== sitioId) {
      throw new DominioInvalidoException(`El dominio ${dominio} ya está asignado a otro sitio.`)
    }

    sitio.conectarDominio(dominio)
    await this.sitioRepo.update(sitioId, { dominioPropio: dominio })

    const hostname = await this.customHostnameService.asegurarHostname(dominio)

    return { dominio, hostname }
  }

  private async quitarDominio(sitioId: string, dominioAnterior: string | null): Promise<ResultadoAsignarDominio> {
    await this.sitioRepo.update(sitioId, { dominioPropio: null })

    if (dominioAnterior) {
      // Mejor esfuerzo: si el proveedor falla, el dominio igual queda
      // desvinculado en nuestra base.
      try {
        await this.customHostnameService.eliminarHostname(dominioAnterior)
      } catch {
        // Silenciado a propósito.
      }
    }

    return { dominio: null, hostname: null }
  }
}

export function normalizarDominio(crudo: string): string {
  let dominio = crudo.trim().toLowerCase()
  dominio = dominio.replace(/^https?:\/\//, '')
  // Todo lo que venga después de la primera barra es ruta, no hostname.
  dominio = dominio.replace(/\/.*$/, '')
  dominio = dominio.replace(/:\d+$/, '')
  return dominio
}

function validarHostname(dominio: string): void {
  if (dominio.length > MAX_LARGO_HOSTNAME) {
    throw new DominioInvalidoException('El dominio es demasiado largo.')
  }

  const labels = dominio.split('.')
  if (labels.length < 2) {
    throw new DominioInvalidoException('Ingresa un dominio completo, por ejemplo www.minegocio.cl.')
  }

  const labelInvalido = labels.some((label) => label.length > MAX_LARGO_LABEL || !LABEL_REGEX.test(label))
  if (labelInvalido) {
    throw new DominioInvalidoException(
      'El dominio solo puede contener letras, números, guiones y puntos, sin guiones al inicio o al final.',
    )
  }

  if (dominio === DOMINIO_PROPIO_DEVALPO || dominio.endsWith(`.${DOMINIO_PROPIO_DEVALPO}`)) {
    throw new DominioInvalidoException('Los dominios de Devalpo no se pueden asignar como dominio propio.')
  }
}
