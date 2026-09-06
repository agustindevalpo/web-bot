import { ISitioRepository } from '@/domain/repositories/ISitioRepository'
import { Sitio } from '@/domain/entities/Sitio'
import { SitioNoEncontradoException } from '@/domain/exceptions/SitioNoEncontradoException'
import { ConfigSitioInvalidaException } from '@/domain/exceptions/ConfigSitioInvalidaException'

export class ActualizarConfigSitioUseCase {
  constructor(private sitioRepo: ISitioRepository) {}

  async execute(sitioId: string, jsonTexto: string): Promise<Sitio> {
    const sitio = await this.sitioRepo.findById(sitioId)
    if (!sitio) throw new SitioNoEncontradoException(sitioId)

    const config = parsearConfig(jsonTexto)

    return this.sitioRepo.update(sitioId, { configJson: config })
  }
}

function parsearConfig(jsonTexto: string): Record<string, unknown> {
  let parseado: unknown
  try {
    parseado = JSON.parse(jsonTexto)
  } catch (error) {
    const detalle = error instanceof Error ? error.message : 'error de sintaxis'
    throw new ConfigSitioInvalidaException(`El contenido no es JSON válido: ${detalle}`)
  }

  if (typeof parseado !== 'object' || parseado === null || Array.isArray(parseado)) {
    throw new ConfigSitioInvalidaException('El contenido debe ser un objeto JSON (entre llaves).')
  }

  const config = parseado as Record<string, unknown>
  if (typeof config.nombre !== 'string' || config.nombre.trim() === '') {
    throw new ConfigSitioInvalidaException('El campo "nombre" es obligatorio y debe ser un texto no vacío.')
  }

  return config
}
