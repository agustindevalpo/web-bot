import { ICustomHostnameService, ResultadoHostname } from '@/application/services/ICustomHostnameService'

// Se usa cuando faltan CLOUDFLARE_API_TOKEN o CLOUDFLARE_ZONE_ID: el dominio
// queda guardado en la base, pero nadie lo registra en el edge.
export class NoopCustomHostnameService implements ICustomHostnameService {
  async asegurarHostname(): Promise<ResultadoHostname> {
    return {
      estado: 'no_configurado',
      detalle: 'Cloudflare no está configurado — el dominio se guardó solo en la base de datos.',
    }
  }

  async eliminarHostname(): Promise<void> {}
}
