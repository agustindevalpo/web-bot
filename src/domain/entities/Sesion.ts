export interface MensajeHistorial {
  rol: 'user' | 'assistant'
  contenido: string
  timestamp: Date
}

export class Sesion {
  public historial: MensajeHistorial[] = []
  public datosJson: Record<string, unknown> | null = null
  public completada: boolean = false
  // Cliente (lead o dueño) que ya capturó/reclamó esta sesión; null hasta la
  // captura del lead.
  public clienteId: string | null = null

  constructor(
    public readonly id: string,
    public readonly sessionId: string,
    public readonly fechaCreacion: Date = new Date(),
  ) {}

  agregarMensaje(rol: 'user' | 'assistant', contenido: string): void {
    this.historial.push({ rol, contenido, timestamp: new Date() })
  }

  marcarCompletada(datos: Record<string, unknown>): void {
    this.datosJson = datos
    this.completada = true
  }

  cantidadIntercambios(): number {
    return Math.floor(this.historial.length / 2)
  }
}
