import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { R2AlmacenamientoArchivos } from '@/infrastructure/storage/R2AlmacenamientoArchivos'
import { NoopAlmacenamientoArchivos } from '@/infrastructure/storage/NoopAlmacenamientoArchivos'
import { IAlmacenamientoArchivos } from '@/application/services/IAlmacenamientoArchivos'

function crearClienteFake(handler: (comando: PutObjectCommand | DeleteObjectCommand) => Promise<unknown> | unknown) {
  const llamadas: (PutObjectCommand | DeleteObjectCommand)[] = []
  const send = jest.fn(async (comando: PutObjectCommand | DeleteObjectCommand) => {
    llamadas.push(comando)
    return handler(comando)
  })
  return { cliente: { send }, llamadas }
}

const OPCIONES_BASE = {
  accountId: 'cuenta-1',
  accessKeyId: 'ak-secreto',
  secretAccessKey: 'sk-secreto',
  bucket: 'devalpo-media',
  urlPublica: 'https://media.devalpo.cl',
}

describe('R2AlmacenamientoArchivos', () => {
  it('elimina el objeto por clave y expone la URL pública sin barra final', async () => {
    const { cliente, llamadas } = crearClienteFake(() => ({}))
    const servicio = new R2AlmacenamientoArchivos({ ...OPCIONES_BASE, urlPublica: 'https://media.devalpo.cl/', cliente })

    const resultado = await servicio.eliminar('sitios/sitio-1/logo-abc.png')

    expect(resultado).toEqual({ tipo: 'ok' })
    expect(llamadas[0]).toBeInstanceOf(DeleteObjectCommand)
    expect(llamadas[0].input).toEqual({ Bucket: 'devalpo-media', Key: 'sitios/sitio-1/logo-abc.png' })
    expect(servicio.urlPublicaBase()).toBe('https://media.devalpo.cl')
  })

  it('eliminar devuelve error genérico sin lanzar ni filtrar credenciales', async () => {
    const { cliente } = crearClienteFake(() => {
      throw new Error('fallo con sk-secreto')
    })
    const servicio = new R2AlmacenamientoArchivos({ ...OPCIONES_BASE, cliente })

    const resultado = await servicio.eliminar('sitios/sitio-1/logo-abc.png')

    expect(resultado.tipo).toBe('error')
    expect(JSON.stringify(resultado)).not.toContain('sk-secreto')
  })

  it('el Noop no borra nada y no tiene URL pública', async () => {
    const servicio = new NoopAlmacenamientoArchivos()
    expect(await servicio.eliminar()).toEqual({ tipo: 'no_configurado' })
    expect(servicio.urlPublicaBase()).toBeNull()
  })

  it('sube el objeto con Content-Type, Cache-Control inmutable y devuelve la URL pública', async () => {
    const { cliente, llamadas } = crearClienteFake(() => ({}))
    const servicio = new R2AlmacenamientoArchivos({ ...OPCIONES_BASE, cliente })

    const resultado = await servicio.subir({
      clave: 'sitios/sitio-1/logo-abc.png',
      contenido: new Uint8Array([1, 2, 3]),
      tipoContenido: 'image/png',
    })

    expect(resultado).toEqual({ tipo: 'ok', url: 'https://media.devalpo.cl/sitios/sitio-1/logo-abc.png' })
    expect(llamadas).toHaveLength(1)
    const input = (llamadas[0] as PutObjectCommand).input
    expect(input.Bucket).toBe('devalpo-media')
    expect(input.Key).toBe('sitios/sitio-1/logo-abc.png')
    expect(input.ContentType).toBe('image/png')
    expect(input.CacheControl).toBe('public, max-age=31536000, immutable')
  })

  it('quita la barra final de urlPublica antes de concatenar la clave', async () => {
    const { cliente } = crearClienteFake(() => ({}))
    const servicio = new R2AlmacenamientoArchivos({ ...OPCIONES_BASE, urlPublica: 'https://media.devalpo.cl/', cliente })

    const resultado = await servicio.subir({
      clave: 'sitios/sitio-1/logo-abc.png',
      contenido: new Uint8Array([1]),
      tipoContenido: 'image/png',
    })

    expect(resultado).toEqual({ tipo: 'ok', url: 'https://media.devalpo.cl/sitios/sitio-1/logo-abc.png' })
  })

  it('devuelve `error` genérico sin tirar y sin exponer credenciales cuando el cliente S3 falla', async () => {
    const { cliente } = crearClienteFake(() => {
      throw new Error('AccessDenied: token ak-secreto inválido')
    })
    const servicio = new R2AlmacenamientoArchivos({ ...OPCIONES_BASE, cliente })

    const resultado = await servicio.subir({
      clave: 'sitios/sitio-1/logo-abc.png',
      contenido: new Uint8Array([1]),
      tipoContenido: 'image/png',
    })

    expect(resultado).toEqual({ tipo: 'error', detalle: 'No se pudo subir el archivo a R2.' })
    expect(JSON.stringify(resultado)).not.toContain('ak-secreto')
  })
})

describe('NoopAlmacenamientoArchivos', () => {
  it('devuelve no_configurado y no sube nada', async () => {
    const servicio: IAlmacenamientoArchivos = new NoopAlmacenamientoArchivos()

    const resultado = await servicio.subir({
      clave: 'sitios/sitio-1/logo-abc.png',
      contenido: new Uint8Array([1]),
      tipoContenido: 'image/png',
    })

    expect(resultado).toEqual({ tipo: 'no_configurado' })
  })
})
