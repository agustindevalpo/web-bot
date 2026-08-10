import { EstadoPago } from '@/domain/value-objects/EstadoPago'
import { Proveedor } from '@/domain/value-objects/Proveedor'

export class Pago {
  constructor(
    public readonly id: string,
    public clienteId: string,
    public monto: number,
    public estado: EstadoPago,
    public proveedor: Proveedor,
    public referencia: string | null = null,
    public readonly fecha: Date = new Date(),
  ) {}

  marcarConfirmado(referencia?: string): void {
    this.estado = EstadoPago.CONFIRMADO
    if (referencia) this.referencia = referencia
  }

  marcarFallido(): void {
    this.estado = EstadoPago.FALLIDO
  }

  estaConfirmado(): boolean {
    return this.estado === EstadoPago.CONFIRMADO
  }

  static crear(clienteId: string, monto: number, proveedor: Proveedor): Pago {
    return new Pago(crypto.randomUUID(), clienteId, monto, EstadoPago.PENDIENTE, proveedor)
  }
}
