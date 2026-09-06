import { Template } from '@/domain/value-objects/Template'

export class Sitio {
  constructor(
    public readonly id: string,
    public clienteId: string,
    public subdominio: string,
    public template: Template,
    public configJson: Record<string, unknown>,
    public activo: boolean = true,
    public dominioPropio: string | null = null,
    public readonly fechaCreacion: Date = new Date(),
  ) {}

  pausar(): void {
    this.activo = false
  }

  reactivar(): void {
    this.activo = true
  }

  conectarDominio(dominio: string): void {
    this.dominioPropio = dominio
  }

  transferirA(clienteId: string): void {
    this.clienteId = clienteId
  }

  estaActivo(): boolean {
    return this.activo
  }
}
