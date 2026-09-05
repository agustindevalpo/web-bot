import { ListarSitiosUseCase } from '@/application/use-cases/ListarSitios.usecase'
import { Sitio } from '@/domain/entities/Sitio'
import { Template } from '@/domain/value-objects/Template'
import { MockSitioRepository } from '../../../integration/mocks/MockSitioRepository'

function sitio(id: string, fecha: string): Sitio {
  return new Sitio(id, 'cliente-1', `sub-${id}`, Template.LANDING, { nombre: id }, true, null, new Date(fecha))
}

describe('ListarSitios UseCase', () => {
  it('devuelve todos los sitios ordenados por fecha de creación descendente', async () => {
    const repo = new MockSitioRepository([
      sitio('viejo', '2026-01-01T00:00:00Z'),
      sitio('nuevo', '2026-03-01T00:00:00Z'),
      sitio('medio', '2026-02-01T00:00:00Z'),
    ])
    const useCase = new ListarSitiosUseCase(repo)

    const resultado = await useCase.execute()

    expect(resultado.map((s) => s.id)).toEqual(['nuevo', 'medio', 'viejo'])
  })

  it('devuelve lista vacía cuando no hay sitios', async () => {
    const useCase = new ListarSitiosUseCase(new MockSitioRepository())

    expect(await useCase.execute()).toEqual([])
  })
})
