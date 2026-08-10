import { EstadoPago } from '@/domain/value-objects/EstadoPago'
import { Proveedor } from '@/domain/value-objects/Proveedor'

export interface PagoDTO {
  id: string
  clienteId: string
  monto: number
  estado: EstadoPago
  proveedor: Proveedor
  referencia: string | null
  fecha: Date
}
