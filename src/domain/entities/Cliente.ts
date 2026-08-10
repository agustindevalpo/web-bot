import { Plan } from '@/domain/value-objects/Plan'

export class Cliente {
  constructor(
    public readonly id: string,
    public email: string,
    public nombre: string,
    public plan: Plan,
    public activo: boolean = false,
    public fechaPago: Date | null = null,
    public telefono?: string,
  ) {}

  activar(): void {
    this.activo = true
    this.fechaPago = new Date()
  }

  pausar(): void {
    this.activo = false
  }

  cambiarPlan(nuevoPlan: Plan): void {
    this.plan = nuevoPlan
  }

  estaActivo(): boolean {
    return this.activo
  }

  static crear(email: string, nombre: string, plan: Plan): Cliente {
    return new Cliente(crypto.randomUUID(), email, nombre, plan)
  }
}
