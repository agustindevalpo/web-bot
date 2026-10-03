import { IAlmacenamientoArchivos, ResultadoEliminacion, ResultadoSubida } from '@/application/services/IAlmacenamientoArchivos'

// Se usa cuando faltan las credenciales de R2: no se sube nada y el
// llamador (SubirImagenSitioUseCase) debe explicar que el storage no está
// configurado, sin escribir nada en configJson.
export class NoopAlmacenamientoArchivos implements IAlmacenamientoArchivos {
  async subir(): Promise<ResultadoSubida> {
    return { tipo: 'no_configurado' }
  }

  async eliminar(): Promise<ResultadoEliminacion> {
    return { tipo: 'no_configurado' }
  }

  urlPublicaBase(): null {
    return null
  }
}
