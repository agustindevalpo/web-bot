'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { guardarTareaMomento2UC } from '@/infrastructure/container'
import type { AccionMomento2 } from '@/application/use-cases/GuardarTareaMomento2.usecase'
import { Momento2NoDisponibleException } from '@/domain/exceptions/Momento2NoDisponibleException'
import { TareaMomento2InvalidaException } from '@/domain/exceptions/TareaMomento2InvalidaException'
import { COOKIE_NAME } from '../sessionCookie'
import { errorDeValidacion, type ResultadoGuardado } from './resultado'

// Server Actions son alcanzables con cualquier POST: el sitio se identifica
// siempre desde la cookie de la sesión de demo, nunca desde un argumento.
async function ejecutar(accion: AccionMomento2): Promise<ResultadoGuardado> {
  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get(COOKIE_NAME)?.value

    const resultado = await guardarTareaMomento2UC.execute(sessionId, accion)

    // El sitio público se sirve cacheado: sin esto la vista previa recargada
    // mostraría la versión anterior.
    revalidatePath(`/sites/${resultado.subdominio}`)

    return { ok: true, subdominio: resultado.subdominio, vista: resultado.vista }
  } catch (error) {
    if (error instanceof Momento2NoDisponibleException) return { ok: false, error: error.motivo }
    if (error instanceof TareaMomento2InvalidaException) return { ok: false, error: errorDeValidacion(error.codigo) }
    console.error('[chat/completar]', error)
    return { ok: false, error: 'error' }
  }
}

export async function guardarTareaAction(tarea: string, valores: unknown): Promise<ResultadoGuardado> {
  return ejecutar({ tipo: 'guardar', tarea, valores })
}

export async function omitirTareaAction(tarea: string): Promise<ResultadoGuardado> {
  return ejecutar({ tipo: 'omitir', tarea })
}
