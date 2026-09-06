export class SitioNoEncontradoException extends Error {
  constructor(sitioId: string) {
    super(`Sitio no encontrado: ${sitioId}`)
    this.name = 'SitioNoEncontradoException'
  }
}
