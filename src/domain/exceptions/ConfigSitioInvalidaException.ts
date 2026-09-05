export class ConfigSitioInvalidaException extends Error {
  constructor(mensaje: string) {
    super(mensaje)
    this.name = 'ConfigSitioInvalidaException'
  }
}
