import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import {
  IAlmacenamientoArchivos,
  ArchivoASubir,
  ResultadoSubida,
} from '@/application/services/IAlmacenamientoArchivos'

// Cloudflare R2 vía su endpoint S3-compatible.
// Docs: https://developers.cloudflare.com/r2/api/s3/api/
// Nunca lanza hacia afuera ni loguea las credenciales: cualquier fallo se
// traduce a `{ tipo: 'error', detalle }` genérico, mismo patrón que
// CloudflareCustomHostnameService.

// Un año — las claves son únicas por subida (uuid en el nombre), así que el
// objeto nunca cambia de contenido bajo la misma URL.
const CACHE_CONTROL_INMUTABLE = 'public, max-age=31536000, immutable'

type ClienteS3 = Pick<S3Client, 'send'>

export interface R2AlmacenamientoArchivosOptions {
  accountId: string
  accessKeyId: string
  secretAccessKey: string
  bucket: string
  urlPublica: string
  cliente?: ClienteS3
}

export class R2AlmacenamientoArchivos implements IAlmacenamientoArchivos {
  private readonly cliente: ClienteS3
  private readonly bucket: string
  private readonly urlPublica: string

  constructor({ accountId, accessKeyId, secretAccessKey, bucket, urlPublica, cliente }: R2AlmacenamientoArchivosOptions) {
    this.bucket = bucket
    this.urlPublica = urlPublica.replace(/\/+$/, '')
    this.cliente =
      cliente ??
      new S3Client({
        region: 'auto',
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: { accessKeyId, secretAccessKey },
      })
  }

  async subir({ clave, contenido, tipoContenido }: ArchivoASubir): Promise<ResultadoSubida> {
    try {
      await this.cliente.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: clave,
          Body: contenido,
          ContentType: tipoContenido,
          CacheControl: CACHE_CONTROL_INMUTABLE,
        }),
      )
      return { tipo: 'ok', url: `${this.urlPublica}/${clave}` }
    } catch {
      return { tipo: 'error', detalle: 'No se pudo subir el archivo a R2.' }
    }
  }
}
