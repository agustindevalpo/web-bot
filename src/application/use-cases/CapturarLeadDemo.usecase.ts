import { ISesionRepository } from '@/domain/repositories/ISesionRepository'
import { ISitioRepository } from '@/domain/repositories/ISitioRepository'
import { IClienteRepository } from '@/domain/repositories/IClienteRepository'
import { Cliente } from '@/domain/entities/Cliente'
import { Sitio } from '@/domain/entities/Sitio'
import { Plan } from '@/domain/value-objects/Plan'
import type { Template } from '@/domain/value-objects/Template'
import { normalizarEmail } from '@/application/shared/email'
import { subdominioDemoDe } from '@/application/shared/subdominioDemo'
import { LeadInvalidoException } from '@/domain/exceptions/LeadInvalidoException'
import { SesionNoEncontradaException } from '@/domain/exceptions/SesionNoEncontradaException'
import { SesionIncompletaException } from '@/domain/exceptions/SesionIncompletaException'
import { SesionNoDemoException } from '@/domain/exceptions/SesionNoDemoException'

export interface CapturarLeadDemoInput {
  sessionId: string
  nombre: string
  email: string
  // Resuelto por la ruta (ver `resolverModoChat`), nunca leído acá desde
  // cookies o JWT — el caso de uso no depende de `NextRequest` (Decisión D4
  // en design.md).
  esDemo: boolean
}

export interface ResultadoCapturarLeadDemo {
  subdominioDemo: string
}

export class CapturarLeadDemoUseCase {
  constructor(
    private sesionRepo: ISesionRepository,
    private sitioRepo: ISitioRepository,
    private clienteRepo: IClienteRepository,
    private clienteDemoId: string,
  ) {}

  async execute(input: CapturarLeadDemoInput): Promise<ResultadoCapturarLeadDemo> {
    if (!input.esDemo) {
      throw new SesionNoDemoException()
    }

    const nombre = input.nombre.trim()
    if (!nombre) {
      throw new LeadInvalidoException('El nombre es obligatorio.')
    }

    let email: string
    try {
      email = normalizarEmail(input.email)
    } catch {
      throw new LeadInvalidoException('Ingresa un email válido.')
    }

    const sesion = await this.sesionRepo.findBySessionId(input.sessionId)
    if (!sesion) {
      throw new SesionNoEncontradaException(input.sessionId)
    }

    if (!sesion.completada) {
      throw new SesionIncompletaException()
    }

    const subdominioDemo = subdominioDemoDe(sesion.sessionId)

    // Idempotencia (Decisión D5 en design.md): si ya se capturó un lead para
    // esta sesión, se devuelve el subdominio ya derivado sin revalidar ni
    // reescribir con datos distintos — un reenvío con otro email no puede
    // re-atribuir la sesión en silencio.
    if (sesion.clienteId) {
      return { subdominioDemo }
    }

    const cliente = await this.clienteRepo.findOrCreateByEmail(
      new Cliente(crypto.randomUUID(), email, nombre, Plan.STARTER, false),
    )

    // El Sitio demo queda siempre a nombre del cliente demo compartido
    // (Decisión D6): la identidad del lead nunca reemplaza a
    // `CLIENTE_DEMO_ID` como dueño, o se rompe la atribución de compra en
    // ConfirmarPagoSitioUseCase y el badge de admin.
    const datosJson = sesion.datosJson as Record<string, unknown>
    const sitioExistente = await this.sitioRepo.findBySubdominio(subdominioDemo)
    if (sitioExistente) {
      await this.sitioRepo.update(sitioExistente.id, { configJson: datosJson })
    } else {
      await this.sitioRepo.save(
        new Sitio(
          crypto.randomUUID(),
          this.clienteDemoId,
          subdominioDemo,
          datosJson.template as Template,
          datosJson,
          true,
        ),
      )
    }

    await this.sesionRepo.update(sesion.sessionId, { clienteId: cliente.id })

    return { subdominioDemo }
  }
}
