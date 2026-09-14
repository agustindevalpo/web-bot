// Resuelve el email a precargar en /login a partir de la sesión de demo que
// el visitante ya completó: cookie `webbot_session` → Sesion.clienteId →
// Cliente.email (el mismo correo que escribió en el LeadForm del chat).
// Repetirle ese dato en /login sería pedir algo que el sistema ya tiene.
//
// Función pura e inyectada de dependencias (recibe los repos, no el
// container) para poder testearla con fakes: jest.config.ts corre en
// testEnvironment 'node', sin red ni base de datos real.
//
// Cualquier eslabón ausente — sin cookie, sesión no encontrada, sesión sin
// clienteId (lead aún no capturado), cliente no encontrado — o un
// repositorio que falle, degrada en silencio a '' — el mismo estado que si
// el campo arrancara vacío. Nunca debe propagar el error ni bloquear el
// render de /login.

import type { ISesionRepository } from '@/domain/repositories/ISesionRepository'
import type { IClienteRepository } from '@/domain/repositories/IClienteRepository'

export async function resolverEmailPrefill(
  sessionId: string | undefined,
  sesionRepo: Pick<ISesionRepository, 'findBySessionId'>,
  clienteRepo: Pick<IClienteRepository, 'findById'>,
): Promise<string> {
  if (!sessionId) return ''

  try {
    const sesion = await sesionRepo.findBySessionId(sessionId)
    if (!sesion?.clienteId) return ''

    const cliente = await clienteRepo.findById(sesion.clienteId)
    return cliente?.email ?? ''
  } catch {
    return ''
  }
}
