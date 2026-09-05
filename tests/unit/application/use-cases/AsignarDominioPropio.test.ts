import {
  AsignarDominioPropioUseCase,
  normalizarDominio,
} from '@/application/use-cases/AsignarDominioPropio.usecase'
import { ICustomHostnameService, ResultadoHostname } from '@/application/services/ICustomHostnameService'
import { Sitio } from '@/domain/entities/Sitio'
import { Template } from '@/domain/value-objects/Template'
import { SitioNoEncontradoException } from '@/domain/exceptions/SitioNoEncontradoException'
import { DominioInvalidoException } from '@/domain/exceptions/DominioInvalidoException'
import { MockSitioRepository } from '../../../integration/mocks/MockSitioRepository'

describe('normalizarDominio', () => {
  it.each([
    ['  WWW.MiNegocio.CL  ', 'www.minegocio.cl'],
    ['https://www.minegocio.cl/', 'www.minegocio.cl'],
    ['http://minegocio.cl/contacto', 'minegocio.cl'],
    ['minegocio.cl:8080', 'minegocio.cl'],
    ['https://minegocio.cl:443/', 'minegocio.cl'],
    ['', ''],
    ['   ', ''],
  ])('normaliza %p a %p', (entrada, esperado) => {
    expect(normalizarDominio(entrada)).toBe(esperado)
  })
})

describe('AsignarDominioPropio UseCase', () => {
  const resultadoCreado: ResultadoHostname = { estado: 'creado', id: 'cf-1', sslEstado: 'pending_validation' }

  let repo: MockSitioRepository
  let hostnameService: jest.Mocked<ICustomHostnameService>
  let useCase: AsignarDominioPropioUseCase

  beforeEach(() => {
    repo = new MockSitioRepository([
      new Sitio('sitio-1', 'cliente-1', 'testpyme', Template.LANDING, { nombre: 'Test Pyme' }),
      new Sitio('sitio-2', 'cliente-2', 'otra', Template.LANDING, { nombre: 'Otra' }, true, 'www.otra.cl'),
    ])
    hostnameService = {
      asegurarHostname: jest.fn().mockResolvedValue(resultadoCreado),
      eliminarHostname: jest.fn().mockResolvedValue(undefined),
    }
    useCase = new AsignarDominioPropioUseCase(repo, hostnameService)
  })

  it('normaliza, persiste el dominio y registra el hostname en el proveedor', async () => {
    const resultado = await useCase.execute('sitio-1', 'https://WWW.TestPyme.cl/')

    expect(resultado).toEqual({ dominio: 'www.testpyme.cl', hostname: resultadoCreado })
    expect((await repo.findById('sitio-1'))?.dominioPropio).toBe('www.testpyme.cl')
    expect(hostnameService.asegurarHostname).toHaveBeenCalledWith('www.testpyme.cl')
  })

  it('permite re-guardar el mismo dominio que ya tiene el sitio', async () => {
    await useCase.execute('sitio-1', 'www.testpyme.cl')

    await expect(useCase.execute('sitio-1', 'www.testpyme.cl')).resolves.toMatchObject({
      dominio: 'www.testpyme.cl',
    })
  })

  it('rechaza un dominio que ya pertenece a otro sitio', async () => {
    await expect(useCase.execute('sitio-1', 'www.otra.cl')).rejects.toThrow(DominioInvalidoException)
    expect(hostnameService.asegurarHostname).not.toHaveBeenCalled()
  })

  it.each([
    ['sin punto', 'localhost'],
    ['guion al inicio', '-mal.cl'],
    ['guion al final', 'mal-.cl'],
    ['caracteres inválidos', 'mi negocio.cl'],
    ['underscore', 'mi_negocio.cl'],
    ['label vacío', 'mi..negocio.cl'],
    ['demasiado largo', `${'a'.repeat(250)}.cl`],
    ['label demasiado largo', `${'a'.repeat(64)}.cl`],
  ])('rechaza hostname inválido (%s)', async (_caso, dominio) => {
    await expect(useCase.execute('sitio-1', dominio)).rejects.toThrow(DominioInvalidoException)
  })

  it.each(['devalpo.cl', 'www.devalpo.cl', 'cliente.sitios.devalpo.cl', 'HTTPS://Webbot.Devalpo.CL'])(
    'rechaza dominios de Devalpo (%s)',
    async (dominio) => {
      await expect(useCase.execute('sitio-1', dominio)).rejects.toThrow(/Devalpo/)
    },
  )

  it('no confunde dominios que solo terminan parecido (nodevalpo.cl es válido)', async () => {
    await expect(useCase.execute('sitio-1', 'nodevalpo.cl')).resolves.toMatchObject({ dominio: 'nodevalpo.cl' })
  })

  it('con string vacío quita el dominio y elimina el hostname anterior (mejor esfuerzo)', async () => {
    await useCase.execute('sitio-1', 'www.testpyme.cl')
    const spyUpdate = jest.spyOn(repo, 'update')

    const resultado = await useCase.execute('sitio-1', '   ')

    expect(resultado).toEqual({ dominio: null, hostname: null })
    expect(spyUpdate).toHaveBeenCalledWith('sitio-1', { dominioPropio: null })
    expect((await repo.findById('sitio-1'))?.dominioPropio).toBeNull()
    expect(hostnameService.eliminarHostname).toHaveBeenCalledWith('www.testpyme.cl')
  })

  it('al quitar un dominio que no existía no llama al proveedor', async () => {
    await useCase.execute('sitio-1', '')

    expect(hostnameService.eliminarHostname).not.toHaveBeenCalled()
  })

  it('si eliminar en el proveedor falla, el dominio igual queda desvinculado', async () => {
    await useCase.execute('sitio-1', 'www.testpyme.cl')
    hostnameService.eliminarHostname.mockRejectedValueOnce(new Error('cloudflare caído'))

    await expect(useCase.execute('sitio-1', '')).resolves.toEqual({ dominio: null, hostname: null })
    expect((await repo.findById('sitio-1'))?.dominioPropio).toBeNull()
  })

  it('devuelve el resultado del proveedor tal cual (por ejemplo no_configurado)', async () => {
    hostnameService.asegurarHostname.mockResolvedValueOnce({ estado: 'no_configurado' })

    const resultado = await useCase.execute('sitio-1', 'www.testpyme.cl')

    expect(resultado.hostname).toEqual({ estado: 'no_configurado' })
  })

  it('lanza SitioNoEncontradoException si el sitio no existe', async () => {
    await expect(useCase.execute('no-existe', 'www.x.cl')).rejects.toThrow(SitioNoEncontradoException)
  })
})
