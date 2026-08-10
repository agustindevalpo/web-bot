export interface MensajeDTO {
  rol: 'user' | 'assistant'
  contenido: string
  timestamp: Date
}
