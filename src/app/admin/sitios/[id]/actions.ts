'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { esAdmin } from '../../_lib/requerirAdmin'
import {
  cambiarEstadoSitioUC,
  asignarDominioPropioUC,
  actualizarConfigSitioUC,
  confirmarPagoSitioUC,
} from '@/infrastructure/container'
import { DominioInvalidoException } from '@/domain/exceptions/DominioInvalidoException'
import { ConfigSitioInvalidaException } from '@/domain/exceptions/ConfigSitioInvalidaException'
import { SitioNoEncontradoException } from '@/domain/exceptions/SitioNoEncontradoException'
import { ClienteNoEncontradoException } from '@/domain/exceptions/ClienteNoEncontradoException'
import { CompradorInvalidoException } from '@/domain/exceptions/CompradorInvalidoException'
import { etiquetaCliente } from './etiquetaCliente'

const REFERENCIA_PAGO_MAX = 100

// Todas las actions terminan en redirect (que lanza internamente), por eso
// el try/catch solo envuelve el trabajo y el redirect queda afuera.

async function exigirAdmin(): Promise<void> {
  if (!(await esAdmin())) {
    throw new Error('No autorizado')
  }
}

function revalidar(sitioId: string, subdominio: string): void {
  revalidatePath('/admin')
  revalidatePath(`/admin/sitios/${sitioId}`)
  revalidatePath(`/sites/${subdominio}`)
}

function mensajeDeError(error: unknown): string {
  if (
    error instanceof DominioInvalidoException ||
    error instanceof ConfigSitioInvalidaException ||
    error instanceof SitioNoEncontradoException ||
    error instanceof ClienteNoEncontradoException ||
    error instanceof CompradorInvalidoException
  ) {
    return error.message
  }
  console.error('[admin] error inesperado:', error)
  return 'Ocurrió un error inesperado. Revisa los logs del servidor.'
}

function irA(sitioId: string, params: Record<string, string>): never {
  const query = new URLSearchParams(params).toString()
  redirect(`/admin/sitios/${sitioId}${query ? `?${query}` : ''}`)
}

export async function cambiarEstadoSitioAction(sitioId: string, activo: boolean): Promise<void> {
  await exigirAdmin()

  let params: Record<string, string>
  try {
    const sitio = await cambiarEstadoSitioUC.execute(sitioId, activo)
    revalidar(sitioId, sitio.subdominio)
    params = { ok: activo ? 'reactivado' : 'pausado' }
  } catch (error) {
    params = { error: mensajeDeError(error) }
  }

  irA(sitioId, params)
}

export async function guardarDominioAction(sitioId: string, formData: FormData): Promise<void> {
  await exigirAdmin()

  const dominioCrudo = formData.get('dominio')
  await asignarDominio(sitioId, typeof dominioCrudo === 'string' ? dominioCrudo : '')
}

export async function quitarDominioAction(sitioId: string): Promise<void> {
  await exigirAdmin()
  await asignarDominio(sitioId, '')
}

async function asignarDominio(sitioId: string, dominioCrudo: string): Promise<void> {
  let params: Record<string, string>
  try {
    const resultado = await asignarDominioPropioUC.execute(sitioId, dominioCrudo)
    revalidarDominio(sitioId, resultado.dominio)
    params = resultado.dominio
      ? {
          ok: 'dominio',
          hostname: resultado.hostname?.estado ?? '',
          ssl: resultado.hostname?.sslEstado ?? '',
          detalle: resultado.hostname?.detalle ?? '',
        }
      : { ok: 'dominio_quitado' }
  } catch (error) {
    params = { error: mensajeDeError(error) }
  }

  irA(sitioId, params)
}

function revalidarDominio(sitioId: string, dominio: string | null): void {
  revalidatePath('/admin')
  revalidatePath(`/admin/sitios/${sitioId}`)
  if (dominio) revalidatePath(`/sites/custom/${dominio}`)
}

// Confirmación manual del pago (WB-43): Devalpo verifica el pago en Mercado Pago
// y activa al cliente desde el panel. No hay webhook ni conciliación automática.
// El sitioId identifica al sitio; el dueño real (demo o cliente ya asignado)
// se re-deriva siempre desde la base dentro del use case, nunca se confía en
// un clienteId enviado por el formulario (D5).
export async function confirmarPagoAction(sitioId: string, formData: FormData): Promise<void> {
  await exigirAdmin()

  const montoCrudo = formData.get('monto')
  const referenciaCruda = formData.get('referencia')
  const nombreCrudo = formData.get('nombre')
  const emailCrudo = formData.get('email')

  const monto = typeof montoCrudo === 'string' && /^\d+$/.test(montoCrudo.trim()) ? Number(montoCrudo.trim()) : NaN
  const referencia = typeof referenciaCruda === 'string' ? referenciaCruda.trim() : ''
  const nombre = typeof nombreCrudo === 'string' ? nombreCrudo : undefined
  const email = typeof emailCrudo === 'string' ? emailCrudo : undefined

  let params: Record<string, string>
  if (!Number.isSafeInteger(monto) || monto <= 0) {
    params = { error: 'El monto debe ser un número entero de pesos mayor que cero.' }
  } else if (referencia.length > REFERENCIA_PAGO_MAX) {
    params = { error: `La referencia no puede superar los ${REFERENCIA_PAGO_MAX} caracteres.` }
  } else {
    try {
      const resultado = await confirmarPagoSitioUC.execute({
        sitioId,
        monto,
        referencia: referencia || undefined,
        nombre,
        email,
      })
      revalidatePath('/admin')
      revalidatePath(`/admin/sitios/${sitioId}`)
      params = { ok: 'pago_confirmado', cliente: etiquetaCliente(resultado) }
    } catch (error) {
      params = { error: mensajeDeError(error) }
    }
  }

  irA(sitioId, params)
}

export async function guardarContenidoAction(sitioId: string, formData: FormData): Promise<void> {
  await exigirAdmin()

  const jsonTexto = formData.get('configJson')

  let params: Record<string, string>
  try {
    const sitio = await actualizarConfigSitioUC.execute(sitioId, typeof jsonTexto === 'string' ? jsonTexto : '')
    revalidar(sitioId, sitio.subdominio)
    params = { ok: 'contenido' }
  } catch (error) {
    params = { error: mensajeDeError(error) }
  }

  irA(sitioId, params)
}
