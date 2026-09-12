export class LeadInvalidoException extends Error {
  constructor(mensaje: string) {
    super(mensaje)
    this.name = 'LeadInvalidoException'
  }
}
