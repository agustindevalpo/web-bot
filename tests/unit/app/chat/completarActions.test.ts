// La acción identifica el sitio por la cookie y traduce las excepciones a
// códigos para el formulario. `next/headers` y `next/cache` solo existen
// dentro de una petición, así que se simulan.

const cookiesMock = jest.fn()
const revalidatePathMock = jest.fn()
const ejecutarMock = jest.fn()

jest.mock('next/headers', () => ({ cookies: () => cookiesMock() }))
jest.mock('next/cache', () => ({ revalidatePath: (ruta: string) => revalidatePathMock(ruta) }))
jest.mock('@/infrastructure/container', () => ({
  guardarTareaMomento2UC: { execute: (...args: unknown[]) => ejecutarMock(...args) },
}))

import { guardarTareaAction, omitirTareaAction } from '@/app/chat/completar/actions'
import { Momento2NoDisponibleException } from '@/domain/exceptions/Momento2NoDisponibleException'
import { TareaMomento2InvalidaException } from '@/domain/exceptions/TareaMomento2InvalidaException'

const VISTA = { avance: 50, tareas: [], serviciosTotal: 0, sinDescripcion: [], horarios: 0 }

describe('acciones del momento 2', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    cookiesMock.mockResolvedValue({
      get: (nombre: string) => (nombre === 'webbot_session' ? { value: 'sesion-cookie' } : undefined),
    })
  })

  it('guarda con el sessionId de la cookie y revalida la ruta del sitio', async () => {
    ejecutarMock.mockResolvedValue({ subdominio: 'demo-abcd1234', template: 'SERVICIOS', vista: VISTA })

    const resultado = await guardarTareaAction('nosotros', { quien: 'Ana' })

    expect(ejecutarMock).toHaveBeenCalledWith('sesion-cookie', {
      tipo: 'guardar',
      tarea: 'nosotros',
      valores: { quien: 'Ana' },
    })
    expect(revalidatePathMock).toHaveBeenCalledWith('/sites/demo-abcd1234')
    expect(resultado).toEqual({ ok: true, subdominio: 'demo-abcd1234', vista: VISTA })
  })

  it('sin cookie pasa undefined al caso de uso', async () => {
    cookiesMock.mockResolvedValue({ get: () => undefined })
    ejecutarMock.mockRejectedValue(new Momento2NoDisponibleException('sesion_vencida'))

    expect(await omitirTareaAction('frase')).toEqual({ ok: false, error: 'sesion_vencida' })
    expect(ejecutarMock).toHaveBeenCalledWith(undefined, { tipo: 'omitir', tarea: 'frase' })
    expect(revalidatePathMock).not.toHaveBeenCalled()
  })

  it('traduce cerrado, validación y errores inesperados', async () => {
    ejecutarMock.mockRejectedValueOnce(new Momento2NoDisponibleException('cerrado'))
    expect(await guardarTareaAction('frase', {})).toEqual({ ok: false, error: 'cerrado' })

    ejecutarMock.mockRejectedValueOnce(new TareaMomento2InvalidaException('demasiado_largo'))
    expect(await guardarTareaAction('frase', {})).toEqual({ ok: false, error: 'demasiado_largo' })

    ejecutarMock.mockRejectedValueOnce(new TareaMomento2InvalidaException('algo_nuevo'))
    expect(await guardarTareaAction('frase', {})).toEqual({ ok: false, error: 'error' })

    const consola = jest.spyOn(console, 'error').mockImplementation(() => undefined)
    ejecutarMock.mockRejectedValueOnce(new Error('db caída'))
    expect(await guardarTareaAction('frase', {})).toEqual({ ok: false, error: 'error' })
    consola.mockRestore()
  })
})
