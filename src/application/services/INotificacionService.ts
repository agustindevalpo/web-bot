import { Cliente } from '@/domain/entities/Cliente'

export interface INotificacionService {
  enviarBienvenida(cliente: Cliente, urlSitio: string): Promise<void>
  enviarSitioListo(cliente: Cliente, urlSitio: string): Promise<void>
  enviarAvisoVencimiento(cliente: Cliente, diasRestantes: number): Promise<void>
  enviarPagoFallido(cliente: Cliente, linkPago: string): Promise<void>
}
