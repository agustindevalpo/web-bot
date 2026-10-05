import type { ISesionRepository } from '@/domain/repositories/ISesionRepository'
import type { ISitioRepository } from '@/domain/repositories/ISitioRepository'
import { resolverSitioMomento2 } from '@/application/shared/sitioMomento2'
import {
  construirVistaMomento2,
  valoresIniciales,
  type ValoresIniciales,
  type VistaMomento2,
} from '@/application/shared/momento2'

export type EstadoMomento2 =
  | { estado: 'sesion_vencida' }
  | { estado: 'cerrado' }
  | {
      estado: 'abierto'
      subdominio: string
      nombre: string
      template: string | null
      vista: VistaMomento2
      iniciales: ValoresIniciales
    }

// Lo que `/chat/completar` necesita para decidir qué pantalla mostrar. Nunca
// devuelve el `configJson` completo: solo la vista y los valores editables.
export class ObtenerMomento2UseCase {
  constructor(
    private sesionRepo: ISesionRepository,
    private sitioRepo: ISitioRepository,
    private clienteDemoId: string,
  ) {}

  async execute(sessionId: string | undefined): Promise<EstadoMomento2> {
    const resuelto = await resolverSitioMomento2(this.sesionRepo, this.sitioRepo, this.clienteDemoId, sessionId)
    if (resuelto.estado !== 'abierto') return { estado: resuelto.estado }

    const { sitio, config, template } = resuelto
    return {
      estado: 'abierto',
      subdominio: sitio.subdominio,
      nombre: typeof config.nombre === 'string' ? config.nombre : '',
      template,
      vista: construirVistaMomento2(config, template),
      iniciales: valoresIniciales(config),
    }
  }
}
