import type { ISesionRepository } from '@/domain/repositories/ISesionRepository'
import type { ISitioRepository } from '@/domain/repositories/ISitioRepository'
import type { Sitio } from '@/domain/entities/Sitio'
import { subdominioDemoDe } from '@/application/shared/subdominioDemo'

export type SitioMomento2 =
  | { estado: 'sesion_vencida' }
  | { estado: 'cerrado' }
  | { estado: 'abierto'; sitio: Sitio; config: Record<string, unknown>; template: string | null }

/**
 * Resuelve el sitio de demo de una sesión del chat, siempre en el servidor y
 * desde el `sessionId` de la cookie: nunca se acepta un id de sitio del
 * cliente. El subdominio se deriva del `sessionId` (el mismo que usa el lead),
 * así que una sesión solo alcanza su propio sitio.
 *
 * - sin `sessionId`, sesión desconocida o sin sitio: `sesion_vencida`.
 * - el sitio ya no es del cliente demo compartido: `cerrado`. Eso pasa cuando
 *   Devalpo confirma el pago (`ConfirmarPagoSitioUseCase` lo transfiere al
 *   comprador), así que no hace falta una columna nueva.
 */
export async function resolverSitioMomento2(
  sesionRepo: Pick<ISesionRepository, 'findBySessionId'>,
  sitioRepo: Pick<ISitioRepository, 'findBySubdominio'>,
  clienteDemoId: string,
  sessionId: string | undefined,
): Promise<SitioMomento2> {
  if (!sessionId) return { estado: 'sesion_vencida' }

  const sesion = await sesionRepo.findBySessionId(sessionId)
  if (!sesion) return { estado: 'sesion_vencida' }

  const sitio = await sitioRepo.findBySubdominio(subdominioDemoDe(sesion.sessionId))
  if (!sitio) return { estado: 'sesion_vencida' }
  if (sitio.clienteId !== clienteDemoId) return { estado: 'cerrado' }

  const config = sitio.configJson && typeof sitio.configJson === 'object' ? sitio.configJson : {}
  const template = typeof config.template === 'string' ? config.template : sitio.template
  return { estado: 'abierto', sitio, config, template }
}
