import { ActualizarConfigSitioUseCase } from '@/application/use-cases/ActualizarConfigSitio.usecase'
import { Sitio } from '@/domain/entities/Sitio'
import { Template } from '@/domain/value-objects/Template'
import { SitioNoEncontradoException } from '@/domain/exceptions/SitioNoEncontradoException'
import { ConfigSitioInvalidaException } from '@/domain/exceptions/ConfigSitioInvalidaException'
import { MockSitioRepository } from '../../../mocks/MockSitioRepository'
import { FakeAlmacenamiento } from '../../../mocks/FakeAlmacenamientoArchivos'

describe('ActualizarConfigSitio UseCase', () => {
  let repo: MockSitioRepository
  let useCase: ActualizarConfigSitioUseCase
  let almacenamiento: FakeAlmacenamiento

  beforeEach(() => {
    repo = new MockSitioRepository([
      new Sitio('sitio-1', 'cliente-1', 'testpyme', Template.LANDING, { nombre: 'Viejo' }),
    ])
    almacenamiento = new FakeAlmacenamiento()
    useCase = new ActualizarConfigSitioUseCase(repo, almacenamiento)
  })

  it('reemplaza el configJson con el objeto parseado', async () => {
    const resultado = await useCase.execute('sitio-1', '{"nombre": "Nuevo", "rubro": "cafe"}')

    expect(resultado.configJson).toEqual({ nombre: 'Nuevo', rubro: 'cafe' })
    expect((await repo.findById('sitio-1'))?.configJson).toEqual({ nombre: 'Nuevo', rubro: 'cafe' })
  })

  it('rechaza JSON con sintaxis inválida con un mensaje legible', async () => {
    await expect(useCase.execute('sitio-1', '{"nombre": ')).rejects.toThrow(ConfigSitioInvalidaException)
    await expect(useCase.execute('sitio-1', '{"nombre": ')).rejects.toThrow(/JSON válido/)
  })

  it('rechaza un JSON que no es objeto plano (array, string, null)', async () => {
    await expect(useCase.execute('sitio-1', '[]')).rejects.toThrow(ConfigSitioInvalidaException)
    await expect(useCase.execute('sitio-1', '"hola"')).rejects.toThrow(ConfigSitioInvalidaException)
    await expect(useCase.execute('sitio-1', 'null')).rejects.toThrow(ConfigSitioInvalidaException)
  })

  it('rechaza un objeto sin nombre o con nombre vacío', async () => {
    await expect(useCase.execute('sitio-1', '{"rubro": "cafe"}')).rejects.toThrow(/nombre/)
    await expect(useCase.execute('sitio-1', '{"nombre": "   "}')).rejects.toThrow(/nombre/)
    await expect(useCase.execute('sitio-1', '{"nombre": 42}')).rejects.toThrow(/nombre/)
  })

  it('no toca el repositorio cuando el JSON es inválido', async () => {
    const spyUpdate = jest.spyOn(repo, 'update')

    await expect(useCase.execute('sitio-1', '{')).rejects.toThrow()

    expect(spyUpdate).not.toHaveBeenCalled()
  })

  it('lanza SitioNoEncontradoException si el sitio no existe', async () => {
    await expect(useCase.execute('no-existe', '{"nombre": "x"}')).rejects.toThrow(SitioNoEncontradoException)
  })

  describe('limpieza de huérfanos y logoDimensiones', () => {
    const LOGO_VIEJO = 'https://media.devalpo.cl/sitios/sitio-1/logo-viejo.png'
    const HERO_VIEJO = 'https://media.devalpo.cl/sitios/sitio-1/hero-viejo.jpg'
    const AJENA = 'https://media.devalpo.cl/sitios/sitio-2/logo.png'

    function sembrar(config: Record<string, unknown>) {
      repo = new MockSitioRepository([new Sitio('sitio-1', 'cliente-1', 'testpyme', Template.LANDING, config)])
      useCase = new ActualizarConfigSitioUseCase(repo, almacenamiento)
    }

    it('borra solo las imágenes propias que el JSON nuevo ya no tiene', async () => {
      sembrar({ nombre: 'V', logo: LOGO_VIEJO, imagenes: [HERO_VIEJO, 'https://images.unsplash.com/a.jpg', AJENA] })

      await useCase.execute('sitio-1', JSON.stringify({ nombre: 'V', logo: LOGO_VIEJO, imagenes: [] }))

      expect(almacenamiento.eliminadas).toEqual(['sitios/sitio-1/hero-viejo.jpg'])
    })

    it('no borra una imagen que solo cambió de posición', async () => {
      sembrar({ nombre: 'V', imagenes: [HERO_VIEJO, 'https://images.unsplash.com/a.jpg'] })

      await useCase.execute('sitio-1', JSON.stringify({ nombre: 'V', imagenes: ['https://images.unsplash.com/a.jpg', HERO_VIEJO] }))

      expect(almacenamiento.eliminadas).toEqual([])
    })

    it('un fallo al borrar no falla el guardado', async () => {
      almacenamiento = new FakeAlmacenamiento(undefined, { tipo: 'error', detalle: 'boom' })
      sembrar({ nombre: 'V', logo: LOGO_VIEJO })
      const consola = jest.spyOn(console, 'error').mockImplementation(() => {})

      const resultado = await useCase.execute('sitio-1', '{"nombre": "V"}')

      expect(resultado.configJson).toEqual({ nombre: 'V' })
      expect(consola).toHaveBeenCalled()
      consola.mockRestore()
    })

    it('no borra nada si el guardado falla', async () => {
      sembrar({ nombre: 'V', logo: LOGO_VIEJO })
      jest.spyOn(repo, 'update').mockRejectedValue(new Error('db caída'))

      await expect(useCase.execute('sitio-1', '{"nombre": "V"}')).rejects.toThrow('db caída')

      expect(almacenamiento.eliminadas).toEqual([])
    })

    it('no borra nada si el JSON es inválido', async () => {
      sembrar({ nombre: 'V', logo: LOGO_VIEJO })

      await expect(useCase.execute('sitio-1', '{"nombre": ')).rejects.toThrow()

      expect(almacenamiento.eliminadas).toEqual([])
    })

    it('descarta logoDimensiones si el logo cambió y las dimensiones quedaron iguales', async () => {
      sembrar({ nombre: 'V', logo: LOGO_VIEJO, logoDimensiones: { ancho: 400, alto: 100 } })

      const resultado = await useCase.execute(
        'sitio-1',
        JSON.stringify({ nombre: 'V', logo: 'https://images.unsplash.com/n.png', logoDimensiones: { ancho: 400, alto: 100 } }),
      )

      expect(resultado.configJson.logoDimensiones).toBeUndefined()
    })

    it('conserva logoDimensiones si el logo no cambió o si las dimensiones también cambiaron', async () => {
      sembrar({ nombre: 'V', logo: LOGO_VIEJO, logoDimensiones: { ancho: 400, alto: 100 } })

      const mismoLogo = await useCase.execute(
        'sitio-1',
        JSON.stringify({ nombre: 'V2', logo: LOGO_VIEJO, logoDimensiones: { ancho: 400, alto: 100 } }),
      )
      expect(mismoLogo.configJson.logoDimensiones).toEqual({ ancho: 400, alto: 100 })

      const nuevas = await useCase.execute(
        'sitio-1',
        JSON.stringify({ nombre: 'V2', logo: 'https://x.test/l.png', logoDimensiones: { ancho: 50, alto: 50 } }),
      )
      expect(nuevas.configJson.logoDimensiones).toEqual({ ancho: 50, alto: 50 })
    })
  })
})
