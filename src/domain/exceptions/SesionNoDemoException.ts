export class SesionNoDemoException extends Error {
  constructor() {
    super('Esta sesión no corresponde a una demo.')
    this.name = 'SesionNoDemoException'
  }
}
