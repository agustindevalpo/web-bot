import { ISitioRepository } from '@/domain/repositories/ISitioRepository'
import { IAlmacenamientoArchivos } from '@/application/services/IAlmacenamientoArchivos'
import { Sitio } from '@/domain/entities/Sitio'
import { SitioNoEncontradoException } from '@/domain/exceptions/SitioNoEncontradoException'
import { eliminarImagenesPropias } from '@/application/services/eliminarImagenesPropias'
import { urlsImagenDeConfig } from '@/domain/imagen/imagenesPropias'

// Máximo 10 MB: una carta completa con fotos de platos pesa más que una foto
// suelta (el tope de las imágenes es 5 MB).
const MAX_BYTES = 10 * 1024 * 1024

// Firma de todo PDF: los primeros bytes son "%PDF-". Se valida esto y no el
// Content-Type del browser, que es falsificable (mismo criterio que las fotos).
const FIRMA_PDF = [0x25, 0x50, 0x44, 0x46, 0x2d]

export type ResultadoCartaPdfSitio =
  | { tipo: 'ok'; url: string; sitio: Sitio }
  | { tipo: 'formato_no_soportado' }
  | { tipo: 'archivo_muy_grande' }
  | { tipo: 'no_configurado' }
  | { tipo: 'error'; detalle: string }

// Carta completa en PDF de un sitio (`configJson.cartaPdf`): una sola por
// sitio, complemento opcional de la carta armada (R6). Subir una nueva
// reemplaza la anterior y borra su objeto; quitarla borra el objeto y la clave.
export class SubirCartaPdfSitioUseCase {
  constructor(
    private sitioRepo: ISitioRepository,
    private almacenamiento: IAlmacenamientoArchivos,
  ) {}

  async execute(sitioId: string, bytes: Uint8Array): Promise<ResultadoCartaPdfSitio> {
    const sitio = await this.sitioRepo.findById(sitioId)
    if (!sitio) throw new SitioNoEncontradoException(sitioId)

    if (bytes.byteLength > MAX_BYTES) return { tipo: 'archivo_muy_grande' }
    if (!esPdf(bytes)) return { tipo: 'formato_no_soportado' }

    // Archivo plano bajo `sitios/<id>/`: es lo único que `claveSiPropia`
    // reconoce como propio (sin subcarpetas), así que la limpieza lo ve.
    const clave = `sitios/${sitioId}/carta-${crypto.randomUUID()}.pdf`
    const subida = await this.almacenamiento.subir({ clave, contenido: bytes, tipoContenido: 'application/pdf' })
    if (subida.tipo !== 'ok') return subida

    // Se relee el sitio tras la subida (tarda segundos) para no pisar lo que
    // otro guardado escribió mientras tanto.
    const vigente = (await this.sitioRepo.findById(sitioId)) ?? sitio
    const anterior = vigente.configJson.cartaPdf
    const configActualizado = { ...vigente.configJson, cartaPdf: subida.url }
    const sitioActualizado = await this.sitioRepo.update(sitioId, { configJson: configActualizado })

    if (typeof anterior === 'string' && !urlsImagenDeConfig(configActualizado).includes(anterior)) {
      await eliminarImagenesPropias(this.almacenamiento, sitioId, [anterior])
    }

    return { tipo: 'ok', url: subida.url, sitio: sitioActualizado }
  }

  async quitar(sitioId: string): Promise<Sitio> {
    const sitio = await this.sitioRepo.findById(sitioId)
    if (!sitio) throw new SitioNoEncontradoException(sitioId)

    const anterior = sitio.configJson.cartaPdf
    if (anterior === undefined) return sitio

    const resto = { ...sitio.configJson }
    delete resto.cartaPdf
    const actualizado = await this.sitioRepo.update(sitioId, { configJson: resto })

    if (typeof anterior === 'string') await eliminarImagenesPropias(this.almacenamiento, sitioId, [anterior])
    return actualizado
  }
}

function esPdf(bytes: Uint8Array): boolean {
  return bytes.length >= FIRMA_PDF.length && FIRMA_PDF.every((byte, i) => bytes[i] === byte)
}
