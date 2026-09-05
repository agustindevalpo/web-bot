'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { esAdmin } from '../../_lib/requerirAdmin'
import {
  cambiarEstadoSitioUC,
  asignarDominioPropioUC,
  actualizarConfigSitioUC,
} from '@/infrastructure/container'
import { DominioInvalidoException } from '@/domain/exceptions/DominioInvalidoException'
import { ConfigSitioInvalidaException } from '@/domain/exceptions/ConfigSitioInvalidaException'
import { SitioNoEncontradoException } from '@/domain/exceptions/SitioNoEncontradoException'

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
    error instanceof SitioNoEncontradoException
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
