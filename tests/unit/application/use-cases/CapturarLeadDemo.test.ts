import { CapturarLeadDemoUseCase } from '@/application/use-cases/CapturarLeadDemo.usecase'
import { MockSesionRepository } from '../../../mocks/MockSesionRepository'
import { MockSitioRepository } from '../../../mocks/MockSitioRepository'
import { MockClienteRepository } from '../../../mocks/MockClienteRepository'
import { Sesion } from '@/domain/entities/Sesion'
import { Cliente } from '@/domain/entities/Cliente'
import { Plan } from '@/domain/value-objects/Plan'
import { LeadInvalidoException } from '@/domain/exceptions/LeadInvalidoException'
import { SesionNoEncontradaException } from '@/domain/exceptions/SesionNoEncontradaException'
import { SesionIncompletaException } from '@/domain/exceptions/SesionIncompletaException'
import { SesionNoDemoException } from '@/domain/exceptions/SesionNoDemoException'

const CLIENTE_DEMO_ID = 'cliente-demo-webbot-devalpo'

function sesionCompletada(sessionId: string, clienteId: string | null = null): Sesion {
  const sesion = new Sesion(`sesion-${sessionId}`, sessionId)
  sesion.marcarCompletada({
    nombre: 'Panadería El Trigal',
    rubro: 'panaderia',
    descripcion: 'desc',
    servicios: ['pan'],
    ciudad: 'Santiago',
    contacto: { telefono: '123', email: 'panaderia@correo.cl' },
    redes: {},
    estilo: 'moderno',
    highlight: 'h',
    template: 'RESTAURANTE',
  })
  sesion.clienteId = clienteId
  return sesion
}

describe('CapturarLeadDemoUseCase', () => {
  let sesionRepo: MockSesionRepository
  let sitioRepo: MockSitioRepository
  let clienteRepo: MockClienteRepository
  let useCase: CapturarLeadDemoUseCase

  beforeEach(() => {
    sesionRepo = new MockSesionRepository([sesionCompletada('sess-demo-1')])
    sitioRepo = new MockSitioRepository()
    clienteRepo = new MockClienteRepository()
    useCase = new CapturarLeadDemoUseCase(sesionRepo, sitioRepo, clienteRepo, CLIENTE_DEMO_ID)
  })

  it('happy path: crea el Sitio demo con el dueño CLIENTE_DEMO_ID y devuelve el subdominio', async () => {
    const resultado = await useCase.execute({
      sessionId: 'sess-demo-1',
      nombre: 'Ana Pérez',
      email: 'ana@correo.cl',
      esDemo: true,
    })

    expect(resultado.subdominioDemo).toBe('demo-sess-dem')

    const sitio = await sitioRepo.findBySubdominio('demo-sess-dem')
    expect(sitio).not.toBeNull()
    expect(sitio!.clienteId).toBe(CLIENTE_DEMO_ID)
  })

  it('crea un Cliente nuevo con activo:false para el lead', async () => {
    await useCase.execute({ sessionId: 'sess-demo-1', nombre: 'Ana Pérez', email: 'ana@correo.cl', esDemo: true })

    const cliente = await clienteRepo.findByEmail('ana@correo.cl')
    expect(cliente).not.toBeNull()
    expect(cliente!.activo).toBe(false)
    expect(cliente!.nombre).toBe('Ana Pérez')
  })

  it('reutiliza el Cliente existente por email normalizado, sin duplicar', async () => {
    const existente = new Cliente('cliente-existente', 'ana@correo.cl', 'Ana Vieja', Plan.STARTER, false)
    clienteRepo = new MockClienteRepository([existente])
    useCase = new CapturarLeadDemoUseCase(sesionRepo, sitioRepo, clienteRepo, CLIENTE_DEMO_ID)
    const totalAntes = (await clienteRepo.findAll()).length

    await useCase.execute({ sessionId: 'sess-demo-1', nombre: 'Ana Nueva', email: '  ANA@Correo.CL  ', esDemo: true })

    expect((await clienteRepo.findAll()).length).toBe(totalAntes)
    const sesionActualizada = await sesionRepo.findBySessionId('sess-demo-1')
    expect(sesionActualizada!.clienteId).toBe('cliente-existente')
  })

  it('resubmit con Sesion.clienteId ya seteado: devuelve el mismo subdominio sin crear filas nuevas', async () => {
    sesionRepo = new MockSesionRepository([sesionCompletada('sess-demo-1', 'cliente-ya-capturado')])
    useCase = new CapturarLeadDemoUseCase(sesionRepo, sitioRepo, clienteRepo, CLIENTE_DEMO_ID)
    const spyFindOrCreate = jest.spyOn(clienteRepo, 'findOrCreateByEmail')
    const spySitioSave = jest.spyOn(sitioRepo, 'save')

    const resultado = await useCase.execute({
      sessionId: 'sess-demo-1',
      nombre: 'Otro Nombre',
      email: 'otro@correo.cl',
      esDemo: true,
    })

    expect(resultado.subdominioDemo).toBe('demo-sess-dem')
    expect(spyFindOrCreate).not.toHaveBeenCalled()
    expect(spySitioSave).not.toHaveBeenCalled()
  })

  it.each([
    ['vacío', ''],
    ['solo espacios', '   '],
  ])('rechaza nombre en blanco (%s)', async (_caso, nombre) => {
    await expect(
      useCase.execute({ sessionId: 'sess-demo-1', nombre, email: 'ana@correo.cl', esDemo: true }),
    ).rejects.toThrow(LeadInvalidoException)
  })

  it('rechaza email inválido', async () => {
    await expect(
      useCase.execute({ sessionId: 'sess-demo-1', nombre: 'Ana', email: 'no-es-email', esDemo: true }),
    ).rejects.toThrow(LeadInvalidoException)
  })

  it('rechaza sessionId desconocido', async () => {
    await expect(
      useCase.execute({ sessionId: 'no-existe', nombre: 'Ana', email: 'ana@correo.cl', esDemo: true }),
    ).rejects.toThrow(SesionNoEncontradaException)
  })

  it('rechaza sesión incompleta (conversación en curso)', async () => {
    const enCurso = new Sesion('sesion-en-curso', 'sess-en-curso')
    sesionRepo = new MockSesionRepository([enCurso])
    useCase = new CapturarLeadDemoUseCase(sesionRepo, sitioRepo, clienteRepo, CLIENTE_DEMO_ID)

    await expect(
      useCase.execute({ sessionId: 'sess-en-curso', nombre: 'Ana', email: 'ana@correo.cl', esDemo: true }),
    ).rejects.toThrow(SesionIncompletaException)
  })

  it('rechaza esDemo:false (sesión de un cliente pagado)', async () => {
    await expect(
      useCase.execute({ sessionId: 'sess-demo-1', nombre: 'Ana', email: 'ana@correo.cl', esDemo: false }),
    ).rejects.toThrow(SesionNoDemoException)
  })

  it('dos submits concurrentes con el mismo email nuevo resuelven al mismo Cliente sin lanzar', async () => {
    let clienteGanador: Cliente | null = null
    jest.spyOn(clienteRepo, 'findOrCreateByEmail').mockImplementation(async (cliente) => {
      if (!clienteGanador) clienteGanador = cliente
      return clienteGanador
    })

    const [r1, r2] = await Promise.all([
      useCase.execute({ sessionId: 'sess-demo-1', nombre: 'Ana', email: 'concurrente@correo.cl', esDemo: true }),
      useCase.execute({ sessionId: 'sess-demo-1', nombre: 'Ana', email: 'concurrente@correo.cl', esDemo: true }),
    ])

    expect(r1.subdominioDemo).toBe(r2.subdominioDemo)
    expect(r1.subdominioDemo).toBe('demo-sess-dem')
  })
})
