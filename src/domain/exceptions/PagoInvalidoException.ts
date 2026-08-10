export class PagoInvalidoException extends Error {
  constructor(mensaje: string) {
    super(`Pago inválido: ${mensaje}`)
    this.name = 'PagoInvalidoException'
  }
}
