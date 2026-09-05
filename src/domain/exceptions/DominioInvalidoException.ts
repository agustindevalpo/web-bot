export class DominioInvalidoException extends Error {
  constructor(mensaje: string) {
    super(mensaje)
    this.name = 'DominioInvalidoException'
  }
}
