import { ISitioRepository } from '@/domain/repositories/ISitioRepository'
import { Sitio } from '@/domain/entities/Sitio'
import { SitioNoEncontradoException } from '@/domain/exceptions/SitioNoEncontradoException'
import { ConfigSitioInvalidaException } from '@/domain/exceptions/ConfigSitioInvalidaException'
import { IAlmacenamientoArchivos } from '@/application/services/IAlmacenamientoArchivos'
import { eliminarImagenesPropias } from '@/application/services/eliminarImagenesPropias'
import { urlsImagenDeConfig } from '@/domain/imagen/imagenesPropias'

export class ActualizarConfigSitioUseCase {
  constructor(
    private sitioRepo: ISitioRepository,
    private almacenamiento: IAlmacenamientoArchivos,
  ) {}

  async execute(sitioId: string, jsonTexto: string): Promise<Sitio> {
    const sitio = await this.sitioRepo.findById(sitioId)
    if (!sitio) throw new SitioNoEncontradoException(sitioId)

    const config = parsearConfig(jsonTexto)

    // Si el logo cambió pero `logoDimensiones` quedó igual, esa proporción es
    // del logo anterior: se descarta antes de guardar.
    const configAnterior = sitio.configJson
    const configFinal = descartarDimensionesViejas(configAnterior, config)

    const actualizado = await this.sitioRepo.update(sitioId, { configJson: configFinal })

    // Solo con el guardado hecho: se borran las imágenes propias que el JSON
    // nuevo ya no referencia.
    const vigentes = new Set(urlsImagenDeConfig(configFinal))
    const quitadas = urlsImagenDeConfig(configAnterior).filter((url) => !vigentes.has(url))
    await eliminarImagenesPropias(this.almacenamiento, sitioId, quitadas)

    return actualizado
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

function descartarDimensionesViejas(
  anterior: Record<string, unknown>,
  nuevo: Record<string, unknown>,
): Record<string, unknown> {
  const logoCambio = anterior.logo !== nuevo.logo
  const dimensionesIguales = JSON.stringify(anterior.logoDimensiones) === JSON.stringify(nuevo.logoDimensiones)
  if (!logoCambio || !dimensionesIguales || nuevo.logoDimensiones === undefined) return nuevo

  const resto = { ...nuevo }
  delete resto.logoDimensiones
  return resto
}
