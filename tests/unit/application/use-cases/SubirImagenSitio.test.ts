import { SubirImagenSitioUseCase } from '@/application/use-cases/SubirImagenSitio.usecase'
import { IAlmacenamientoArchivos, ArchivoASubir, ResultadoSubida } from '@/application/services/IAlmacenamientoArchivos'
import { Sitio } from '@/domain/entities/Sitio'
import { Template } from '@/domain/value-objects/Template'
import { SitioNoEncontradoException } from '@/domain/exceptions/SitioNoEncontradoException'
import { MockSitioRepository } from '../../../mocks/MockSitioRepository'

function bytesJpeg(): Uint8Array {
  return new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 1, 2, 3])
}

function bytesPng(): Uint8Array {
  return new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3])
}

function bytesWebp(): Uint8Array {
  const riff = [0x52, 0x49, 0x46, 0x46] // "RIFF"
  const tamano = [0, 0, 0, 0]
  const webp = [0x57, 0x45, 0x42, 0x50] // "WEBP"
  return new Uint8Array([...riff, ...tamano, ...webp, 1, 2, 3])
}

function bytesSvg(): Uint8Array {
  return new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"></svg>')
}

class FakeAlmacenamiento implements IAlmacenamientoArchivos {
  llamadas: ArchivoASubir[] = []
  constructor(private resultado: ResultadoSubida = { tipo: 'ok', url: 'https://media.devalpo.cl/x.png' }) {}

  async subir(archivo: ArchivoASubir): Promise<ResultadoSubida> {
    this.llamadas.push(archivo)
    return this.resultado
  }
}

describe('SubirImagenSitio UseCase', () => {
  let repo: MockSitioRepository
  let sitio: Sitio

  beforeEach(() => {
    sitio = new Sitio('sitio-1', 'cliente-1', 'testpyme', Template.LANDING, { nombre: 'Vieja pyme' })
    repo = new MockSitioRepository([sitio])
  })

  it('lanza SitioNoEncontradoException si el sitio no existe', async () => {
    const useCase = new SubirImagenSitioUseCase(repo, new FakeAlmacenamiento())

    await expect(useCase.execute('no-existe', 'logo', bytesPng())).rejects.toThrow(SitioNoEncontradoException)
  })

  it('rechaza un archivo mayor a 5 MB sin llamar al storage', async () => {
    const almacenamiento = new FakeAlmacenamiento()
    const useCase = new SubirImagenSitioUseCase(repo, almacenamiento)
    const pesado = new Uint8Array(5 * 1024 * 1024 + 1)
    pesado.set(bytesPng())

    const resultado = await useCase.execute('sitio-1', 'logo', pesado)

    expect(resultado).toEqual({ tipo: 'archivo_muy_grande' })
    expect(almacenamiento.llamadas).toHaveLength(0)
  })

  it('rechaza un SVG (no es JPEG/PNG/WebP) sin llamar al storage', async () => {
    const almacenamiento = new FakeAlmacenamiento()
    const useCase = new SubirImagenSitioUseCase(repo, almacenamiento)

    const resultado = await useCase.execute('sitio-1', 'logo', bytesSvg())

    expect(resultado).toEqual({ tipo: 'formato_no_soportado' })
    expect(almacenamiento.llamadas).toHaveLength(0)
  })

  it('rechaza bytes que no coinciden con ningún magic number conocido', async () => {
    const almacenamiento = new FakeAlmacenamiento()
    const useCase = new SubirImagenSitioUseCase(repo, almacenamiento)

    const resultado = await useCase.execute('sitio-1', 'logo', new Uint8Array([1, 2, 3, 4]))

    expect(resultado).toEqual({ tipo: 'formato_no_soportado' })
  })

  it.each([
    ['JPEG', bytesJpeg, 'jpg', 'image/jpeg'],
    ['PNG', bytesPng, 'png', 'image/png'],
    ['WebP', bytesWebp, 'webp', 'image/webp'],
  ])('acepta %s: construye la clave sitios/<id>/<campo>-<uuid>.<ext> y sube con el Content-Type correcto', async (_nombre, bytes, extension, mime) => {
    const almacenamiento = new FakeAlmacenamiento({ tipo: 'ok', url: `https://media.devalpo.cl/x.${extension}` })
    const useCase = new SubirImagenSitioUseCase(repo, almacenamiento)

    await useCase.execute('sitio-1', 'logo', bytes())

    expect(almacenamiento.llamadas).toHaveLength(1)
    const [subida] = almacenamiento.llamadas
    expect(subida.clave).toMatch(
      new RegExp(`^sitios/sitio-1/logo-[0-9a-f-]{36}\\.${extension}$`),
    )
    expect(subida.tipoContenido).toBe(mime)
  })

  it('logo/imagenHero: reemplazan el campo en configJson y devuelven el sitio actualizado', async () => {
    const almacenamiento = new FakeAlmacenamiento({ tipo: 'ok', url: 'https://media.devalpo.cl/logo.png' })
    const useCase = new SubirImagenSitioUseCase(repo, almacenamiento)

    const resultado = await useCase.execute('sitio-1', 'logo', bytesPng())

    expect(resultado).toEqual({
      tipo: 'ok',
      url: 'https://media.devalpo.cl/logo.png',
      sitio: expect.objectContaining({ configJson: { nombre: 'Vieja pyme', logo: 'https://media.devalpo.cl/logo.png' } }),
    })
    expect((await repo.findById('sitio-1'))?.configJson).toEqual({
      nombre: 'Vieja pyme',
      logo: 'https://media.devalpo.cl/logo.png',
    })
  })

  it('imagenHero reemplaza (no acumula) igual que logo', async () => {
    sitio.configJson = { nombre: 'Vieja pyme', imagenHero: 'https://media.devalpo.cl/vieja.png' }
    const almacenamiento = new FakeAlmacenamiento({ tipo: 'ok', url: 'https://media.devalpo.cl/nueva.png' })
    const useCase = new SubirImagenSitioUseCase(repo, almacenamiento)

    await useCase.execute('sitio-1', 'imagenHero', bytesPng())

    expect((await repo.findById('sitio-1'))?.configJson.imagenHero).toBe('https://media.devalpo.cl/nueva.png')
  })

  it('imagenes: agrega (append) sin borrar las existentes', async () => {
    sitio.configJson = { nombre: 'Vieja pyme', imagenes: ['https://media.devalpo.cl/a.png'] }
    const almacenamiento = new FakeAlmacenamiento({ tipo: 'ok', url: 'https://media.devalpo.cl/b.png' })
    const useCase = new SubirImagenSitioUseCase(repo, almacenamiento)

    const resultado = await useCase.execute('sitio-1', 'imagenes', bytesPng())

    expect(resultado.tipo).toBe('ok')
    expect((await repo.findById('sitio-1'))?.configJson.imagenes).toEqual([
      'https://media.devalpo.cl/a.png',
      'https://media.devalpo.cl/b.png',
    ])
  })

  it('imagenes: parte de un array vacío cuando configJson no trae imagenes', async () => {
    const almacenamiento = new FakeAlmacenamiento({ tipo: 'ok', url: 'https://media.devalpo.cl/a.png' })
    const useCase = new SubirImagenSitioUseCase(repo, almacenamiento)

    await useCase.execute('sitio-1', 'imagenes', bytesPng())

    expect((await repo.findById('sitio-1'))?.configJson.imagenes).toEqual(['https://media.devalpo.cl/a.png'])
  })

  it('no escribe nada en configJson cuando el storage devuelve no_configurado', async () => {
    const almacenamiento = new FakeAlmacenamiento({ tipo: 'no_configurado' })
    const useCase = new SubirImagenSitioUseCase(repo, almacenamiento)
    const spyUpdate = jest.spyOn(repo, 'update')

    const resultado = await useCase.execute('sitio-1', 'logo', bytesPng())

    expect(resultado).toEqual({ tipo: 'no_configurado' })
    expect(spyUpdate).not.toHaveBeenCalled()
    expect((await repo.findById('sitio-1'))?.configJson).toEqual({ nombre: 'Vieja pyme' })
  })

  it('no escribe nada en configJson cuando el storage falla', async () => {
    const almacenamiento = new FakeAlmacenamiento({ tipo: 'error', detalle: 'boom' })
    const useCase = new SubirImagenSitioUseCase(repo, almacenamiento)
    const spyUpdate = jest.spyOn(repo, 'update')

    const resultado = await useCase.execute('sitio-1', 'logo', bytesPng())

    expect(resultado).toEqual({ tipo: 'error', detalle: 'boom' })
    expect(spyUpdate).not.toHaveBeenCalled()
  })
})
