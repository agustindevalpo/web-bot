import { Pago } from '@/domain/entities/Pago'
import { EstadoPago } from '@/domain/value-objects/EstadoPago'
import { Proveedor } from '@/domain/value-objects/Proveedor'

describe('Pago entity', () => {
  it('Pago.crear() arranca en PENDIENTE', () => {
    const pago = Pago.crear('cliente-1', 39990, Proveedor.FLOW)
    expect(pago.estado).toBe(EstadoPago.PENDIENTE)
    expect(pago.estaConfirmado()).toBe(false)
  })

  it('marcarConfirmado() cambia el estado y opcionalmente la referencia', () => {
    const pago = Pago.crear('cliente-1', 39990, Proveedor.FLOW)
    pago.marcarConfirmado('ref-123')

    expect(pago.estado).toBe(EstadoPago.CONFIRMADO)
    expect(pago.referencia).toBe('ref-123')
    expect(pago.estaConfirmado()).toBe(true)
  })

  it('marcarFallido() cambia el estado a FALLIDO', () => {
    const pago = Pago.crear('cliente-1', 39990, Proveedor.FLOW)
    pago.marcarFallido()

    expect(pago.estado).toBe(EstadoPago.FALLIDO)
    expect(pago.estaConfirmado()).toBe(false)
  })
})
