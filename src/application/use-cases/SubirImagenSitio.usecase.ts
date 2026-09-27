import { ISitioRepository } from '@/domain/repositories/ISitioRepository'
import { IAlmacenamientoArchivos } from '@/application/services/IAlmacenamientoArchivos'
import { Sitio } from '@/domain/entities/Sitio'
import { SitioNoEncontradoException } from '@/domain/exceptions/SitioNoEncontradoException'

// Máximo 5 MB por archivo (Decisión 2026-09-27 del feature de subida de
// imágenes, ver odd/tasks/subida-imagenes-admin.md).
const MAX_BYTES = 5 * 1024 * 1024

// `hero` no es un campo propio de configJson: los templates derivan la foto
// principal de `imagenes[0]` (ninguno lee un `imagenHero` separado —
// verificado por grep, la premisa original de este feature estaba mal). Por
// eso `hero` reemplaza el índice 0 de `imagenes` (o lo crea si está vacío)
// en vez de escribir una clave nueva; solo sirve para nombrar la clave del
// objeto en el storage (`sitios/<id>/hero-<uuid>.<ext>`) y el mensaje en
// /admin. No se toca ningún template.
export type CampoImagenSitio = 'logo' | 'hero' | 'imagenes'

// `logo`/`hero` no lanzan (para que el llamador solo maneje mensajes, no
// excepciones) porque son entradas esperables de un cliente subiendo un
// archivo cualquiera desde WhatsApp — formato equivocado, SVG, archivo
// pesado. `no_configurado`/`error` replican el shape de
// IAlmacenamientoArchivos.subir. `sitioId` inexistente sigue lanzando
// SitioNoEncontradoException, igual que ActualizarConfigSitioUseCase: eso
// nunca debería pasar desde /admin, así que no es una entrada esperable.
export type ResultadoSubirImagenSitio =
  | { tipo: 'ok'; url: string; sitio: Sitio }
  | { tipo: 'formato_no_soportado' }
  | { tipo: 'archivo_muy_grande' }
  | { tipo: 'no_configurado' }
  | { tipo: 'error'; detalle: string }

interface FormatoDetectado {
  extension: string
  mime: string
}

export class SubirImagenSitioUseCase {
  constructor(
    private sitioRepo: ISitioRepository,
    private almacenamiento: IAlmacenamientoArchivos,
  ) {}

  async execute(sitioId: string, campo: CampoImagenSitio, bytes: Uint8Array): Promise<ResultadoSubirImagenSitio> {
    const sitio = await this.sitioRepo.findById(sitioId)
    if (!sitio) throw new SitioNoEncontradoException(sitioId)

    if (bytes.byteLength > MAX_BYTES) {
      return { tipo: 'archivo_muy_grande' }
    }

    const formato = detectarFormato(bytes)
    if (!formato) {
      return { tipo: 'formato_no_soportado' }
    }

    const clave = `sitios/${sitioId}/${campo}-${crypto.randomUUID()}.${formato.extension}`
    const resultadoSubida = await this.almacenamiento.subir({ clave, contenido: bytes, tipoContenido: formato.mime })

    if (resultadoSubida.tipo !== 'ok') {
      return resultadoSubida
    }

    // La subida tarda segundos: se vuelve a leer el sitio para no pisar con
    // la copia vieja lo que otra subida o un guardado del JSON escribió
    // mientras tanto. Achica la ventana de carrera; no la elimina.
    const sitioVigente = (await this.sitioRepo.findById(sitioId)) ?? sitio
    const configActualizado = aplicarImagen(sitioVigente.configJson, campo, resultadoSubida.url)
    const sitioActualizado = await this.sitioRepo.update(sitioId, { configJson: configActualizado })

    return { tipo: 'ok', url: resultadoSubida.url, sitio: sitioActualizado }
  }
}

function aplicarImagen(
  config: Record<string, unknown>,
  campo: CampoImagenSitio,
  url: string,
): Record<string, unknown> {
  if (campo === 'logo') {
    return { ...config, logo: url }
  }

  const actuales = Array.isArray(config.imagenes)
    ? (config.imagenes as unknown[]).filter((valor): valor is string => typeof valor === 'string')
    : []

  if (campo === 'imagenes') {
    return { ...config, imagenes: [...actuales, url] }
  }

  // campo === 'hero': reemplaza el índice 0 (o lo crea si `imagenes` está
  // vacío/ausente) en vez de acumular.
  const nuevasImagenes = actuales.length === 0 ? [url] : [url, ...actuales.slice(1)]
  return { ...config, imagenes: nuevasImagenes }
}

// Detección por magic bytes, no por el Content-Type que manda el browser
// (falsificable): solo JPEG, PNG y WebP. Nunca SVG — next/image lo rechaza
// por defecto y puede llevar script embebido.
function detectarFormato(bytes: Uint8Array): FormatoDetectado | null {
  if (esJpeg(bytes)) return { extension: 'jpg', mime: 'image/jpeg' }
  if (esPng(bytes)) return { extension: 'png', mime: 'image/png' }
  if (esWebp(bytes)) return { extension: 'webp', mime: 'image/webp' }
  return null
}

function esJpeg(bytes: Uint8Array): boolean {
  return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
}

function esPng(bytes: Uint8Array): boolean {
  const firma = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
  return bytes.length >= firma.length && firma.every((byte, i) => bytes[i] === byte)
}

function esWebp(bytes: Uint8Array): boolean {
  if (bytes.length < 12) return false
  const riff = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3])
  const webp = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11])
  return riff === 'RIFF' && webp === 'WEBP'
}
