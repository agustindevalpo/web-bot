export class CompradorInvalidoException extends Error {
  constructor(mensaje: string) {
    super(mensaje)
    this.name = 'CompradorInvalidoException'
  }
}
