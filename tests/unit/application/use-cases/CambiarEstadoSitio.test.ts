import { CambiarEstadoSitioUseCase } from '@/application/use-cases/CambiarEstadoSitio.usecase'
import { Sitio } from '@/domain/entities/Sitio'
import { Template } from '@/domain/value-objects/Template'
import { SitioNoEncontradoException } from '@/domain/exceptions/SitioNoEncontradoException'
import { MockSitioRepository } from '../../../integration/mocks/MockSitioRepository'

describe('CambiarEstadoSitio UseCase', () => {
  let repo: MockSitioRepository
  let useCase: CambiarEstadoSitioUseCase

  beforeEach(() => {
    repo = new MockSitioRepository([
      new Sitio('sitio-1', 'cliente-1', 'testpyme', Template.LANDING, { nombre: 'Test Pyme' }, true),
    ])
    useCase = new CambiarEstadoSitioUseCase(repo)
  })

  it('pausa un sitio activo y lo persiste', async () => {
    const spyUpdate = jest.spyOn(repo, 'update')

    const resultado = await useCase.execute('sitio-1', false)

    expect(resultado.activo).toBe(false)
    expect(spyUpdate).toHaveBeenCalledWith('sitio-1', { activo: false })
    expect((await repo.findById('sitio-1'))?.estaActivo()).toBe(false)
  })

  it('reactiva un sitio pausado y lo persiste', async () => {
    await useCase.execute('sitio-1', false)
    const spyUpdate = jest.spyOn(repo, 'update')

    const resultado = await useCase.execute('sitio-1', true)

    expect(resultado.activo).toBe(true)
    expect(spyUpdate).toHaveBeenCalledWith('sitio-1', { activo: true })
  })

  it('lanza SitioNoEncontradoException si el sitio no existe', async () => {
    await expect(useCase.execute('no-existe', false)).rejects.toThrow(SitioNoEncontradoException)
  })
})
