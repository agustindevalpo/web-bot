import { ActualizarDatosLegalesSitioUseCase } from '@/application/use-cases/ActualizarDatosLegalesSitio.usecase'
import { Sitio } from '@/domain/entities/Sitio'
import { Template } from '@/domain/value-objects/Template'
import { SitioNoEncontradoException } from '@/domain/exceptions/SitioNoEncontradoException'
import { ConfigSitioInvalidaException } from '@/domain/exceptions/ConfigSitioInvalidaException'
import { MockSitioRepository } from '../../../mocks/MockSitioRepository'

describe('ActualizarDatosLegalesSitio UseCase', () => {
  let repo: MockSitioRepository
  let useCase: ActualizarDatosLegalesSitioUseCase

  beforeEach(() => {
    repo = new MockSitioRepository([
      new Sitio('sitio-1', 'cliente-1', 'testpyme', Template.LANDING, { nombre: 'Café', rubro: 'cafe' }),
    ])
    useCase = new ActualizarDatosLegalesSitioUseCase(repo)
  })

  it('guarda legal normalizado y no toca el resto del config', async () => {
    const r = await useCase.execute('sitio-1', '  Devalpo   SpA ', '77119936-4')

    expect(r.configJson).toEqual({
      nombre: 'Café',
      rubro: 'cafe',
      legal: { razonSocial: 'Devalpo SpA', rut: '77.119.936-4' },
    })
    expect((await repo.findById('sitio-1'))?.configJson.legal).toEqual({
      razonSocial: 'Devalpo SpA',
      rut: '77.119.936-4',
    })
  })

  it('con ambos vacíos quita legal y conserva lo demás', async () => {
    await useCase.execute('sitio-1', 'Devalpo SpA', '77119936-4')

    const r = await useCase.execute('sitio-1', '  ', '')

    expect(r.configJson).toEqual({ nombre: 'Café', rubro: 'cafe' })
  })

  it('rechaza uno solo de los dos sin guardar', async () => {
    const spy = jest.spyOn(repo, 'update')

    await expect(useCase.execute('sitio-1', 'Devalpo SpA', '')).rejects.toThrow(ConfigSitioInvalidaException)
    await expect(useCase.execute('sitio-1', '', '77119936-4')).rejects.toThrow(/ambos vacíos/)
    expect(spy).not.toHaveBeenCalled()
  })

  it('rechaza un RUT con dígito verificador incorrecto sin guardar', async () => {
    const spy = jest.spyOn(repo, 'update')

    await expect(useCase.execute('sitio-1', 'Devalpo SpA', '77119936-5')).rejects.toThrow(/RUT no es válido/)
    expect(spy).not.toHaveBeenCalled()
  })

  it('rechaza una razón social demasiado larga', async () => {
    await expect(useCase.execute('sitio-1', 'a'.repeat(121), '77119936-4')).rejects.toThrow(/120/)
  })

  it('lanza SitioNoEncontradoException si el sitio no existe', async () => {
    await expect(useCase.execute('x', 'Devalpo SpA', '77119936-4')).rejects.toThrow(SitioNoEncontradoException)
  })
})
