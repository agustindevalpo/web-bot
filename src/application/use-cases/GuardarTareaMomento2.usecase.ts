import type { ISesionRepository } from '@/domain/repositories/ISesionRepository'
import type { ISitioRepository } from '@/domain/repositories/ISitioRepository'
import { Momento2NoDisponibleException } from '@/domain/exceptions/Momento2NoDisponibleException'
import { TareaMomento2InvalidaException } from '@/domain/exceptions/TareaMomento2InvalidaException'
import { resolverSitioMomento2 } from '@/application/shared/sitioMomento2'
import {
  aplicarTarea,
  construirVistaMomento2,
  omitirTarea,
  tareaPerteneceAPlantilla,
  validarTarea,
  type VistaMomento2,
} from '@/application/shared/momento2'

export type AccionMomento2 =
  | { tipo: 'guardar'; tarea: unknown; valores: unknown }
  | { tipo: 'omitir'; tarea: unknown }

export interface ResultadoGuardarTareaMomento2 {
  subdominio: string
  template: string | null
  vista: VistaMomento2
}

export class GuardarTareaMomento2UseCase {
  constructor(
    private sesionRepo: ISesionRepository,
    private sitioRepo: ISitioRepository,
    private clienteDemoId: string,
  ) {}

  /**
   * Guarda (o omite) una tarea en el sitio de la sesión. El sitio se resuelve
   * desde el `sessionId` de la cookie, nunca desde un dato del cliente. Si
   * Devalpo ya confirmó el pago la escritura se rechaza.
   *
   * Lanza `Momento2NoDisponibleException` o `TareaMomento2InvalidaException`.
   */
  async execute(sessionId: string | undefined, accion: AccionMomento2): Promise<ResultadoGuardarTareaMomento2> {
    const resuelto = await resolverSitioMomento2(this.sesionRepo, this.sitioRepo, this.clienteDemoId, sessionId)
    if (resuelto.estado !== 'abierto') throw new Momento2NoDisponibleException(resuelto.estado)

    const { sitio, config, template } = resuelto

    let nuevo: Record<string, unknown>
    if (accion.tipo === 'omitir') {
      if (!tareaPerteneceAPlantilla(accion.tarea, template)) throw new TareaMomento2InvalidaException('tarea_invalida')
      nuevo = omitirTarea(config, accion.tarea)
    } else {
      const validacion = validarTarea(accion.tarea, accion.valores, template)
      if (!validacion.ok) throw new TareaMomento2InvalidaException(validacion.error)
      nuevo = aplicarTarea(config, validacion.datos)
    }

    // Omitir una tarea ya omitida devuelve el mismo objeto: no hay nada que escribir.
    if (nuevo !== config) {
      await this.sitioRepo.update(sitio.id, { configJson: nuevo })
    }

    return { subdominio: sitio.subdominio, template, vista: construirVistaMomento2(nuevo, template) }
  }
}
