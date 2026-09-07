export class SesionIncompletaException extends Error {
  constructor() {
    super('La conversación todavía no está completa.')
    this.name = 'SesionIncompletaException'
  }
}
