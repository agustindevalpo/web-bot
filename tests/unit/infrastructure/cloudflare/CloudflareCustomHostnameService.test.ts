import { CloudflareCustomHostnameService } from '@/infrastructure/cloudflare/CloudflareCustomHostnameService'
import { NoopCustomHostnameService } from '@/infrastructure/cloudflare/NoopCustomHostnameService'
import { ICustomHostnameService } from '@/application/services/ICustomHostnameService'

type Llamada = { url: string; init: RequestInit }

function respuesta(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

// Fake de fetch: cada handler decide qué responder según método + url y deja
// registro de las llamadas para poder inspeccionar headers y body.
function crearFetchFake(handler: (metodo: string, url: string) => Response | Promise<Response>) {
  const llamadas: Llamada[] = []
  const fetchFn = jest.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
    llamadas.push({ url, init: init ?? {} })
    return handler(init?.method ?? 'GET', url)
  }) as unknown as typeof fetch
  return { fetchFn, llamadas }
}

const BASE = 'https://api.cloudflare.com/client/v4/zones/zona-123/custom_hostnames'

describe('CloudflareCustomHostnameService', () => {
  function crearServicio(handler: Parameters<typeof crearFetchFake>[0]) {
    const { fetchFn, llamadas } = crearFetchFake(handler)
    const servicio = new CloudflareCustomHostnameService({ apiToken: 'token-secreto', zoneId: 'zona-123', fetchFn })
    return { servicio, llamadas }
  }

  describe('asegurarHostname', () => {
    it('crea el hostname con POST, ssl http/dv y bearer token', async () => {
      const { servicio, llamadas } = crearServicio(() =>
        respuesta(201, {
          success: true,
          result: { id: 'ch-1', hostname: 'www.cliente.cl', ssl: { status: 'pending_validation' } },
        }),
      )

      const resultado = await servicio.asegurarHostname('www.cliente.cl')

      expect(resultado).toEqual({ estado: 'creado', id: 'ch-1', sslEstado: 'pending_validation' })
      expect(llamadas).toHaveLength(1)
      expect(llamadas[0].url).toBe(BASE)
      expect(llamadas[0].init.method).toBe('POST')
      expect((llamadas[0].init.headers as Record<string, string>).Authorization).toBe('Bearer token-secreto')
      expect(JSON.parse(llamadas[0].init.body as string)).toEqual({
        hostname: 'www.cliente.cl',
        ssl: { method: 'http', type: 'dv' },
      })
    })

    it('si el POST responde 409 busca el existente y devuelve `existente`', async () => {
      const { servicio, llamadas } = crearServicio((metodo) =>
        metodo === 'POST'
          ? respuesta(409, { success: false, errors: [{ code: 1406, message: 'Duplicate custom hostname found.' }] })
          : respuesta(200, {
              success: true,
              result: [{ id: 'ch-existente', hostname: 'www.cliente.cl', ssl: { status: 'active' } }],
            }),
      )

      const resultado = await servicio.asegurarHostname('www.cliente.cl')

      expect(resultado).toEqual({ estado: 'existente', id: 'ch-existente', sslEstado: 'active' })
      expect(llamadas[1].init.method).toBe('GET')
      expect(llamadas[1].url).toBe(`${BASE}?hostname=www.cliente.cl`)
    })

    it('reconoce el duplicado por código/mensaje aunque el status sea 400', async () => {
      const { servicio } = crearServicio((metodo) =>
        metodo === 'POST'
          ? respuesta(400, { success: false, errors: [{ code: 1406, message: 'Duplicate custom hostname found.' }] })
          : respuesta(200, { success: true, result: [{ id: 'ch-dup', hostname: 'www.cliente.cl', ssl: {} }] }),
      )

      const resultado = await servicio.asegurarHostname('www.cliente.cl')

      expect(resultado).toMatchObject({ estado: 'existente', id: 'ch-dup' })
    })

    it('devuelve `error` con detalle corto cuando Cloudflare responde otro error', async () => {
      const { servicio } = crearServicio(() =>
        respuesta(403, { success: false, errors: [{ code: 10000, message: 'Authentication error' }] }),
      )

      const resultado = await servicio.asegurarHostname('www.cliente.cl')

      expect(resultado.estado).toBe('error')
      expect(resultado.detalle).toContain('403')
      expect(resultado.detalle).toContain('Authentication error')
      expect(resultado.detalle).not.toContain('token-secreto')
    })

    it('devuelve `error` sin tirar cuando la red falla', async () => {
      const { servicio } = crearServicio(() => {
        throw new TypeError('fetch failed')
      })

      const resultado = await servicio.asegurarHostname('www.cliente.cl')

      expect(resultado).toEqual({ estado: 'error', detalle: 'No se pudo contactar a Cloudflare.' })
    })

    it('devuelve `error` cuando la respuesta no es JSON', async () => {
      const { servicio } = crearServicio(() => new Response('<html>502</html>', { status: 502 }))

      const resultado = await servicio.asegurarHostname('www.cliente.cl')

      expect(resultado.estado).toBe('error')
      expect(resultado.detalle).toContain('502')
    })
  })

  describe('eliminarHostname', () => {
    it('busca por hostname y hace DELETE con el id encontrado', async () => {
      const { servicio, llamadas } = crearServicio((metodo) =>
        metodo === 'GET'
          ? respuesta(200, { success: true, result: [{ id: 'ch-9', hostname: 'www.cliente.cl' }] })
          : respuesta(200, { success: true, result: { id: 'ch-9' } }),
      )

      await servicio.eliminarHostname('www.cliente.cl')

      expect(llamadas).toHaveLength(2)
      expect(llamadas[1].init.method).toBe('DELETE')
      expect(llamadas[1].url).toBe(`${BASE}/ch-9`)
    })

    it('no hace DELETE si el hostname no existe', async () => {
      const { servicio, llamadas } = crearServicio(() => respuesta(200, { success: true, result: [] }))

      await servicio.eliminarHostname('www.cliente.cl')

      expect(llamadas).toHaveLength(1)
    })

    it('se traga los errores de red', async () => {
      const { servicio } = crearServicio(() => {
        throw new Error('sin red')
      })

      await expect(servicio.eliminarHostname('www.cliente.cl')).resolves.toBeUndefined()
    })
  })
})

describe('NoopCustomHostnameService', () => {
  it('devuelve no_configurado y no hace nada al eliminar', async () => {
    const servicio: ICustomHostnameService = new NoopCustomHostnameService()

    expect(await servicio.asegurarHostname('www.cliente.cl')).toMatchObject({ estado: 'no_configurado' })
    await expect(servicio.eliminarHostname('www.cliente.cl')).resolves.toBeUndefined()
  })
})
