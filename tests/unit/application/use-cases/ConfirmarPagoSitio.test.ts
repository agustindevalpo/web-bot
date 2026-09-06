import {
  ConfirmarPagoSitioUseCase,
  normalizarEmailComprador,
} from '@/application/use-cases/ConfirmarPagoSitio.usecase'
import { ActivarClienteUseCase } from '@/application/use-cases/ActivarCliente.usecase'
import { MockSitioRepository } from '../../../integration/mocks/MockSitioRepository'
import { MockClienteRepository } from '../../../integration/mocks/MockClienteRepository'
import { MockPagoRepository } from '../../../integration/mocks/MockPagoRepository'
import { Sitio } from '@/domain/entities/Sitio'
import { Cliente } from '@/domain/entities/Cliente'
import { Template } from '@/domain/value-objects/Template'
import { Plan } from '@/domain/value-objects/Plan'
import { Proveedor } from '@/domain/value-objects/Proveedor'
import { SitioNoEncontradoException } from '@/domain/exceptions/SitioNoEncontradoException'
import { CompradorInvalidoException } from '@/domain/exceptions/CompradorInvalidoException'

const CLIENTE_DEMO_ID = 'cliente-demo-webbot-devalpo'

describe('normalizarEmailComprador', () => {
  it.each([
    ['  Ana@Correo.CL  ', 'ana@correo.cl'],
    ['DUENO@GMAIL.COM', 'dueno@gmail.com'],
  ])('normaliza %p a %p', (entrada, esperado) => {
    expect(normalizarEmailComprador(entrada)).toBe(esperado)
  })

  it.each([
    ['vacío', ''],
    ['solo espacios', '   '],
    ['sin arroba', 'sincorreo.cl'],
    ['sin dominio', 'sin-dominio@'],
  ])('rechaza email inválido (%s)', (_caso, crudo) => {
    expect(() => normalizarEmailComprador(crudo)).toThrow(CompradorInvalidoException)
  })
})

describe('ConfirmarPagoSitio UseCase', () => {
  const clienteDemo = new Cliente(CLIENTE_DEMO_ID, 'demo@devalpo.cl', 'Cliente Demo', Plan.STARTER, false)
  const clienteReal = new Cliente('cliente-real-1', 'dueno@correo.cl', 'Cliente Real', Plan.STARTER, true, new Date())

  let sitioRepo: MockSitioRepository
  let clienteRepo: MockClienteRepository
  let pagoRepo: MockPagoRepository
  let activarCliente: ActivarClienteUseCase
  let spyActivar: jest.SpyInstance
  let useCase: ConfirmarPagoSitioUseCase

  beforeEach(() => {
    sitioRepo = new MockSitioRepository([
      new Sitio('sitio-demo', CLIENTE_DEMO_ID, 'demo1', Template.LANDING, { nombre: 'Demo' }),
      new Sitio('sitio-no-demo', 'cliente-real-1', 'testpyme', Template.LANDING, { nombre: 'Test Pyme' }),
    ])
    clienteRepo = new MockClienteRepository([clienteDemo, clienteReal])
    pagoRepo = new MockPagoRepository()
    const notifService = {
      enviarBienvenida: jest.fn().mockResolvedValue(undefined),
      enviarSitioListo: jest.fn().mockResolvedValue(undefined),
      enviarAvisoVencimiento: jest.fn().mockResolvedValue(undefined),
      enviarPagoFallido: jest.fn().mockResolvedValue(undefined),
    }
    activarCliente = new ActivarClienteUseCase(clienteRepo, pagoRepo, notifService)
    spyActivar = jest.spyOn(activarCliente, 'execute').mockResolvedValue(undefined)
    useCase = new ConfirmarPagoSitioUseCase(sitioRepo, clienteRepo, activarCliente, CLIENTE_DEMO_ID)
  })

  afterEach(() => jest.restoreAllMocks())

  it('sitio no demo: activa al dueño actual sin tocar el comprador ni el Sitio (modo sin_cambio)', async () => {
    const spyUpdate = jest.spyOn(sitioRepo, 'update')

    const resultado = await useCase.execute({ sitioId: 'sitio-no-demo', monto: 50000, referencia: 'MP-1' })

    expect(resultado).toEqual({
      modo: 'sin_cambio',
      clienteId: 'cliente-real-1',
      email: 'dueno@correo.cl',
      nombre: 'Cliente Real',
    })
    expect(spyActivar).toHaveBeenCalledWith('cliente-real-1', 50000, Proveedor.MERCADOPAGO, 'MP-1')
    expect(spyUpdate).not.toHaveBeenCalled()
  })

  it('sitio demo + email nuevo: crea el Cliente, transfiere el Sitio y activa (modo creado)', async () => {
    const resultado = await useCase.execute({
      sitioId: 'sitio-demo',
      monto: 90000,
      referencia: 'MP-2',
      nombre: 'Ana Perez',
      email: '  Ana@Correo.CL  ',
    })

    expect(resultado.modo).toBe('creado')
    expect(resultado.email).toBe('ana@correo.cl')

    const clienteCreado = await clienteRepo.findByEmail('ana@correo.cl')
    expect(clienteCreado).not.toBeNull()
    expect(clienteCreado!.nombre).toBe('Ana Perez')
    expect(clienteCreado!.plan).toBe(Plan.STARTER)
    expect(resultado.clienteId).toBe(clienteCreado!.id)

    const sitioActualizado = await sitioRepo.findById('sitio-demo')
    expect(sitioActualizado!.clienteId).toBe(clienteCreado!.id)

    expect(spyActivar).toHaveBeenCalledWith(clienteCreado!.id, 90000, Proveedor.MERCADOPAGO, 'MP-2')
  })

  it('sitio demo + email existente (mayúsculas y espacios) reutiliza el Cliente sin duplicar (modo existente)', async () => {
    const totalClientesAntes = (await clienteRepo.findAll()).length

    const resultado = await useCase.execute({
      sitioId: 'sitio-demo',
      monto: 60000,
      nombre: 'Cliente Real',
      email: '  DUENO@Correo.cl  ',
    })

    expect(resultado).toEqual({
      modo: 'existente',
      clienteId: 'cliente-real-1',
      email: 'dueno@correo.cl',
      nombre: 'Cliente Real',
    })
    expect((await clienteRepo.findAll()).length).toBe(totalClientesAntes)

    const sitioActualizado = await sitioRepo.findById('sitio-demo')
    expect(sitioActualizado!.clienteId).toBe('cliente-real-1')
    expect(spyActivar).toHaveBeenCalledWith('cliente-real-1', 60000, Proveedor.MERCADOPAGO, undefined)
  })

  it.each([
    ['sin nombre', { sitioId: 'sitio-demo', monto: 50000, email: 'nuevo@correo.cl' }],
    ['sin email', { sitioId: 'sitio-demo', monto: 50000, nombre: 'Nuevo Cliente' }],
    ['email inválido', { sitioId: 'sitio-demo', monto: 50000, nombre: 'Nuevo Cliente', email: 'no-es-email' }],
  ])('sitio demo con datos de comprador inválidos (%s): rechaza y no persiste nada', async (_caso, input) => {
    const totalClientesAntes = (await clienteRepo.findAll()).length
    const sitioAntes = await sitioRepo.findById('sitio-demo')

    await expect(useCase.execute(input)).rejects.toThrow(CompradorInvalidoException)

    expect((await clienteRepo.findAll()).length).toBe(totalClientesAntes)
    expect((await sitioRepo.findById('sitio-demo'))!.clienteId).toBe(sitioAntes!.clienteId)
    expect(spyActivar).not.toHaveBeenCalled()
  })

  it('el comprador no puede ser el cliente demo compartido (R8)', async () => {
    await expect(
      useCase.execute({ sitioId: 'sitio-demo', monto: 50000, nombre: 'Cliente Demo', email: clienteDemo.email }),
    ).rejects.toThrow(CompradorInvalidoException)

    expect(spyActivar).not.toHaveBeenCalled()
    expect((await sitioRepo.findById('sitio-demo'))!.clienteId).toBe(CLIENTE_DEMO_ID)
  })

  it('lanza SitioNoEncontradoException si el sitio no existe', async () => {
    await expect(useCase.execute({ sitioId: 'no-existe', monto: 50000 })).rejects.toThrow(SitioNoEncontradoException)
  })
})
