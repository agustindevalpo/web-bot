import { ISesionRepository } from '@/domain/repositories/ISesionRepository'
import { ISitioRepository } from '@/domain/repositories/ISitioRepository'
import { IClienteRepository } from '@/domain/repositories/IClienteRepository'
import { Cliente } from '@/domain/entities/Cliente'
import { Sitio } from '@/domain/entities/Sitio'
import { Plan } from '@/domain/value-objects/Plan'
import type { Template } from '@/domain/value-objects/Template'
import { normalizarEmail } from '@/application/shared/email'
import { telefonoLeadANormalizado } from '@/application/shared/datosLead'
import { calcularAvance } from '@/application/shared/avanceSitio'
import { subdominioDemoDe } from '@/application/shared/subdominioDemo'
import { LeadInvalidoException } from '@/domain/exceptions/LeadInvalidoException'
import { SesionNoEncontradaException } from '@/domain/exceptions/SesionNoEncontradaException'
import { SesionIncompletaException } from '@/domain/exceptions/SesionIncompletaException'
import { SesionNoDemoException } from '@/domain/exceptions/SesionNoDemoException'

export interface CapturarLeadDemoInput {
  sessionId: string
  nombre: string
  email: string
  // 8 dígitos después del +56 9; se acepta con espacios o guiones.
  telefono: string
  // Resuelto por la ruta (ver `resolverModoChat`), nunca leído acá desde
  // cookies o JWT — el caso de uso no depende de `NextRequest` (Decisión D4
  // en design.md).
  esDemo: boolean
}

export interface ResultadoCapturarLeadDemo {
  subdominioDemo: string
  // Lo que el reveal necesita del sitio sin recibir el configJson completo:
  // el nombre del negocio, la plantilla y el avance ya calculado (T4).
  nombre: string
  template: string | null
  avance: number
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

    const telefono = telefonoLeadANormalizado(input.telefono ?? '')
    if (!telefono) {
      throw new LeadInvalidoException('Ingresa un teléfono válido.')
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
      // El sitio puede haber ganado respuestas del momento 2 desde el primer
      // envío: el avance sale de lo que está guardado, no de la sesión.
      const guardado = await this.sitioRepo.findBySubdominio(subdominioDemo)
      return resultadoDelSitio(subdominioDemo, guardado?.configJson ?? (sesion.datosJson as Record<string, unknown>))
    }

    const cliente = await this.clienteRepo.findOrCreateByEmail(
      new Cliente(crypto.randomUUID(), email, nombre, Plan.STARTER, false, null, telefono),
    )

    // El Sitio demo queda siempre a nombre del cliente demo compartido
    // (Decisión D6): la identidad del lead nunca reemplaza a
    // `CLIENTE_DEMO_ID` como dueño, o se rompe la atribución de compra en
    // ConfirmarPagoSitioUseCase y el badge de admin.
    const datosJson = conContactoDelLead(sesion.datosJson as Record<string, unknown>, {
      telefono,
      email,
    })
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

    return resultadoDelSitio(subdominioDemo, datosJson)
  }
}

function resultadoDelSitio(subdominioDemo: string, config: Record<string, unknown>): ResultadoCapturarLeadDemo {
  const template = typeof config.template === 'string' ? config.template : null
  return {
    subdominioDemo,
    nombre: typeof config.nombre === 'string' ? config.nombre : '',
    template,
    avance: calcularAvance(config, template),
  }
}

// Merge defensivo: el teléfono y el correo del lead completan `contacto`, pero
// nunca pisan un valor que ya tenga contenido ni descartan otras claves
// (p. ej. `formulario`).
function conContactoDelLead(
  datos: Record<string, unknown>,
  lead: { telefono: string; email: string },
): Record<string, unknown> {
  const actual =
    datos.contacto && typeof datos.contacto === 'object' ? (datos.contacto as Record<string, unknown>) : {}
  const vacio = (valor: unknown) => typeof valor !== 'string' || !valor.trim()

  return {
    ...datos,
    contacto: {
      ...actual,
      telefono: vacio(actual.telefono) ? lead.telefono : actual.telefono,
      email: vacio(actual.email) ? lead.email : actual.email,
    },
  }
}
