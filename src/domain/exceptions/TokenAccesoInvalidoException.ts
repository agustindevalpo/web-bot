export class TokenAccesoInvalidoException extends Error {
  constructor() {
    super('Token de acceso inválido o expirado')
    this.name = 'TokenAccesoInvalidoException'
  }
}
