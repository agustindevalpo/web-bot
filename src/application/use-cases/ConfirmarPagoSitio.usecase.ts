import { ISitioRepository } from '@/domain/repositories/ISitioRepository'
import { IClienteRepository } from '@/domain/repositories/IClienteRepository'
import { ActivarClienteUseCase } from '@/application/use-cases/ActivarCliente.usecase'
import { Sitio } from '@/domain/entities/Sitio'
import { Cliente } from '@/domain/entities/Cliente'
import { Plan } from '@/domain/value-objects/Plan'
import { Proveedor } from '@/domain/value-objects/Proveedor'
import { SitioNoEncontradoException } from '@/domain/exceptions/SitioNoEncontradoException'
import { CompradorInvalidoException } from '@/domain/exceptions/CompradorInvalidoException'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export interface ConfirmarPagoSitioInput {
  sitioId: string
  monto: number
  referencia?: string
  nombre?: string
  email?: string
}

export interface ResultadoConfirmarPago {
  modo: 'creado' | 'existente' | 'sin_cambio'
  clienteId: string
  email: string
  nombre: string
}

export class ConfirmarPagoSitioUseCase {
  constructor(
    private sitioRepo: ISitioRepository,
    private clienteRepo: IClienteRepository,
    private activarCliente: ActivarClienteUseCase,
    private clienteDemoId: string,
  ) {}

  async execute(input: ConfirmarPagoSitioInput): Promise<ResultadoConfirmarPago> {
    const sitio = await this.sitioRepo.findById(input.sitioId)
    if (!sitio) throw new SitioNoEncontradoException(input.sitioId)

    if (sitio.clienteId !== this.clienteDemoId) {
      return this.confirmarSinCambio(sitio.clienteId, input)
    }

    return this.confirmarConCompradorDemo(sitio, input)
  }

  // El sitio ya pertenece a un cliente real: no hay comprador que resolver,
  // solo se confirma el pago y se activa al dueño actual (R4, R10).
  private async confirmarSinCambio(clienteId: string, input: ConfirmarPagoSitioInput): Promise<ResultadoConfirmarPago> {
    await this.activarCliente.execute(clienteId, input.monto, Proveedor.MERCADOPAGO, input.referencia)
    const cliente = await this.clienteRepo.findById(clienteId)
    return { modo: 'sin_cambio', clienteId, email: cliente?.email ?? '', nombre: cliente?.nombre ?? '' }
  }

  // El sitio es demo: hay que identificar (o crear) al comprador real antes
  // de poder activar nada, y nunca se puede terminar activando al cliente
  // demo compartido (R5, R6, R7, R8).
  private async confirmarConCompradorDemo(sitio: Sitio, input: ConfirmarPagoSitioInput): Promise<ResultadoConfirmarPago> {
    const nombre = (input.nombre ?? '').trim()
    const email = normalizarEmailComprador(input.email ?? '')
    if (!nombre) {
      throw new CompradorInvalidoException('El nombre del comprador es obligatorio.')
    }

    let cliente = await this.clienteRepo.findByEmail(email)
    if (cliente && cliente.id === this.clienteDemoId) {
      throw new CompradorInvalidoException('El comprador no puede ser el cliente demo compartido.')
    }

    let modo: 'creado' | 'existente'
    if (cliente) {
      modo = 'existente'
    } else {
      cliente = await this.clienteRepo.save(Cliente.crear(email, nombre, Plan.STARTER))
      modo = 'creado'
    }

    // El Cliente debe existir en la base ANTES de reasignar el Sitio, o la
    // FK de Sitio.clienteId rechaza el update.
    sitio.transferirA(cliente.id)
    await this.sitioRepo.update(sitio.id, { clienteId: cliente.id })

    await this.activarCliente.execute(cliente.id, input.monto, Proveedor.MERCADOPAGO, input.referencia)

    return { modo, clienteId: cliente.id, email: cliente.email, nombre: cliente.nombre }
  }
}

export function normalizarEmailComprador(crudo: string): string {
  const email = crudo.trim().toLowerCase()
  if (!EMAIL_REGEX.test(email)) {
    throw new CompradorInvalidoException('Ingresa un email de comprador válido.')
  }
  return email
}
