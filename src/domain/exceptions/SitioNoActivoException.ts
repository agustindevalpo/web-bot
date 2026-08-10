export class SitioNoActivoException extends Error {
  constructor(subdominio: string) {
    super(`Sitio inactivo o no encontrado: ${subdominio}`)
    this.name = 'SitioNoActivoException'
  }
}
