import { Cliente } from '@/domain/entities/Cliente'
import { Plan } from '@/domain/value-objects/Plan'

describe('Cliente entity', () => {
  let cliente: Cliente

  beforeEach(() => {
    cliente = Cliente.crear('test@test.cl', 'Test Negocio', Plan.STARTER)
  })

  it('debe estar inactivo al crearse', () => {
    expect(cliente.activo).toBe(false)
    expect(cliente.fechaPago).toBeNull()
  })

  it('activar() pone activo=true y registra fechaPago', () => {
    cliente.activar()
    expect(cliente.activo).toBe(true)
    expect(cliente.fechaPago).toBeInstanceOf(Date)
  })

  it('pausar() pone activo=false', () => {
    cliente.activar()
    cliente.pausar()
    expect(cliente.activo).toBe(false)
  })

  it('estaActivo() refleja el estado correctamente', () => {
    expect(cliente.estaActivo()).toBe(false)
    cliente.activar()
    expect(cliente.estaActivo()).toBe(true)
  })

  it('cambiarPlan() actualiza el plan', () => {
    cliente.cambiarPlan(Plan.AGENCIA)
    expect(cliente.plan).toBe(Plan.AGENCIA)
  })
})
