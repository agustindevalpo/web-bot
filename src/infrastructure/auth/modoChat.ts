import { IClienteRepository } from '@/domain/repositories/IClienteRepository'
import { verificarSesionJWT } from './JwtSessionService'

// Re-deriva de forma independiente si el visitante detrás de un token de
// autenticación es un visitante demo (sin cuenta o sin plan activo) o un
// cliente real y pagado — mismo criterio que usa `/api/chat` (línea 26-29),
// extraído para que el nuevo endpoint de captura de lead lo reutilice sin
// depender de `NextRequest` en esta capa. La cookie se resuelve en el route
// handler; acá solo se recibe su valor crudo.
export async function resolverModoChat(
  token: string | undefined,
  clienteRepo: IClienteRepository,
): Promise<boolean> {
  const sesionAuth = token ? await verificarSesionJWT(token) : null
  const cliente = sesionAuth ? await clienteRepo.findById(sesionAuth.clienteId) : null
  return !cliente || !cliente.activo
}
