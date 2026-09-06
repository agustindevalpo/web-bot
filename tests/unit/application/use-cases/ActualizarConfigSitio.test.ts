import { ActualizarConfigSitioUseCase } from '@/application/use-cases/ActualizarConfigSitio.usecase'
import { Sitio } from '@/domain/entities/Sitio'
import { Template } from '@/domain/value-objects/Template'
import { SitioNoEncontradoException } from '@/domain/exceptions/SitioNoEncontradoException'
import { ConfigSitioInvalidaException } from '@/domain/exceptions/ConfigSitioInvalidaException'
import { MockSitioRepository } from '../../../integration/mocks/MockSitioRepository'

describe('ActualizarConfigSitio UseCase', () => {
  let repo: MockSitioRepository
  let useCase: ActualizarConfigSitioUseCase

  beforeEach(() => {
    repo = new MockSitioRepository([
      new Sitio('sitio-1', 'cliente-1', 'testpyme', Template.LANDING, { nombre: 'Viejo' }),
    ])
    useCase = new ActualizarConfigSitioUseCase(repo)
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
})
