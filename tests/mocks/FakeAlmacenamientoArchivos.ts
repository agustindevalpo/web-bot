import {
  IAlmacenamientoArchivos,
  ArchivoASubir,
  ResultadoSubida,
  ResultadoEliminacion,
} from '@/application/services/IAlmacenamientoArchivos'

export const URL_PUBLICA_FAKE = 'https://media.devalpo.cl'

export class FakeAlmacenamiento implements IAlmacenamientoArchivos {
  llamadas: ArchivoASubir[] = []
  eliminadas: string[] = []

  constructor(
    private resultado: ResultadoSubida = { tipo: 'ok', url: `${URL_PUBLICA_FAKE}/x.png` },
    private resultadoEliminar: ResultadoEliminacion = { tipo: 'ok' },
    private urlPublica: string | null = URL_PUBLICA_FAKE,
  ) {}

  async subir(archivo: ArchivoASubir): Promise<ResultadoSubida> {
    this.llamadas.push(archivo)
    return this.resultado
  }

  async eliminar(clave: string): Promise<ResultadoEliminacion> {
    this.eliminadas.push(clave)
    return this.resultadoEliminar
  }

  urlPublicaBase(): string | null {
    return this.urlPublica
  }
}
