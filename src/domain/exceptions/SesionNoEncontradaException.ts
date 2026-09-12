export class SesionNoEncontradaException extends Error {
  constructor(sessionId: string) {
    super(`Sesión no encontrada: ${sessionId}`)
    this.name = 'SesionNoEncontradaException'
  }
}
