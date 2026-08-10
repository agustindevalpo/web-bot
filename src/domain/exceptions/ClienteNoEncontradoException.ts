export class ClienteNoEncontradoException extends Error {
  constructor(id: string) {
    super(`Cliente no encontrado: ${id}`)
    this.name = 'ClienteNoEncontradoException'
  }
}
