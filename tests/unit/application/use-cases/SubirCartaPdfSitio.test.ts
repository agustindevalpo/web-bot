import { SubirCartaPdfSitioUseCase } from '@/application/use-cases/SubirCartaPdfSitio.usecase'
import { ActualizarConfigSitioUseCase } from '@/application/use-cases/ActualizarConfigSitio.usecase'
import { Sitio } from '@/domain/entities/Sitio'
import { Template } from '@/domain/value-objects/Template'
import { SitioNoEncontradoException } from '@/domain/exceptions/SitioNoEncontradoException'
import { MockSitioRepository } from '../../../mocks/MockSitioRepository'
import { FakeAlmacenamiento, URL_PUBLICA_FAKE } from '../../../mocks/FakeAlmacenamientoArchivos'

const MB = 1024 * 1024
const URL_NUEVA = `${URL_PUBLICA_FAKE}/sitios/sitio-1/carta-nueva.pdf`
const URL_VIEJA = `${URL_PUBLICA_FAKE}/sitios/sitio-1/carta-vieja.pdf`

function bytesPdf(): Uint8Array {
  return new TextEncoder().encode('%PDF-1.7\n%contenido')
}

describe('SubirCartaPdfSitio UseCase', () => {
  let repo: MockSitioRepository
  let sitio: Sitio

  beforeEach(() => {
    sitio = new Sitio('sitio-1', 'cliente-1', 'testpyme', Template.RESTAURANTE, { nombre: 'El Fogón' })
    repo = new MockSitioRepository([sitio])
  })

  it('lanza SitioNoEncontradoException si el sitio no existe', async () => {
    const useCase = new SubirCartaPdfSitioUseCase(repo, new FakeAlmacenamiento())
    await expect(useCase.execute('no-existe', bytesPdf())).rejects.toThrow(SitioNoEncontradoException)
  })

  it('rechaza más de 10 MB sin llamar al storage', async () => {
    const almacenamiento = new FakeAlmacenamiento()
    const pesado = new Uint8Array(10 * MB + 1)
    pesado.set(bytesPdf())

    const resultado = await new SubirCartaPdfSitioUseCase(repo, almacenamiento).execute('sitio-1', pesado)

    expect(resultado).toEqual({ tipo: 'archivo_muy_grande' })
    expect(almacenamiento.llamadas).toHaveLength(0)
  })

  it('acepta exactamente 10 MB', async () => {
    const almacenamiento = new FakeAlmacenamiento({ tipo: 'ok', url: URL_NUEVA })
    const justo = new Uint8Array(10 * MB)
    justo.set(bytesPdf())

    const resultado = await new SubirCartaPdfSitioUseCase(repo, almacenamiento).execute('sitio-1', justo)

    expect(resultado.tipo).toBe('ok')
  })

  it.each([
    ['una imagen PNG', new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])],
    ['texto con la firma desplazada', new TextEncoder().encode(' %PDF-1.7')],
    ['una firma incompleta', new TextEncoder().encode('%PDF')],
    ['un archivo vacío', new Uint8Array(0)],
  ])('rechaza %s por la firma, sin llamar al storage', async (_nombre, bytes) => {
    const almacenamiento = new FakeAlmacenamiento()

    const resultado = await new SubirCartaPdfSitioUseCase(repo, almacenamiento).execute('sitio-1', bytes)

    expect(resultado).toEqual({ tipo: 'formato_no_soportado' })
    expect(almacenamiento.llamadas).toHaveLength(0)
  })

  it('sube con clave plana sitios/<id>/carta-<uuid>.pdf y Content-Type application/pdf', async () => {
    const almacenamiento = new FakeAlmacenamiento({ tipo: 'ok', url: URL_NUEVA })

    await new SubirCartaPdfSitioUseCase(repo, almacenamiento).execute('sitio-1', bytesPdf())

    const [subida] = almacenamiento.llamadas
    expect(subida.clave).toMatch(/^sitios\/sitio-1\/carta-[0-9a-f-]{36}\.pdf$/)
    expect(subida.tipoContenido).toBe('application/pdf')
  })

  it('guarda la URL en configJson.cartaPdf sin tocar el resto', async () => {
    const almacenamiento = new FakeAlmacenamiento({ tipo: 'ok', url: URL_NUEVA })

    const resultado = await new SubirCartaPdfSitioUseCase(repo, almacenamiento).execute('sitio-1', bytesPdf())

    expect(resultado).toMatchObject({ tipo: 'ok', url: URL_NUEVA })
    expect((await repo.findById('sitio-1'))?.configJson).toEqual({ nombre: 'El Fogón', cartaPdf: URL_NUEVA })
  })

  it('reemplazo: guarda la nueva y borra el objeto anterior', async () => {
    sitio.configJson = { nombre: 'El Fogón', cartaPdf: URL_VIEJA }
    const almacenamiento = new FakeAlmacenamiento({ tipo: 'ok', url: URL_NUEVA })

    await new SubirCartaPdfSitioUseCase(repo, almacenamiento).execute('sitio-1', bytesPdf())

    expect((await repo.findById('sitio-1'))?.configJson.cartaPdf).toBe(URL_NUEVA)
    expect(almacenamiento.eliminadas).toEqual(['sitios/sitio-1/carta-vieja.pdf'])
  })

  it('no borra una carta anterior ajena (URL externa)', async () => {
    sitio.configJson = { nombre: 'El Fogón', cartaPdf: 'https://ejemplo.cl/carta.pdf' }
    const almacenamiento = new FakeAlmacenamiento({ tipo: 'ok', url: URL_NUEVA })

    await new SubirCartaPdfSitioUseCase(repo, almacenamiento).execute('sitio-1', bytesPdf())

    expect(almacenamiento.eliminadas).toEqual([])
  })

  it('si el storage falla no escribe nada ni borra la carta anterior', async () => {
    sitio.configJson = { nombre: 'El Fogón', cartaPdf: URL_VIEJA }
    const almacenamiento = new FakeAlmacenamiento({ tipo: 'error', detalle: 'boom' })

    const resultado = await new SubirCartaPdfSitioUseCase(repo, almacenamiento).execute('sitio-1', bytesPdf())

    expect(resultado).toEqual({ tipo: 'error', detalle: 'boom' })
    expect((await repo.findById('sitio-1'))?.configJson.cartaPdf).toBe(URL_VIEJA)
    expect(almacenamiento.eliminadas).toEqual([])
  })

  it('sin storage configurado responde no_configurado', async () => {
    const almacenamiento = new FakeAlmacenamiento({ tipo: 'no_configurado' })
    const resultado = await new SubirCartaPdfSitioUseCase(repo, almacenamiento).execute('sitio-1', bytesPdf())
    expect(resultado).toEqual({ tipo: 'no_configurado' })
  })

  describe('quitar', () => {
    it('quita la clave y borra el objeto propio', async () => {
      sitio.configJson = { nombre: 'El Fogón', cartaPdf: URL_VIEJA }
      const almacenamiento = new FakeAlmacenamiento()

      await new SubirCartaPdfSitioUseCase(repo, almacenamiento).quitar('sitio-1')

      expect((await repo.findById('sitio-1'))?.configJson).toEqual({ nombre: 'El Fogón' })
      expect(almacenamiento.eliminadas).toEqual(['sitios/sitio-1/carta-vieja.pdf'])
    })

    it('sin carta no hace nada', async () => {
      const almacenamiento = new FakeAlmacenamiento()
      await new SubirCartaPdfSitioUseCase(repo, almacenamiento).quitar('sitio-1')
      expect(almacenamiento.eliminadas).toEqual([])
    })

    it('lanza SitioNoEncontradoException si el sitio no existe', async () => {
      const useCase = new SubirCartaPdfSitioUseCase(repo, new FakeAlmacenamiento())
      await expect(useCase.quitar('no-existe')).rejects.toThrow(SitioNoEncontradoException)
    })
  })

  describe('limpieza de huérfanos al guardar el JSON', () => {
    it('no borra la carta PDF mientras el JSON nuevo la sigue referenciando', async () => {
      sitio.configJson = { nombre: 'El Fogón', cartaPdf: URL_VIEJA, logo: `${URL_PUBLICA_FAKE}/sitios/sitio-1/logo-a.png` }
      const almacenamiento = new FakeAlmacenamiento()
      const nuevo = JSON.stringify({ nombre: 'El Fogón', cartaPdf: URL_VIEJA })

      await new ActualizarConfigSitioUseCase(repo, almacenamiento).execute('sitio-1', nuevo)

      // Se borra el logo que se fue, nunca el PDF referenciado.
      expect(almacenamiento.eliminadas).toEqual(['sitios/sitio-1/logo-a.png'])
    })

    it('borra la carta PDF cuando el JSON editado ya no la referencia', async () => {
      sitio.configJson = { nombre: 'El Fogón', cartaPdf: URL_VIEJA }
      const almacenamiento = new FakeAlmacenamiento()

      await new ActualizarConfigSitioUseCase(repo, almacenamiento).execute('sitio-1', JSON.stringify({ nombre: 'El Fogón' }))

      expect(almacenamiento.eliminadas).toEqual(['sitios/sitio-1/carta-vieja.pdf'])
    })
  })
})
