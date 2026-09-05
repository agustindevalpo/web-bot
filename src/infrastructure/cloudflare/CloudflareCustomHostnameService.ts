import { ICustomHostnameService, ResultadoHostname } from '@/application/services/ICustomHostnameService'

// Cloudflare for SaaS — Custom Hostnames.
// Docs: https://developers.cloudflare.com/cloudflare-for-saas/
// Nunca lanza hacia afuera ni loguea el token: cualquier fallo se traduce a
// `{ estado: 'error', detalle }` para que el panel lo muestre tal cual.

const API_BASE = 'https://api.cloudflare.com/client/v4'
const CODIGO_DUPLICADO = 1406

type FetchFn = typeof fetch

interface CloudflareError {
  code?: number
  message?: string
}

interface CustomHostnameRaw {
  id: string
  hostname: string
  ssl?: { status?: string }
}

interface CloudflareEnvelope<T> {
  success?: boolean
  errors?: CloudflareError[]
  result?: T
}

export interface CloudflareCustomHostnameOptions {
  apiToken: string
  zoneId: string
  fetchFn?: FetchFn
}

export class CloudflareCustomHostnameService implements ICustomHostnameService {
  private readonly apiToken: string
  private readonly zoneId: string
  private readonly fetchFn: FetchFn

  constructor({ apiToken, zoneId, fetchFn }: CloudflareCustomHostnameOptions) {
    this.apiToken = apiToken
    this.zoneId = zoneId
    this.fetchFn = fetchFn ?? ((input, init) => fetch(input, init))
  }

  async asegurarHostname(dominio: string): Promise<ResultadoHostname> {
    try {
      const res = await this.fetchFn(this.url('/custom_hostnames'), {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify({ hostname: dominio, ssl: { method: 'http', type: 'dv' } }),
      })
      const body = await leerJson<CloudflareEnvelope<CustomHostnameRaw>>(res)

      if (res.ok && body?.success !== false && body?.result) {
        return { estado: 'creado', id: body.result.id, sslEstado: body.result.ssl?.status }
      }

      if (esDuplicado(res.status, body?.errors)) {
        const existente = await this.buscarPorHostname(dominio)
        if (existente) {
          return { estado: 'existente', id: existente.id, sslEstado: existente.ssl?.status }
        }
        return { estado: 'error', detalle: 'Cloudflare dice que el hostname ya existe pero no se pudo recuperar.' }
      }

      return { estado: 'error', detalle: describirError(res.status, body?.errors) }
    } catch {
      return { estado: 'error', detalle: 'No se pudo contactar a Cloudflare.' }
    }
  }

  async eliminarHostname(dominio: string): Promise<void> {
    try {
      const existente = await this.buscarPorHostname(dominio)
      if (!existente) return

      await this.fetchFn(this.url(`/custom_hostnames/${encodeURIComponent(existente.id)}`), {
        method: 'DELETE',
        headers: this.headers(),
      })
    } catch {
      // Mejor esfuerzo: el llamador ya desvinculó el dominio en la base.
    }
  }

  private async buscarPorHostname(dominio: string): Promise<CustomHostnameRaw | null> {
    const res = await this.fetchFn(this.url(`/custom_hostnames?hostname=${encodeURIComponent(dominio)}`), {
      method: 'GET',
      headers: this.headers(),
    })
    if (!res.ok) return null

    const body = await leerJson<CloudflareEnvelope<CustomHostnameRaw[]>>(res)
    const encontrado = body?.result?.find((h) => h.hostname === dominio) ?? body?.result?.[0]
    return encontrado ?? null
  }

  private url(path: string): string {
    return `${API_BASE}/zones/${encodeURIComponent(this.zoneId)}${path}`
  }

  private headers(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.apiToken}`,
      'Content-Type': 'application/json',
    }
  }
}

async function leerJson<T>(res: Response): Promise<T | null> {
  try {
    return (await res.json()) as T
  } catch {
    return null
  }
}

function esDuplicado(status: number, errors: CloudflareError[] | undefined): boolean {
  if (status === 409) return true
  return (errors ?? []).some(
    (e) => e.code === CODIGO_DUPLICADO || /duplicate|already exists/i.test(e.message ?? ''),
  )
}

function describirError(status: number, errors: CloudflareError[] | undefined): string {
  const mensaje = errors?.find((e) => e.message)?.message
  return mensaje ? `Cloudflare respondió ${status}: ${mensaje}` : `Cloudflare respondió HTTP ${status}.`
}
