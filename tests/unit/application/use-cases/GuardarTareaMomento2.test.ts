import { GuardarTareaMomento2UseCase } from '@/application/use-cases/GuardarTareaMomento2.usecase'
import { ObtenerMomento2UseCase } from '@/application/use-cases/ObtenerMomento2.usecase'
import { MockSesionRepository } from '../../../mocks/MockSesionRepository'
import { MockSitioRepository } from '../../../mocks/MockSitioRepository'
import { Sesion } from '@/domain/entities/Sesion'
import { Sitio } from '@/domain/entities/Sitio'
import { Template } from '@/domain/value-objects/Template'
import { Momento2NoDisponibleException } from '@/domain/exceptions/Momento2NoDisponibleException'
import { TareaMomento2InvalidaException } from '@/domain/exceptions/TareaMomento2InvalidaException'

const CLIENTE_DEMO_ID = 'cliente-demo-webbot-devalpo'
const SESSION_ID = 'abcd1234-aaaa-bbbb-cccc-000000000001'
const SUBDOMINIO = 'demo-abcd1234'

function configInicial(): Record<string, unknown> {
  return {
    nombre: 'Peluquería Ana',
    template: 'SERVICIOS',
    servicios: ['Corte', 'Color'],
    contacto: { telefono: '+56912345678', email: 'ana@correo.cl' },
  }
}

function sitio(clienteId = CLIENTE_DEMO_ID): Sitio {
  return new Sitio('sitio-1', clienteId, SUBDOMINIO, Template.SERVICIOS, configInicial(), true)
}

describe('Momento 2: casos de uso', () => {
  let sitioRepo: MockSitioRepository
  let sesionRepo: MockSesionRepository
  let guardar: GuardarTareaMomento2UseCase
  let obtener: ObtenerMomento2UseCase

  function montar(sitios: Sitio[]) {
    sesionRepo = new MockSesionRepository([new Sesion('sesion-1', SESSION_ID)])
    sitioRepo = new MockSitioRepository(sitios)
    guardar = new GuardarTareaMomento2UseCase(sesionRepo, sitioRepo, CLIENTE_DEMO_ID)
    obtener = new ObtenerMomento2UseCase(sesionRepo, sitioRepo, CLIENTE_DEMO_ID)
  }

  beforeEach(() => montar([sitio()]))

  describe('guardar', () => {
    it('resuelve el sitio desde el sessionId y escribe la tarea sin tocar el resto del configJson', async () => {
      const resultado = await guardar.execute(SESSION_ID, {
        tipo: 'guardar',
        tarea: 'servicios',
        valores: { filas: [{ descripcion: 'Corte de pelo', precioDesde: '$15.000' }, {}] },
      })

      expect(resultado.subdominio).toBe(SUBDOMINIO)
      expect(resultado.vista.avance).toBe(50)

      const guardado = (await sitioRepo.findBySubdominio(SUBDOMINIO))!.configJson
      expect(guardado.servicios).toEqual([{ nombre: 'Corte', descripcion: 'Corte de pelo', precioDesde: '$15.000' }, 'Color'])
      expect(guardado.contacto).toEqual({ telefono: '+56912345678', email: 'ana@correo.cl' })
      expect(guardado.nombre).toBe('Peluquería Ana')
    })

    it('rechaza el guardado de una tarea inválida sin escribir', async () => {
      await expect(
        guardar.execute(SESSION_ID, { tipo: 'guardar', tarea: 'frase', valores: { frase: 'x'.repeat(161) } }),
      ).rejects.toMatchObject({ codigo: 'demasiado_largo' })
      await expect(guardar.execute(SESSION_ID, { tipo: 'guardar', tarea: 'frase', valores: {} })).rejects.toBeInstanceOf(
        TareaMomento2InvalidaException,
      )
      expect((await sitioRepo.findBySubdominio(SUBDOMINIO))!.configJson).toEqual(configInicial())
    })

    it('omitir registra la tarea una sola vez y no guarda nada más', async () => {
      await guardar.execute(SESSION_ID, { tipo: 'omitir', tarea: 'horarios' })
      const segunda = await guardar.execute(SESSION_ID, { tipo: 'omitir', tarea: 'horarios' })

      const config = (await sitioRepo.findBySubdominio(SUBDOMINIO))!.configJson
      expect(config.momento2Omitidas).toEqual(['horarios'])
      expect(config.servicios).toEqual(['Corte', 'Color'])
      expect(segunda.vista.avance).toBe(35)
      expect(segunda.vista.tareas.find((tarea) => tarea.id === 'horarios')?.estado).toBe('omitida')
    })

    it('omitir una tarea que la plantilla no tiene es inválido', async () => {
      montar([
        new Sitio('sitio-1', CLIENTE_DEMO_ID, SUBDOMINIO, Template.LANDING, { nombre: 'X', template: 'LANDING', servicios: [] }, true),
      ])
      await expect(guardar.execute(SESSION_ID, { tipo: 'omitir', tarea: 'horarios' })).rejects.toMatchObject({
        codigo: 'tarea_invalida',
      })
      await expect(guardar.execute(SESSION_ID, { tipo: 'omitir', tarea: 'nada' })).rejects.toBeInstanceOf(
        TareaMomento2InvalidaException,
      )
    })

    it('sin cookie, con sesión desconocida o sin sitio: sesión vencida', async () => {
      const accion = { tipo: 'omitir', tarea: 'frase' } as const
      await expect(guardar.execute(undefined, accion)).rejects.toMatchObject({ motivo: 'sesion_vencida' })
      await expect(guardar.execute('otra-sesion', accion)).rejects.toBeInstanceOf(Momento2NoDisponibleException)

      montar([])
      await expect(guardar.execute(SESSION_ID, accion)).rejects.toMatchObject({ motivo: 'sesion_vencida' })
    })

    it('con el pago confirmado (el sitio ya no es del cliente demo) rechaza la escritura', async () => {
      montar([sitio('cliente-real-1')])
      await expect(
        guardar.execute(SESSION_ID, { tipo: 'guardar', tarea: 'nosotros', valores: { quien: 'Ana' } }),
      ).rejects.toMatchObject({ motivo: 'cerrado' })
      await expect(guardar.execute(SESSION_ID, { tipo: 'omitir', tarea: 'frase' })).rejects.toMatchObject({
        motivo: 'cerrado',
      })
      expect((await sitioRepo.findBySubdominio(SUBDOMINIO))!.configJson).toEqual(configInicial())
    })

    it('una sesión no alcanza el sitio de otra', async () => {
      const otra = 'zzzz9999-aaaa-bbbb-cccc-000000000002'
      sesionRepo = new MockSesionRepository([new Sesion('s2', otra)])
      guardar = new GuardarTareaMomento2UseCase(sesionRepo, sitioRepo, CLIENTE_DEMO_ID)
      await expect(guardar.execute(otra, { tipo: 'omitir', tarea: 'frase' })).rejects.toMatchObject({
        motivo: 'sesion_vencida',
      })
    })
  })

  describe('obtener', () => {
    it('abierto: devuelve vista y valores editables, nunca el configJson', async () => {
      const estado = await obtener.execute(SESSION_ID)
      expect(estado).toMatchObject({
        estado: 'abierto',
        subdominio: SUBDOMINIO,
        nombre: 'Peluquería Ana',
        template: 'SERVICIOS',
      })
      if (estado.estado !== 'abierto') throw new Error('esperaba abierto')
      expect(estado.vista.avance).toBe(35)
      expect(estado.iniciales.servicios.map((servicio) => servicio.nombre)).toEqual(['Corte', 'Color'])
      expect(estado).not.toHaveProperty('config')
    })

    it('cerrado cuando el sitio ya es de un cliente real', async () => {
      montar([sitio('cliente-real-1')])
      expect(await obtener.execute(SESSION_ID)).toEqual({ estado: 'cerrado' })
    })

    it('sesión vencida sin cookie o sin sitio', async () => {
      expect(await obtener.execute(undefined)).toEqual({ estado: 'sesion_vencida' })
      montar([])
      expect(await obtener.execute(SESSION_ID)).toEqual({ estado: 'sesion_vencida' })
    })
  })
})
